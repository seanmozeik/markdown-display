import gradient from 'gradient-string';
import { getGradientColors } from './themes/semantic';

// Create gradient lazily to pick up theme changes
function getBannerGradient() {
  return gradient([...getGradientColors().banner]);
}

/**
 * Display the ASCII art banner with gradient colors
 */
export async function showBanner(): Promise<void> {
  const banner = `\n                    __
     ____ ___  ____/ /
    / __ \`__ \\/ __  / 
   / / / / / / /_/ /  
  /_/ /_/ /_/\\__,_/   
                      
  `;

  // Add whitespace above and indent to the right
  console.log(`\n${getBannerGradient()(banner)}`);
  console.log(); // Spacing after banner
}
