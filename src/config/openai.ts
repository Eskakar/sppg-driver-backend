import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});