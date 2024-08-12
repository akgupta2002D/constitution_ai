//api/chat/route.js
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

//components/ChatInterface.js

'use client'

import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useState, useRef, useEffect } from 'react'
import { createSession, updateSession } from '../lib/firebaseOperations'

export default function ChatInterface ({ onNewSession }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! I'm the Headstarter support assistant. How can I help you today?"
    }
  ])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)

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
    }
    setIsLoading(false)
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
              >
                {message.content}
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


//components/Sidebar.js
import {
  Box,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'

import { useState, useEffect } from 'react'
import { getSessions } from '../lib/firebaseOperations'

export default function Sidebar () {
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
        alignItems: 'center'
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
            onClick={() => onSessionSelect(session.id)}
            sx={{
              '&:hover': { backgroundColor: 'white' },
              bgcolor: 'grey',
              borderRadius: '10px',
              py: '4px'
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



//lib/firebase.js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
// const analytics = getAnalytics(app)

// Export db
export const db = getFirestore(app)


//page.js
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









// lib/firebaseOperations.js
import { db } from './firebase'
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


// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
// const analytics = getAnalytics(app)

// Export db
export const db = getFirestore(app)


// api/chat/route.js

import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Define constants for easy configuration
const SYSTEM_PROMPT = 'You are an expert parent!'
const MODEL_NAME = 'gpt-4' // Using GPT-4 model

export async function GET () {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
  try {
    console.log('OpenAI API Key:', process.env.OPENAI_API_KEY)
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello, World!' }]
    })
    return NextResponse.json(response)
  } catch (error) {
    console.error('OpenAI Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

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
