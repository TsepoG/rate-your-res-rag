import React from 'react'
import styled from 'styled-components'
import ReactMarkdown from 'react-markdown'

export default function Message({ role, content, sources }) {
  return (
    <MessageWrapper $role={role}>
      <Bubble $role={role}>
        {role === 'assistant'
          ? <ReactMarkdown>{content}</ReactMarkdown>
          : content
        }
      </Bubble>

      {sources && (sources.docs.length > 0 || sources.code.length > 0) && (
        <Sources>
          {sources.docs.map((doc, i) => (
            <SourceTag key={i} $type="doc" title={`Similarity: ${doc.similarity}`}>
              📄 {doc.title}
            </SourceTag>
          ))}
          {sources.code.map((c, i) => (
            <SourceTag key={i} $type="code" title={`${c.file} — Similarity: ${c.similarity}`}>
              💻 {c.function}
            </SourceTag>
          ))}
        </Sources>
      )}
    </MessageWrapper>
  )
}

export function LoadingMessage() {
  return (
    <MessageWrapper $role="assistant">
      <Bubble $role="assistant">
        <Dots>
          <Dot $delay="0s" />
          <Dot $delay="0.2s" />
          <Dot $delay="0.4s" />
        </Dots>
        Thinking...
      </Bubble>
    </MessageWrapper>
  )
}

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 800px;
  align-self: ${p => p.$role === 'user' ? 'flex-end' : 'flex-start'};
  align-items: ${p => p.$role === 'user' ? 'flex-end' : 'flex-start'};
`

const Bubble = styled.div`
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  max-width: 680px;
  background: ${p => p.$role === 'user' ? '#4F46E5' : 'white'};
  color: ${p => p.$role === 'user' ? 'white' : '#0F172A'};
  border: ${p => p.$role === 'user' ? 'none' : '1px solid #E2E8F0'};
  border-bottom-right-radius: ${p => p.$role === 'user' ? '4px' : '12px'};
  border-bottom-left-radius: ${p => p.$role === 'assistant' ? '4px' : '12px'};
  display: ${p => p.$role === 'assistant' ? 'block' : 'inline-block'};

  /* Markdown styles */
  h1, h2, h3 { margin: 16px 0 8px; font-weight: 600; }
  h1 { font-size: 18px; }
  h2 { font-size: 16px; }
  h3 { font-size: 14px; }
  p { margin: 8px 0; }
  ul, ol { padding-left: 20px; margin: 8px 0; }
  li { margin: 4px 0; }
  code {
    background: #F1F5F9;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 13px;
  }
  pre {
    background: #0F172A;
    color: #E2E8F0;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 12px 0;
    font-size: 13px;
    line-height: 1.5;
    code { background: none; padding: 0; color: inherit; }
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 13px;
  }
  th {
    background: #4F46E5;
    color: white;
    padding: 8px 12px;
    text-align: left;
  }
  td {
    padding: 8px 12px;
    border-bottom: 1px solid #E2E8F0;
  }
  tr:nth-child(even) td { background: #F8FAFC; }
  strong { font-weight: 600; }
  hr { border: none; border-top: 1px solid #E2E8F0; margin: 16px 0; }
  blockquote {
    border-left: 3px solid #4F46E5;
    padding-left: 12px;
    color: #64748B;
    margin: 8px 0;
  }
`

const Sources = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 680px;
`

const SourceTag = styled.span`
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${p => p.$type === 'doc' ? '#EEF2FF' : '#F0FDF4'};
  color: ${p => p.$type === 'doc' ? '#3730A3' : '#065F46'};
  border: 1px solid ${p => p.$type === 'doc' ? '#C7D2FE' : '#A7F3D0'};
`

const Dots = styled.div`
  display: inline-flex;
  gap: 4px;
  margin-right: 8px;
  vertical-align: middle;
`

const Dot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4F46E5;
  animation: bounce 1.2s ${p => p.$delay} infinite;

  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
  }
`