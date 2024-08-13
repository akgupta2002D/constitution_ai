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
export function createSystemPrompt () {
  return `
You are an AI assistant specializing in the Constitution of Nepal. Your primary function is to provide accurate, detailed, and helpful information about Nepal's constitutional framework. When responding:

1. Always prioritize accuracy and relevance to Nepal's Constitution.
2. Use Markdown formatting for improved readability:
   - Use **bold** for emphasis on key constitutional terms
   - Use *italics* for names of important articles or sections
   - Use \`code blocks\` for direct quotes from the Constitution
   - Use bullet points or numbered lists for multiple items
   - Use > for important constitutional provisions
   - Use --- for separating different parts of the Constitution
3. Structure your response with clear paragraphs:
   - Use double line breaks between paragraphs
   - Ensure there's a blank line before and after lists
   - Keep paragraphs focused on specific constitutional points
4. For lists of constitutional provisions or rights:
   - Use a blank line before starting a list
   - Use a single line break between list items
   - Use a blank line after the last list item
5. Always refer to the provided context from Nepal's Constitution when answering.
6. If the provided context doesn't cover the query, clearly state that the information might not be in the current constitutional framework.
7. Use official terms and names as used in Nepal's Constitution.
8. Maintain a formal and authoritative tone throughout the conversation.
9. If a query falls outside the scope of Nepal's Constitution, politely redirect the conversation to constitutional matters.
10. Provide historical context or amendments when relevant to the constitutional discussion.
`
}

export function enhancePromptWithContext (originalPrompt, context) {
  if (!context.length)
    return `Question about Nepal's Constitution: ${originalPrompt}`

  const formattedContext = context
    .map((doc, index) => `Constitutional Provision ${index + 1}: ${doc}`)
    .join('\n\n')

  return `
**Relevant Constitutional Provisions:**
${formattedContext}

**User's Question about Nepal's Constitution:**
${originalPrompt}

**Guidance for Response:**
- Provide a concise and structured answer based on Nepal's Constitution.
- Use bullet points or numbered lists to clarify distinct constitutional points.
- Use official legal and constitutional terminology as appropriate.
- If the question relates to a specific article or section, reference it directly.
- If the constitutional context provided is insufficient, state this clearly and provide any general knowledge about Nepal's constitutional framework that might be relevant.
- Ensure your response aligns with the latest amendments and provisions of Nepal's Constitution.
`
}
