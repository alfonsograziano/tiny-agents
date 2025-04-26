import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { config } from "dotenv";

config();

const clients = {};
// The client name is used to identify the intenrnal client for interactions with the user
export const INTERACTION_SERVER = "interaction-server";

const serverConfigs = [
  {
    name: "local-stdio",
    transport: new StdioClientTransport({
      command: "node",
      args: ["server.js"],
      env: { PATH: process.env.PATH },
    }),
  },
  {
    name: "filesystem",
    transport: new StdioClientTransport({
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
    }),
  },
  {
    name: "fetch",
    transport: new StdioClientTransport({
      command: "docker",
      args: ["run", "-i", "--rm", "mcp/fetch"],
      env: { PATH: process.env.PATH },
    }),
  },
  {
    name: "memory",
    transport: new StdioClientTransport({
      command: "docker",
      args: [
        "run",
        "-i",
        "-v",
        "claude-memory:/app/dist",
        "--rm",
        "mcp/memory",
      ],
      env: { PATH: process.env.PATH },
    }),
  },
  {
    name: "sequentialthinking",
    transport: new StdioClientTransport({
      command: "docker",
      args: ["run", "--rm", "-i", "mcp/sequentialthinking"],
      env: { PATH: process.env.PATH },
    }),
  },
  {
    name: "brave-search",
    transport: new StdioClientTransport({
      command: "docker",
      args: [
        "run",
        "-i",
        "--rm",
        "-e",
        `BRAVE_API_KEY=${process.env.BRAVE_API_KEY}`,
        "mcp/brave-search",
      ],
      env: {
        PATH: process.env.PATH,
        BRAVE_API_KEY: process.env.BRAVE_API_KEY,
      },
    }),
  },
  {
    name: "run_js",
    transport: new StdioClientTransport({
      command: "docker",
      args: [
        "run",
        "-i",
        "--rm",
        "-v",
        "/var/run/docker.sock:/var/run/docker.sock",
        "alfonsograziano/node-code-sandbox-mcp",
      ],
      env: {
        PATH: process.env.PATH,
      },
    }),
  },
];

export async function initializeClients() {
  for (const cfg of serverConfigs) {
    const client = new Client({ name: cfg.name, version: "1.0.0" });
    await client.connect(cfg.transport);
    clients[cfg.name] = client;
  }

  return clients;
}

export const taskCompletionTool = {
  clientName: INTERACTION_SERVER,
  type: "function",
  function: {
    name: "task_complete",
    description: "Call this tool when the task given by the user is complete",
    parameters: {
      type: "object",
      properties: {},
    },
  },
};

export const askQuestionTool = {
  clientName: INTERACTION_SERVER,
  type: "function",
  function: {
    name: "ask_question",
    description:
      "Ask a question to the user to get more info required to solve or clarify their problem.",
    parameters: {
      type: "object",
      properties: {
        questions: {
          type: "string",
          description:
            "The question(s) to ask the user to gather more information.",
        },
      },
      required: ["questions"],
    },
  },
};

export const getTools = async (clients) => {
  const toolsByClient = await Promise.all(
    Object.entries(clients).map(async ([clientName, client]) => {
      const { tools } = await client.listTools();
      return { clientName, tools };
    })
  );

  const availableToolsFromClients = toolsByClient.flatMap(
    ({ clientName, tools }) =>
      tools.map((tool) => ({
        type: "function",
        function: {
          parameters: tool.inputSchema,
          ...tool,
        },
        clientName,
      }))
  );

  const availableTools = [
    taskCompletionTool,
    askQuestionTool,
    ...availableToolsFromClients,
  ];

  return availableTools;
};

export const callTool = async (
  toolCall,
  clients,
  availableToolsFromClients
) => {
  const functionName = toolCall.function.name;
  const args = JSON.parse(toolCall.function.arguments || "{}");

  const clientName = availableToolsFromClients.find(
    (tool) => tool.function.name === functionName
  )?.clientName;

  const client = clients[clientName];

  return client.callTool({
    name: functionName,
    arguments: args,
  });
};
