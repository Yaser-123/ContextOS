/**
 * Direct Webhook Test
 * 
 * Test the Kestra webhook endpoint directly
 */

async function testWebhook() {
  console.log('🧪 Testing Kestra Webhook Directly\n');
  
  const kestraAuth = Buffer.from('1ammar.yaser@gmail.com:Your_Password').toString('base64');
  
  const payload = {
    content: "This is a direct webhook test to verify Kestra integration is working properly.",
    source: "webhook-test",
    timestamp: Date.now()
  };

  console.log('📤 Sending to webhook endpoint...');
  console.log('   URL: http://localhost:8080/api/v1/executions/webhook/contextos/context_parsing_flow/context_webhook');
  console.log('   Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch('http://localhost:8080/api/v1/executions/webhook/contextos/context_parsing_flow/context_webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${kestraAuth}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Webhook triggered successfully!\n');
      console.log('Execution Details:');
      console.log(JSON.stringify(result, null, 2));
      
      console.log('\n🔗 View execution in Kestra UI:');
      console.log(`   http://localhost:8080/ui/executions/${result.namespace}/${result.flowId}/${result.id}`);
    } else {
      const errorText = await response.text();
      console.log('❌ Webhook failed!');
      console.log('Response:', errorText);
      
      if (response.status === 404) {
        console.log('\n💡 404 means the webhook endpoint is incorrect.');
        console.log('   Check that:');
        console.log('   1. The flow has a webhook trigger defined');
        console.log('   2. The webhook key matches: "context_webhook"');
        console.log('   3. The namespace and flow ID are correct');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWebhook();
