import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { authStore } from '../stores/AuthStore';
import { observer } from 'mobx-react-lite';

export const DashboardScreen = observer(({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Button title="View Transactions" onPress={() => navigation.navigate('Transactions')} />
      <Button title="Logout" onPress={async () => { await authStore.logout(); navigation.replace('Login'); }} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center' },
  title: { fontSize:24, marginBottom:20 }
});