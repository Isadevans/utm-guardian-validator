export type PlatformName = 'facebook' | 'google' | 'tiktok' | 'pinterest';

export interface PlatformConfig {
  icon: string;
  color: string;
  displayName: string;
}

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  facebook: {
    icon: '/meta.svg',
    color: 'bg-[#1877F2] dark:bg-[#1877F2] text-white',
    displayName: 'Facebook'
  },
  google: {
    icon: '/google.svg',
    color: 'bg-[#EA4335] dark:bg-[#EA4335] text-white',
    displayName: 'Google'
  },
  tiktok: {
    icon: '/tiktok.svg',
    color: 'bg-[#000000] dark:bg-[#000000] text-white',
    displayName: 'TikTok'
  },
  pinterest: {
    icon: '/pinterest.svg',
    color: 'bg-[#E60023] dark:bg-[#E60023] text-white',
    displayName: 'Pinterest'
  }
};

const DEFAULT_CONFIG: PlatformConfig = {
  icon: '/placeholder.svg',
  color: 'bg-gray-500 dark:bg-gray-500 text-white',
  displayName: 'Unknown'
};

/**
 * Normalizes platform names to match config keys
 */
const normalizePlatformName = (platform: string): string => {
  const normalized = platform.toLowerCase();
  
  // Handle variations
  if (normalized.includes('meta') || normalized.includes('facebook')) {
    return 'facebook';
  }
  if (normalized.includes('google')) {
    return 'google';
  }
  if (normalized.includes('tiktok')) {
    return 'tiktok';
  }
  if (normalized.includes('pinterest')) {
    return 'pinterest';
  }
  
  return normalized;
};

/**
 * Gets platform configuration based on platform name
 */
export const getPlatformConfig = (platform: string): PlatformConfig => {
  const key = normalizePlatformName(platform);
  return PLATFORM_CONFIGS[key] || DEFAULT_CONFIG;
};

/**
 * Gets platform icon path
 */
export const getPlatformIcon = (platform: string): string => {
  return getPlatformConfig(platform).icon;
};

/**
 * Gets platform color classes
 */
export const getPlatformColor = (platform: string): string => {
  return getPlatformConfig(platform).color;
};

