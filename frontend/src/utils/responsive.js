import { useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
  xs: 480,   // Small Mobile (<480)
  sm: 640,   // Mobile (<640)
  md: 768,   // Tablet (<768)
  lg: 1024,  // Small Desktop / Laptop (<1024)
  xl: 1280,  // Desktop (<1280)
  xxl: 1536, // Large Desktop (>=1536)
};

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isSmallMobile = width < BREAKPOINTS.xs;
  const isMobile = width < BREAKPOINTS.md;
  const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isSmallDesktop = width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl;
  const isDesktop = width >= BREAKPOINTS.lg;
  const isWideScreen = width >= BREAKPOINTS.xxl;

  const isLandscape = width > height;
  const isPortrait = height >= width;

  // Dynamic grid column calculator
  const getGridColumns = (maxCols = 4) => {
    if (width >= BREAKPOINTS.xl) return Math.min(4, maxCols);
    if (width >= BREAKPOINTS.lg) return Math.min(3, maxCols);
    if (width >= BREAKPOINTS.sm) return Math.min(2, maxCols);
    return 1;
  };

  const contentMaxWidth = Math.min(width - (isMobile ? 24 : 48), 1280);

  return {
    width,
    height,
    isSmallMobile,
    isMobile,
    isTablet,
    isSmallDesktop,
    isDesktop,
    isWideScreen,
    isLandscape,
    isPortrait,
    getGridColumns,
    contentMaxWidth,
  };
};

export default useResponsive;
