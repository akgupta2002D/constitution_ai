/**
 * Author: Ankit Gupta
 * Project: Nepal Constitution AI
 * App created during Headstarter fellowship
 *
 * Description:
 * This file contains the API route handler for adding documents to the Pinecone vector database.
 * It's part of the Nepal Constitution AI project, allowing new documents or sections of the
 * constitution to be added to the knowledge base for future queries.
 */

// File: app/api/addDocument/route.js

// Import necessary dependencies
import { NextResponse } from 'next/server'
import { addDocument } from '../../../utils/pinecone'

/**
 * POST handler for adding a document to Pinecone
 * @param {Request} req - The incoming request object
 * @returns {NextResponse} A JSON response indicating success or failure
 */
export async function POST (req) {
  try {
    // Parse the incoming request body to get the text and metadata
    const { text, metadata } = await req.json()

    // Call the addDocument function to add the document to Pinecone
    await addDocument(text, metadata)

    // Return a success message
    return NextResponse.json({ message: 'Document added successfully' })
  } catch (error) {
    // Log any errors that occur during the process
    console.error('Error adding document:', error)

    // Return an error response with a 500 status code
    return NextResponse.json(
      { error: 'Failed to add document' },
      { status: 500 }
    )
  }
}
