/**
 * App Navigation - Stack navigator for PDF to Excel app
 */

import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  HomeScreen,
  UploadScreen,
  ResultScreen,
  SettingsScreen,
  HowToUseScreen,
  BankAnalyzerScreen,
  DashboardScreen,
} from '../screens';
import type { AnalysisResult } from '../services/types';
import { Colors } from '../theme';

export type RootStackParamList = {
  Home: undefined;
  Upload: undefined;
  Result: {
    fileBase64: string;
    fileName: string;
    fileSize: number;
    format: string;
    originalFileName: string;
  };
  Settings: undefined;
  HowToUse: undefined;
  BankAnalyzer: undefined;
  Dashboard: {
    result: AnalysisResult;
    fileName: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
  },
};

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Upload" component={UploadScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="HowToUse" component={HowToUseScreen} />
        <Stack.Screen name="BankAnalyzer" component={BankAnalyzerScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
