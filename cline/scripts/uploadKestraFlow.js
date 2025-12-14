const fs = require("fs");
const axios = require("axios");

// Kestra Configuration
const KESTRA_URL = "http://localhost:8080";
// Note: In a production setting, these should be environment variables
const KESTRA_USERNAME = "1ammar.yaser@gmail.com"; 
const KESTRA_PASSWORD = "Your_Password"; 
const FLOW_FILE_PATH = "kestra/flows/context_summarizer_flow.yaml"; // Path to your YAML file

async function uploadFlow() {
  try {
    const yaml = fs.readFileSync(FLOW_FILE_PATH, "utf8");

    // Create Basic Auth header
    // Buffer is imported implicitly in Node.js environments
    const authHeader = Buffer.from(`${KESTRA_USERNAME}:${KESTRA_PASSWORD}`).toString('base64');

    console.log(`Attempting to upload flow from ${FLOW_FILE_PATH} to ${KESTRA_URL}...`);

    const res = await axios.post(
      `${KESTRA_URL}/api/v1/flows/import`,
      yaml,
      {
        headers: {
          "Content-Type": "text/yaml",
          "Authorization": `Basic ${authHeader}`
        }
      }
    );

    console.log("✅ Kestra flow uploaded successfully!");
    // The response data typically contains the flow definition that was just imported
    console.log(JSON.stringify(res.data, null, 2)); 
    
  } catch (err) {
    console.error("❌ Failed to upload flow:");
    // Provides more detailed error information from the Kestra API response body
    if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Data:", err.response.data);
    } else {
        console.error(err.message);
    }
    process.exit(1); // Exit with an error code if the upload fails
  }
}

uploadFlow();
