import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { createInitialSchedule, getInitialThreshold } from '@/features/classes/utils/schedulerUtils';
import { ClassForm, ClassFormSubmitPayload } from '@features/classes/components/ClassForm';
import { useClassList } from '@features/classes/hooks/useClassList';
import { useCreateClass } from '@features/classes/hooks/useCreateClass';
import { ConfirmationDialog } from '@shared/components/ConfirmationDialog';
import { palette } from '@theme/tokens';

const CreateClassScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const createClassMutation = useCreateClass();
  const classListQuery = useClassList();

  const [isCancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const initialThresholdString = useMemo(() => {
    const firstClass = classListQuery.data?.[0];
    return getInitialThreshold(firstClass?.minAttendancePercentage);
  }, [classListQuery.data]);

  const initialValues = useMemo(
    () => ({
      name: '',
      instructorName: '',
      capacity: '',
      threshold: initialThresholdString,
      location: '',
      iconName: 'school-outline',
      scheduleEntries: createInitialSchedule(),
    }),
    [initialThresholdString],
  );

  const handleCancel = () => {
    if (createClassMutation.isPending) {
      return;
    }

    if (isDirty) {
      setCancelDialogOpen(true);
      return;
    }

    router.back();
  };

  const handleConfirmCancel = () => {
    setCancelDialogOpen(false);
    router.back();
  };

  const handleSubmit = async (payload: ClassFormSubmitPayload) => {
    await createClassMutation.mutateAsync(payload);
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('classes.add_new'),
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
        formKey="create"
        description={t('classes.create_description')}
        submitLabel={t('classes.add_new')}
        submitIconName="plus-circle"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onDirtyChange={setIsDirty}
      />
    </>
  );
};

export default CreateClassScreen;
