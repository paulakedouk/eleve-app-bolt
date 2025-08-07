import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Settings, Upload, Save, ArrowLeft } from 'lucide-react-native';
import { RootStackParamList } from '../../../shared/types';
import { supabase } from '../../../shared/lib/supabase';
import { getAdminProfile, updateOrganization, AdminProfile } from '../../../shared/services/adminService';
import { s3Service } from '../../../shared/services/awsS3Service';
import { isWeb } from '../../../shared/utils/platform';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import { BottomNavigation } from '../../../shared/components/BottomNavigation';
import BackButton from '../../../shared/components/BackButton';

type AdminSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdminSettings'>;

interface RouteParams {
  organizationId: string;
}

// Admin-specific design colors that extend the main design system
const ADMIN_COLORS = {
  coach: '#FFC900',
  parent: '#91A8EB', 
  partners: '#55C1C3',
  approvals: '#FF5A34',
  tricks: '#91DEF1',
};

const AdminSettingsScreen: React.FC = () => {
  const navigation = useNavigation<AdminSettingsScreenNavigationProp>();
  const route = useRoute();
  const { organizationId } = route.params as RouteParams;

  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null); // For web platform
  const [logoError, setLogoError] = useState<boolean>(false); // Track image loading errors
  const [logoLoading, setLogoLoading] = useState<boolean>(false); // Track image loading state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadAdminData();
    requestPermissions();
  }, []);

  // Cleanup object URL on unmount (web only)
  useEffect(() => {
    return () => {
      if (isWeb && logoUri && logoUri.startsWith('blob:')) {
        URL.revokeObjectURL(logoUri);
      }
    };
  }, [logoUri]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to upload logos.');
    }
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const profile = await getAdminProfile();
      if (profile) {
        setAdminProfile(profile);
        setOrganizationName(profile.organization_name);
        setLogoUri(profile.organization_logo_url);
        setLogoError(false); // Reset logo error state
        setLogoLoading(false); // Reset logo loading state
        console.log('🏢 Loaded organization logo URL:', profile.organization_logo_url);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      Alert.alert('Error', 'Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      if (isWeb) {
        // Web platform: use HTML file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
              Alert.alert('File too large', 'Please select an image smaller than 5MB');
              return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
              Alert.alert('Invalid file type', 'Please select an image file');
              return;
            }

            setLogoFile(file);
            setLogoUri(URL.createObjectURL(file)); // Create preview URL
            setLogoError(false); // Reset error state for new image
            setLogoLoading(false); // Reset loading state for new image
          }
        };
        input.click();
      } else {
        // Native platform: use expo-image-picker
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          allowsMultipleSelection: false,
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          
          // Validate file size (max 5MB)
          if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
            Alert.alert('File too large', 'Please select an image smaller than 5MB');
            return;
          }

          setLogoUri(asset.uri);
          setLogoFile(null); // Clear web file state
          setLogoError(false); // Reset error state for new image
          setLogoLoading(false); // Reset loading state for new image
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const saveSettings = async () => {
    if (!organizationName.trim()) {
      Alert.alert('Validation Error', 'Organization name is required');
      return;
    }

    try {
      setSaving(true);
      setUploadProgress(0);

      let logoUrl = adminProfile?.organization_logo_url;

      // Upload logo if a new image was selected
      const hasNewLogo = isWeb 
        ? logoFile !== null 
        : (logoUri && logoUri !== adminProfile?.organization_logo_url);

      if (hasNewLogo) {
        console.log('🚀 Starting logo upload...');
        
        // Determine the correct image source for upload
        const imageSource = isWeb ? logoFile! : logoUri!;
        
        const uploadResult = await s3Service.uploadOrganizationLogo(
          organizationId,
          imageSource,
          setUploadProgress
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Logo upload failed');
        }

        logoUrl = uploadResult.url;
        console.log('✅ Logo uploaded successfully:', logoUrl);
      }

      // Update organization in database
      const result = await updateOrganization(organizationId, {
        name: organizationName.trim(),
        logo_url: logoUrl || undefined,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      Alert.alert('Success', 'Organization settings updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error: any) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', `Failed to save settings: ${error.message}`);
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ADMIN_COLORS.coach} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Organization Settings</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Organization Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ORGANIZATION NAME</Text>
          <TextInput
            style={styles.textInput}
            value={organizationName}
            onChangeText={setOrganizationName}
            placeholder="Enter organization name"
            placeholderTextColor={COLORS.textSecondary}
            editable={!saving}
          />
        </View>

        {/* Logo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ORGANIZATION LOGO</Text>
          
          <View style={styles.logoContainer}>
            {logoUri && !logoError ? (
              <View style={styles.logoPreview}>
                <Image 
                  source={{ uri: logoUri }} 
                  style={styles.logoImage}
                  onLoadStart={() => {
                    console.log('🔄 Logo loading started:', logoUri);
                    setLogoLoading(true);
                  }}
                  onError={() => {
                    console.log('❌ Logo failed to load:', logoUri);
                    setLogoError(true);
                    setLogoLoading(false);
                  }}
                  onLoad={() => {
                    console.log('✅ Logo loaded successfully:', logoUri);
                    setLogoError(false);
                    setLogoLoading(false);
                  }}
                />
                {logoLoading && (
                  <View style={styles.logoLoadingOverlay}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.logoPlaceholder}>
                <Settings size={48} color={COLORS.textSecondary} />
                <Text style={styles.logoPlaceholderText}>
                  {logoUri && logoError ? 'Logo failed to load' : 'No logo uploaded'}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickImage}
            disabled={saving}
          >
            <Upload size={20} color={COLORS.black} />
            <Text style={styles.uploadButtonText}>
              {logoUri ? 'Change Logo' : 'Upload Logo'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Recommended: Square image, max 5MB (PNG, JPG, GIF, WebP)
          </Text>

          {logoUri && !logoError && (
            <Text style={styles.logoStatusText}>
              ✅ Organization logo active
            </Text>
          )}
        </View>

        {/* Upload Progress */}
        {saving && uploadProgress > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>UPLOADING LOGO</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${uploadProgress}%` }]} 
                />
              </View>
              <Text style={styles.progressText}>{uploadProgress}%</Text>
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Save size={20} color={COLORS.black} />
          )}
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab="" 
        userRole="admin" 
        organizationId={organizationId} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.black,
    ...SHADOWS.brutalist,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.families.archivoBold,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl + 80, // Extra space for bottom navigation
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...SHADOWS.brutalist,
    marginHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    fontFamily: TYPOGRAPHY.families.poppinsBold,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoPreview: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.brutalist,
  },
  logoImage: {
    width: 116,
    height: 116,
    borderRadius: BORDER_RADIUS.round,
  },
  logoImageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  logoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  logoPlaceholderText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.md,
    ...SHADOWS.brutalist,
  },
  uploadButtonText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.black,
    marginLeft: SPACING.sm,
  },
  helpText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  logoStatusText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.success,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: SPACING.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginTop: SPACING.xs,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADMIN_COLORS.coach,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    ...SHADOWS.brutalist,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.black,
    marginLeft: SPACING.sm,
    fontFamily: TYPOGRAPHY.families.archivoBold,
  },
});

export default AdminSettingsScreen; 