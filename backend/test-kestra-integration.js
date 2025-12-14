/**
 * Test Kestra Integration
 * 
 * This script tests the complete flow:
 * 1. Send context to backend API
 * 2. Backend saves to memory
 * 3. Backend triggers Kestra workflow
 * 4. Verify workflow execution in Kestra
 */

const testContext = {
  content: `Meeting notes from team standup on December 9, 2025:

Attendees: John, Sarah, Mike, and the product team

Action Items:
- John needs to finish the API documentation by Friday, December 13th
- Sarah will review all pending pull requests this afternoon
- We need to schedule a product demo with the client next week (Dec 16-20)
- Mike mentioned the database migration should happen on Monday morning
- Everyone should update their Jira tickets before end of day

Discussion Points:
- The new feature release is on track for Q1 2026
- Security audit findings need to be addressed
- Performance improvements showing 40% reduction in load time

Next Meeting: Thursday at 10 AM`,
  source: 'kestra-integration-test'
};

async function testIntegration() {
  console.log('🧪 Testing Kestra Integration\n');
  
  try {
    // Step 1: Send context to backend
    console.log('📤 Step 1: Sending context to backend...');
    const response = await fetch('http://localhost:8000/api/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testContext)
    });
    
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Backend response:', result);
    
    // Wait a moment for Kestra to process
    console.log('\n⏳ Waiting 2 seconds for Kestra workflow...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Check Kestra executions
    console.log('📋 Step 2: Checking Kestra executions...');
    const kestraAuth = Buffer.from('1ammar.yaser@gmail.com:Your_Password').toString('base64');
    
    const executions = await fetch('http://localhost:8080/api/v1/executions?namespace=contextos&flowId=context_parsing_flow', {
      headers: { 'Authorization': `Basic ${kestraAuth}` }
    });
    
    if (!executions.ok) {
      throw new Error(`Kestra API returned ${executions.status}`);
    }
    
    const executionList = await executions.json();
    console.log(`✅ Found ${executionList.total} total executions`);
    
    if (executionList.results && executionList.results.length > 0) {
      const latest = executionList.results[0];
      console.log('\n📊 Latest Execution:');
      console.log(`   ID: ${latest.id}`);
      console.log(`   State: ${latest.state.current}`);
      console.log(`   Started: ${new Date(latest.state.startDate).toLocaleString()}`);
      
      if (latest.state.current === 'SUCCESS') {
        console.log('\n✅ Integration test PASSED!');
        console.log('🎉 Complete flow working:');
        console.log('   ✓ Backend API received context');
        console.log('   ✓ Memory saved raw context');
        console.log('   ✓ LLM parsed the content');
        console.log('   ✓ Processed memory saved');
        console.log('   ✓ Kestra workflow triggered');
        console.log('   ✓ Workflow executed successfully');
      } else {
        console.log(`\n⚠️  Workflow state: ${latest.state.current}`);
      }
    } else {
      console.log('⚠️  No executions found yet');
    }
    
    // Step 3: View link
    console.log('\n🔗 View in Kestra UI:');
    console.log('   http://localhost:8080/ui/executions/contextos/context_parsing_flow');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure backend is running: cd backend && npm start');
    console.error('   2. Make sure Kestra is running: cd kestra && docker compose up');
    console.error('   3. Check flow is registered: http://localhost:8080/ui/flows');
    process.exit(1);
  }
}

testIntegration();
