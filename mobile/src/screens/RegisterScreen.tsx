import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';
import { authStore } from '../stores/AuthStore';
import { observer } from 'mobx-react-lite';

export const RegisterScreen = observer(({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    await authStore.register(email, password);
    Alert.alert('Success', 'Account created! Please login.');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <Button title="Register" onPress={handleRegister} disabled={authStore.loading} />
      <Text style={styles.link} onPress={() => navigation.goBack()}>Back to Login</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:20 },
  input: { borderWidth:1, borderColor:'#ccc', padding:10, marginVertical:5, borderRadius:5 },
  title: { fontSize:24, marginBottom:20, textAlign:'center' },
  link: { marginTop:10, color:'blue', textAlign:'center' }
});