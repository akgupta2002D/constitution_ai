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
