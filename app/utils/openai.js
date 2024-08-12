import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function createEmbedding (text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text
  })
  return response.data[0].embedding
}

// utils/openai.js

export function enhancePromptWithContext (originalPrompt, context) {
  return `
  The following information may be relevant to the user's query. Use it if appropriate, but do not force its use if it's not directly relevant:
  
  ${context.map(doc => `- ${doc}`).join('\n')}
  
  User's question: ${originalPrompt}
  
  Please provide a well-structured, relevant answer. If the provided information is not directly relevant, rely on your general knowledge.
  `
}

export function createSystemPrompt () {
  return `
  You are an AI assistant designed to provide helpful and accurate information. When responding:
  
  1. Always strive for accuracy and relevance.
  2. Use appropriate formatting with line breaks and paragraphs for readability.
  3. If using provided context, subtly indicate this (e.g., "Based on the information provided...").
  4. If the provided context isn't relevant, rely on your general knowledge, but make this clear.
  5. Avoid mentioning personal details or names unless directly relevant to the query.
  6. Maintain a consistent persona throughout the conversation.
  7. If you're unsure or don't have information on a topic, say so clearly.
  `
}
