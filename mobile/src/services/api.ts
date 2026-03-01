import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

let API_URL = 'http://localhost:3000'; 

if (Platform.OS !== 'web') {
  const debuggerHost = Constants.manifest?.debuggerHost?.split(':')[0];
  if (debuggerHost) {
    API_URL = `http://${debuggerHost}:3000`;
  }
}

export const api = axios.create({
  baseURL: API_URL,
});