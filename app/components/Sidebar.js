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
import AddIcon from '@mui/icons-material/Add'

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
      <Toolbar
        sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
      >
        <Typography
          variant='h6'
          component='div'
          sx={{ flexGrow: 1, color: 'white' }}
        >
          Customer Support
        </Typography>
        <AddIcon
          sx={{ color: 'white', cursor: 'pointer' }}
          onClick={() => window.location.reload()}
        />
      </Toolbar>

      <Box sx={{ width: '100%', textAlign: 'center', py: 1 }}></Box>
      <List
        sx={{
          width: '100%',
          py: 1,
          px: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflowY: 'auto',
          '::-webkit-scrollbar': {
            display: 'none'
          },
          scrollbarWidth: 'none'
        }}
      >
        {sessions.map(session => (
          <ListItemButton
            key={session.id}
            onClick={() => onSessionSelect(session)}
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
                  ? `${session.name.slice(0, 20)}...`
                  : session.name
              }
            />
          </ListItemButton>
        ))}
      </List>
      <Box
        sx={{
          display: 'flex',
          marginTop: 'auto',
          paddingBottom: '48px',
          paddingTop: '16px'
        }}
      >
        <Link href='/upload'>
          <Button
            variant='contained'
            color='primary'
            sx={{ bgcolor: '#003893' }}
          >
            Manage Documents
          </Button>
        </Link>
      </Box>
    </Box>
  )
}
