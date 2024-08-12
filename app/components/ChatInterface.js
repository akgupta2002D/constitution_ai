'use client'

import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useState, useRef, useEffect } from 'react'
import { createSession, updateSession } from '../lib/firebaseOperations'

export default function ChatInterface ({ onNewSession }) {
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
