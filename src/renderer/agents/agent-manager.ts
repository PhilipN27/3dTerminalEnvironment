import { AGENT_MAP, AgentConfig } from '../../shared/agent-config';

export type RobotState = 'idle' | 'active' | 'complete';

export interface AgentStatus {
  id: string;
  config: AgentConfig;
  state: RobotState;
}

type AgentEventCallback = (agentId: string, state: RobotState) => void;

export class AgentManager {
  private agents: Map<string, AgentStatus> = new Map();
  private listeners: AgentEventCallback[] = [];

  constructor() {
    for (const [id, config] of Object.entries(AGENT_MAP)) {
      this.agents.set(id, { id, config, state: 'idle' });
    }

    window.electronAPI?.onAgentEvent((event) => {
      this.handleEvent(event.agent, event.event as 'start' | 'complete');
    });
  }

  private handleEvent(agentId: string, event: 'start' | 'complete') {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    if (event === 'start') {
      agent.state = 'active';
      this.notify(agentId, 'active');
    } else if (event === 'complete') {
      agent.state = 'complete';
      this.notify(agentId, 'complete');

      setTimeout(() => {
        agent.state = 'idle';
        this.notify(agentId, 'idle');
      }, 2000);
    }
  }

  onStateChange(callback: AgentEventCallback) {
    this.listeners.push(callback);
  }

  private notify(agentId: string, state: RobotState) {
    for (const listener of this.listeners) {
      listener(agentId, state);
    }
  }

  getAgent(id: string): AgentStatus | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): AgentStatus[] {
    return Array.from(this.agents.values());
  }
}
