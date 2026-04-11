import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import Sidebar from './components/Sidebar'
import Message, { LoadingMessage } from './components/Message'
import ChatInput from './components/ChatInput'
import { sendQuery } from './services/api'

export default function App() {
  const [messages, setMessages] = useState([])
  const [role, setRole] = useState('dev')
  const [relevance, setRelevance] = useState(0.50)
  const [contextWindow, setContextWindow] = useState(2)
  const [loading, setLoading] = useState(false)
  const chatRef = useRef(null)

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, loading])

  async function handleSend(question) {
    const newMessage = { role: 'user', content: question }
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const history = messages.filter(m =>
        m.role === 'user' || m.role === 'assistant'
      )

      const result = await sendQuery(question, role, history, {
        relevance,
        contextWindow
      })

      if (result.contextUsed && result.contextUsed.count > 0) {
        const contextCount = result.contextUsed.count
        setMessages(prev => {
          const updated = [...prev]
          const cleared = updated.map(m => ({ ...m, inContext: false }))
          const startIndex = cleared.length - 1 - contextCount
          for (let i = Math.max(0, startIndex); i < cleared.length - 1; i++) {
            cleared[i] = { ...cleared[i], inContext: true }
          }
          return cleared
        })
      }

      setMessages(prev => {
        const cleared = prev.map(m => ({ ...m, inContext: false }))
        if (result.contextUsed && result.contextUsed.count > 0) {
          const contextCount = result.contextUsed.count
          const startIndex = cleared.length - 1 - contextCount
          for (let i = Math.max(0, startIndex); i < cleared.length - 1; i++) {
            cleared[i] = { ...cleared[i], inContext: true }
          }
        }
        return [...cleared, {
          role: 'assistant',
          content: result.answer,
          sources: result.sources,
          contextUsed: result.contextUsed
        }]
      })

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Something went wrong: ${err.message}`
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setMessages([])
  }

  return (
    <AppWrapper>
      <Sidebar
        role={role}
        onRoleChange={setRole}
        relevance={relevance}
        onRelevanceChange={setRelevance}
        contextWindow={contextWindow}
        onContextWindowChange={setContextWindow}
        onSuggestionClick={handleSend}
        onClear={handleClear}
      />

      <Main>
        <Chat ref={chatRef}>
          <ChatInner>
            {messages.length === 0 && (
              <Welcome>
                <h1>What do you want to know?</h1>
                <p>Ask anything about the RateYourRes codebase or documentation.</p>
              </Welcome>
            )}

            {messages.map((msg, i) => (
              <Message
                key={i}
                role={msg.role}
                content={msg.content}
                sources={msg.sources}
                inContext={msg.inContext}
                contextUsed={msg.contextUsed}
              />
            ))}

            {loading && <LoadingMessage />}
          </ChatInner>
        </Chat>

        <ChatInput onSend={handleSend} disabled={loading} />
      </Main>
    </AppWrapper>
  )
}

const AppWrapper = styled.div`
  display: flex;
  height: 100vh;
`

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const Chat = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const ChatInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
`

const Welcome = styled.div`
  text-align: center;
  max-width: 480px;
  position: absolute;
  top: 42%;
  left: 55%;
  transform: translate(-50%, -50%);

  h1 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  p {
    font-size: 15px;
    color: #64748B;
  }
`