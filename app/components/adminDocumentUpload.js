'use client'

import { useState } from 'react'
import { Button, TextField, Box, Typography } from '@mui/material'

export default function AdminDocumentUpload () {
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

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
    <Box component='form' onSubmit={handleSubmit} sx={{ m: 2 }}>
      <Typography variant='h6'>Add Document to Knowledge Base</Typography>
      <TextField
        multiline
        rows={4}
        fullWidth
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder='Enter document text'
        sx={{ my: 2 }}
      />
      <Button type='submit' variant='contained' disabled={isLoading}>
        {isLoading ? 'Adding...' : 'Add Document'}
      </Button>
      {message && <Typography sx={{ mt: 2 }}>{message}</Typography>}
    </Box>
  )
}
