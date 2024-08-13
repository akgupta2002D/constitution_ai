/**
 * Author: Ankit Gupta
 * Project: Nepal Constitution AI
 * App created during Headstarter fellowship
 *
 * Description:
 * This file contains the API route handler for the OpenAI-based chat functionality.
 * It integrates with OpenAI's GPT-4 model for AI completions, uses Pinecone for
 * context retrieval, and implements streaming responses. The code is designed
 * to provide context-aware AI responses for queries related to the Nepal Constitution.
 */

// File: app/api/chat/route.js

// Import necessary dependencies
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { queryPinecone } from '../../utils/pinecone'
import {
  enhancePromptWithContext,
  createSystemPrompt
} from '../../utils/openai'

// Define the OpenAI model to be used
const MODEL_NAME = 'gpt-4'

/**
 * POST handler for the chat API route
 * @param {Request} req - The incoming request object
 * @returns {NextResponse} A streaming response containing the AI's reply
 */
export async function POST (req) {
  // Initialize OpenAI client with API key from environment variables
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  // Parse the incoming request body to get user messages
  const userMessages = await req.json()

  // Extract the last user message for context enhancement
  const lastUserMessage = userMessages[userMessages.length - 1].content

  // Query Pinecone vector database for relevant context
  const relevantDocs = await queryPinecone(lastUserMessage)

  // Enhance the user's prompt with relevant context
  const enhancedPrompt = enhancePromptWithContext(lastUserMessage, relevantDocs)

  // Create a ReadableStream to stream the AI's response
  const stream = new ReadableStream({
    async start (controller) {
      const encoder = new TextEncoder()

      try {
        // Create a streaming chat completion using OpenAI
        const completion = await openai.chat.completions.create({
          messages: [
            { role: 'system', content: createSystemPrompt() },
            ...userMessages.slice(0, -1),
            { role: 'user', content: enhancedPrompt }
          ],
          model: MODEL_NAME,
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
        console.error('Error in OpenAI stream:', error)
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
