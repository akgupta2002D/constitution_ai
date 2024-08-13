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
  if (!context.length) return `User's question: ${originalPrompt}`

  const formattedContext = context
    .map((doc, index) => `Context ${index + 1}: ${doc}`)
    .join('\n\n')
  return `
  **Context Information:**
  ${formattedContext}

  **User's Question:**
  ${originalPrompt}

  **Guidance for Response:**
  - Please provide a concise and structured answer.
  - Use bullet points or numbered lists if necessary to clarify distinct points.
  - Avoid technical jargon unless explicitly relevant.
    `
}

export function createSystemPrompt () {
  return `
  You are an AI assistant designed to provide helpful and accurate information. When responding:
  
  1. Always strive for accuracy and relevance.
  2. Use Markdown formatting for improved readability:
     - Use **bold** for emphasis
     - Use *italics* for subtle emphasis
     - Use \`code blocks\` for code or technical terms
     - Use bullet points or numbered lists for multiple items
     - Use > for quotations
     - Use --- for horizontal rules to separate sections
  3. Structure your response with clear paragraphs:
     - Use double line breaks between paragraphs
     - Ensure there's a blank line before and after lists
     - Keep paragraphs focused on a single idea
  4. For lists:
     - Use a blank line before starting a list
     - Use a single line break between list items
     - Use a blank line after the last list item
  5. If using provided context, subtly indicate this (e.g., "Based on the information provided...").
  6. If the provided context isn't relevant, rely on your general knowledge, don't mention anything from context.
  7. Avoid mentioning personal details or names unless directly relevant to the query.
  8. Maintain a consistent persona throughout the conversation.
  9. If you're unsure or don't have information on a topic, say so clearly.
  `
}
