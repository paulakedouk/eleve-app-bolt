import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

export const webSupport = {
  camera: typeof navigator !== 'undefined' && 'mediaDevices' in navigator,
  localStorage: typeof localStorage !== 'undefined',
  sessionStorage: typeof sessionStorage !== 'undefined',
};

export const getWebCameraConstraints = () => ({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'environment' // Use back camera on mobile browsers
  },
  audio: true
});

export const handleWebNavigation = (url: string) => {
  if (isWeb) {
    window.location.href = url;
  }
};

export const deepLink = {
  canHandle: !isWeb,
  createUrl: (path: string) => isWeb ? `${window.location.origin}${path}` : `eleve://${path}`
}; 