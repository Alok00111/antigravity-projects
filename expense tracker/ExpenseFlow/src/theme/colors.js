// File: src/theme/colors.js

const LIGHT_COLORS = {
  background: '#FAFAFA',
  card: '#FFFFFF',
  primary: '#7C3AED',
  accent: '#22C55E',
  text: '#18181B',
  textSecondary: '#71717A',
  border: '#E4E4E7',
  danger: '#EF4444',
  success: '#22C55E',
  tabInactive: '#A1A1AA',
};

const DARK_COLORS = {
  background: '#0F0F14',
  card: '#1A1A24',
  primary: '#A78BFA',
  accent: '#4ADE80',
  text: '#F4F4F5',
  textSecondary: '#A1A1AA',
  border: '#27272A',
  danger: '#F87171',
  success: '#4ADE80',
  tabInactive: '#71717A',
};

// Default export stays light for backward compatibility
const COLORS = { ...LIGHT_COLORS };

export { LIGHT_COLORS, DARK_COLORS };
export default COLORS;
