/**
 * Settings Management Utility
 * Server URL is stored in browser localStorage
 * All other settings (API keys) are stored on the user's chosen backend
 */

export interface Settings {
  togetherApiKey: string;
  groqApiKey: string;
  serverUrl: string;
}

const DEFAULT_SERVER_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SERVER_URL_KEY = 'contextos_server_url';

// Cache settings in memory to avoid repeated API calls
let settingsCache: Settings | null = null;

/**
 * Get server URL from localStorage
 * This is the ONLY setting stored locally
 */
function getStoredServerUrl(): string {
  // IMPORTANT: Return default immediately if on server side
  if (typeof window === 'undefined') {
    console.log('[Settings] Running on server, using default URL:', DEFAULT_SERVER_URL);
    return DEFAULT_SERVER_URL;
  }
  
  try {
    const stored = localStorage.getItem(SERVER_URL_KEY);
    if (stored && stored.trim()) {
      console.log('[Settings] Using stored server URL from localStorage:', stored.trim());
      return stored.trim();
    }
  } catch (error) {
    console.error('Error reading server URL from localStorage:', error);
  }
  
  console.log('[Settings] No stored server URL, using default:', DEFAULT_SERVER_URL);
  return DEFAULT_SERVER_URL;
}

/**
 * Save server URL to localStorage
 */
function storeServerUrl(url: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const trimmedUrl = url.trim();
    localStorage.setItem(SERVER_URL_KEY, trimmedUrl);
    console.log('[Settings] Saved server URL to localStorage:', trimmedUrl);
  } catch (error) {
    console.error('Error writing server URL to localStorage:', error);
  }
}

/**
 * Load settings from the user's chosen backend
 * Server URL comes from localStorage, everything else from backend
 * @returns Promise<Settings>
 */
export async function loadSettings(): Promise<Settings> {
  try {
    // Get server URL from localStorage (this determines which backend to use)
    const serverUrl = getStoredServerUrl();
    
    console.log('[Settings] Loading settings from:', `${serverUrl}/api/settings`);
    
    // Fetch ALL settings from the user's backend
    const response = await fetch(`${serverUrl}/api/settings`, {
      cache: 'no-cache',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to load settings: ${response.statusText}`);
    }
    
    const backendSettings = await response.json();
    
    // Combine backend settings with locally stored server URL
    settingsCache = {
      togetherApiKey: backendSettings.togetherApiKey || '',
      groqApiKey: backendSettings.groqApiKey || '',
      serverUrl: serverUrl // Always use localStorage value for serverUrl
    };
    
    console.log('[Settings] Loaded settings successfully');
    return settingsCache;
  } catch (error) {
    console.error('Error loading settings:', error);
    
    // Return default settings if loading fails
    const serverUrl = getStoredServerUrl();
    return {
      togetherApiKey: '',
      groqApiKey: '',
      serverUrl: serverUrl
    };
  }
}

/**
 * Save settings
 * Server URL is saved to localStorage
 * API keys are saved to the backend at that URL
 * @param updates - Partial settings object with fields to update
 * @returns Promise<Settings> - Updated complete settings
 */
export async function saveSettings(updates: Partial<Settings>): Promise<Settings> {
  try {
    // Determine which backend to use
    let targetUrl: string;
    
    if (updates.serverUrl !== undefined) {
      // If updating server URL, use the NEW URL for saving
      targetUrl = updates.serverUrl.trim() || DEFAULT_SERVER_URL;
      storeServerUrl(targetUrl);
      console.log('[Settings] Server URL updated to:', targetUrl);
    } else {
      // Otherwise use current stored URL
      targetUrl = getStoredServerUrl();
    }
    
    // Prepare backend updates (everything except serverUrl)
    const backendUpdates: any = {};
    if (updates.togetherApiKey !== undefined) {
      backendUpdates.togetherApiKey = updates.togetherApiKey;
    }
    if (updates.groqApiKey !== undefined) {
      backendUpdates.groqApiKey = updates.groqApiKey;
    }
    
    console.log('[Settings] Saving to backend:', `${targetUrl}/api/settings`);
    
    // Save to backend (even if empty, to trigger backend validation)
    const response = await fetch(`${targetUrl}/api/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendUpdates),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save settings: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Update cache with complete settings
    settingsCache = {
      togetherApiKey: result.settings?.togetherApiKey || backendUpdates.togetherApiKey || settingsCache?.togetherApiKey || '',
      groqApiKey: result.settings?.groqApiKey || backendUpdates.groqApiKey || settingsCache?.groqApiKey || '',
      serverUrl: targetUrl
    };
    
    console.log('[Settings] Settings saved successfully');
    return settingsCache;
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

/**
 * Get the base URL for API calls
 * Always reads from localStorage (client-side only)
 * @returns string
 */
export function getBaseUrl(): string {
  const serverUrl = getStoredServerUrl();
  return serverUrl;
}

/**
 * Clear the settings cache
 * Forces reload from backend on next access
 */
export function clearSettingsCache(): void {
  settingsCache = null;
  console.log('[Settings] Cache cleared');
}

/**
 * Get cached settings without making an API call
 * Returns null if settings haven't been loaded yet
 */
export function getCachedSettings(): Settings | null {
  return settingsCache;
}

/**
 * Reset server URL to default (clears localStorage)
 * Useful for "Reset to Default" button
 */
export function resetServerUrl(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SERVER_URL_KEY);
    console.log('[Settings] Server URL reset to default');
  }
  settingsCache = null;
}