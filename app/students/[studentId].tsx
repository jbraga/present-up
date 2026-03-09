import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreateStudentDialog } from '@features/students/components/CreateStudentDialog';
import { useStudentsByIds } from '@features/students/hooks/useStudentsByIds';
import { useUpsertStudent } from '@features/students/hooks/useUpsertStudent';
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
  const params = useLocalSearchParams<{ studentId?: string | string[] }>();
  const studentIdParam = params.studentId;
  const studentId = Array.isArray(studentIdParam) ? studentIdParam[0] : studentIdParam ?? null;

  const [isEditDialogOpen, setEditDialogOpen] = useState(false);

  const studentsQuery = useStudentsByIds(studentId ? [studentId] : []);
  const upsertStudentMutation = useUpsertStudent();

  const student = studentsQuery.data?.[0];
  const isLoading = studentsQuery.isLoading || studentsQuery.isFetching;

  const handleEditStudent = async (input: {
    id?: string;
    firstName: string;
    lastName: string;
    email?: string;
    guardianEmail?: string;
    phoneNumber?: string;
  }) => {
    await upsertStudentMutation.mutateAsync(input);
    setEditDialogOpen(false);
  };

  const fullName = student ? `${student.firstName} ${student.lastName}` : 'Student';

  const initials = useMemo(() => {
    if (!student) return '?';
    return `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase();
  }, [student]);

  const memberSince = useMemo(() => {
    if (!student?.createdAt) return null;
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(student.createdAt);
  }, [student]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: fullName,
          headerRight: () =>
            student ? (
              <Pressable onPress={() => setEditDialogOpen(true)} style={styles.headerButton}>
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
          <Text style={styles.missingTitle}>Student not found</Text>
          <Text style={styles.missingSubtitle}>This student may have been deleted.</Text>
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
                <Text style={styles.memberText}>Member since {memberSince}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <InfoRow icon="account" label="First name" value={student.firstName} />
            <InfoRow icon="account" label="Last name" value={student.lastName} />
            {student.preferredName ? (
              <InfoRow icon="account-heart" label="Preferred name" value={student.preferredName} />
            ) : null}
            {student.email ? (
              <InfoRow icon="email-outline" label="Email" value={student.email} />
            ) : null}
            {student.phoneNumber ? (
              <InfoRow icon="phone-outline" label="Phone" value={student.phoneNumber} />
            ) : null}
          </View>

          {student.guardianEmail ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Guardian Information</Text>
              <InfoRow icon="account-child-outline" label="Guardian email" value={student.guardianEmail} />
            </View>
          ) : null}
        </ScrollView>
      )}

      {student ? (
        <CreateStudentDialog
          visible={isEditDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSubmit={handleEditStudent}
          student={student}
        />
      ) : null}
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
