import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { palette } from '@theme/tokens';

export default function ClassesStack() {
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
      <Stack.Screen name="[classId]" options={{ title: 'Class details' }} />
      <Stack.Screen name="create" options={{ title: t('classes.add_new') }} />
      <Stack.Screen name="edit" options={{ title: t('classes.edit_class') }} />
    </Stack>
  );
}
