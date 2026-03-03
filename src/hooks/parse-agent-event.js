#!/usr/bin/env node
// parse-agent-event.js
// Called by Claude Code hooks. Parses tool input to identify which agent
// is being activated and POSTs to the 3D terminal environment.

const http = require('http');

const AGENT_KEYWORDS = {
  'ui-architect': ['ui-architect', 'ui architect', 'frontend-design', 'UI Architect'],
  'backend-engineer': ['backend-engineer', 'backend engineer', 'Backend Engineer'],
  'test-writer': ['test-writer', 'test writer', 'Test Writer', 'test-driven'],
  'trello-attacker': ['trello-attacker', 'trello attacker', 'Trello Attacker', 'trello'],
  'mobile-optimizer': ['mobile-optimizer', 'mobile optimizer', 'Mobile Optimizer'],
  'qa-gatekeeper': ['qa-gatekeeper', 'qa gatekeeper', 'Q&A Gatekeeper', 'gatekeeper'],
};

const eventType = process.argv[2] || 'start';
let toolInput = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { toolInput += chunk; });
process.stdin.on('end', () => {
  const lower = toolInput.toLowerCase();
  let matchedAgent = null;

  for (const [agentId, keywords] of Object.entries(AGENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        matchedAgent = agentId;
        break;
      }
    }
    if (matchedAgent) break;
  }

  if (!matchedAgent) {
    process.exit(0);
  }

  const payload = JSON.stringify({ agent: matchedAgent, event: eventType });
  const req = http.request({
    hostname: '127.0.0.1',
    port: 3847,
    path: '/agent-event',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    timeout: 1000,
  }, () => { process.exit(0); });

  req.on('error', () => { process.exit(0); });
  req.write(payload);
  req.end();
});
