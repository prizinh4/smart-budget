import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../src/screens/LoginScreen';
import { RegisterScreen } from '../src/screens/RegisterScreen';
import { DashboardScreen } from '../src/screens/DashboardScreen';
import { TransactionListScreen } from '../src/screens/TransactionListScreen';
import { CategoryListScreen } from '../src/screens/CategoryListScreen';
import { GoalListScreen } from '../src/screens/GoalListScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Transactions" component={TransactionListScreen} />
      <Stack.Screen name="Categories" component={CategoryListScreen} />
      <Stack.Screen name="Goals" component={GoalListScreen} />
    </Stack.Navigator>
  );
}