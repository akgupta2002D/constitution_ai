'use client'

import { useState } from 'react'
import { Button, TextField, Box, Typography } from '@mui/material'

/**
 * AdminDocumentUpload Component
 *
 * Provides an interface for administrators to upload text-based documents 
 * to a knowledge base. It supports real-time status updates, including
 * success or error feedback, and ensures a clean, user-friendly form submission.
 *
 * Features:
 * - Multi-line text input for document content.
 * - API integration to send the document to the server.
 * - Loading state and user feedback messages.
 */
export default function AdminDocumentUpload() {
  // Holds the text input entered by the admin
  const [text, setText] = useState('')

  // Tracks the loading state of the submission
  const [isLoading, setIsLoading] = useState(false)

  // Stores the status message (success or error)
  const [message, setMessage] = useState('')

  /**
   * Handles form submission.
   * Sends the document text to the server via a POST request and displays feedback.
   *
   * @param {Event} e - The form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault() // Prevents the default form submission behavior
    setIsLoading(true) // Show loading state during the request
    setMessage('') // Clear any previous messages

    try {
      const response = await fetch('/api/rag/add-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }) // Send the text as a JSON payload
      })

      if (response.ok) {
        setMessage('Document added successfully!') // Display success feedback
        setText('') // Clear the input field
      } else {
        setMessage('Failed to add document.') // Display error feedback
      }
    } catch (error) {
      setMessage('An error occurred.') // Handle network or server errors
    } finally {
      setIsLoading(false) // Reset the loading state
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit} // Attach the submission handler
      sx={{ m: 2 }}
    >
      {/* Title for the form */}
      <Typography variant="h6">Add Document to Knowledge Base</Typography>

      {/* Multi-line text input for the document content */}
      <TextField
        multiline
        rows={4}
        fullWidth
        value={text} // Bind the input value to state
        onChange={(e) => setText(e.target.value)} // Update state on change
        placeholder="Enter document text"
        sx={{ my: 2 }}
      />

      {/* Submit button */}
      <Button type="submit" variant="contained" disabled={isLoading || !text.trim()}>
        {isLoading ? 'Adding...' : 'Add Document'} {/* Show appropriate button label */}
      </Button>

      {/* Feedback message */}
      {message && (
        <Typography sx={{ mt: 2 }}>{message}</Typography> // Show feedback if available
      )}
    </Box>
  )
}