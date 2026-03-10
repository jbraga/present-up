import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { StudentForm, StudentFormInitialValues, StudentFormSubmitPayload } from '@features/students/components/StudentForm';
import { useUpsertStudent } from '@features/students/hooks/useUpsertStudent';
import { ConfirmationDialog } from '@shared/components/ConfirmationDialog';
import { palette } from '@theme/tokens';

const CreateStudentScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const upsertStudentMutation = useUpsertStudent();

  const [isCancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const initialValues: StudentFormInitialValues = {
    firstName: '',
    lastName: '',
    email: '',
    guardianEmail: '',
    phoneNumber: '',
  };

  const handleCancel = () => {
    if (upsertStudentMutation.isPending) {
      return;
    }

    if (isDirty) {
      setCancelDialogOpen(true);
    } else {
      router.back();
    }
  };

  const handleConfirmCancel = () => {
    setCancelDialogOpen(false);
    router.back();
  };

  const handleSubmit = async (payload: StudentFormSubmitPayload) => {
    await upsertStudentMutation.mutateAsync(payload);
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('students.add_new'),
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
        formKey="create"
        headerIcon="account-plus-outline"
        description={t('students.add_new')}
        submitLabel={t('students.add_new')}
        submitIconName="plus-circle"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onDirtyChange={setIsDirty}
      />
    </>
  );
};

export default CreateStudentScreen;
