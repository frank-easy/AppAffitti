import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IntroScreen } from '../screens/IntroScreen';
import { RoleSelectionScreen } from '../screens/RoleSelectionScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { AddApartmentScreen } from '../screens/AddApartmentScreen';
import { TenantApp } from '../screens/TenantApp';
import { OwnerApp } from '../screens/OwnerApp';
import { ChatDetailScreen } from '../screens/ChatDetailScreen';
import { LikedApartmentsScreen } from '../screens/LikedApartmentsScreen';
import { TenantPreferencesScreen } from '../screens/TenantPreferencesScreen';

export type RootStackParamList = {
  Intro: undefined;
  RoleSelection: undefined;
  Auth: { role: string };
  ProfileSetup: undefined;
  TenantApp: undefined;
  OwnerApp: undefined;
  AddApartment: undefined;
  TenantPreferences: undefined;
  ChatDetail: { matchId: string };
  LikedApartments: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Intro">
      <Stack.Screen name="Intro" component={IntroScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="TenantApp" component={TenantApp} />
      <Stack.Screen name="OwnerApp" component={OwnerApp} />
      <Stack.Screen name="AddApartment" component={AddApartmentScreen} />
      <Stack.Screen name="TenantPreferences" component={TenantPreferencesScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <Stack.Screen name="LikedApartments" component={LikedApartmentsScreen} />
    </Stack.Navigator>
  );
}