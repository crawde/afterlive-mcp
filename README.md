# AfterLive MCP Server

Create and interact with AI-powered digital memorials through any MCP-compatible AI assistant.

## What is AfterLive?

[AfterLive](https://afterlive.ai) lets you build living memorials for loved ones. Upload memories, stories, and recollections — then have AI-powered conversations that reflect their personality and life.

## Tools

| Tool | Description |
|------|-------------|
| `create_memorial` | Create a new memorial profile (name, pronoun, bio) |
| `add_memory` | Add a text memory/story to a profile |
| `chat_with_memorial` | Have a conversation with the AI memorial |
| `get_memorial` | View profile details, memory count, analytics |

## Quick Start

```bash
npx afterlive-mcp
```

### Claude Desktop Configuration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "afterlive": {
      "command": "npx",
      "args": ["-y", "afterlive-mcp"],
      "env": {
        "AFTERLIVE_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Usage Examples

- "Create a memorial for my grandmother Sarah"
- "Add a memory about how she always made apple pie on Sundays"
- "Chat with Sarah's memorial — ask her about her childhood"

## Free Tier

- 20 chat messages included
- Unlimited memorial creation and memory contributions
- Upgrade at [afterlive.ai/pricing](https://afterlive.ai/pricing) for unlimited access

## License

MIT
