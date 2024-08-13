// app/upload/page.js
'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText
} from '@mui/material'

export default function DocumentUpload () {
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [documents, setDocuments] = useState([])

  useEffect(() => {
    // Fetch the list of documents when the component mounts
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/rag/list-documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/rag/add-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (response.ok) {
        setMessage('Document added successfully!')
        setText('')
        fetchDocuments() // Refresh the list of documents
      } else {
        setMessage('Failed to add document.')
      }
    } catch (error) {
      setMessage('An error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box sx={{ m: 4, px: 20 }}>
      <Typography variant='h4' gutterBottom>
        Document Upload
      </Typography>
      <Typography variant='h6' gutterBottom>
        Add text to the Knowledge Base
      </Typography>
      <Box component='form' onSubmit={handleSubmit} sx={{ mb: 4 }}>
        <TextField
          multiline
          rows={4}
          fullWidth
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder='Enter document text'
          sx={{ mb: 2 }}
        />
        <Button type='submit' variant='contained' disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Document'}
        </Button>
      </Box>
      {message && <Typography sx={{ mb: 2 }}>{message}</Typography>}
      <Typography variant='h5' gutterBottom>
        Uploaded Documents
      </Typography>
      <List sx={{ overflow: 'scroll' }}>
        {documents.map((doc, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={doc.title || `Document ${index + 1}`}
              secondary={doc.text.substring(0, 100) + '...'}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
