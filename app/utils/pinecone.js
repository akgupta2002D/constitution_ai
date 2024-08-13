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

  // Split the text into chunks
  const chunks = splitTextIntoChunks(text, 2000) // Adjust chunk size as needed

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const embedding = await createEmbedding(chunk)

    await index.upsert([
      {
        id: `doc_${Date.now()}_chunk_${i}`,
        values: embedding,
        metadata: {
          ...metadata,
          text: chunk,
          chunk_index: i,
          total_chunks: chunks.length
        }
      }
    ])
  }
}

function splitTextIntoChunks (text, maxChunkLength) {
  const chunks = []
  let start = 0

  while (start < text.length) {
    let end = start + maxChunkLength
    if (end > text.length) end = text.length

    // Try to find a natural break point (e.g., end of a sentence)
    if (end < text.length) {
      const naturalBreak = text.lastIndexOf('.', end)
      if (naturalBreak > start) end = naturalBreak + 1
    }

    chunks.push(text.slice(start, end).trim())
    start = end
  }

  return chunks
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
