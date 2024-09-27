'use client'

import { Box } from '@mui/material'
import Sidebar from './/components/Sidebar'
import ChatInterface from './/components/ChatInterface'
import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function Home () {
  const [selectedSession, setSelectedSession] = useState(null)

  const handleSessionSelect = session => {
    setSelectedSession(session)
  }

  const handleNewSession = (sessionId, firstMessage) => {
    setSelectedSession({
      id: sessionId,
      messages: [{ role: 'user', content: firstMessage }]
    })
  }
  useEffect(() => {
    document.title = 'Constitution AI' // Force update title on the client side
  }, [])

  return (
    <Box
      component='section'
      display='flex'
      sx={{
        flexDirection: { xs: 'column', sm: 'row' },
        height: '100vh'
      }}
    >
      <Sidebar onSessionSelect={handleSessionSelect} />
      <Box
        sx={{
          flexGrow: { xs: '1', sm: '1' }
        }}
      >
        <ChatInterface
          session={selectedSession}
          onNewSession={handleNewSession}
        />
      </Box>
    </Box>
  )
}
