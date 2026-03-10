import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStudentsByIds } from '@features/students/hooks/useStudentsByIds';
import { palette, shape, spacing, typography } from '@theme/tokens';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconContainer}>
      <MaterialCommunityIcons name={icon} size={20} color={palette.primary} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const StudentDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId?: string | string[] }>();
  const { t, i18n } = useTranslation();
  const studentIdParam = params.studentId;
  const studentId = Array.isArray(studentIdParam) ? studentIdParam[0] : studentIdParam ?? null;

  const studentsQuery = useStudentsByIds(studentId ? [studentId] : []);

  const student = studentsQuery.data?.[0];
  const isLoading = studentsQuery.isLoading || studentsQuery.isFetching;

  const fullName = student ? `${student.firstName} ${student.lastName}` : t('students.unknown');

  const initials = useMemo(() => {
    if (!student) return '?';
    return `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase();
  }, [student]);

  const memberSince = useMemo(() => {
    if (!student?.createdAt) return null;
    return new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(student.createdAt);
  }, [student, i18n.language]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: fullName,
          headerRight: () =>
            student ? (
              <Pressable
                onPress={() => router.push({ pathname: '/(tabs)/students/edit', params: { studentId: student.id } })}
                style={styles.headerButton}>
                <MaterialCommunityIcons name="pencil-outline" size={24} color={palette.onSurface} />
              </Pressable>
            ) : null,
        }}
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={palette.primary} size="large" />
        </View>
      ) : !student ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="account-off-outline" size={48} color={palette.onSurfaceMuted} />
          <Text style={styles.missingTitle}>{t('students.empty')}</Text>
          <Text style={styles.missingSubtitle}>{t('students.empty_search')}</Text>
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <View style={styles.heroSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.heroName}>{fullName}</Text>
            {student.email ? (
              <Text style={styles.heroEmail}>{student.email}</Text>
            ) : null}
            {memberSince ? (
              <View style={styles.memberBadge}>
                <MaterialCommunityIcons name="calendar-check" size={14} color={palette.primary} />
                <Text style={styles.memberText}>{t('students.member_since', { date: memberSince })}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('students.personal_information')}</Text>
            <InfoRow icon="account" label={t('students.first_name')} value={student.firstName} />
            <InfoRow icon="account" label={t('students.last_name')} value={student.lastName} />
            {student.email ? (
              <InfoRow icon="email-outline" label={t('students.email')} value={student.email} />
            ) : null}
            {student.phoneNumber ? (
              <InfoRow icon="phone-outline" label={t('students.phone')} value={student.phoneNumber} />
            ) : null}
          </View>

          {student.guardianEmail ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('students.guardian_information')}</Text>
              <InfoRow icon="account-child-outline" label={t('students.guardian_email')} value={student.guardianEmail} />
            </View>
          ) : null}
        </ScrollView>
      )}

    </SafeAreaView>
  );
};

export default StudentDetailScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  headerButton: {
    padding: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  missingTitle: {
    ...typography.titleMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
    textAlign: 'center',
  },
  missingSubtitle: {
    ...typography.bodyMedium,
    color: palette.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 260,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heroSection: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  avatarText: {
    ...typography.headlineMedium,
    color: palette.primary,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  heroName: {
    ...typography.titleLarge,
    color: palette.onSurface,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
    textAlign: 'center',
  },
  heroEmail: {
    ...typography.bodyMedium,
    color: palette.onSurfaceVariant,
    textAlign: 'center',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  memberText: {
    ...typography.labelSmall,
    color: palette.primary,
    fontFamily: 'Lexend-Medium',
    fontWeight: '500',
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: shape.medium,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.labelMedium,
    color: palette.onSurfaceVariant,
    fontFamily: 'Lexend-Medium',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
    gap: 2,
    paddingVertical: 2,
  },
  infoLabel: {
    ...typography.labelSmall,
    color: palette.onSurfaceMuted,
    fontFamily: 'Lexend-Medium',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    ...typography.bodyMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-Regular',
  },
});
