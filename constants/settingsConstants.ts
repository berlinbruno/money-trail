// Settings constants for the Money Trail app
import Constants from 'expo-constants';

// Get real app version from expo constants
export const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

// Theme options
export const THEME_OPTIONS = ['light', 'dark', 'system'] as const;

// Currency options with symbols and names
export const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
] as const;

// Sync interval options in minutes
export const SYNC_INTERVALS = [15, 120, 180, 360, 720, 1440] as const;

// Sample amount for currency preview
export const CURRENCY_PREVIEW_AMOUNT = '1,234';
