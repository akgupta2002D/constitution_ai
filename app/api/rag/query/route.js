/**
 * Author: Ankit Gupta
 * Project: Nepal Constitution AI
 *
 * Handles RAG (Retrieval-Augmented Generation) queries for the Nepal Constitution AI.
 */

import { NextResponse } from 'next/server'
import { queryPinecone } from '../../../utils/pinecone'
import { enhancePromptWithContext } from '../../../utils/openai'

export async function POST (req) {
  try {
    // Extract query from request body
    const { query } = await req.json()

    // Retrieve relevant documents from Pinecone
    const relevantDocs = await queryPinecone(query)

    // Enhance the original query with retrieved context
    const enhancedPrompt = enhancePromptWithContext(query, relevantDocs)

    // Return the enhanced prompt
    return NextResponse.json({ enhancedPrompt })
  } catch (error) {
    console.error('Error querying RAG:', error)
    return NextResponse.json({ error: 'Failed to query RAG' }, { status: 500 })
  }
}
