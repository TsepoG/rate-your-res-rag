import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'

export function InfoIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

export default function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const wrapperRef = useRef(null)

  function handleMouseEnter() {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX
      })
    }
    setVisible(true)
  }

  return (
    <Wrapper
      ref={wrapperRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && ReactDOM.createPortal(
        <TooltipBox style={{ top: coords.top, left: coords.left }}>
          {text}
        </TooltipBox>,
        document.body
      )}
    </Wrapper>
  )
}

const Wrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: help;
`

const TooltipBox = styled.div`
  position: absolute;
  background: #0F172A;
  color: white;
  font-size: 12px;
  line-height: 1.5;
  padding: 8px 12px;
  border-radius: 8px;
  width: 220px;
  pointer-events: none;
  word-break: break-word;
  white-space: normal;

  &::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 10px;
    border: 5px solid transparent;
    border-bottom-color: #0F172A;
  }
`