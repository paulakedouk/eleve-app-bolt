import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  ArrowLeft,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Video,
  Users,
  MapPin,
  Trophy,
  Target,
  X,
  Check,
  Clock
} from 'lucide-react-native';
import { RootStackParamList } from '../../../shared/types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import { supabase } from '../../../shared/lib/supabase';

const { width: screenWidth } = Dimensions.get('window');
const dayWidth = (screenWidth - (SPACING.screenPadding * 2)) / 7;

type VideosCalendarScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VideosCalendar'>;

interface VideoItem {
  id: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number;
  trick_name?: string;
  landed?: boolean;
  comment?: string;
  student_ids: string[];
  created_at: string;
  upload_status: string;
}

interface Student {
  id: string;
  full_name: string;
  skill_level: string;
}

interface FilterOptions {
  students: string[];
  landed?: boolean | null;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

const VideosCalendarScreen: React.FC = () => {
  const navigation = useNavigation<VideosCalendarScreenNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    students: [],
    landed: null,
    dateRange: { start: null, end: null }
  });

  useEffect(() => {
    loadData();
  }, []);

  const getStudentNames = (studentIds: string[]): string => {
    if (!studentIds || studentIds.length === 0) {
      return 'No students';
    }

    const names = studentIds
      .map(id => {
        const student = students.find(s => s.id === id);
        return student ? student.full_name : `Student ${id.slice(0, 8)}`;
      })
      .filter(Boolean);

    if (names.length === 0) {
      return 'Unknown student(s)';
    }

    if (names.length === 1) {
      return names[0];
    }

    if (names.length === 2) {
      return `${names[0]} & ${names[1]}`;
    }

    return `${names[0]} +${names.length - 1} others`;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadVideos(), loadStudents()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get videos for the current month with some buffer
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);

      const { data: videosData, error } = await supabase
        .from('videos')
        .select(`
          id,
          s3_url,
          thumbnail_url,
          duration,
          trick_name,
          landed,
          comment,
          student_ids,
          upload_status,
          created_at
        `)
        .eq('coach_id', user.id)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        return;
      }

      const transformedVideos = (videosData || []).map(video => ({
        ...video,
        video_url: video.s3_url,
        student_ids: video.student_ids || []
      }));

      setVideos(transformedVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // This is a simplified query - in practice you'd need proper coach-student relationships
      const { data: studentsData, error } = await supabase
        .from('students')
        .select('id, full_name, skill_level')
        .limit(50);

      if (error) {
        console.error('Error fetching students:', error);
        return;
      }

      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getVideosForDate = (date: Date) => {
    if (!date) return [];
    
    const dateString = date.toDateString();
    return videos.filter(video => {
      const videoDate = new Date(video.created_at).toDateString();
      return videoDate === dateString && applyFilters(video);
    });
  };

  const applyFilters = (video: VideoItem) => {
    // Student filter
    if (filters.students.length > 0) {
      const hasFilteredStudent = video.student_ids.some(studentId => 
        filters.students.includes(studentId)
      );
      if (!hasFilteredStudent) return false;
    }

    // Landed filter
    if (filters.landed !== null && video.landed !== filters.landed) {
      return false;
    }

    return true;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    
    // Reload videos for the new month
    setTimeout(() => loadVideos(), 100);
  };

  const toggleStudentFilter = (studentId: string) => {
    setFilters(prev => ({
      ...prev,
      students: prev.students.includes(studentId)
        ? prev.students.filter(id => id !== studentId)
        : [...prev.students, studentId]
    }));
  };

  const setLandedFilter = (landed: boolean | null) => {
    setFilters(prev => ({
      ...prev,
      landed
    }));
  };

  const clearFilters = () => {
    setFilters({
      students: [],
      landed: null,
      dateRange: { start: null, end: null }
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.students.length > 0) count++;
    if (filters.landed !== null) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    return count;
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const DayCell: React.FC<{ date: Date | null }> = ({ date }) => {
    if (!date) {
      return <View style={styles.dayCell} />;
    }

    const dayVideos = getVideosForDate(date);
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = selectedDate?.toDateString() === date.toDateString();

    return (
      <TouchableOpacity
        style={[
          styles.dayCell,
          isToday && styles.todayCell,
          isSelected && styles.selectedCell,
          dayVideos.length > 0 && styles.hasVideosCell
        ]}
        onPress={() => setSelectedDate(date)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dayText,
          isToday && styles.todayText,
          isSelected && styles.selectedText,
          dayVideos.length > 0 && styles.hasVideosText
        ]}>
          {date.getDate()}
        </Text>
        {dayVideos.length > 0 && (
          <View style={styles.videosIndicator}>
            <Text style={styles.videosCount}>{dayVideos.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const VideoCard: React.FC<{ video: VideoItem }> = ({ video }) => {
    const statusColor = video.landed === null 
      ? COLORS.textSecondary 
      : video.landed 
        ? COLORS.success 
        : COLORS.warning;

    return (
      <TouchableOpacity 
        style={styles.videoCard}
        onPress={() => {
          (navigation as any).navigate('VideoDetail', { video });
        }}
        activeOpacity={0.8}
      >
        <View style={styles.videoCardHeader}>
          <Text style={styles.videoTitle} numberOfLines={1}>
            {video.trick_name || 'Untitled Video'}
          </Text>
          <Text style={styles.videoTime}>
            {new Date(video.created_at).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </Text>
        </View>
        
        <View style={styles.videoMeta}>
          <View style={styles.videoMetaItem}>
            <Users size={14} color={COLORS.textSecondary} />
            <Text style={styles.videoMetaText}>
              {getStudentNames(video.student_ids)}
            </Text>
          </View>
          
          {video.landed !== null && (
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              {video.landed ? (
                <Trophy size={12} color={COLORS.white} />
              ) : (
                <Target size={12} color={COLORS.white} />
              )}
              <Text style={styles.statusText}>
                {video.landed ? 'Landed' : 'Trying'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const FilterModal: React.FC = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Videos</Text>
            <TouchableOpacity 
              onPress={() => setShowFilters(false)}
              style={styles.modalCloseButton}
            >
              <X size={SIZES.icon.medium} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Students Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Filter by Student</Text>
              <View style={styles.filterOptions}>
                {students.map(student => (
                  <TouchableOpacity
                    key={student.id}
                    style={[
                      styles.filterOption,
                      filters.students.includes(student.id) && styles.filterOptionSelected
                    ]}
                    onPress={() => toggleStudentFilter(student.id)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.students.includes(student.id) && styles.filterOptionSelectedText
                    ]}>
                      {student.full_name}
                    </Text>
                    {filters.students.includes(student.id) && (
                      <Check size={16} color={COLORS.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Landed Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Filter by Status</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.landed === true && styles.filterOptionSelected
                  ]}
                  onPress={() => setLandedFilter(filters.landed === true ? null : true)}
                >
                  <Trophy size={16} color={filters.landed === true ? COLORS.white : COLORS.success} />
                  <Text style={[
                    styles.filterOptionText,
                    filters.landed === true && styles.filterOptionSelectedText
                  ]}>
                    Landed Only
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.landed === false && styles.filterOptionSelected
                  ]}
                  onPress={() => setLandedFilter(filters.landed === false ? null : false)}
                >
                  <Target size={16} color={filters.landed === false ? COLORS.white : COLORS.warning} />
                  <Text style={[
                    styles.filterOptionText,
                    filters.landed === false && styles.filterOptionSelectedText
                  ]}>
                    Trying Only
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearFilters}
            >
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyFiltersText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={SIZES.icon.medium} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const days = getDaysInMonth(currentDate);
  const selectedDayVideos = selectedDate ? getVideosForDate(selectedDate) : [];
  const activeFiltersCount = getActiveFiltersCount();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={SIZES.icon.medium} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Videos Calendar</Text>
          <Text style={styles.subtitle}>
            {videos.length} total videos
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Filter size={SIZES.icon.medium} color={activeFiltersCount > 0 ? COLORS.white : COLORS.primary} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity 
            style={styles.monthNavButton}
            onPress={() => navigateMonth('prev')}
          >
            <ChevronLeft size={SIZES.icon.medium} color={COLORS.primary} />
          </TouchableOpacity>
          
          <Text style={styles.monthTitle}>{formatMonthYear(currentDate)}</Text>
          
          <TouchableOpacity 
            style={styles.monthNavButton}
            onPress={() => navigateMonth('next')}
          >
            <ChevronRight size={SIZES.icon.medium} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Day Labels */}
        <View style={styles.dayLabels}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={styles.dayLabel}>{day}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {days.map((date, index) => (
            <DayCell key={index} date={date} />
          ))}
        </View>

        {/* Selected Day Videos */}
        {selectedDate && (
          <View style={styles.selectedDaySection}>
            <Text style={styles.selectedDayTitle}>
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            
            {selectedDayVideos.length > 0 ? (
              <View style={styles.videosGrid}>
                {selectedDayVideos.map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </View>
            ) : (
              <View style={styles.noVideosContainer}>
                <Video size={48} color={COLORS.textSecondary} />
                <Text style={styles.noVideosText}>No videos recorded on this day</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <FilterModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.black,
    ...SHADOWS.brutalist,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.black,
    fontFamily: TYPOGRAPHY.families.archivoBold,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.error,
    borderWidth: 2,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  monthNavButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.brutalist,
  },
  monthTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.families.archivoBold,
  },
  dayLabels: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  dayLabel: {
    width: dayWidth,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.xl,
  },
  dayCell: {
    width: dayWidth,
    height: dayWidth,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  todayCell: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.black,
    borderWidth: 2,
  },
  selectedCell: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.black,
    borderWidth: 2,
  },
  hasVideosCell: {
    backgroundColor: `${COLORS.success}20`,
  },
  dayText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  todayText: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  selectedText: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  hasVideosText: {
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  videosIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    borderWidth: 1,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videosCount: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  selectedDaySection: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  selectedDayTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.families.archivoBold,
    marginBottom: SPACING.lg,
  },
  videosGrid: {
    gap: SPACING.md,
  },
  videoCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.md,
    ...SHADOWS.brutalist,
  },
  videoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  videoTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.families.poppins,
    marginRight: SPACING.sm,
  },
  videoTime: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  videoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoMetaText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  noVideosContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  noVideosText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    borderWidth: 3,
    borderColor: COLORS.black,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.families.archivoBold,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: SPACING.lg,
  },
  filterSection: {
    marginBottom: SPACING.xl,
  },
  filterTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    fontFamily: TYPOGRAPHY.families.poppins,
  },
  filterOptions: {
    gap: SPACING.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  filterOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.black,
  },
  filterOptionText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  filterOptionSelectedText: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: SPACING.lg,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  clearFiltersButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  applyFiltersButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});

export default VideosCalendarScreen; 