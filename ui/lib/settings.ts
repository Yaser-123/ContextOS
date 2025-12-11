/**
 * Settings Management Utility
 * Handles loading, saving, and accessing application settings
 */

export interface Settings {
  togetherApiKey: string;
  groqApiKey: string;
  serverUrl: string;
}

const DEFAULT_SERVER_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Cache settings in memory to avoid repeated API calls
let settingsCache: Settings | null = null;

/**
 * Load settings from the backend
 * @returns Promise<Settings>
 */
export async function loadSettings(): Promise<Settings> {
  try {
    // Use default URL for settings endpoint (chicken-egg problem)
    const response = await fetch(`${DEFAULT_SERVER_URL}/api/settings`);
    
    if (!response.ok) {
      throw new Error(`Failed to load settings: ${response.statusText}`);
    }
    
    const settings = await response.json();
    settingsCache = settings;
    return settings;
  } catch (error) {
    console.error('Error loading settings:', error);
    // Return default settings if loading fails
    return {
      togetherApiKey: '',
      groqApiKey: '',
      serverUrl: ''
    };
  }
}

/**
 * Save settings to the backend (supports partial updates)
 * @param updates - Partial settings object with fields to update
 * @returns Promise<Settings> - Updated complete settings
 */
export async function saveSettings(updates: Partial<Settings>): Promise<Settings> {
  try {
    // Use default URL for settings endpoint
    const response = await fetch(`${DEFAULT_SERVER_URL}/api/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save settings: ${response.statusText}`);
    }
    
    const result = await response.json();
    settingsCache = result.settings;
    return result.settings;
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

/**
 * Get the base URL for API calls
 * Uses custom server URL from settings, or falls back to default
 * @returns Promise<string>
 */
export async function getBaseUrl(): Promise<string> {
  // Load settings if not cached
  if (!settingsCache) {
    await loadSettings();
  }
  
  // Return custom server URL if configured, otherwise default
  const customUrl = settingsCache?.serverUrl?.trim();
  return customUrl || DEFAULT_SERVER_URL;
}

/**
 * Clear the settings cache (useful after updates)
 */
export function clearSettingsCache(): void {
  settingsCache = null;
}

/**
 * Get cached settings without making an API call
 * Returns null if settings haven't been loaded yet
 */
export function getCachedSettings(): Settings | null {
  return settingsCache;
}
