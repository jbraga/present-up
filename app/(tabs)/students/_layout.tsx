import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { palette } from '@theme/tokens';

export default function StudentsStack() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.onSurface,
        headerTitleStyle: {
          fontFamily: 'Lexend-SemiBold',
          fontSize: 20,
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[studentId]" options={{ title: t('navigation.student_singular') }} />
      <Stack.Screen name="create" options={{ title: t('students.add_new') }} />
      <Stack.Screen name="edit" options={{ title: t('students.edit_student') }} />
    </Stack>
  );
}
