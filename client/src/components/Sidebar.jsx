import React from 'react';
import styled from 'styled-components';

const ROLES = [
  { id: 'dev', label: 'Developer' },
  { id: 'ba', label: 'Business Analyst' },
  { id: 'po', label: 'Product Owner' },
  { id: 'qa', label: 'QA Engineer' },
  { id: 'pm', label: 'Project Manager' }
];

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
};

export default function Sidebar({ role, onRoleChange, onSuggestionClick, onClear }) {
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
        <SectionLabel>I am a</SectionLabel>
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
};

const SidebarWrapper = styled.aside`
  width: 280px;
  background: white;
  border-right: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  flex-shrink: 0;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
`;

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
`;

const LogoText = styled.span`
  font-size: 16px;
  font-weight: 700;
`;

const LogoSub = styled.p`
  font-size: 12px;
  color: #64748B;
  margin-left: 42px;
`;

const Section = styled.div`
  margin-bottom: 28px;
`;

const SectionLabel = styled.label`
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748B;
  margin-bottom: 10px;
`;

const RoleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

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
`;

const SuggestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

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
`;

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
`;