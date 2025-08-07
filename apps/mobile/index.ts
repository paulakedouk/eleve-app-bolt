// Add comprehensive polyfills for React Native
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';

// Set up global polyfills
global.Buffer = Buffer;

// Fix for crypto polyfill if needed
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = {
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }
  };
}

// Fix for process.env if needed
if (typeof global.process === 'undefined') {
  (global as any).process = { 
    env: { 
      NODE_ENV: __DEV__ ? 'development' : 'production' 
    } 
  };
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
