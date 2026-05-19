import gradient from 'gradient-string';

import { getGradientColors } from './themes/semantic';

// Create gradient lazily to pick up theme changes
const getBannerGradient = (): ReturnType<typeof gradient> =>
  gradient([...getGradientColors().banner]);

/**
 * Display the ASCII art banner with gradient colors
 */
export const showBanner = (): void => {
  const banner = `\n                    __
     ____ ___  ____/ /
    / __ \`__ \\/ __  / 
   / / / / / / /_/ /  
  /_/ /_/ /_/\\__,_/   
                      
  `;

  console.log(`\n${getBannerGradient()(banner)}`);
  console.log();
};
