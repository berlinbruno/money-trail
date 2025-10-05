/**
 * Global settings refresh utility
 * This module provides a way to refresh settings from anywhere in the app
 * without creating circular dependencies
 */

// Global reference to refresh function for use outside the provider
let globalSettingsRefresh: (() => Promise<void>) | null = null;

/**
 * Set the global settings refresh function
 * Called by SettingsProvider during initialization
 */
export function setGlobalSettingsRefresh(refreshFn: () => Promise<void>): void {
  globalSettingsRefresh = refreshFn;
}

/**
 * Global function to refresh settings from anywhere in the app
 * This allows SMS sync and other operations to trigger settings refresh
 */
export async function refreshSettingsGlobally(): Promise<void> {
  if (globalSettingsRefresh) {
    try {
      await globalSettingsRefresh();
    } catch (error) {
      console.error('Error in global settings refresh:', error);
    }
  }
}

/**
 * Clear the global settings refresh function
 * Called when SettingsProvider unmounts
 */
export function clearGlobalSettingsRefresh(): void {
  globalSettingsRefresh = null;
}
