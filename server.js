import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { parse } from "mathjs";

// Create an MCP server
const server = new McpServer({
  name: "Demo",
  version: "1.0.0",
});

server.tool(
  "calculator",
  {
    expression: z.string().describe("A mathematical expression to evaluate"),
  },
  async ({ expression }) => {
    try {
      const node = parse(expression);
      const code = node.compile();
      const result = code.evaluate();
      return {
        content: [{ type: "text", text: String(result) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
);

server.tool(
  "hello",
  {
    name: z.string().describe("Name of the person to greet"),
  },
  async ({ name }) => {
    return {
      content: [
        { type: "text", text: `Hello, ${name}!` },
        { type: "text", text: "How can I assist you today?" },
      ],
    };
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
