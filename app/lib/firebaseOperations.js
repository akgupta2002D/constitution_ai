/**
 * Author: Ankit Gupta
 * Project: Nepal Constitution AI
 *
 * Firebase operations for managing chat sessions in the Nepal Constitution AI project.
 */

import { db } from '../../firebase'
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore'

// Create a new chat session
export const createSession = async firstMessage => {
  try {
    const docRef = await addDoc(collection(db, 'sessions'), {
      name: firstMessage,
      messages: [{ role: 'user', content: firstMessage }]
    })
    return docRef.id
  } catch (e) {
    console.error('Error adding document: ', e)
    return null
  }
}

// Update an existing chat session with new messages
export const updateSession = async (sessionId, newMessage) => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId)
    await updateDoc(sessionRef, {
      messages: newMessage
    })
  } catch (e) {
    console.error('Error updating document: ', e)
  }
}

// Retrieve all chat sessions
export const getSessions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'sessions'))
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (e) {
    console.error('Error getting documents: ', e)
    return []
  }
}
