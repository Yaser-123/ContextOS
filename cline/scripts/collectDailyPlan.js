const fs = require("fs");
const path = require("path");

// Add your Kestra credentials here
const KESTRA_URL = "http://localhost:8080";
const KESTRA_USERNAME = "1ammar.yaser@gmail.com"; // Replace with your username
const KESTRA_PASSWORD = "Your_Password"; // Replace with your password

async function collectAndSummarizeDailyPlans() {
  const folder = path.join(process.cwd(), "./backend/memory/daily-plan");

  if (!fs.existsSync(folder)) {
    console.error("❌ daily-plan folder not found.");
    process.exit(1);
  }

  const files = fs.readdirSync(folder).filter(f => f.endsWith(".json"));

  let combined = "Daily Plan Summaries:\n\n";

  for (const file of files) {
    const fullPath = path.join(folder, file);
    const content = fs.readFileSync(fullPath, "utf8");

    combined += `--- ${file} ---\n`;
    combined += content + "\n\n";
  }

  // Save locally
  const outPath = path.join(process.cwd(), "daily-plan-text.txt");
  fs.writeFileSync(outPath, combined);
  console.log(`✅ Daily plan text created at: ${outPath}`);

  // Send to Kestra for AI summarization
  try {
    // Create Basic Auth header
    const auth = Buffer.from(`${KESTRA_USERNAME}:${KESTRA_PASSWORD}`).toString('base64');
    
    // Create multipart form data boundary
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const formData = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="text"\r\n\r\n` +
      `${combined}\r\n` +
      `--${boundary}--\r\n`;
    
    const response = await fetch(`${KESTRA_URL}/api/v1/main/executions/contextos/context_summarizer_flow`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Authorization": `Basic ${auth}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kestra API error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const execution = await response.json();
    console.log(`🚀 Kestra execution started: ${execution.id}`);
    
    // Poll for completion
    const summary = await waitForSummary(execution.id, auth);
    console.log("\n📝 AI Summary:\n");
    console.log(summary);
    
    // Save summary
    const summaryPath = path.join(process.cwd(), "daily-plan-summary.txt");
    fs.writeFileSync(summaryPath, summary);
    console.log(`\n✅ Summary saved to: ${summaryPath}`);

  } catch (error) {
    console.error("❌ Failed to get AI summary:", error.message);
  }
}

async function waitForSummary(executionId, auth) {
  const maxAttempts = 30;
  const delay = 2000; // 2 seconds

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${KESTRA_URL}/api/v1/main/executions/${executionId}`, {
      headers: {
        "Authorization": `Basic ${auth}`
      }
    });
    
    const execution = await response.json();

    if (execution.state.current === "SUCCESS") {
      return execution.outputs.summary;
    } else if (execution.state.current === "FAILED") {
      throw new Error("Kestra execution failed");
    }

    console.log(`⏳ Waiting for completion... (${i + 1}/${maxAttempts})`);
    
    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  throw new Error("Timeout waiting for summary");
}

// Run it
collectAndSummarizeDailyPlans().catch(console.error);
