import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { observer } from 'mobx-react-lite';
import { ActivityIndicator, View } from 'react-native';
import { LoginScreen } from '../src/screens/LoginScreen';
import { RegisterScreen } from '../src/screens/RegisterScreen';
import { DashboardScreen } from '../src/screens/DashboardScreen';
import { TransactionListScreen } from '../src/screens/TransactionListScreen';
import { CategoryListScreen } from '../src/screens/CategoryListScreen';
import { GoalListScreen } from '../src/screens/GoalListScreen';
import { authStore } from '../src/stores/AuthStore';

const Stack = createNativeStackNavigator();

const App = observer(() => {
  // Aguarda carregar sessão do AsyncStorage
  if (!authStore.initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={authStore.token ? "Dashboard" : "Login"}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Transactions" component={TransactionListScreen} options={{ title: 'Transações' }} />
      <Stack.Screen name="Categories" component={CategoryListScreen} options={{ title: 'Categorias' }} />
      <Stack.Screen name="Goals" component={GoalListScreen} options={{ title: 'Metas' }} />
    </Stack.Navigator>
  );
});

export default App;