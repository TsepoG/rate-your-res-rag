import React, { useRef, useEffect } from 'react'
import styled from 'styled-components'

export default function ChatInput({ onSend, disabled }) {
  const textareaRef = useRef(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const value = textareaRef.current?.value.trim()
    if (!value || disabled) return
    onSend(value)
    textareaRef.current.value = ''
    textareaRef.current.style.height = 'auto'
  }

  function handleInput() {
    const el = textareaRef.current
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  return (
    <InputArea>
      <InputWrapper>
        <Textarea
          ref={textareaRef}
          placeholder="Ask a question about RateYourRes..."
          rows={1}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
        />
        <SendBtn onClick={submit} disabled={disabled}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </SendBtn>
      </InputWrapper>
      <Hint>Responses are based on your Confluence docs and GitHub codebase.</Hint>
    </InputArea>
  )
}

const InputArea = styled.div`
  padding: 16px 32px 24px;
  background: white;
  border-top: 1px solid #E2E8F0;
`

const InputWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 12px 16px;
  transition: border-color 0.15s;

  &:focus-within {
    border-color: #4F46E5;
  }
`

const Textarea = styled.textarea`
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  color: #0F172A;
  resize: none;
  max-height: 120px;
  line-height: 1.5;

  &::placeholder { color: #94A3B8; }
  &:disabled { opacity: 0.5; }
`

const SendBtn = styled.button`
  background: #4F46E5;
  color: white;
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;

  &:hover:not(:disabled) { background: #3730A3; }
  &:disabled { background: #E2E8F0; cursor: not-allowed; }
`

const Hint = styled.p`
  font-size: 11px;
  color: #94A3B8;
  margin-top: 8px;
  text-align: center;
`