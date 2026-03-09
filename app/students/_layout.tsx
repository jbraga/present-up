import { Stack } from 'expo-router';

import { palette } from '@theme/tokens';

export default function StudentsDetailStack() {
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
      <Stack.Screen name="[studentId]" options={{ title: 'Student' }} />
    </Stack>
  );
}
