//app/api/chat/route.js
// app/api/chat/route.js
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { queryPinecone } from '../../utils/pinecone'
import {
  enhancePromptWithContext,
  createSystemPrompt
} from '../../utils/openai'

const MODEL_NAME = 'gpt-4'

export async function POST (req) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const userMessages = await req.json()
  const lastUserMessage = userMessages[userMessages.length - 1].content

  // Query Pinecone for relevant context
  const relevantDocs = await queryPinecone(lastUserMessage)
  const enhancedPrompt = enhancePromptWithContext(lastUserMessage, relevantDocs)

  const stream = new ReadableStream({
    async start (controller) {
      const encoder = new TextEncoder()

      try {
        const completion = await openai.chat.completions.create({
          messages: [
            { role: 'system', content: createSystemPrompt() },
            ...userMessages.slice(0, -1),
            { role: 'user', content: enhancedPrompt }
          ],
          model: MODEL_NAME,
          stream: true
        })

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            controller.enqueue(encoder.encode(content))
          }
        }
      } catch (error) {
        console.error('Error in OpenAI stream:', error)
        controller.error(error)
      } finally {
        controller.close()
      }
    }
  })

  return new NextResponse(stream)
}




//app/api/rag/add-document/route.js
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

//app/api/rag/list-document/route.js
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

//app/api/rag/query/route.js
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

//app/components/adminDocumentUpload.js
'use client'

import { useState } from 'react'
import { Button, TextField, Box, Typography } from '@mui/material'

export default function AdminDocumentUpload () {
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/rag/add-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (response.ok) {
        setMessage('Document added successfully!')
        setText('')
      } else {
        setMessage('Failed to add document.')
      }
    } catch (error) {
      setMessage('An error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box component='form' onSubmit={handleSubmit} sx={{ m: 2 }}>
      <Typography variant='h6'>Add Document to Knowledge Base</Typography>
      <TextField
        multiline
        rows={4}
        fullWidth
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder='Enter document text'
        sx={{ my: 2 }}
      />
      <Button type='submit' variant='contained' disabled={isLoading}>
        {isLoading ? 'Adding...' : 'Add Document'}
      </Button>
      {message && <Typography sx={{ mt: 2 }}>{message}</Typography>}
    </Box>
  )
}

//app/components/ChatInterface.js
'use client'

import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useState, useRef, useEffect } from 'react'
import { createSession, updateSession } from '../lib/firebaseOperations'
import ReactMarkdown from 'react-markdown'

export default function ChatInterface ({ session, onNewSession }) {
  const MarkdownComponents = {
    p: props => <Typography {...props} paragraph />,
    ul: props => (
      <ul style={{ paddingLeft: '20px', marginBottom: '16px' }} {...props} />
    ),
    li: props => <li style={{ marginBottom: '8px' }} {...props} />
  }
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hi! I know parenting is difficult but rewarding job. I am here to help!'
    }
  ])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)

  useEffect(() => {
    if (session) {
      setMessages(session.messages || [])
      setSessionId(session.id)
    } else {
      setMessages([
        {
          role: 'assistant',
          content:
            'Hi! I know parenting is difficult but rewarding job. I am here to help!'
        }
      ])
      setSessionId(null)
    }
  }, [session])

  const sendMessage = async () => {
    if (!message.trim()) return
    setIsLoading(true)

    const newMessages = [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' }
    ]

    setMessage('')
    setMessages(newMessages)

    if (!sessionId) {
      const newSessionId = await createSession(message)
      setSessionId(newSessionId)
      onNewSession(newSessionId, message)
    } else {
      // If sessionId exists, update the existing session
      await updateSession(sessionId, newMessages)
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newMessages)
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        setMessages(prevMessages => {
          const updatedMessages = [
            ...prevMessages.slice(0, -1),
            {
              ...prevMessages[prevMessages.length - 1],
              content: prevMessages[prevMessages.length - 1].content + text
            }
          ]
          updateSession(sessionId, updatedMessages)
          return updatedMessages
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prevMessages => [
        ...prevMessages,
        {
          role: 'assistant',
          content:
            "I'm sorry, but I encountered an error. Please try again later."
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <Box
      height='100vh'
      display='flex'
      flexDirection='column'
      justifyContent='center'
      alignItems='center'
      px={10}
      sx={{ flexBasis: '80%', bgcolor: '#1E1E22', flexShrink: '3' }}
    >
      <Stack direction={'column'} width='100%' height='700px' p={3} spacing={3}>
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow='auto'
          maxHeight='100%'
          sx={{
            '&::-webkit-scrollbar': {
              width: '0.4em'
            },
            '&::-webkit-scrollbar-track': {
              boxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
              webkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,.1)',
              outline: '1px solid slategrey'
            },
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0,0,0,.1) transparent'
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display='flex'
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={message.role === 'assistant' ? 'black' : 'white'}
                color={message.role === 'assistant' ? 'white' : 'black'}
                borderRadius={5}
                p={2}
                sx={{ maxWidth: '70%' }}
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown components={MarkdownComponents}>
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <Typography>{message.content}</Typography>
                )}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction={'row'} px={6} spacing={2}>
          <TextField
            sx={{ bgcolor: 'white', borderRadius: '10px' }}
            label='Message'
            fullWidth
            value={message}
            variant='filled'
            onChange={e => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button
            variant='contained'
            onClick={sendMessage}
            disabled={isLoading}
            sx={{ bgcolor: 'black', color: 'white', borderRadius: '10px' }}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}


//app/components/Sidebar.js
import {
  Box,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  Link,
  Button
} from '@mui/material'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'

import { useState, useEffect } from 'react'
import { getSessions } from '../lib/firebaseOperations'

export default function Sidebar ({ onSessionSelect }) {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    const fetchSessions = async () => {
      const fetchedSessions = await getSessions()
      setSessions(fetchedSessions)
    }
    fetchSessions()
  }, [])
  return (
    <Box
      position='static'
      sx={{
        bgcolor: 'black',
        flexBasis: '20%',
        flexShrink: '1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowY: 'scroll',
        '&::-webkit-scrollbar': {
          width: '0.4em'
        },
        '&::-webkit-scrollbar-track': {
          boxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
          webkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,.1)',
          outline: '1px solid slategrey'
        },
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(0,0,0,.1) transparent'
      }}
    >
      <Toolbar>
        <Typography
          variant='h6'
          component='div'
          sx={{ flexGrow: 1, color: 'white' }}
        >
          Customer Support
        </Typography>
      </Toolbar>
      <Box sx={{ position: 'fixed', top: 20, right: 20 }}>
        <Link href='/upload'>
          <Button variant='contained' color='primary'>
            Manage Documents
          </Button>
        </Link>
      </Box>
      <List
        sx={{
          width: '100%',
          py: 1,
          px: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        {sessions.map(session => (
          <ListItemButton
            key={session.id}
            onClick={() => onSessionSelect(session)}
            sx={{
              '&:hover': { backgroundColor: 'white' },
              bgcolor: 'grey',
              borderRadius: '10px',
              py: '4px',
              fontSize: '8px'
            }}
          >
            <ListItemIcon>
              <ArrowForwardIosIcon />
            </ListItemIcon>
            <ListItemText primary={session.name} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}


//app/lib/firebaseOperations.js
// lib/firebaseOperations.js
import { db } from '../../firebase'
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore'

export const createSession = async firstMessage => {
  try {
    const docRef = await addDoc(collection(db, 'sessions'), {
      name: firstMessage,
      messages: [{ role: 'user', content: firstMessage }]
    })
    return docRef.id
  } catch (e) {
    console.error('Error adding document: ', e)
    return null
  }
}

export const updateSession = async (sessionId, newMessage) => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId)
    await updateDoc(sessionRef, {
      messages: newMessage
    })
  } catch (e) {
    console.error('Error updating document: ', e)
  }
}

export const getSessions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'sessions'))
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (e) {
    console.error('Error getting documents: ', e)
    return []
  }
}

//app/upload/page.js
// app/upload/page.js
'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText
} from '@mui/material'

export default function DocumentUpload () {
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [documents, setDocuments] = useState([])

  useEffect(() => {
    // Fetch the list of documents when the component mounts
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/rag/list-documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/rag/add-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (response.ok) {
        setMessage('Document added successfully!')
        setText('')
        fetchDocuments() // Refresh the list of documents
      } else {
        setMessage('Failed to add document.')
      }
    } catch (error) {
      setMessage('An error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box sx={{ m: 4 }}>
      <Typography variant='h4' gutterBottom>
        Document Upload
      </Typography>
      <Box component='form' onSubmit={handleSubmit} sx={{ mb: 4 }}>
        <TextField
          multiline
          rows={4}
          fullWidth
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder='Enter document text'
          sx={{ mb: 2 }}
        />
        <Button type='submit' variant='contained' disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Document'}
        </Button>
      </Box>
      {message && <Typography sx={{ mb: 2 }}>{message}</Typography>}

      <Typography variant='h5' gutterBottom>
        Uploaded Documents
      </Typography>
      <List>
        {documents.map((doc, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={doc.title || `Document ${index + 1}`}
              secondary={doc.text.substring(0, 100) + '...'}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  )
}


//app/utils/openai.js
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function createEmbedding (text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text
  })
  return response.data[0].embedding
}

// utils/openai.js

export function enhancePromptWithContext (originalPrompt, context) {
  return `
  The following information may be relevant to the user's query. Use it if appropriate, but do not force its use if it's not directly relevant:
  
  ${context.map(doc => `- ${doc}`).join('\n')}
  
  User's question: ${originalPrompt}
  
  Please provide a well-structured, relevant answer. If the provided information is not directly relevant, rely on your general knowledge.
  `
}

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function createEmbedding (text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text
  })
  return response.data[0].embedding
}

// utils/openai.js

export function enhancePromptWithContext (originalPrompt, context) {
  if (!context.length) return `User's question: ${originalPrompt}`

  const formattedContext = context
    .map((doc, index) => `Context ${index + 1}: ${doc}`)
    .join('\n\n')
  return `
  **Context Information:**
  ${formattedContext}

  **User's Question:**
  ${originalPrompt}

  **Guidance for Response:**
  - Please provide a concise and structured answer.
  - Use bullet points or numbered lists if necessary to clarify distinct points.
  - Avoid technical jargon unless explicitly relevant.
    `
}

export function createSystemPrompt () {
  return `
  You are an AI assistant designed to provide helpful and accurate information. When responding:
  
  1. Always strive for accuracy and relevance.
  2. Use Markdown formatting for improved readability:
     - Use **bold** for emphasis
     - Use *italics* for subtle emphasis
     - Use \`code blocks\` for code or technical terms
     - Use bullet points or numbered lists for multiple items
     - Use > for quotations
     - Use --- for horizontal rules to separate sections
  3. Structure your response with clear paragraphs:
     - Use double line breaks between paragraphs
     - Ensure there's a blank line before and after lists
     - Keep paragraphs focused on a single idea
  4. For lists:
     - Use a blank line before starting a list
     - Use a single line break between list items
     - Use a blank line after the last list item
  5. If using provided context, subtly indicate this (e.g., "Based on the information provided...").
  6. If the provided context isn't relevant, rely on your general knowledge, don't mention anything from context.
  7. Avoid mentioning personal details or names unless directly relevant to the query.
  8. Maintain a consistent persona throughout the conversation.
  9. If you're unsure or don't have information on a topic, say so clearly.
  `
}


//app/utils/pinecone.js
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


//app/page.js
'use client'

import { Box } from '@mui/material'
import Sidebar from './/components/Sidebar'
import ChatInterface from './/components/ChatInterface'
import { useState } from 'react'

export default function Home () {
  const [selectedSession, setSelectedSession] = useState(null)

  const handleSessionSelect = sessionId => {
    setSelectedSession(sessionId)
    // You might want to load the messages for this session here
  }

  const handleNewSession = (sessionId, firstMessage) => {
    // You might want to update the sidebar with the new session here
  }
  return (
    <Box
      component='section'
      display='flex'
      sx={{ flexDirection: 'row', height: '100vh' }}
    >
      <Sidebar onSessionSelect={handleSessionSelect} />
      <ChatInterface onNewSession={handleNewSession} />
    </Box>
  )
}
