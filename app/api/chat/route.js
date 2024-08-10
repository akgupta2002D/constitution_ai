import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Define constants for easy configuration
const SYSTEM_PROMPT = 'You are an expert parent!'
const MODEL_NAME = 'gpt-4' // Using GPT-4 model

export async function POST (req) {
  // Initialize the OpenAI client
  const openai = new OpenAI()

  // Parse the incoming request body
  const userMessages = await req.json()

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start (controller) {
      // Initialize a TextEncoder to convert strings to Uint8Array
      const encoder = new TextEncoder()

      try {
        // Create a chat completion request to the OpenAI API
        const completion = await openai.chat.completions.create({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...userMessages
          ],
          model: MODEL_NAME,
          stream: true // Enable streaming responses
        })

        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            // Encode and enqueue the content to the stream
            const encodedContent = encoder.encode(content)
            controller.enqueue(encodedContent)
          }
        }
      } catch (error) {
        // Log and handle any errors that occur during streaming
        console.error('Error in OpenAI stream:', error)
        controller.error(error)
      } finally {
        // Close the stream when done
        controller.close()
      }
    }
  })

  // Return the stream as the response
  return new NextResponse(stream)
}
