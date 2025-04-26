# 🛠️ MCP Tool Runner

This project is an AI-powered agent that connects to multiple MCP servers, uses available tools dynamically, and processes complex prompts intelligently using OpenAI's API. This repo has been inspired by Huggingface [Tiny Agents](https://huggingface.co/blog/tiny-agents)

It can:

- Interact with multiple tool servers (MCP clients).
- Automatically choose and call the right tool based on the user input.
- Generate solutions step-by-step, including file operations inside a controlled `/projects/tmp` workspace.
- Save the entire conversation and tool usage for inspection.

---

## 🚀 How it Works

1. **Initialize Clients**: Connect to multiple MCP servers and fetch available tools.
2. **Interact with OpenAI**: Use `gpt-4o-mini` to process prompts and choose actions.
3. **Handle Tool Calls**: Dynamically call tools, ask clarification questions, and confirm task completion.
4. **Save Outputs**: Conversation logs and tool metadata are saved in `/outputs`.

---

## 📦 Installation

```bash
git clone https://your-repo-url.git
cd your-repo-folder
npm install
```

Make sure you have a `.env` file in the root folder with:

```env
OPENAI_API_KEY=your-openai-key
MAX_INTERACTIONS=10
```

---

## 🧹 Project Structure

| File         | Purpose                                        |
| :----------- | :--------------------------------------------- |
| `index.js`   | Main execution logic                           |
| `clients.js` | Initialize clients and handle tool invocations |
| `utils.js`   | Utility functions like user questioning        |
| `outputs/`   | Saved conversations and tool metadata          |

---

## 🖥️ Usage

Run the script with a prompt:

```bash
node index.js "Write a JS script to print the current time"
```

If no prompt is provided, it uses a default prompt inside the script (can be customized).

---

## ⚙️ Environment Variables

| Variable           | Description                                              |
| :----------------- | :------------------------------------------------------- |
| `OPENAI_API_KEY`   | Your OpenAI API Key                                      |
| `MAX_INTERACTIONS` | (Optional) Max interactions with the model (default: 10) |

---

## 👢 Outputs

At the end of the run, you’ll find a new JSON file in the `outputs/` folder containing:

- The conversation history
- Available tools metadata

Example filename:

```
2025-04-26T15:30:10.000Z-interaction.json
```

---

## ✨ Features

- Auto-detect and use tools without manual selection.
- Supports clarification questions (`askQuestions`).
- Handles multiple servers at once.
- Clean file saving and timestamped output.
- Error handling and graceful shutdown.

---

## 👋 TODO / Improvements

- Add support for retries on tool errors.
- Improve logging and add verbosity levels.
- Allow interactive input instead of hardcoded prompts.
- Add simple tests for `clients.js` and `utils.js`.

---
