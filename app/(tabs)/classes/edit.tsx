import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { createInitialSchedule, getInitialThreshold } from '@/features/classes/utils/schedulerUtils';
import { ClassForm, ClassFormSubmitPayload } from '@features/classes/components/ClassForm';
import { useClassList } from '@features/classes/hooks/useClassList';
import { useUpdateClass } from '@features/classes/hooks/useUpdateClass';
import { ConfirmationDialog } from '@shared/components/ConfirmationDialog';
import { palette, spacing, typography } from '@theme/tokens';

const EditClassScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = params.classId ?? null;

  const classListQuery = useClassList();
  const updateClassMutation = useUpdateClass();

  const classData = useMemo(
    () => classListQuery.data?.find((c) => c.id === classId) ?? null,
    [classListQuery.data, classId],
  );
  const [isCancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const initialValues = useMemo(() => {
    if (!classData) {
      return {
        name: '',
        instructorName: '',
        capacity: '',
        threshold: '50',
        location: '',
        iconName: 'pencil-outline',
        scheduleEntries: createInitialSchedule(),
      };
    }

    return {
      name: classData.name,
      instructorName: classData.instructorName || '',
      capacity: classData.capacity?.toString() || '',
      threshold: getInitialThreshold(classData.minAttendancePercentage),
      location: classData.location || '',
      iconName: classData.iconName || 'pencil-outline',
      scheduleEntries:
        classData.schedule.length > 0
          ? classData.schedule.map((entry) => ({
              dayOfWeek: entry.dayOfWeek,
              startTime: entry.startTime,
              endTime: entry.endTime,
            }))
          : createInitialSchedule(),
    };
  }, [classData]);

  const handleCancel = () => {
    if (updateClassMutation.isPending) {
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

  const handleSubmit = async (payload: ClassFormSubmitPayload) => {
    if (!classId) {
      return;
    }

    await updateClassMutation.mutateAsync({
      classId,
      ...payload,
    });

    router.back();
  };

  if (classListQuery.isLoading || !classData) {
    return (
      <>
        <Stack.Screen options={{ title: t('classes.edit_class') }} />
        <View style={styles.centered}>
          {classListQuery.isLoading ? (
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
          title: t('classes.edit_class'),
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
        message={t('classes.discard_changes_confirm')}
        confirmLabel={t('common.discard')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelDialogOpen(false)}
      />

      <ClassForm
        formKey={`edit-${classData.id}`}
        description={t('classes.edit_description')}
        submitLabel={t('common.save')}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onDirtyChange={setIsDirty}
      />
    </>
  );
};

export default EditClassScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
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
