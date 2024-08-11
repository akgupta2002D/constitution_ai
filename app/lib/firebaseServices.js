// lib/firebaseServices.js

import { db } from './firebase'
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'

/**
 * Creates a new chat session in Firestore.
 * @returns {Promise<string>} A promise that resolves with the new session ID.
 */
export const createSession = async () => {
  const docRef = await addDoc(collection(db, 'sessions'), {
    createdAt: serverTimestamp()
  })
  return docRef.id
}

/**
 * Adds the initial assistant message to a specified chat session.
 * @param {string} sessionId - The ID of the chat session.
 * @returns {Promise<void>} A promise that resolves when the message is added.
 */
export const addInitialMessage = async sessionId => {
  await addDoc(collection(db, 'sessions', sessionId, 'messages'), {
    role: 'assistant',
    content:
      "Hi! I'm the Headstarter support assistant. How can I help you today?",
    timestamp: serverTimestamp()
  })
}

/**
 * Adds a new message to a specified chat session.
 * @param {string} sessionId - The ID of the chat session.
 * @param {string} role - The role of the message sender ('user' or 'assistant').
 * @param {string} content - The content of the message.
 * @returns {Promise<void>} A promise that resolves when the message is added.
 */
export const addMessage = async (sessionId, role, content) => {
  await addDoc(collection(db, 'sessions', sessionId, 'messages'), {
    role,
    content,
    timestamp: serverTimestamp()
  })
}

/**
 * Sets up a real-time listener for messages in a specified chat session.
 * @param {string} sessionId - The ID of the chat session to listen to.
 * @param {function} callback - A function to be called with the updated messages array when changes occur.
 * @returns {function} An unsubscribe function that can be called to stop listening to updates.
 */
export const listenToMessages = (sessionId, callback) => {
  const q = query(
    collection(db, 'sessions', sessionId, 'messages'),
    orderBy('timestamp')
  )

  return onSnapshot(q, snapshot => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(messages)
  })
}
