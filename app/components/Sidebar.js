import {
  Box,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemText
} from '@mui/material'
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
      <List sx={{ width: '100%', py: 2, px: 1 }}>
        {sessions.map(session => (
          <ListItem
            key={session.id}
            onClick={() => onSessionSelect(session.id, session.messages)}
            sx={{
              '&:hover': { backgroundColor: 'white' },
              bgcolor: 'grey',
              borderRadius: '10px',
              py: 1
            }}
          >
            <ListItemText primary={session.name} />
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
