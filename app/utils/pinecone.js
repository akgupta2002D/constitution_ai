import { Pinecone } from '@pinecone-database/pinecone'

let pinecone

export async function initPinecone () {
  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    })
  }
  return pinecone
}

export async function addDocument (text, metadata = {}) {
  const pinecone = await initPinecone()
  const index = pinecone.index(process.env.PINECONE_INDEX_NAME)

  // Assume createEmbedding is implemented in openai.js
  const { createEmbedding } = await import('./openai')
  const embedding = await createEmbedding(text)

  await index.upsert([
    {
      id: `doc_${Date.now()}`,
      values: embedding,
      metadata: { ...metadata, text }
    }
  ])
}

export async function queryPinecone (query, topK = 3) {
  const pinecone = await initPinecone()
  const index = pinecone.index(process.env.PINECONE_INDEX_NAME)

  const { createEmbedding } = await import('./openai')
  const queryEmbedding = await createEmbedding(query)

  const results = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true
  })

  return results.matches.map(match => match.metadata.text)
}

export async function listDocuments () {
  const pinecone = await initPinecone()
  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME)

  // This is a simple implementation and might need pagination for large datasets
  const queryResponse = await index.query({
    vector: Array(1536).fill(0), // Assuming 1536 is your vector dimension
    topK: 10000, // Adjust based on your needs
    includeMetadata: true
  })

  return queryResponse.matches.map(match => ({
    id: match.id,
    text: match.metadata.text
    // Add any other metadata fields you want to include
  }))
}
