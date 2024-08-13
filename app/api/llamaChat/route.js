/**
 * Author: Ankit Gupta
 * Project: Nepal Constitution AI
 * App created during Headstarter fellowship
 *
 * Description:
 * This file contains the API route handler for the Llama chat functionality.
 * It integrates with Llama OpenRouter for AI completions, uses Pinecone for
 * context retrieval, and implements streaming responses. The code is designed
 * to provide context-aware AI responses for queries related to the Nepal Constitution.
 */

// File: app/api/llamaChat/route.js

// Import necessary dependencies
import { NextResponse } from 'next/server'
import llamaOpenRouter, {
  LLAMA_MODEL_NAME,
  createLlamaSystemPrompt,
  enhanceLlamaPromptWithContext
} from '../../utils/llamaOpenRouter'
import { queryPinecone } from '../../utils/pinecone'

/**
 * POST handler for the Llama chat API route
 * @param {Request} req - The incoming request object
 * @returns {NextResponse} A streaming response containing the AI's reply
 */
export async function POST (req) {
  // Parse the incoming request body to get user messages
  const userMessages = await req.json()

  // Extract the last user message for context enhancement
  const lastUserMessage = userMessages[userMessages.length - 1].content

  // Query Pinecone vector database for relevant context
  const relevantDocs = await queryPinecone(lastUserMessage)

  // Enhance the user's prompt with relevant context using Llama-specific function
  const enhancedPrompt = enhanceLlamaPromptWithContext(
    lastUserMessage,
    relevantDocs
  )

  // Create a ReadableStream to stream the AI's response
  const stream = new ReadableStream({
    async start (controller) {
      const encoder = new TextEncoder()

      try {
        // Create a streaming chat completion using Llama OpenRouter
        const completion = await llamaOpenRouter.chat.completions.create({
          messages: [
            { role: 'system', content: createLlamaSystemPrompt() },
            ...userMessages.slice(0, -1),
            { role: 'user', content: enhancedPrompt }
          ],
          model: LLAMA_MODEL_NAME,
          stream: true
        })

        // Iterate through the completion stream
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            // Encode and enqueue each chunk of content
            controller.enqueue(encoder.encode(content))
          }
        }
      } catch (error) {
        // Log any errors that occur during streaming
        console.error('Error in Llama OpenRouter stream:', error)
        controller.error(error)
      } finally {
        // Close the controller when streaming is complete
        controller.close()
      }
    }
  })

  // Return a NextResponse object with the stream
  return new NextResponse(stream)
}
