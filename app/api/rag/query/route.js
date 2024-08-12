import { NextResponse } from 'next/server'
import { queryPinecone } from '../../../utils/pinecone'
import { enhancePromptWithContext } from '../../../utils/openai'

export async function POST (req) {
  try {
    const { query } = await req.json()
    const relevantDocs = await queryPinecone(query)
    const enhancedPrompt = enhancePromptWithContext(query, relevantDocs)
    return NextResponse.json({ enhancedPrompt })
  } catch (error) {
    console.error('Error querying RAG:', error)
    return NextResponse.json({ error: 'Failed to query RAG' }, { status: 500 })
  }
}
