/**
 * Author: Ankit Gupta
 * Project: Nepal Constitution AI
 *
 * Configuration and utility functions for Llama model via OpenRouter.
 */

import { OpenAI } from 'openai'

// Initialize OpenAI client with OpenRouter configuration
const llamaOpenRouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    // 'HTTP-Referer': process.env.YOUR_SITE_URL,
    // 'X-Title': process.env.YOUR_SITE_NAME
  }
})

// Specify the Llama model to be used
export const LLAMA_MODEL_NAME = 'meta-llama/llama-3.1-8b-instruct:free'

// Generate system prompt for the Llama model
export function createLlamaSystemPrompt () {
  return `You are an AI assistant based on the Llama 3.1 8B Instruct model, specializing in the Constitution of Nepal. Your primary function is to provide accurate, detailed, and helpful information about Nepal's constitutional framework. When responding:

  1. Always prioritize accuracy and relevance to Nepal's Constitution.
  2. Use Markdown formatting for improved readability.
  3. Structure your response with clear paragraphs.
  4. Always refer to the provided context from Nepal's Constitution when answering.
  5. If the provided context doesn't cover the query, clearly state that the information might not be in the current constitutional framework.
  6. Use official terms and names as used in Nepal's Constitution.
  7. Maintain a formal and authoritative tone throughout the conversation.
  8. If a query falls outside the scope of Nepal's Constitution, politely redirect the conversation to constitutional matters.
  9. Provide historical context or amendments when relevant to the constitutional discussion.`
}

// Enhance user prompt with relevant constitutional context
export function enhanceLlamaPromptWithContext (originalPrompt, context) {
  if (!context.length)
    return `Question about Nepal's Constitution: ${originalPrompt}`

  const formattedContext = context
    .map((doc, index) => `Constitutional Provision ${index + 1}: ${doc}`)
    .join('\n\n')

  return `
Relevant Constitutional Provisions:
${formattedContext}

User's Question about Nepal's Constitution:
${originalPrompt}

Guidance for Response:
- Provide a concise and structured answer based on Nepal's Constitution.
- Use bullet points or numbered lists to clarify distinct constitutional points.
- Use official legal and constitutional terminology as appropriate.
- If the question relates to a specific article or section, reference it directly.
- If the constitutional context provided is insufficient, state this clearly and provide any general knowledge about Nepal's constitutional framework that might be relevant.
- Ensure your response aligns with the latest amendments and provisions of Nepal's Constitution.`
}

export default llamaOpenRouter
