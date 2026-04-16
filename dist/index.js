#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const API_BASE = process.env.AFTERLIVE_API_URL || "https://afterlive.ai";
const API_KEY = process.env.AFTERLIVE_API_KEY || "";
const headers = (extra) => ({
    "Content-Type": "application/json",
    ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    ...extra,
});
const server = new McpServer({
    name: "afterlive",
    version: "0.1.0",
});
server.tool("create_memorial", "Create a new digital memorial profile for a loved one. Returns a profile ID used for adding memories and chatting.", {
    name: z.string().describe("Full name of the person being memorialized"),
    pronoun: z.enum(["he", "she", "they"]).describe("Preferred pronoun for the memorial"),
    bio: z.string().describe("A brief biography or description of who this person was — personality, interests, what made them special"),
    email: z.string().optional().describe("Optional email for the memorial creator (for account linking)"),
}, async ({ name, pronoun, bio, email }) => {
    const res = await fetch(`${API_BASE}/api/memories`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action: "create", name, pronoun, bio, email }),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Request failed" }));
        return {
            content: [{ type: "text", text: `Error: ${error.error || res.statusText}` }],
            isError: true,
        };
    }
    const data = await res.json();
    return {
        content: [{
                type: "text",
                text: `Memorial created for ${name}.\n\nProfile ID: ${data.id}\nInvite Token: ${data.inviteToken || "N/A"}\n\nUse this Profile ID to add memories and start chatting.`,
            }],
    };
});
server.tool("add_memory", "Add a text memory to an existing memorial profile. Share stories, anecdotes, and personal recollections.", {
    profileId: z.string().describe("The memorial profile ID from create_memorial"),
    content: z.string().describe("The memory text — a story, anecdote, personality trait, or recollection about the person"),
    caption: z.string().optional().describe("Optional short caption or title for this memory"),
    contributorName: z.string().optional().describe("Name of the person contributing this memory"),
}, async ({ profileId, content, caption, contributorName }) => {
    const res = await fetch(`${API_BASE}/api/memories`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
            action: "add",
            profileId,
            type: "text",
            content,
            caption,
            contributorName,
        }),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Request failed" }));
        return {
            content: [{ type: "text", text: `Error: ${error.error || res.statusText}` }],
            isError: true,
        };
    }
    const data = await res.json();
    return {
        content: [{
                type: "text",
                text: `Memory added successfully.${caption ? ` Caption: "${caption}"` : ""}\n\nThe more memories you add, the more authentic the AI conversations become.`,
            }],
    };
});
server.tool("chat_with_memorial", "Have a conversation with the AI memorial. The AI draws on all contributed memories to respond in a way that reflects the memorialized person's personality and life.", {
    profileId: z.string().describe("The memorial profile ID"),
    message: z.string().describe("Your message to the memorial — ask questions, share feelings, or just talk"),
}, async ({ profileId, message }) => {
    const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
            profileId,
            messages: [{ role: "user", content: message }],
        }),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Request failed" }));
        const errMsg = error.error || res.statusText;
        if (res.status === 402 || errMsg.includes("limit")) {
            return {
                content: [{
                        type: "text",
                        text: `Free chat limit reached (20 messages). Upgrade at https://afterlive.ai/pricing\n\nSetup: Add AFTERLIVE_API_KEY to your MCP config env vars.`,
                    }],
                isError: true,
            };
        }
        return {
            content: [{ type: "text", text: `Error: ${errMsg}` }],
            isError: true,
        };
    }
    // Consume streaming response
    const reader = res.body?.getReader();
    if (!reader) {
        return {
            content: [{ type: "text", text: "Error: No response body" }],
            isError: true,
        };
    }
    const decoder = new TextDecoder();
    let fullText = "";
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        fullText += decoder.decode(value, { stream: true });
    }
    return {
        content: [{
                type: "text",
                text: fullText || "No response received.",
            }],
    };
});
server.tool("get_memorial", "Get details about a memorial profile including name, bio, memory count, and analytics.", {
    profileId: z.string().describe("The memorial profile ID"),
}, async ({ profileId }) => {
    const res = await fetch(`${API_BASE}/api/memories?id=${encodeURIComponent(profileId)}`, {
        headers: headers(),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Request failed" }));
        return {
            content: [{ type: "text", text: `Error: ${error.error || res.statusText}` }],
            isError: true,
        };
    }
    const data = await res.json();
    const profile = data.profile || data;
    const memories = data.memories || [];
    let text = `**${profile.name}** (${profile.pronoun || "they"})\n`;
    text += `Bio: ${profile.bio || "N/A"}\n`;
    text += `Memories: ${memories.length}\n`;
    if (data.analytics) {
        text += `Total chats: ${data.analytics.totalChats || 0}\n`;
        text += `Contributors: ${data.analytics.contributors || 0}\n`;
    }
    return { content: [{ type: "text", text }] };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch(console.error);
