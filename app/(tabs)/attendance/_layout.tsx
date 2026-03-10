import { Stack } from 'expo-router';

import { palette } from '@theme/tokens';

export default function AttendanceStack() {
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
    </Stack>
  );
}
