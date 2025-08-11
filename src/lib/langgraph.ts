import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai"
import wxflows from "@wxflows/sdk/langchain"
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { END, MemorySaver, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph"
import  SYSTEM_MESSAGE from "../constants/systemMessage"
import { AIMessage, BaseMessage, HumanMessage, SystemMessage, trimMessages } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"
 
const toolClient = new wxflows({
 endpoint: process.env.WXFLOWS_ENDPOINT || "",
 apikey : process.env.WXFLOWS_APIKEY
})

const tools = await toolClient.lcTools;
const toolNode = new ToolNode(tools)


const trimmer = trimMessages({
  maxTokens: 150000,
  strategy: "last",
  tokenCounter: (msgs) => msgs.length,
  includeSystem: true,
  allowPartial:false,
  startOn:"human"
})



const initialModel = () => {
  const model = new ChatOpenAI({
   model: 'openai/gpt-5-mini',
    temperature: 0.8,
    streaming: true,
    apiKey: process.env.OPENAI_API_KEY,
     maxTokens: 8000, 
    configuration: {
      baseURL: 'https://openrouter.ai/api/v1',
    }
  }).bindTools(tools);
 return model;
}


const shouldContinue = (state : typeof MessagesAnnotation.State ) => {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  if (lastMessage.tool_calls?.length) {
    return "tools"
  }
  if (lastMessage.content && lastMessage._getType() == "tool") {
    return "agent"
  }

  return END
}


const createWorkflow = () => {
 const model = initialModel();
 const stateGraph =  new StateGraph(MessagesAnnotation).addNode("agent", async (state) => {
  const systemContent = SYSTEM_MESSAGE;
  const promptTemplate = ChatPromptTemplate.fromMessages([
   new SystemMessage(systemContent, {
    cache_control : {type : "ephemeral"}
   }) ,
   new MessagesPlaceholder("messages")
  ])
   const trimmedMessages =await  trimmer.invoke(state.messages);
   const prompt = await promptTemplate.invoke({ messages: trimmedMessages });
   const response = await model.invoke(prompt);
   return { messages: [response] };
  }).addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent")

  return stateGraph;
 }

function addCachingHeaders(messages: BaseMessage[]) : BaseMessage[] {
  if (!messages.length) return messages;
  const cachedMessage = [...messages]

  const addCache = (message: BaseMessage) =>  {
    message.content = [
      {
        type: "text",
        text: message.content as string,
        cache_control : { type : "ephemeral"} 
      }
    ]
  }

  addCache(cachedMessage.at(-1)!)


  let humanCount = 0;
  for (let i = cachedMessage.length - 1; i >= 0; i--){
    if (cachedMessage[i] instanceof HumanMessage) {
      humanCount++;
    if (humanCount === 2) {
      addCache(cachedMessage[i]);
      break;
      }
    }
      
  }
  return cachedMessage;

}


export async function submitQuestion(messages: BaseMessage[], chatId: string) {
  const cachedMessages = addCachingHeaders(messages);
  const checkpointer = new MemorySaver();
  const workFlow = createWorkflow();
  const app = workFlow.compile({ checkpointer });
  const stream = await app.streamEvents(
    { messages: cachedMessages },
  {
    version: "v2",
    configurable: { thread_id: chatId },
    streamMode: "messages",
    runId: chatId,
    }
  );
  return stream;
 }
