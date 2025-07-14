import { ChatGoogleGenerativeAI } from "@langchain/google-genai";


export const initialModel = () => {
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
 })
}
