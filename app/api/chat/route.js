import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Define constants for easy configuration
const SYSTEM_PROMPT = `You are an expert parenting guide specializing in small children (ages 0-8). 
Your role is to provide empathetic, practical, and evidence-based advice to parents. 
Consider child development stages, positive parenting techniques, and age-appropriate strategies. 
Always prioritize the child's well-being and encourage open communication between parents and children. 
If faced with serious issues like abuse or medical emergencies, advise seeking professional help immediately.`

const MODEL_NAME = 'gpt-4' // Using GPT-4 model for more nuanced understanding of complex parenting scenarios

export async function POST (req) {
  // Initialize the OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

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
          stream: true, // Enable streaming responses
          // max_tokens: 500, // Limit response length for more focused advice
          temperature: 0.7 // Slightly lower temperature for more consistent advice
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
