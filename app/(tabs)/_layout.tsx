import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@theme/tokens';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.onSurfaceMuted,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.outlineVariant,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontFamily: 'Lexend-Medium',
          fontSize: 10,
          letterSpacing: 1.0,
          textTransform: 'uppercase',
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classes',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'calendar-month' : 'calendar-month-outline'}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'check-circle' : 'check-circle-outline'}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'account-multiple' : 'account-multiple-outline'}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, color, focused }: { name: React.ComponentProps<typeof MaterialCommunityIcons>['name']; color: string; focused: boolean }) {
  if (focused) {
    return (
      <View style={{
        backgroundColor: palette.primaryContainer,
        borderRadius: 12,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <MaterialCommunityIcons name={name} size={24} color={color} />
      </View>
    );
  }

  return <MaterialCommunityIcons name={name} size={24} color={color} />;
}
