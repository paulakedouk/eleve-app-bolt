// screens/Admin/AdminStudentsScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, Image, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Trophy, Settings, UserPlus } from 'lucide-react-native';

import { RootStackParamList } from '../../../shared/types';
import { BottomNavigation } from '../../../shared/components/BottomNavigation';
import BackButton from '../../../shared/components/BackButton';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';

import { getAllStudentsForOrg } from '../../../shared/services/adminService';

// Admin-specific design colors that extend the main design system
const ADMIN_COLORS = {
  coach: '#FFC900',
  parent: '#91A8EB', 
  partners: '#55C1C3',
  approvals: '#FF5A34',
  tricks: '#91DEF1',
};

type AdminStudentsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdminStudents'>;
type AdminStudentsScreenProps = NativeStackScreenProps<RootStackParamList, 'AdminStudents'>;

interface Student {
    id: string;
    full_name: string;
    profile_image: string | null;
    xp_points: number;
    skill_level: string;
    age: number | null;
    coach_name?: string | null;
}

const AdminStudentsScreen: React.FC = () => {
    const navigation = useNavigation<AdminStudentsScreenNavigationProp>();
    const route = useRoute<AdminStudentsScreenProps['route']>();
    const { organizationId } = route.params;

    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const result = await getAllStudentsForOrg(organizationId); // <-- You’ll need this API
            setStudents(result);
        } catch (error) {
            console.error('Failed to load students:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const getSkillLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'beginner': return ADMIN_COLORS.tricks;
            case 'intermediate': return ADMIN_COLORS.coach;
            case 'advanced': return ADMIN_COLORS.approvals;
            default: return ADMIN_COLORS.partners;
        }
    };

    const getSkillLevelEmoji = (level: string) => {
        switch (level.toLowerCase()) {
            case 'beginner': return '🌱';
            case 'intermediate': return '🔥';
            case 'advanced': return '⚡';
            default: return '🛹';
        }
    };

    const StudentCard = ({ student }: { student: Student }) => (
        <View style={styles.card}>
            <View style={styles.cardLeft}>
                {student.profile_image ? (
                    <Image source={{ uri: student.profile_image }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.initials}>
                            {student.full_name.split(' ').map(n => n[0]).join('')}
                        </Text>
                    </View>
                )}
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.studentName}>{student.full_name}</Text>
                <Text style={styles.subText}>{student.age ? `${student.age} years old` : 'Age not set'}</Text>
                <View style={styles.metaRow}>
                    <View style={[styles.skillBadge, { backgroundColor: getSkillLevelColor(student.skill_level) }]}>
                        <Text style={styles.skillBadgeText}>
                            {getSkillLevelEmoji(student.skill_level)} {student.skill_level}
                        </Text>
                    </View>
                    <View style={styles.xpContainer}>
                        <Trophy size={14} color={ADMIN_COLORS.coach} />
                        <Text style={styles.xpText}>{student.xp_points} XP</Text>
                    </View>
                </View>
                {student.coach_name && (
                    <Text style={styles.subText}>Coach: {student.coach_name}</Text>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            {/* Header */}
            <View style={styles.header}>
                <BackButton
                    onPress={handleBack}
                    variant="simple"
                    iconSize={20}
                    iconColor={COLORS.black}
                />
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Students</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.black} />
                    <Text style={styles.loadingText}>Loading students...</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchStudents(true)}
                            tintColor={COLORS.black}
                        />
                    }
                >
                    {students.length > 0 ? (
                        students.map(student => (
                            <StudentCard key={student.id} student={student} />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>No Students Yet</Text>
                            <Text style={styles.emptyText}>Add or assign students to see them here.</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            <BottomNavigation activeTab="Students" userRole="admin" organizationId={organizationId} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.screenPadding,
        paddingVertical: SPACING.lg,
        backgroundColor: COLORS.white,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.black,
    },
    backButton: {
        marginRight: SPACING.sm,
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
    },
    headerSpacer: {
        width: 28, // Same width as back button to center content
    },
    headerTitle: {
        fontFamily: TYPOGRAPHY.families.archivoBold,
        fontSize: TYPOGRAPHY.sizes.h2,
        fontWeight: TYPOGRAPHY.weights.bold,
        color: COLORS.textPrimary,
    },
    list: { padding: SPACING.screenPadding, paddingBottom: 100 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { 
        fontSize: TYPOGRAPHY.sizes.body,
        color: COLORS.textSecondary,
        marginTop: SPACING.sm
    },
    card: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderColor: COLORS.black,
        borderWidth: 2,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        ...SHADOWS.brutalist,
    },
    cardLeft: { marginRight: SPACING.md },
    avatar: { width: 50, height: 50, borderRadius: BORDER_RADIUS.round },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: BORDER_RADIUS.round,
        backgroundColor: ADMIN_COLORS.coach,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.black,
    },
    initials: { 
        fontWeight: TYPOGRAPHY.weights.bold, 
        fontSize: TYPOGRAPHY.sizes.body, 
        color: COLORS.black 
    },
    cardBody: { flex: 1 },
    studentName: { 
        fontSize: TYPOGRAPHY.sizes.h4,
        fontWeight: TYPOGRAPHY.weights.bold,
        color: COLORS.textPrimary,
        fontFamily: TYPOGRAPHY.families.poppinsBold,
    },
    subText: { 
        fontSize: TYPOGRAPHY.sizes.bodySmall, 
        color: COLORS.textSecondary, 
        marginTop: SPACING.xs 
    },
    metaRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginTop: SPACING.sm, 
        gap: SPACING.sm 
    },
    skillBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.sm,
        borderWidth: 2,
        borderColor: COLORS.black,
    },
    skillBadgeText: { 
        fontSize: TYPOGRAPHY.sizes.caption, 
        fontWeight: TYPOGRAPHY.weights.bold, 
        color: COLORS.black 
    },
    xpContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: SPACING.xs 
    },
    xpText: { 
        fontSize: TYPOGRAPHY.sizes.caption, 
        color: COLORS.textSecondary 
    },
    emptyState: { 
        alignItems: 'center', 
        paddingTop: SPACING.xxl * 2 
    },
    emptyTitle: { 
        fontSize: TYPOGRAPHY.sizes.h3,
        fontWeight: TYPOGRAPHY.weights.bold,
        color: COLORS.textPrimary,
        fontFamily: TYPOGRAPHY.families.archivoBold,
        marginBottom: SPACING.sm
    },
    emptyText: { 
        fontSize: TYPOGRAPHY.sizes.body,
        color: COLORS.textSecondary,
        textAlign: 'center',
        fontFamily: TYPOGRAPHY.families.poppins,
    },
});

export default AdminStudentsScreen;
