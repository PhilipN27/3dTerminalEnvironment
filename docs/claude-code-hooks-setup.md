# Claude Code Hooks Setup

Add the following to your `.claude/settings.json` to connect Claude Code to the 3D Terminal Environment.

## Hook Configuration

Replace `<PROJECT_PATH>` with the absolute path to the 3dTerminalEnvironment project.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Task",
        "command": "echo $CLAUDE_TOOL_INPUT | node <PROJECT_PATH>/src/hooks/parse-agent-event.js start"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Task",
        "command": "echo $CLAUDE_TOOL_INPUT | node <PROJECT_PATH>/src/hooks/parse-agent-event.js complete"
      }
    ]
  }
}
```

## How It Works

1. When Claude Code invokes the Task tool (which dispatches agents), the PreToolUse hook fires.
2. The parser script reads the tool input JSON from stdin.
3. It searches for known agent keywords in the input.
4. If a match is found, it POSTs an event to the 3D environment's hook server on localhost:3847.
5. When the Task tool completes, PostToolUse fires and sends a "complete" event.
6. If the 3D environment is not running, all hook calls fail silently with no impact on Claude Code.

## Supported Agents

| Agent ID | Keywords Matched |
|----------|-----------------|
| ui-architect | ui-architect, ui architect, frontend-design, UI Architect |
| backend-engineer | backend-engineer, backend engineer, Backend Engineer |
| test-writer | test-writer, test writer, Test Writer, test-driven |
| trello-attacker | trello-attacker, trello attacker, Trello Attacker, trello |
| mobile-optimizer | mobile-optimizer, mobile optimizer, Mobile Optimizer |
| qa-gatekeeper | qa-gatekeeper, qa gatekeeper, Q&A Gatekeeper, gatekeeper |

## Testing

With the 3D Terminal Environment running:

```bash
echo '{"subagent_type":"ui-architect","prompt":"Fix the layout"}' | node src/hooks/parse-agent-event.js start
```

You should see the UI Architect robot activate in the 3D scene.
