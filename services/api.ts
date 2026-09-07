import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IP locale du PC de développement sur le réseau Wi-Fi — utilisée par l'app native
// (APK) qui ne peut pas déduire l'hôte comme le fait le web via window.location.
const DEV_LAN_IP = '192.168.1.150';

// Sur le web, on déduit l'hôte du backend depuis celui utilisé pour charger l'app
// (localhost en local sur le PC, l'IP du réseau quand on y accède depuis un téléphone).
// Ainsi un seul et même lien fonctionne peu importe l'appareil.
function resolveApiUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    return `${window.location.protocol}//${window.location.hostname}:4000/api`;
  }
  return `http://${DEV_LAN_IP}:4000/api`;
}

export const API_URL = resolveApiUrl();

const api = axios.create({ baseURL: API_URL });

// Injecte automatiquement le token JWT dans chaque requête
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
