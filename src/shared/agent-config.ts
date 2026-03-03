export interface AgentConfig {
  robotId: string;
  displayName: string;
  color: string;
}

export const AGENT_MAP: Record<string, AgentConfig> = {
  'ui-architect': {
    robotId: 'robot-ui-architect',
    displayName: 'UI Architect',
    color: '#00ffff',
  },
  'backend-engineer': {
    robotId: 'robot-backend-engineer',
    displayName: 'Backend Engineer',
    color: '#ff6600',
  },
  'test-writer': {
    robotId: 'robot-test-writer',
    displayName: 'Test Writer',
    color: '#00ff66',
  },
  'trello-attacker': {
    robotId: 'robot-trello-attacker',
    displayName: 'Trello Attacker',
    color: '#ff00ff',
  },
  'mobile-optimizer': {
    robotId: 'robot-mobile-optimizer',
    displayName: 'Mobile Optimizer',
    color: '#ffff00',
  },
  'qa-gatekeeper': {
    robotId: 'robot-qa-gatekeeper',
    displayName: 'Q&A Gatekeeper',
    color: '#ff3366',
  },
};

export const AGENT_KEYWORDS: Record<string, string[]> = {
  'ui-architect': ['ui-architect', 'ui architect', 'frontend-design', 'UI Architect'],
  'backend-engineer': ['backend-engineer', 'backend engineer', 'Backend Engineer'],
  'test-writer': ['test-writer', 'test writer', 'Test Writer', 'test-driven'],
  'trello-attacker': ['trello-attacker', 'trello attacker', 'Trello Attacker', 'trello'],
  'mobile-optimizer': ['mobile-optimizer', 'mobile optimizer', 'Mobile Optimizer'],
  'qa-gatekeeper': ['qa-gatekeeper', 'qa gatekeeper', 'Q&A Gatekeeper', 'gatekeeper'],
};
