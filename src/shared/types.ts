export type ShellType = 'powershell' | 'bash';

export interface ShellData {
  output: string;
}

export interface ShellInput {
  input: string;
}

export interface AgentEvent {
  agent: string;
  event: 'start' | 'complete';
}

export interface AgentState {
  agentId: string;
  state: 'idle' | 'active' | 'complete';
}

export type CameraPreset = 'overview' | 'terminal' | 'ui-architect' | 'backend-engineer' | 'test-writer' | 'trello-attacker' | 'mobile-optimizer' | 'qa-gatekeeper';

export const IPC = {
  SHELL_OUTPUT: 'shell:output',
  SHELL_INPUT: 'shell:input',
  SHELL_RESIZE: 'shell:resize',
  SHELL_SWITCH: 'shell:switch',
  AGENT_EVENT: 'agent:event',
} as const;
