import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import Sidebar from './components/Sidebar'
import Message, { LoadingMessage } from './components/Message'
import ChatInput from './components/ChatInput'
import { sendQuery } from './services/api'

export default function App() {
  const [messages, setMessages] = useState([])
  const [role, setRole] = useState('dev')
  const [loading, setLoading] = useState(false)
  const chatRef = useRef(null)

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, loading])

  async function handleSend(question) {
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)

    try {
      const result = await sendQuery(question, role)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.answer,
        sources: result.sources
      }])
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
        onSuggestionClick={handleSend}
        onClear={handleClear}
      />

      <Main>
        <Chat ref={chatRef}>
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
            />
          ))}

          {loading && <LoadingMessage />}
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

const Welcome = styled.div`
  text-align: center;
  margin: auto;
  max-width: 480px;

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