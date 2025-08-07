import { Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import uuid from 'react-native-uuid';

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your media library to save videos'
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting media library permission:', error);
    return false;
  }
};

export const saveVideoToLibrary = async (videoUri: string): Promise<boolean> => {
  try {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return false;

    const asset = await MediaLibrary.createAssetAsync(videoUri);
    await MediaLibrary.createAlbumAsync('Eleve', asset, false);
    
    return true;
  } catch (error) {
    console.error('Error saving video to library:', error);
    Alert.alert('Error', 'Failed to save video to library');
    return false;
  }
};

export const generateVideoId = (): string => {
  return uuid.v4() as string;
}; 