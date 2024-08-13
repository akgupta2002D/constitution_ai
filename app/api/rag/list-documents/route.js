/**
 * Author: Ankit Gupta
 * Project: Nepal Constitution AI
 * App created during Headstarter fellowship
 *
 * Lists documents from Pinecone database for Nepal Constitution AI.
 */

import { NextResponse } from 'next/server'
import { listDocuments } from '../../../utils/pinecone'

export async function GET () {
  try {
    const documents = await listDocuments()
    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Error listing documents:', error)
    return NextResponse.json(
      { error: 'Failed to list documents' },
      { status: 500 }
    )
  }
}
