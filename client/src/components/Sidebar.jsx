import React from 'react'
import styled from 'styled-components'
import Tooltip, { InfoIcon } from './Tooltip'

const ROLES = [
  { id: 'dev', label: 'Developer' },
  { id: 'ba', label: 'Business Analyst' },
  { id: 'po', label: 'Product Owner' },
  { id: 'qa', label: 'QA Engineer' },
  { id: 'pm', label: 'Project Manager' }
]

const SUGGESTIONS = {
  dev: [
    'What DynamoDB tables exist and what are their keys?',
    'How does the JWT authorizer work?',
    'How are Lambda functions structured?'
  ],
  ba: [
    'What tech stack does RateYourRes use?',
    'What data does a review collect?',
    'How is student verification handled?'
  ],
  po: [
    'How does the review submission work?',
    'What features are currently built?',
    'Are there any gaps between specs and implementation?'
  ],
  qa: [
    'What validation rules exist on review submission?',
    'How is duplicate review prevention handled?',
    'What error cases are tested in the backend?'
  ],
  pm: [
    'How is the frontend deployed?',
    'What is the CI/CD pipeline?',
    'What phases have been completed?'
  ]
}

const TOOLTIPS = {
  role: `Your role shapes how answers are written. Developers get technical detail and code references. Business Analysts and Product Owners get plain English focused on what the system does. QA gets edge cases and validation rules. Project Managers get status and progress summaries.`,

  relevance: `Controls how closely a source must match your question before it's used as context. Higher values mean only very relevant sources are used — answers may be more precise but could miss some context. Lower values cast a wider net — more sources are included but some may be loosely related.`,

  contextWindow: `How many previous exchanges the assistant remembers when answering follow-up questions. More exchanges means better continuity in long conversations, but may slow responses slightly. Set to 1 if you want each question treated independently.`
}

export default function Sidebar({
  role, onRoleChange,
  relevance, onRelevanceChange,
  contextWindow, onContextWindowChange,
  onSuggestionClick, onClear
}) {
  return (
    <SidebarWrapper>
      <Header>
        <Logo>
          <LogoIcon>R</LogoIcon>
          <LogoText>RateYourRes</LogoText>
        </Logo>
        <LogoSub>Knowledge Assistant</LogoSub>
      </Header>

      <Section>
        <SectionHeader>
          <SectionLabel>I am a</SectionLabel>
          <Tooltip text={TOOLTIPS.role}>
            <IconWrapper><InfoIcon /></IconWrapper>
          </Tooltip>
        </SectionHeader>
        <RoleList>
          {ROLES.map(r => (
            <RoleBtn
              key={r.id}
              $active={role === r.id}
              onClick={() => onRoleChange(r.id)}
            >
              {r.label}
            </RoleBtn>
          ))}
        </RoleList>
      </Section>

      <Section>
        <SectionHeader>
          <SectionLabel>Relevance filter</SectionLabel>
          <Tooltip text={TOOLTIPS.relevance}>
            <IconWrapper><InfoIcon /></IconWrapper>
          </Tooltip>
        </SectionHeader>
        <SliderRow>
          <Slider
            type="range"
            min="0.4"
            max="0.8"
            step="0.05"
            value={relevance}
            onChange={e => onRelevanceChange(parseFloat(e.target.value))}
          />
          <SliderValue>{relevance.toFixed(2)}</SliderValue>
        </SliderRow>
        <SliderLabels>
          <span>Broader</span>
          <span>Stricter</span>
        </SliderLabels>
      </Section>

      <Section>
        <SectionHeader>
          <SectionLabel>Conversation context</SectionLabel>
          <Tooltip text={TOOLTIPS.contextWindow}>
            <IconWrapper><InfoIcon /></IconWrapper>
          </Tooltip>
        </SectionHeader>
        <SliderRow>
          <Slider
            type="range"
            min="1"
            max="5"
            step="1"
            value={contextWindow}
            onChange={e => onContextWindowChange(parseInt(e.target.value))}
          />
          <SliderValue>
            {contextWindow} {contextWindow === 1 ? 'exchange' : 'exchanges'}
          </SliderValue>
        </SliderRow>
        <SliderLabels>
          <span>Independent</span>
          <span>More memory</span>
        </SliderLabels>
      </Section>

      <Section style={{ flex: 1 }}>
        <SectionLabel>Suggested questions</SectionLabel>
        <SuggestionList>
          {SUGGESTIONS[role].map((q, i) => (
            <SuggestionBtn key={i} onClick={() => onSuggestionClick(q)}>
              {q}
            </SuggestionBtn>
          ))}
        </SuggestionList>
      </Section>

      <ClearBtn onClick={onClear}>Clear conversation</ClearBtn>
    </SidebarWrapper>
  )
}

const SidebarWrapper = styled.aside`
  width: 280px;
  background: white;
  border-right: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  flex-shrink: 0;
  overflow-x: visible;
  overflow-y: auto;
`

const Header = styled.div`
  margin-bottom: 32px;
`

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
`

const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  background: #4F46E5;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
`

const LogoText = styled.span`
  font-size: 16px;
  font-weight: 700;
`

const LogoSub = styled.p`
  font-size: 12px;
  color: #64748B;
  margin-left: 42px;
`

const Section = styled.div`
  margin-bottom: 24px;
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
`

const SectionLabel = styled.label`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748B;
`

const IconWrapper = styled.div`
  color: #94A3B8;
  display: flex;
  align-items: center;

  &:hover {
    color: #4F46E5;
  }
`

const RoleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const RoleBtn = styled.button`
  background: ${p => p.$active ? '#4F46E5' : 'none'};
  border: 1px solid ${p => p.$active ? '#4F46E5' : '#E2E8F0'};
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: ${p => p.$active ? 'white' : '#64748B'};
  font-weight: ${p => p.$active ? '500' : '400'};
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;

  &:hover {
    border-color: #4F46E5;
    color: ${p => p.$active ? 'white' : '#4F46E5'};
    background: ${p => p.$active ? '#4F46E5' : '#EEF2FF'};
  }
`

const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const Slider = styled.input`
  flex: 1;
  height: 4px;
  accent-color: #4F46E5;
  cursor: pointer;
`

const SliderValue = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #4F46E5;
  min-width: 72px;
  text-align: right;
`

const SliderLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #94A3B8;
  margin-top: 4px;
`

const SuggestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const SuggestionBtn = styled.button`
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: #64748B;
  cursor: pointer;
  text-align: left;
  line-height: 1.4;
  transition: all 0.15s;

  &:hover {
    border-color: #4F46E5;
    color: #4F46E5;
    background: #EEF2FF;
  }
`

const ClearBtn = styled.button`
  margin-top: auto;
  width: 100%;
  background: none;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 8px;
  font-size: 13px;
  color: #64748B;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: #EF4444;
    color: #EF4444;
  }
`