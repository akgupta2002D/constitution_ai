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
        'Namaste! Let me answer your questions about the constitution of Nepal'
    }
  ])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)

  useEffect(() => {
    if (session) {
      setMessages(
        session.messages || [
          {
            role: 'assistant',
            content:
              'Namaste! Let me answer your questions about the constitution of Nepal'
          }
        ]
      )
      setSessionId(session.id)
    } else {
      setMessages([
        {
          role: 'assistant',
          content:
            'Namaste! Let me answer your questions about the constitution of Nepal'
        }
      ])
      setSessionId(null)
    }
  }, [session])

  const sendMessage = async () => {
    if (!message.trim()) return
    setIsLoading(true)

    const newUserMessage = { role: 'user', content: message }
    const updatedMessages = [...messages, newUserMessage]

    setMessage('')
    setMessages(updatedMessages)

    let currentSessionId = sessionId
    if (!currentSessionId) {
      currentSessionId = await createSession(message)
      setSessionId(currentSessionId)
      onNewSession(currentSessionId, message)
    }

    // Update session with user message
    await updateSession(currentSessionId, updatedMessages)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedMessages)
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let assistantMessage = { role: 'assistant', content: '' }
      setMessages(prevMessages => [...prevMessages, assistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        assistantMessage.content += text
        setMessages(prevMessages => {
          const newMessages = [
            ...prevMessages.slice(0, -1),
            { ...assistantMessage }
          ]
          // Update session with each chunk of assistant's response
          updateSession(currentSessionId, newMessages)
          return newMessages
        })
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = {
        role: 'assistant',
        content:
          "I'm sorry, but I encountered an error. Please try again later."
      }
      setMessages(prevMessages => {
        const newMessages = [...prevMessages, errorMessage]
        // Update session with error message
        updateSession(currentSessionId, newMessages)
        return newMessages
      })
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
          py={6}
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
                px={6}
                py={2}
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
