'use client'

import { Box } from '@mui/material'
import Sidebar from './/components/Sidebar'
import ChatInterface from './/components/ChatInterface'
import { useState } from 'react'

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
          flexGrow: 1
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
