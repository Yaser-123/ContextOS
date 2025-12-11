/**
 * API helper functions for ContextOS Daily Planner
 * Connects Next.js frontend to Express backend
 */

import { getBaseUrl, clearSettingsCache } from './settings';

interface Task {
  taskNumber: number;
  title: string;
  completed?: boolean;
}

interface FocusTask extends Task {
  reason: string;
}

interface DailyPlan {
  date: string;
  daySummary: string;
  focusTasks: FocusTask[];
  otherTasks: Task[];
  reminders: string[];
  scheduleSuggestions: Array<{
    timeOfDay: string;
    suggestion: string;
  }>;
  totalTasks: number;
}

interface DailyPlanResponse {
  exists: boolean;
  plan?: DailyPlan;
}

export type { DailyPlan, DailyPlanResponse, Task, FocusTask };

/**
 * Get the backend URL dynamically from settings
 * Always uses the stored server URL from localStorage
 * Only call this from client-side code (useEffect, event handlers)
 */
function getBackendUrl(): string {
  // Ensure we're in the browser
  if (typeof window === 'undefined') {
    console.warn('[API] getBackendUrl called on server side, using default');
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }
  
  const url = getBaseUrl();
  console.log('[API] Using backend URL:', url);
  return url;
}

/**
 * Capture context manually (same as extension capture)
 * @param content - The text content to capture
 * @returns Response indicating success or failure
 */
export async function captureContext(content: string): Promise<{ ok: boolean; error?: string; ignored?: boolean }> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '69420',
      },
      body: JSON.stringify({
        source: 'manual',
        content: content,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { ok: false, error: error.error || 'Failed to capture context' };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error capturing context:', error);
    return { ok: false, error: 'Network error' };
  }
}

/**
 * Fetch a daily plan for a specific date
 * @param dateStr - Date in YYYY-MM-DD format
 * @returns DailyPlanResponse with plan data or exists:false
 */
export async function getDailyPlan(dateStr: string): Promise<DailyPlanResponse | null> {
  try {
    const backendUrl = getBackendUrl();
    const fullUrl = `${backendUrl}/api/daily-plan?date=${dateStr}`;
    console.log('[API] Fetching daily plan from:', fullUrl);
    
    const response = await fetch(fullUrl, {
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '69420',
      },
    });

    if (!response.ok) {
      console.error(`[API] Failed to fetch daily plan: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('[API] Response body:', text);
      return null;
    }

    const data: DailyPlanResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[API] Error fetching daily plan:', error);
    return null;
  }
}

/**
 * Fetch today's daily plan
 * Automatically uses current date in YYYY-MM-DD format (local timezone)
 * @returns DailyPlanResponse with plan data or exists:false
 */
export async function getTodayPlan(): Promise<DailyPlanResponse | null> {
  const now = new Date();
  // Use local date instead of UTC to avoid timezone issues
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  console.log('[API] Fetching today\'s plan for date:', dateStr);
  return getDailyPlan(dateStr);
}

/**
 * Generate a new daily plan for a specific date
 * @param dateStr - Date in YYYY-MM-DD format
 * @returns Generated plan or null on failure
 */
export async function generateDailyPlan(dateStr: string): Promise<DailyPlan | null> {
  try {
    const backendUrl = getBackendUrl();
    const fullUrl = `${backendUrl}/api/daily-plan/generate?date=${dateStr}`;
    console.log('[API] Generating daily plan at:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '69420',
      },
    });

    if (!response.ok) {
      console.error(`[API] Failed to generate daily plan: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('[API] Response body:', text);
      return null;
    }

    const data = await response.json();
    return data.ok ? data.plan : null;
  } catch (error) {
    console.error('[API] Error generating daily plan:', error);
    return null;
  }
}

/**
 * Get available dates with processed data and daily plans
 * @returns Object with arrays of dates and generation status
 */
export async function getAvailableDates() {
  try {
    const backendUrl = getBackendUrl();
    const fullUrl = `${backendUrl}/api/daily-plan/available-dates`;
    console.log('[API] Fetching available dates from:', fullUrl);
    
    const response = await fetch(fullUrl, {
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '69420',
      },
    });

    if (!response.ok) {
      console.error(`[API] Failed to get available dates: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('[API] Response body:', text);
      return null;
    }

    const data = await response.json();
    console.log('[API] Received available dates:', data);
    return data;
  } catch (error) {
    console.error('[API] Error getting available dates:', error);
    return null;
  }
}

/**
 * Generate daily plans for all dates with processed data but no plan
 * @returns Result with list of generated plans
 */
export async function generateMissingPlans() {
  try {
    const backendUrl = getBackendUrl();
    const fullUrl = `${backendUrl}/api/daily-plan/generate-missing`;
    console.log('[API] Generating missing plans at:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '69420',
      },
    });

    if (!response.ok) {
      console.error(`[API] Failed to generate missing plans: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Error generating missing plans:', error);
    return null;
  }
}

/**
 * Toggle task completion status
 * @param taskId - Task number to update
 * @param completed - New completion status
 * @param date - Date of the plan (YYYY-MM-DD)
 * @returns Updated plan or null on failure
 */
export async function toggleTaskCompletion(
  taskId: number,
  completed: boolean,
  date: string
): Promise<DailyPlan | null> {
  try {
    const backendUrl = getBackendUrl();
    const fullUrl = `${backendUrl}/api/tasks/${taskId}`;
    console.log('[API] Toggling task completion at:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'PATCH',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '69420',
      },
      body: JSON.stringify({ completed, date }),
    });

    if (!response.ok) {
      console.error(`[API] Failed to toggle task completion: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.ok ? data.plan : null;
  } catch (error) {
    console.error('[API] Error toggling task completion:', error);
    return null;
  }
}

/**
 * Force refresh the settings cache
 * Call this after updating server URL in settings
 */
export function refreshApiSettings(): void {
  clearSettingsCache();
  console.log('[API] Settings cache cleared, next request will use updated URL');
}