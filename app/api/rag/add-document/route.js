import { NextResponse } from 'next/server'
import { addDocument } from '../../../utils/pinecone'

export async function POST (req) {
  try {
    const { text, metadata } = await req.json()
    await addDocument(text, metadata)
    return NextResponse.json({ message: 'Document added successfully' })
  } catch (error) {
    console.error('Error adding document:', error)
    return NextResponse.json(
      { error: 'Failed to add document' },
      { status: 500 }
    )
  }
}
