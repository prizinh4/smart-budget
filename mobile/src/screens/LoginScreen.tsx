import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { authStore } from '../stores/AuthStore';
import { observer } from 'mobx-react-lite';

export const LoginScreen = observer(({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    await authStore.login(email, password);
    if (authStore.token) navigation.replace('Dashboard');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <Button title="Login" onPress={handleLogin} disabled={authStore.loading} />
      <Text style={styles.link} onPress={() => navigation.navigate('Register')}>Create account</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:20 },
  input: { borderWidth:1, borderColor:'#ccc', padding:10, marginVertical:5, borderRadius:5 },
  title: { fontSize:24, marginBottom:20, textAlign:'center' },
  link: { marginTop:10, color:'blue', textAlign:'center' }
});