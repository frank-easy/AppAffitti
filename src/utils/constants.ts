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

export const ONBOARDING = {
  BG: '#0D1F1A',
  BG_INPUT: '#152B20',
  BG_INPUT_BORDER: '#2A4F38',
  SPHERE_STROKE: '#4A7D5B',
  TEXT_PRIMARY: '#F0EDE8',
  TEXT_SECONDARY: '#6B9975',
  TEXT_LINK: '#84A98C',
  CTA_TENANT: '#84A98C',
  CTA_OWNER: '#A7754D',
};