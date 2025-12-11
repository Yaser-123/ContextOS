# **ContextOS**
Your AI-powered personal context engine — with automation, planning, memory, and intelligent workflows.

---

# 📘 Overview

**ContextOS** is a personal productivity and context-management system designed to automate how you capture, organize, summarize, and act on your daily information.

It combines:

- 🌐 A **Next.js Frontend UI**
- ⚙️ A **Node.js Backend**
- 🧩 A **Browser Extension**
- 🤖 **AI agents** for parsing, summarization, memory management
- 🚀 **Cline CLI, Kestra Workflows, Oumi RL**, and Vercel

This README provides full documentation of **all five sponsor integrations**, setup instructions, architecture, and contribution guidelines.

---

# 🚀 Features

### ✔ Daily Plan Generator  
Creates structured plans every morning using your captured context.

### ✔ Memory System  
Stores your notes, tasks, summaries, OCR text, and history.

### ✔ AI Chatbot  
Chat with your entire context — using Together API, Groq, or local LLMs.

### ✔ Intelligent Parsing Pipeline  
Extract tasks, people, tools, and summary from any text.

### ✔ Browser Extension  
Capture screenshots, links, and text directly into backend memory.

---

# 🏆 Sponsor Technology Integrations

This section documents the integration for **all 5 hackathon prize tracks**.

---

# 1️⃣ **Cline CLI Automation — Infinity Build Award ($5,000)**

ContextOS includes **3 full automation abilities**:

### 🔹 Ability 1: Summarize Memory
```

cline/abilities/summarize-memory.yaml

````

Runs:
```sh
node cline/scripts/generateMemorySummary.js
````

### 🔹 Ability 2: Collect Daily Plan Files

```
cline/abilities/collect-daily-plan.yaml
```

Runs:

```sh
node cline/scripts/collectDailyPlan.js
```

### 🔹 Ability 3: Upload Kestra Flow

```
cline/abilities/upload-kestra-flow.yaml
```

Uploads flow using:

```sh
curl -X POST http://localhost:8080/api/v1/flows/upload
```

These demonstrate **autonomous code generation & workflow automation** — required for Sponsor #1.

---

# 2️⃣ **Kestra AI Agent — Wakanda Data Award ($4,000)**

A complete Kestra workflow:

```
kestra/flows/context_summarizer_flow.yaml
```

### ✔ Uses Gemini 2.5 Flash

### ✔ Summarizes daily plan JSON

### ✔ Built-in agent with structured output

Snippet:

```yaml
id: context_summarizer_flow
namespace: contextos
tasks:
  - id: ai_summarize
    type: io.kestra.plugin.ai.agent.AIAgent
    prompt: |
      Summarize the following content:
      {{ inputs.text }}

pluginDefaults:
  - type: io.kestra.plugin.ai.agent.AIAgent
    values:
      provider:
        type: io.kestra.plugin.ai.provider.GoogleGemini
        apiKey: "{{ secret('GEMINI_API_KEY') }}"
        modelName: "gemini-2.5-flash"
```

🎯 Qualifies for Sponsor #2.

---

# 3️⃣ **Oumi RL Fine-Tuning — Iron Intelligence Award ($3,000)**

ContextOS includes a complete RL pipeline:

### 📁 Dataset

```
backend/oumi/rl/dataset.jsonl
```

### 📁 Training Config

```
backend/oumi/rl/training.yaml
```

### 📁 Launcher

```
backend/oumi/rl/train.py
```

### ParserAgent Hook

```js
// Oumi RL fine-tuning hook for improved parsing accuracy
```

🎯 Fully satisfies Sponsor #3.

---

# 4️⃣ **Vercel Deployment — Stormbreaker Award ($2,000)**

The frontend (`ui/`) is deployed to Vercel.

### Required settings:

| Setting         | Value         |
| --------------- | ------------- |
| Root Directory  | `ui`          |
| Framework       | Next.js       |
| Build Command   | npm run build |
| Install Command | npm install   |

🎯 Sponsor #4 satisfied.

---

# 5️⃣ **CodeRabbit Automated Reviews — Captain Code Award ($1,000)**

Included:

* `.coderabbit.yaml` with strict review rules
* Auto-review enabled
* Severity tagging
* Auto-fix for lint issues
* PR reviewed by CodeRabbit (visible in repo)

🎯 Sponsor #5 fully satisfied.

---

# ⚙️ Setup Instructions

## 🟥 Backend Setup (Node.js)

```bash
cd backend
npm install
npm start
```

### Environment Variables

Create `backend/.env`:

```
TOGETHER_API_KEY=
GROQ_API_KEY=
OPENAI_API_KEY=
SERVER_URL=http://localhost:8000
```

---

## 🟦 Frontend Setup (Next.js)

```bash
cd ui
npm install
npm run dev
```

Create `ui/.env.local`:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

UI allows users to set custom backend URLs.

---

## 🟧 Kestra Setup

```bash
docker compose up -d
```

Dashboard:
➡ [http://localhost:8080](http://localhost:8080)

Upload flow:

```
kestra/flows/context_summarizer_flow.yaml
```

---

## 🟩 Oumi RL Training

```bash
python backend/oumi/rl/train.py
```

---

# 📁 Folder Structure

```
contextos/
├── backend/
│   ├── index.js
│   ├── memory/
│   ├── parsing/
│   ├── chatbot/
│   └── oumi/
│       └── rl/
│           ├── dataset.jsonl
│           ├── training.yaml
│           └── train.py
├── ui/
│   ├── pages/
│   ├── components/
├── extension/
├── cline/
│   ├── abilities/
│   └── scripts/
├── kestra/
│   └── flows/
└── README.md
```

---

# 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Make changes
4. Submit a Pull Request
5. CodeRabbit automatically reviews everything

---

# 📄 License

MIT License.

---

# 🎉 Thanks for using ContextOS!
