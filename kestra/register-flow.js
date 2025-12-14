/**
 * Upload Kestra flow to server
 * 
 * This script reads the YAML flow definition and uploads it to Kestra
 * using the Flows API.
 */

const fs = require('fs');
const path = require('path');

const KESTRA_URL = process.env.KESTRA_URL || 'http://localhost:8080';
const KESTRA_USER = process.env.KESTRA_USER || '1ammar.yaser@gmail.com';
const KESTRA_PASSWORD = process.env.KESTRA_PASSWORD || 'Your_Password';
const FLOW_FILE = path.join(__dirname, 'flows', 'context-parsing-flow.yaml');

async function uploadFlow() {
  console.log('📤 Uploading Kestra flow...\n');

  try {
    // Read the YAML file
    if (!fs.existsSync(FLOW_FILE)) {
      console.error('❌ Flow file not found:', FLOW_FILE);
      process.exit(1);
    }

    const flowYaml = fs.readFileSync(FLOW_FILE, 'utf-8');
    console.log('✅ Read flow file:', FLOW_FILE);
    console.log(`   Size: ${flowYaml.length} bytes\n`);

    // Check if Kestra is accessible
    console.log('🔍 Checking Kestra availability...');
    try {
      const healthCheck = await fetch(`${KESTRA_URL}/api/v1/flows`, {
        method: 'GET'
      });
      
      if (healthCheck.status === 401) {
        console.log('⚠️  Kestra requires authentication (or running in EE mode)');
        console.log('   Using basic auth with default credentials...\n');
      } else if (healthCheck.ok) {
        console.log('✅ Kestra is accessible (OSS mode - no auth needed)\n');
      }
    } catch (error) {
      console.error('❌ Cannot reach Kestra at', KESTRA_URL);
      console.error('   Make sure Kestra is running: docker compose up -d\n');
      throw error;
    }

    // Upload to Kestra (use PUT to update existing flow)
    const url = `${KESTRA_URL}/api/v1/flows/contextos/context_parsing_flow`;
    console.log('🚀 Updating flow at:', url);

    const credentials = Buffer.from(`${KESTRA_USER}:${KESTRA_PASSWORD}`).toString('base64');
    
    // Use PUT to update existing flow
    let response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/x-yaml',
        'Authorization': `Basic ${credentials}`
      },
      body: flowYaml
    });

    // If 404, flow doesn't exist - create it with POST
    if (response.status === 404) {
      console.log('📝 Flow not found, creating new...');
      response = await fetch(`${KESTRA_URL}/api/v1/flows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-yaml',
          'Authorization': `Basic ${credentials}`
        },
        body: flowYaml
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed with HTTP ${response.status}`);
      console.error('Response:', errorText);
      
      if (response.status === 401) {
        console.error('\n💡 Authentication failed. Try:');
        console.error('   1. Set env vars: KESTRA_USER and KESTRA_PASSWORD');
        console.error('   2. Check if Kestra is in EE mode (requires login)');
        console.error('   3. Or use Kestra OSS (no authentication needed)');
      } else if (response.status === 422) {
        console.error('\n💡 Validation error. The flow YAML might have issues.');
        console.error('   Check the response message above for details.');
      }
      
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Flow updated successfully!\n');

    console.log('📋 Flow Details:');
    console.log(`   Namespace: ${result.namespace}`);
    console.log(`   ID: ${result.id}`);
    console.log(`   Revision: ${result.revision}`);
    console.log(`   Tasks: ${result.tasks?.length || 0}`);
    console.log(`   Triggers: ${result.triggers?.length || 0}`);

    console.log('\n🔗 Next Steps:');
    console.log(`   1. View in UI: ${KESTRA_URL}/ui/flows/edit/contextos/context_parsing_flow`);
    console.log(`   2. List flows: curl ${KESTRA_URL}/api/v1/flows`);
    console.log(`   3. Test trigger: curl -X POST ${KESTRA_URL}/api/v1/executions/contextos/context_parsing_flow \\`);
    console.log(`      -H "Content-Type: application/json" \\`);
    console.log(`      -d '{"content":"test","source":"manual","timestamp":${Date.now()}}'`);

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Is Kestra running? Check: docker compose ps');
    console.error('   2. Is the API accessible? Check: curl ' + KESTRA_URL + '/api/v1/flows');
    console.error('   3. Is the YAML valid? Check syntax at: https://yaml-online-parser.appspot.com/');
    process.exit(1);
  }
}

// Run the upload
uploadFlow();
