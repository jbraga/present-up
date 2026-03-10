import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { StudentForm, StudentFormSubmitPayload } from '@features/students/components/StudentForm';
import { useStudentList } from '@features/students/hooks/useStudentList';
import { useUpsertStudent } from '@features/students/hooks/useUpsertStudent';
import { ConfirmationDialog } from '@shared/components/ConfirmationDialog';
import { palette, spacing, typography } from '@theme/tokens';

const EditStudentScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ studentId?: string }>();
  const studentId = params.studentId ?? null;

  const studentListQuery = useStudentList('');
  const upsertStudentMutation = useUpsertStudent();

  const studentData = useMemo(() => {
    const allStudents = studentListQuery.data?.pages.flatMap(page => page) ?? [];
    return allStudents.find((s) => s.id === studentId) ?? null;
  }, [studentListQuery.data, studentId]);

  const [isCancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const initialValues = useMemo(() => {
    if (!studentData) {
      return {
        firstName: '',
        lastName: '',
        email: '',
        guardianEmail: '',
        phoneNumber: '',
      };
    }

    return {
      firstName: studentData.firstName,
      lastName: studentData.lastName,
      email: studentData.email || '',
      guardianEmail: studentData.guardianEmail || '',
      phoneNumber: studentData.phoneNumber || '',
    };
  }, [studentData]);

  const handleCancel = () => {
    if (upsertStudentMutation.isPending) {
      return;
    }

    if (!isDirty) {
      router.back();
      return;
    }

    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    setCancelDialogOpen(false);
    router.back();
  };

  const handleSubmit = async (payload: StudentFormSubmitPayload) => {
    if (!studentId) {
      return;
    }

    await upsertStudentMutation.mutateAsync({
      id: studentId,
      ...payload,
    });

    router.back();
  };

  if (studentListQuery.isLoading || !studentData) {
    return (
      <>
        <Stack.Screen options={{ title: t('students.edit_student') }} />
        <View style={styles.centered}>
          {studentListQuery.isLoading ? (
            <ActivityIndicator size="large" color={palette.primary} />
          ) : (
            <>
              <MaterialCommunityIcons name="alert-circle-outline" size={48} color={palette.onSurfaceMuted} />
              <Text style={styles.errorTitle}>{t('common.error')}</Text>
            </>
          )}
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t('students.edit_student'),
          headerLeft: () => (
            <Pressable onPress={handleCancel} hitSlop={8} accessibilityRole="button">
              <MaterialCommunityIcons name="arrow-left" size={24} color={palette.onSurface} />
            </Pressable>
          ),
        }}
      />
      <ConfirmationDialog
        visible={isCancelDialogOpen}
        title={t('common.discard')}
        message={t('students.discard_changes_confirm')}
        confirmLabel={t('common.discard')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelDialogOpen(false)}
      />

      <StudentForm
        formKey={`edit-${studentData.id}`}
        headerIcon="account-edit-outline"
        description={t('students.edit_student')}
        submitLabel={t('common.save')}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onDirtyChange={setIsDirty}
      />
    </>
  );
};

export default EditStudentScreen;

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: palette.background,
  },
  errorTitle: {
    ...typography.titleMedium,
    color: palette.onSurfaceMuted,
  },
});
