export interface AgentConfig {
  robotId: string;
  displayName: string;
  color: string;
  modelPath: string;
  workstationModelPath: string;
}

export const AGENT_MAP: Record<string, AgentConfig> = {
  'ui-architect': {
    robotId: 'robot-ui-architect',
    displayName: 'UI Architect',
    color: '#00ffff',
    modelPath: '/models/ui-architect.glb',
    workstationModelPath: '/models/workstations/ui-architect-ws.glb',
  },
  'backend-engineer': {
    robotId: 'robot-backend-engineer',
    displayName: 'Backend Engineer',
    color: '#ff6600',
    modelPath: '/models/backend-engineer.glb',
    workstationModelPath: '/models/workstations/backend-engineer-ws.glb',
  },
  'test-writer': {
    robotId: 'robot-test-writer',
    displayName: 'Test Writer',
    color: '#00ff66',
    modelPath: '/models/test_writer.glb',
    workstationModelPath: '/models/workstations/test-writer-ws.glb',
  },
  'trello-attacker': {
    robotId: 'robot-trello-attacker',
    displayName: 'Trello Attacker',
    color: '#ff00ff',
    modelPath: '/models/trello_attacker.glb',
    workstationModelPath: '/models/workstations/trello-attacker-ws.glb',
  },
  'mobile-optimizer': {
    robotId: 'robot-mobile-optimizer',
    displayName: 'Mobile Optimizer',
    color: '#ffff00',
    modelPath: '/models/mobile_optimizer.glb',
    workstationModelPath: '/models/workstations/mobile-optimizer-ws.glb',
  },
  'qa-gatekeeper': {
    robotId: 'robot-qa-gatekeeper',
    displayName: 'Q&A Gatekeeper',
    color: '#ff3366',
    modelPath: '/models/qa_gatekeeper.glb',
    workstationModelPath: '/models/workstations/qa-gatekeeper-ws.glb',
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
