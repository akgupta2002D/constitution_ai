import {
  Box,
  Toolbar,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Link,
  Button,
  Avatar
} from '@mui/material'

import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import AddIcon from '@mui/icons-material/Add'
import { useState, useEffect } from 'react'
import { getSessions } from '../lib/firebaseOperations'

/**
 * Sidebar Component
 *
 * Displays a sidebar for navigating chat sessions, starting new chats, and managing documents.
 * Features:
 * - A list of previous chat sessions fetched from the backend.
 * - A button to create a new chat.
 * - A link to manage uploaded documents.
 *
 * @param {Function} onSessionSelect - Callback for selecting a chat session.
 */
export default function Sidebar({ onSessionSelect }) {
  // State to store the fetched chat sessions
  const [sessions, setSessions] = useState([])

  // Fetch chat sessions on component mount
  useEffect(() => {
    const fetchSessions = async () => {
      const fetchedSessions = await getSessions() // Fetch sessions from the backend
      setSessions(fetchedSessions) // Update state with fetched sessions
    }
    fetchSessions()
  }, [])

  return (
    <Box
      position="static"
      sx={{
        minWidth: '300px',
        bgcolor: 'black',
        flexBasis: '20%',
        flexShrink: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowY: 'scroll',
        '&::-webkit-scrollbar': { width: '0.4em' },
        '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,.1)' },
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(0,0,0,.1) transparent'
      }}
    >
      {/* Logo Section */}
      <Box sx={{ width: '100%', textAlign: 'center', py: 2 }}>
        <Avatar
          src="./logo.webp"
          alt="Logo"
          sx={{
            width: 100,
            height: 100,
            mx: 'auto',
            boxShadow: '0 0 15px rgba(255, 255, 255, 0.8)' // Glowing effect for the logo
          }}
        />
      </Box>

      {/* New Chat Button */}
      <Toolbar sx={{ width: '100%', textAlign: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            width: '100%'
          }}
          onClick={() => window.location.reload()} // Using window reload to create a new chat
        >
          <Typography
            variant="h6"
            component="div"
            sx={{ color: 'white', mr: 1 }}
          >
            New Chat
          </Typography>
          <AddIcon sx={{ color: 'white' }} />
        </Box>
      </Toolbar>

      {/* Sessions List */}
      <List
        sx={{
          width: '100%',
          py: 1,
          px: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflowY: 'auto',
          '::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none'
        }}
      >
        {sessions.map(session => (
          <ListItemButton
            key={session.id}
            onClick={() => onSessionSelect(session)} // Handle session selection
            sx={{
              '&:hover': { backgroundColor: 'white', color: 'black' },
              bgcolor: 'transparent',
              borderRadius: '10px',
              py: '4px',
              fontSize: '8px',
              color: 'white',
              transition: 'background-color 0.3s ease, color 0.3s ease'
            }}
          >
            <ListItemIcon>
              <ArrowForwardIosIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText
              primary={
                session.name.length > 20
                  ? `${session.name.slice(0, 20)}...` // Truncate long session names
                  : session.name
              }
            />
          </ListItemButton>
        ))}
      </List>

      {/* Manage Documents Button */}
      <Box
        sx={{
          display: 'flex',
          marginTop: 'auto',
          paddingBottom: '48px',
          paddingTop: '16px'
        }}
      >
        <Link href="/upload">
          <Button
            variant="contained"
            color="primary"
            sx={{ bgcolor: '#003893' }}
          >
            Manage Documents
          </Button>
        </Link>
      </Box>
    </Box>
  )
}