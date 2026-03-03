import express from 'express';
import { BrowserWindow } from 'electron';
import { IPC } from '../shared/types';
import { AGENT_MAP, AGENT_KEYWORDS } from '../shared/agent-config';
import type { Server } from 'http';

const HOOK_PORT = 3847;

export class HookServer {
  private server: Server | null = null;
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  start() {
    const app = express();
    app.use(express.json());
    app.use(express.text());

    app.post('/agent-event', (req, res) => {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { agent, event } = body;

      if (agent && AGENT_MAP[agent]) {
        this.mainWindow.webContents.send(IPC.AGENT_EVENT, { agent, event });
      }

      res.status(200).json({ ok: true });
    });

    app.post('/hook-raw', (req, res) => {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const agent = this.identifyAgent(body);

      if (agent) {
        this.mainWindow.webContents.send(IPC.AGENT_EVENT, {
          agent,
          event: req.query.event || 'start',
        });
      }

      res.status(200).json({ ok: true });
    });

    this.server = app.listen(HOOK_PORT, '127.0.0.1', () => {
      console.log(`Hook server listening on http://127.0.0.1:${HOOK_PORT}`);
    });
  }

  private identifyAgent(toolInput: string): string | null {
    const lower = toolInput.toLowerCase();
    for (const [agentId, keywords] of Object.entries(AGENT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lower.includes(keyword.toLowerCase())) {
          return agentId;
        }
      }
    }
    return null;
  }

  stop() {
    this.server?.close();
    this.server = null;
  }
}
