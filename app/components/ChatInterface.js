import React, { useState, useRef, useEffect } from 'react'
import { Box, Button, Stack, TextField, Typography, Link } from '@mui/material'
import ReactMarkdown from 'react-markdown'
import { createSession, updateSession } from '../lib/firebaseOperations'

/**
 * ChatInterface Component
 *
 * Provides an interactive chat interface where users can communicate with an assistant.
 * Supports session management, real-time messaging, and a dynamic typing indicator.
 *
 */
export default function ChatInterface({ session, onNewSession }) {
  // Custom Markdown components for rendering assistant messages.
  const MarkdownComponents = {
    p: (props) => <Typography {...props} paragraph />,
    ul: (props) => (
      <ul style={{ paddingLeft: '20px', marginBottom: '16px' }} {...props} />
    ),
    li: (props) => <li style={{ marginBottom: '8px' }} {...props} />
  }

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Namaste! Let me answer your questions about the constitution of Nepal'
    }
  ]) // Stores chat messages.
  const [message, setMessage] = useState('') // Stores the user's current input.
  const [isLoading, setIsLoading] = useState(false) // Tracks message sending status.
  const [sessionId, setSessionId] = useState(null) // Tracks the current session ID.
  const [isTyping, setIsTyping] = useState(false) // Indicates if the assistant is typing.

  // Initializes or updates the chat session when the session prop changes.
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

  // Handles sending messages and updates the chat state.
  const sendMessage = async () => {
    if (!message.trim()) return
    setIsLoading(true)
    setIsTyping(true)

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

    await updateSession(currentSessionId, updatedMessages)

    try {
      const response = await fetch('/api/llamaChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMessages)
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let assistantMessage = { role: 'assistant', content: '' }
      setMessages((prevMessages) => [...prevMessages, assistantMessage])
      setIsTyping(false)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        assistantMessage.content += text
        setMessages((prevMessages) => {
          const newMessages = [
            ...prevMessages.slice(0, -1),
            { ...assistantMessage }
          ]
          updateSession(currentSessionId, newMessages)
          return newMessages
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." }
      ])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  // Handles pressing the 'Enter' key to send a message.
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  // Ensures the chat scrolls to the bottom when messages update.
  const messagesEndRef = useRef(null)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <Box
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      px={{ xs: 2, sm: 3, md: 16 }}
      sx={{
        position: 'relative',
        flexBasis: '80%',
        flexShrink: '3',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-10px',
          left: '-20px',
          right: '-10px',
          bottom: '-20px',
          backgroundImage: 'url(./nepal_mountain.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(7px)',
          zIndex: -1
        }
      }}
    >
      <Stack direction="column" width="100%" height="700px" p={3} spacing={3}>
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          py={6}
          overflow="auto"
          maxHeight="100%"
          sx={{
            '&::-webkit-scrollbar': { width: '0.4em' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,.1)' },
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0,0,0,.1) transparent'
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
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
          {isTyping && (
            <Box display="flex" justifyContent="flex-start" mt={2}>
              <Box
                bgcolor="black"
                color="white"
                borderRadius={5}
                px={6}
                py={2}
                sx={{ maxWidth: '70%' }}
              >
                <Typography>Typing...</Typography>
              </Box>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Stack>

        <Stack direction="row" spacing={2}>
          <TextField
            sx={{ bgcolor: 'white', borderRadius: '10px' }}
            label="Message"
            fullWidth
            value={message}
            variant="filled"
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={isLoading}
            sx={{
              bgcolor: '#003893',
              color: 'white',
              borderRadius: '10px',
              minWidth: '100px'
            }}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
          <Link href="https://github.com/akgupta2002D/customer_support_ai">
            <Button
              variant="contained"
              sx={{
                bgcolor: 'grey',
                color: 'white',
                borderRadius: '10px',
                minWidth: '100px'
              }}
            >
              GitHub Link
            </Button>
          </Link>
        </Stack>
      </Stack>
    </Box>
  )
}