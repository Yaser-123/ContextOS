/**
 * Test Kestra Trigger Endpoint
 * 
 * This script tests different Kestra API endpoints to find the correct one
 */

async function testTrigger() {
  const kestraAuth = Buffer.from('1ammar.yaser@gmail.com:Your_Password').toString('base64');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${kestraAuth}`
  };
  
  const payload = {
    content: "Test content from diagnostic script",
    source: "test",
    timestamp: Date.now()
  };

  console.log('🧪 Testing Kestra Trigger Endpoints\n');
  
  // Test 1: Direct execution endpoint
  console.log('Test 1: POST /api/v1/executions/contextos/context_parsing_flow');
  try {
    const response1 = await fetch('http://localhost:8080/api/v1/executions/contextos/context_parsing_flow', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    console.log(`   Status: ${response1.status} ${response1.statusText}`);
    const text1 = await response1.text();
    console.log(`   Response: ${text1.substring(0, 200)}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 2: Webhook trigger endpoint
  console.log('Test 2: POST /api/v1/executions/webhook/contextos/context_parsing_flow/{webhook_key}');
  console.log('   ⚠️  Requires webhook key - skipping\n');

  // Test 3: Check flow details
  console.log('Test 3: GET /api/v1/flows/contextos/context_parsing_flow');
  try {
    const response3 = await fetch('http://localhost:8080/api/v1/flows/contextos/context_parsing_flow', {
      headers: { 'Authorization': `Basic ${kestraAuth}` }
    });
    
    console.log(`   Status: ${response3.status} ${response3.statusText}`);
    
    if (response3.ok) {
      const flow = await response3.json();
      console.log(`   ✅ Flow exists: ${flow.namespace}/${flow.id}`);
      console.log(`   Tasks: ${flow.tasks?.length || 0}`);
      console.log(`   Triggers: ${flow.triggers?.length || 0}\n`);
      
      if (!flow.triggers || flow.triggers.length === 0) {
        console.log('   💡 Flow has no triggers defined!');
        console.log('   This means it can only be executed manually via UI.');
        console.log('   To enable API triggering, you need to add a trigger to the flow.\n');
      }
    } else {
      const text3 = await response3.text();
      console.log(`   Response: ${text3}\n`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 4: Try manual execution endpoint (if it exists)
  console.log('Test 4: POST /api/v1/executions/trigger/contextos/context_parsing_flow');
  try {
    const response4 = await fetch('http://localhost:8080/api/v1/executions/trigger/contextos/context_parsing_flow', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    console.log(`   Status: ${response4.status} ${response4.statusText}`);
    const text4 = await response4.text();
    console.log(`   Response: ${text4.substring(0, 200)}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  console.log('📋 Summary:');
  console.log('   If all tests failed, the flow might need a trigger configuration.');
  console.log('   Check the Kestra documentation for the correct execution method.');
}

testTrigger();
