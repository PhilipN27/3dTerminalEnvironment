import { AGENT_MAP } from '../../shared/agent-config';
import { AgentManager, RobotState } from '../agents/agent-manager';
import { CameraController } from '../scene/camera';
import { CameraPreset } from '../../shared/types';
import { TerminalIO } from '../terminal/terminal-io';

const CAMERA_PRESET_KEYS: CameraPreset[] = [
  'overview', 'terminal', 'ui-architect', 'backend-engineer',
  'test-writer', 'trello-attacker', 'mobile-optimizer', 'qa-gatekeeper'
];

export class Overlay {
  constructor(
    agentManager: AgentManager,
    cameraController: CameraController,
    terminalIO: TerminalIO
  ) {
    this.setupAgentStatus(agentManager, cameraController);
    this.setupCameraButtons(cameraController);
    this.setupShellToggle(terminalIO);
  }

  private setupAgentStatus(agentManager: AgentManager, camera: CameraController) {
    const container = document.getElementById('agent-status')!;

    for (const [id, config] of Object.entries(AGENT_MAP)) {
      const indicator = document.createElement('div');
      indicator.className = 'agent-indicator';
      indicator.dataset.agentId = id;
      indicator.style.setProperty('--agent-color', config.color);
      indicator.style.setProperty('--agent-color-dim', config.color + '44');

      const dot = document.createElement('div');
      dot.className = 'agent-dot';
      indicator.appendChild(dot);

      const name = document.createElement('span');
      name.className = 'agent-name';
      name.textContent = config.displayName;
      indicator.appendChild(name);

      const stateText = document.createElement('span');
      stateText.className = 'agent-state-text';
      stateText.textContent = 'Idle';
      indicator.appendChild(stateText);

      indicator.addEventListener('click', () => {
        camera.goTo(id as CameraPreset);
      });
      container.appendChild(indicator);
    }

    agentManager.onStateChange((agentId, state) => {
      const indicator = container.querySelector('[data-agent-id="' + agentId + '"]');
      if (!indicator) return;
      indicator.className = 'agent-indicator' + (state === 'active' ? ' active' : '');
      const stateText = indicator.querySelector('.agent-state-text')!;
      stateText.textContent = state === 'active' ? 'Working...' : state === 'complete' ? 'Done!' : 'Idle';
    });
  }

  private setupCameraButtons(camera: CameraController) {
    const buttons = document.querySelectorAll('.cam-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = parseInt((btn as HTMLElement).dataset.preset!) - 1;
        camera.goTo(CAMERA_PRESET_KEYS[preset]);
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  private setupShellToggle(terminalIO: TerminalIO) {
    const buttons = document.querySelectorAll('.shell-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const shell = (btn as HTMLElement).dataset.shell!;
        terminalIO.switchShell(shell);
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }
}
