import { config } from "dotenv";
import OpenAI from "openai";
import { initializeClients, callTool, getTools } from "./clients.js";
import { askQuestions } from "./utils.js";
import fs from "fs";
import path from "path";

config();

const MAX_INTERACTIONS = parseInt(process.env.MAX_INTERACTIONS, 10) || 20;

async function main() {
  const clients = await initializeClients();
  const availableTools = await getTools(clients);

  console.log(
    `Connected to MCP servers: ${Object.keys(clients).join(", ")} with ${
      availableTools.length
    } available tools.`
  );

  // console.log(
  //   availableTools.map((tool) => ({
  //     toolName: tool.function.name,
  //     description: tool.function.description,
  //     clientName: tool.clientName,
  //   }))
  // );

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const messages = [
    {
      role: "system",
      content:
        "You are an AI assistant that can use various tools. The reference folder is /projects/tmp. Always use this folder when working with files.",
    },
    {
      role: "user",
      content:
        "Write the current time in a file named current_time.txt. Then, read the file and tell me the time.",
    },
  ];

  let interactionCount = 0;
  let taskComplete = false;

  while (interactionCount < MAX_INTERACTIONS && !taskComplete) {
    interactionCount++;
    console.log(`\n--- Interaction #${interactionCount} ---`);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: availableTools,
      tool_choice: "auto",
    });

    const message = response.choices[0].message;
    messages.push(message);

    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || "{}");

        if (functionName === "task_complete") {
          taskComplete = true;
          console.log("Task complete. Exiting...");
          break;
        }

        if (functionName === "ask_question") {
          const question = await askQuestions(args.questions);
          messages.push({
            type: "function_call_output",
            tool_call_id: toolCall.id,
            content: question,
            role: "tool",
          });
          continue;
        }

        const result = await callTool(toolCall, clients, availableTools);
        messages.push({
          type: "function_call_output",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
          role: "tool",
        });
      }
    } else {
      // No tool calls: assume final answer
      break;
    }
  }

  // After interacting, save messages and available tools
  try {
    const outputDir = path.resolve("./outputs");
    fs.mkdirSync(outputDir, { recursive: true });

    const timestamp = new Date().toISOString();
    const filename = `${timestamp}-interaction.json`;
    const filepath = path.join(outputDir, filename);

    const data = {
      tools: availableTools,
      conversation: messages,
    };

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`Saved conversation and tools to ${filepath}`);
  } catch (err) {
    console.error("Failed to save output file:", err);
  }
}

main().catch((error) => {
  console.error("Error:", error);
});
