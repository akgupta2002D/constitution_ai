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
