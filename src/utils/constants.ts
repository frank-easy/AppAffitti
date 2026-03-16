import { Dimensions } from 'react-native';

export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Dimensions.get('window').height;

export type Tab = 'home' | 'chat' | 'profile';

// NexaVerse Color Palette - Role-Based Theme System
export const COLORS = {
  // Universal / Functional (Navigation, Inputs, Headers, Neutral Backgrounds)
  primaryDark: '#01161E',   // Main App Backgrounds, Headers, Primary Text
  functionalTeal: '#124559', // Universal Interactables (Unselected tabs, neutral buttons, functional icons)
  
  // Role Specific Identities
  tenantBrand: '#84A98C',   // "Muted Teal" -> EXCLUSIVE for Tenant UI (Active tabs, Main Buttons for Tenant)
  ownerBrand: '#A7754D',    // "Faded Copper" -> EXCLUSIVE for Owner UI (Active tabs, Main Buttons for Owner)

  // Utilities
  white: '#FFFFFF',
  backgroundLight: '#F4F6F8', // Dashboard board background
  cardWhite: '#FFFFFF',     // Cards, Modals, Input Backgrounds
  inputBorder: '#E0E6ED',   // Subtle border for inputs
  error: '#FF4D4D',
  
  // Legacy aliases for backward compatibility (will be phased out)
  inkBlack: '#01161E',
  darkTeal: '#124559',
  mutedTeal: '#84A98C',
  fadedCopper: '#A7754D',
};