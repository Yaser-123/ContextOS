const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { generate } = require('./lib/llm.js');
const memory = require('./memory');
const { analyzeContext } = require('./parsing/parser');
const { appendProcessedEntry } = require('./memory/processedMemory');
const { generateDailyPlan } = require('./daily/dailyPlanner');
const { saveDailyPlan, loadDailyPlan } = require('./memory/dailyPlanMemory');
const { startWatcher } = require('./fileWatcher');
const { handleChatbot, clearChatHistory } = require('./chatbot/chatbotHandler');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Context capture route - Now with memory persistence
app.post('/api/context', async (req, res) => {
  const { content, source } = req.body;

  if (!content || !source) {
    return res.status(400).json({ 
      ok: false, 
      error: 'Missing required fields: content and source' 
    });
  }

  try {
    // 1. Save to memory system (automatically updates context-index.json)
    await memory.appendContext(source, content);
    console.log('[Memory] Raw context saved to logs/');
    
    // 2. Run cleanup after every append
    try {
      await memory.cleanupOldLogs();
    } catch (cleanupError) {
      console.error('[Error] Cleanup failed:', cleanupError.message);
      // Don't fail the request if cleanup fails
    }
    
    // 3. Parse context with LLM
    const timestamp = Date.now();
    console.log('[Parsing] Starting analysis for', source);
    
    const parsed = await analyzeContext({
      content,
      source,
      timestamp
    });
    
    console.log('[Parsing] Parsed context for', source, 'Tasks:', parsed?.tasks?.length || 0);
    
    // 4. Check if content is irrelevant
    if (parsed.summary === "irrelevant") {
      console.log('[Parsing] Ignored irrelevant content.');
      return res.json({ 
        ok: true, 
        saved: true,
        ignored: true 
      });
    }
    
    // 5. Save parsed result (only for relevant content)
    await appendProcessedEntry(parsed);
    console.log('[Memory] Processed entry saved.');
    
    // 6. Trigger Kestra workflow for additional processing
    try {
      const kestraAuth = Buffer.from('1ammar.yaser@gmail.com:Yaser@123').toString('base64');
      
      // Use webhook endpoint with the webhook key defined in the flow
      const kestraResponse = await fetch("http://localhost:8080/api/v1/executions/webhook/contextos/context_parsing_flow/context_webhook", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Basic ${kestraAuth}`
        },
        body: JSON.stringify({
          content,
          source,
          timestamp
        })
      });
      
      if (kestraResponse.ok) {
        const execution = await kestraResponse.json();
        console.log("[Kestra] Triggered workflow, execution ID:", execution.id);
      } else {
        const errorText = await kestraResponse.text();
        console.warn("[Kestra] Workflow trigger failed:", kestraResponse.status, errorText);
      }
    } catch (kestraError) {
      console.warn("[Kestra] Failed to trigger workflow:", kestraError.message);
      // Continue - not critical if Kestra is unavailable
    }
    
    // 7. Log received context summary
    console.log('=== Context Received ===');
    console.log(`Source: ${source}`);
    console.log(`Content length: ${content.length}`);
    console.log(`Tasks extracted: ${parsed.tasks.length}`);
    console.log('========================');

    // 8. Return success response
    res.json({ 
      ok: true, 
      saved: true,
      parsed: true
    });
  } catch (error) {
    console.error('Error saving context:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to save context' 
    });
  }
});

// Memory API Routes

// Get recent context entries
app.get('/api/context/recent', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 50;
    const entries = await memory.loadRecent(count);
    res.json(entries);
  } catch (error) {
    console.error('Error loading recent context:', error);
    res.status(500).json({ error: 'Failed to load recent context' });
  }
});

// Get context for specific date
app.get('/api/context/day/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const entries = await memory.loadDay(date);
    res.json(entries);
  } catch (error) {
    console.error('Error loading day context:', error);
    res.status(500).json({ error: 'Failed to load context for date' });
  }
});

// Get context within date range
app.get('/api/context/range', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'Missing start or end date' });
    }
    const entries = await memory.loadRange(start, end);
    res.json(entries);
  } catch (error) {
    console.error('Error loading range:', error);
    res.status(500).json({ error: 'Failed to load context range' });
  }
});

// Search context
app.get('/api/context/search', async (req, res) => {
  try {
    const { q, start, end } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Missing search query' });
    }
    const results = await memory.searchContext(q, start, end);
    res.json(results);
  } catch (error) {
    console.error('Error searching context:', error);
    res.status(500).json({ error: 'Failed to search context' });
  }
});

// Get memory index
app.get('/api/context/index', async (req, res) => {
  try {
    const index = await memory.getIndex();
    res.json(index);
  } catch (error) {
    console.error('Error getting index:', error);
    res.status(500).json({ error: 'Failed to get index' });
  }
});

// Run cleanup
app.post('/api/context/cleanup', async (req, res) => {
  try {
    const result = await memory.cleanupOldLogs();
    res.json(result);
  } catch (error) {
    console.error('Error running cleanup:', error);
    res.status(500).json({ error: 'Failed to run cleanup' });
  }
});

// Get cleanup statistics
app.get('/api/context/cleanup/stats', async (req, res) => {
  try {
    const stats = await memory.getCleanupStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    res.status(500).json({ error: 'Failed to get cleanup stats' });
  }
});

// Test LLM with smart fallback
app.get('/test-llm-smart', async (req, res) => {
  try {
    const { text, provider } = await generate('Say hello!');
    res.json({
      providerUsed: provider,
      result: text
    });
  } catch (error) {
    res.status(500).json({
      error: 'Both LLM providers failed',
      message: error.message
    });
  }
});

// ============================================================
// Daily Planner API Routes - Mission 8.2
// ============================================================

// GET /api/daily-plan/available-dates - List all available dates with processed data and daily plans
app.get('/api/daily-plan/available-dates', async (req, res) => {
  try {
    const processedDir = path.join(__dirname, 'memory', 'processed');
    const dailyPlanDir = path.join(__dirname, 'memory', 'daily-plan');

    // Get all processed dates
    const processedFiles = await fs.readdir(processedDir);
    const processedDates = processedFiles
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''))
      .sort();

    // Get all daily plan dates
    const dailyPlanFiles = await fs.readdir(dailyPlanDir);
    const dailyPlanDates = dailyPlanFiles
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''))
      .sort();

    // Find dates with processed data but no daily plan
    const missingDailyPlans = processedDates.filter(date => !dailyPlanDates.includes(date));

    res.json({
      ok: true,
      processedDates,
      dailyPlanDates,
      missingDailyPlans,
      totalProcessed: processedDates.length,
      totalDailyPlans: dailyPlanDates.length,
      needsGeneration: missingDailyPlans.length > 0
    });

  } catch (error) {
    console.error('Error getting available dates:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to get available dates',
      message: error.message
    });
  }
});

// POST /api/daily-plan/generate-missing - Generate daily plans for all dates with processed data but no plan
app.post('/api/daily-plan/generate-missing', async (req, res) => {
  try {
    const processedDir = path.join(__dirname, 'memory', 'processed');
    const dailyPlanDir = path.join(__dirname, 'memory', 'daily-plan');

    // Get all processed dates
    const processedFiles = await fs.readdir(processedDir);
    const processedDates = processedFiles
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''))
      .sort();

    // Get all daily plan dates
    const dailyPlanFiles = await fs.readdir(dailyPlanDir);
    const dailyPlanDates = dailyPlanFiles
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''))
      .sort();

    // Find dates that need generation
    const missingDates = processedDates.filter(date => !dailyPlanDates.includes(date));

    if (missingDates.length === 0) {
      return res.json({
        ok: true,
        message: 'All daily plans are up to date',
        generated: [],
        skipped: processedDates.length
      });
    }

    console.log(`[API] Generating daily plans for ${missingDates.length} missing dates:`, missingDates);

    // Generate plans for all missing dates
    const results = [];
    for (const date of missingDates) {
      try {
        console.log(`[API] Generating daily plan for ${date}`);
        const plan = await generateDailyPlan(date);
        results.push({
          date,
          success: true,
          focusTasks: plan.focusTasks.length,
          totalTasks: plan.metadata.totalTasks
        });
        console.log(`[API] ✓ Generated plan for ${date}: ${plan.focusTasks.length} focus tasks, ${plan.metadata.totalTasks} total`);
      } catch (error) {
        console.error(`[API] ✗ Failed to generate plan for ${date}:`, error.message);
        results.push({
          date,
          success: false,
          error: error.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      ok: true,
      message: `Generated ${successful} daily plan(s), ${failed} failed`,
      generated: results.filter(r => r.success),
      failed: results.filter(r => !r.success),
      total: results.length
    });

  } catch (error) {
    console.error('Error generating missing daily plans:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to generate missing daily plans',
      message: error.message
    });
  }
});

// GET /api/daily-plan - Retrieve existing daily plan
app.get('/api/daily-plan', async (req, res) => {
  try {
    const { date } = req.query;

    // Validate date parameter
    if (!date) {
      return res.status(400).json({
        error: 'Missing required query parameter: date (YYYY-MM-DD)'
      });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format. Expected YYYY-MM-DD'
      });
    }

    // Load the plan
    const plan = await loadDailyPlan(date);

    if (plan) {
      res.json({
        exists: true,
        plan
      });
    } else {
      res.json({
        exists: false
      });
    }

  } catch (error) {
    console.error('Error loading daily plan:', error);
    res.status(500).json({
      error: 'Failed to load daily plan',
      message: error.message
    });
  }
});

// POST /api/daily-plan/generate - Generate new daily plan
app.post('/api/daily-plan/generate', async (req, res) => {
  try {
    const { date } = req.query;

    // Validate date parameter
    if (!date) {
      return res.status(400).json({
        error: 'Missing required query parameter: date (YYYY-MM-DD)'
      });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format. Expected YYYY-MM-DD'
      });
    }

    console.log(`[API] Generating daily plan for ${date}`);

    // Generate the plan
    const plan = await generateDailyPlan(date);

    // Note: generateDailyPlan already saves the plan internally,
    // but we could add explicit save here if needed for redundancy

    console.log(`[API] Daily plan generated successfully for ${date}`);
    console.log(`[API] Focus tasks: ${plan.focusTasks.length}, Total tasks: ${plan.metadata.totalTasks}`);

    res.json({
      ok: true,
      plan
    });

  } catch (error) {
    console.error('Error generating daily plan:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to generate daily plan',
      message: error.message
    });
  }
});

// PATCH /api/tasks/:taskId - Toggle task completion
app.patch('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { completed, date } = req.body;

    // Validate inputs
    if (!date) {
      return res.status(400).json({
        error: 'Missing required field: date (YYYY-MM-DD)'
      });
    }

    if (typeof completed !== 'boolean') {
      return res.status(400).json({
        error: 'Missing or invalid field: completed (must be boolean)'
      });
    }

    const taskIdNum = parseInt(taskId, 10);
    if (isNaN(taskIdNum)) {
      return res.status(400).json({
        error: 'Invalid task ID: must be a number'
      });
    }

    // Load the daily plan
    const plan = await loadDailyPlan(date);
    
    if (!plan) {
      return res.status(404).json({
        error: `No daily plan found for date: ${date}`
      });
    }

    // Find and update the task
    let taskFound = false;
    let taskType = '';

    // Check focus tasks
    const focusTask = plan.focusTasks?.find(t => t.taskNumber === taskIdNum);
    if (focusTask) {
      focusTask.completed = completed;
      taskFound = true;
      taskType = 'focus';
    }

    // Check other tasks if not found in focus
    if (!taskFound) {
      const otherTask = plan.otherTasks?.find(t => t.taskNumber === taskIdNum);
      if (otherTask) {
        otherTask.completed = completed;
        taskFound = true;
        taskType = 'other';
      }
    }

    if (!taskFound) {
      return res.status(404).json({
        error: `Task with ID ${taskIdNum} not found in plan for ${date}`
      });
    }

    // Save the updated plan back to disk
    await saveDailyPlan(date, plan);

    console.log(`[API] Task ${taskIdNum} (${taskType}) completion toggled to ${completed} for ${date}`);

    res.json({
      ok: true,
      plan,
      updated: {
        taskId: taskIdNum,
        taskType,
        completed
      }
    });

  } catch (error) {
    console.error('Error updating task completion:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to update task completion',
      message: error.message
    });
  }
});

// Chatbot routes
app.get('/api/chatbot', handleChatbot);
app.post('/api/chatbot', handleChatbot);
app.delete('/api/chatbot/history', clearChatHistory);

// ============================================================
// Settings API Routes
// ============================================================

// GET /api/settings - Load current settings
app.get('/api/settings', async (req, res) => {
  try {
    const settingsPath = path.join(__dirname, 'memory', 'settings.json');
    
    // Check if settings file exists
    try {
      await fs.access(settingsPath);
    } catch {
      // Create default settings if file doesn't exist
      const defaultSettings = {
        togetherApiKey: '',
        groqApiKey: '',
        serverUrl: ''
      };
      await fs.writeFile(settingsPath, JSON.stringify(defaultSettings, null, 2));
      return res.json(defaultSettings);
    }

    // Load and return settings
    const settingsData = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(settingsData);
    res.json(settings);
  } catch (error) {
    console.error('Error loading settings:', error);
    res.status(500).json({ 
      error: 'Failed to load settings',
      message: error.message 
    });
  }
});

// POST /api/settings - Update settings (partial updates allowed)
app.post('/api/settings', async (req, res) => {
  try {
    const settingsPath = path.join(__dirname, 'memory', 'settings.json');
    const updates = req.body;

    // Load current settings
    let currentSettings = {
      togetherApiKey: '',
      groqApiKey: '',
      serverUrl: ''
    };

    try {
      const settingsData = await fs.readFile(settingsPath, 'utf8');
      currentSettings = JSON.parse(settingsData);
    } catch {
      // File doesn't exist, use defaults
    }

    // Merge updates with current settings (partial update)
    const updatedSettings = {
      ...currentSettings,
      ...updates
    };

    // Validate fields
    if (updatedSettings.togetherApiKey !== undefined && typeof updatedSettings.togetherApiKey !== 'string') {
      return res.status(400).json({ error: 'togetherApiKey must be a string' });
    }
    if (updatedSettings.groqApiKey !== undefined && typeof updatedSettings.groqApiKey !== 'string') {
      return res.status(400).json({ error: 'groqApiKey must be a string' });
    }
    if (updatedSettings.serverUrl !== undefined && typeof updatedSettings.serverUrl !== 'string') {
      return res.status(400).json({ error: 'serverUrl must be a string' });
    }

    // Save updated settings
    await fs.writeFile(settingsPath, JSON.stringify(updatedSettings, null, 2));
    
    console.log('[Settings] Updated:', Object.keys(updates).join(', '));
    
    res.json({ 
      ok: true,
      settings: updatedSettings 
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ 
      error: 'Failed to update settings',
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`ContextOS Backend running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Memory Engine: Active`);
  
  // Start file watcher for automatic OCR/text extraction
  startWatcher();
});
