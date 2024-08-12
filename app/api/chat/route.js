// app/api/chat/route.js
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { queryPinecone } from '../../utils/pinecone'
import {
  enhancePromptWithContext,
  createSystemPrompt
} from '../../utils/openai'

const MODEL_NAME = 'gpt-4'

export async function POST (req) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const userMessages = await req.json()
  const lastUserMessage = userMessages[userMessages.length - 1].content

  // Query Pinecone for relevant context
  const relevantDocs = await queryPinecone(lastUserMessage)
  const enhancedPrompt = enhancePromptWithContext(lastUserMessage, relevantDocs)

  const stream = new ReadableStream({
    async start (controller) {
      const encoder = new TextEncoder()

      try {
        const completion = await openai.chat.completions.create({
          messages: [
            { role: 'system', content: createSystemPrompt() },
            ...userMessages.slice(0, -1),
            { role: 'user', content: enhancedPrompt }
          ],
          model: MODEL_NAME,
          stream: true
        })

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            controller.enqueue(encoder.encode(content))
          }
        }
      } catch (error) {
        console.error('Error in OpenAI stream:', error)
        controller.error(error)
      } finally {
        controller.close()
      }
    }
  })

  return new NextResponse(stream)
}
