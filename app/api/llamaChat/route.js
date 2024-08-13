// app/api/llamaChat/route.js
import { NextResponse } from 'next/server'
import llamaOpenRouter, {
  LLAMA_MODEL_NAME,
  createLlamaSystemPrompt,
  enhanceLlamaPromptWithContext
} from '../../utils/llamaOpenRouter'
import { queryPinecone } from '../../utils/pinecone'

export async function POST (req) {
  const userMessages = await req.json()
  const lastUserMessage = userMessages[userMessages.length - 1].content

  // Query Pinecone for relevant context
  const relevantDocs = await queryPinecone(lastUserMessage)
  const enhancedPrompt = enhanceLlamaPromptWithContext(
    lastUserMessage,
    relevantDocs
  )

  const stream = new ReadableStream({
    async start (controller) {
      const encoder = new TextEncoder()

      try {
        const completion = await llamaOpenRouter.chat.completions.create({
          messages: [
            { role: 'system', content: createLlamaSystemPrompt() },
            ...userMessages.slice(0, -1),
            { role: 'user', content: enhancedPrompt }
          ],
          model: LLAMA_MODEL_NAME,
          stream: true
        })

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            controller.enqueue(encoder.encode(content))
          }
        }
      } catch (error) {
        console.error('Error in Llama OpenRouter stream:', error)
        controller.error(error)
      } finally {
        controller.close()
      }
    }
  })

  return new NextResponse(stream)
}
