import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import wxflows from "@wxflows/sdk/langchain"
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph"
import  SYSTEM_MESSAGE from "../constants/systemMessage"
import { SystemMessage, trimMessages } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"
 
const toolClient = new wxflows({
 endpoint: process.env.WXFLOWS_ENDPOINT || "",
 apikey : process.env.WXFLOWS_APIKEY
})

const tools = await toolClient.lcTools;
const toolNode = new ToolNode(tools)

const trimmers = trimMessages({
  maxTokens: 10,
  strategy: "last",
  tokenCounter: (msgs) => msgs.length,
  includeSystem: true,
  allowPartial: false,
  startOn: "human",
});


const initialModel = () => {
 const model = new ChatGoogleGenerativeAI({
  model : "gemini-2.0-flash",
  apiKey: process.env.GEMENI_API_KEY,
  temperature : 0.7,
  maxOutputTokens: 4096,
  streaming: true,
  callbacks: [
   {
    handleLLMStart: async () => {
     console.log("the llm start calling")
    },
    handleLLMEnd: async (output) => {
     console.log("the end of the llm call ")
    }
   }
  ]
 }).bindTools(tools)
 return model;
}

const createWorkflow = () => {
 const model = initialModel();
 return new StateGraph(MessagesAnnotation).addNode("agent", async (state) => {
  const systemContent = SYSTEM_MESSAGE;
  const promptTemplate = ChatPromptTemplate.fromMessages([
   new SystemMessage(systemContent, {
    cache_controle : {type : "ephemeral"}
   }) ,
   new MessagesPlaceholder("messages")
  ])
  })
 }
