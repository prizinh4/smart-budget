import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { observer } from 'mobx-react-lite';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { LoginScreen } from '../src/screens/LoginScreen';
import { RegisterScreen } from '../src/screens/RegisterScreen';
import { DashboardScreen } from '../src/screens/DashboardScreen';
import { TransactionListScreen } from '../src/screens/TransactionListScreen';
import { CategoryListScreen } from '../src/screens/CategoryListScreen';
import { GoalListScreen } from '../src/screens/GoalListScreen';
import { authStore } from '../src/stores/AuthStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, label, focused }: { icon: string; label: string; focused: boolean }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
  </View>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        height: 65,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen
      name="DashboardTab"
      component={DashboardScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Início" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="TransactionsTab"
      component={TransactionListScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon="💰" label="Transações" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="CategoriesTab"
      component={CategoryListScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon="📂" label="Categorias" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="GoalsTab"
      component={GoalListScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon="🎯" label="Metas" focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

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
    <Stack.Navigator initialRouteName={authStore.token ? "Main" : "Login"}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Transactions" component={TransactionListScreen} options={{ title: 'Transações' }} />
      <Stack.Screen name="Categories" component={CategoryListScreen} options={{ title: 'Categorias' }} />
      <Stack.Screen name="Goals" component={GoalListScreen} options={{ title: 'Metas' }} />
    </Stack.Navigator>
  );
});

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  tabLabelFocused: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});

export default App;