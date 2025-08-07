import { useState, useEffect } from 'react';
import * as Font from 'expo-font';

export const useFonts = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontLoadingError, setFontLoadingError] = useState<Error | null>(null);

  useEffect(() => {
    loadFonts();
  }, []);

  const loadFonts = async () => {
    try {
      await Font.loadAsync({
        'Archivo-Medium': require('../../../public/fonts/Archivo-Medium.ttf'),
        'ArchivoBlack-Regular': require('../../../public/fonts/ArchivoBlack-Regular.ttf'),
        'Poppins-ExtraBold': require('../../../public/fonts/Poppins-ExtraBold.ttf'),
        'Poppins-Medium': require('../../../public/fonts/Poppins-Medium.ttf'),
      });
      setFontsLoaded(true);
    } catch (error) {
      console.error('Error loading fonts:', error);
      setFontLoadingError(error as Error);
      // Continue without custom fonts to prevent app crash
      setFontsLoaded(true);
    }
  };

  return { fontsLoaded, fontLoadingError };
}; 