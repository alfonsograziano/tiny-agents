import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({ name: "first-client", version: "1.0.0" });

await client.connect(
  new StdioClientTransport({
    command: "docker",
    args: [
      "run",
      "-i",
      "--rm",
      "--mount",
      "type=bind,src=/Users/alfonsograziano/Desktop/experiments/tiny-agents,dst=/projects",
      "mcp/filesystem",
      "/projects",
    ],
    env: { PATH: process.env.PATH },
  })
);

const tools = await client.listTools();
console.log("Available tools:", JSON.stringify(tools, null, 2));

console.log("Connected to MCP server");
const result = await client.callTool({
  name: "write_file",
  arguments: {
    path: "/projects/tmp/test.txt",
    content: "Hello, pippo!",
  },
});

console.log("Result:", result);
