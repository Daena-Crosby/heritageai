import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { StoryViewScreen } from './src/screens/StoryViewScreen';
import { RecordingScreen } from './src/screens/RecordingScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="StoryView" component={StoryViewScreen} />
        <Stack.Screen name="Recording" component={RecordingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
