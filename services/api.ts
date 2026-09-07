import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sur le web, on déduit l'hôte du backend depuis celui utilisé pour charger l'app
// (localhost en local sur le PC, l'IP du réseau quand on y accède depuis un téléphone).
// Ainsi un seul et même lien fonctionne peu importe l'appareil.
function resolveApiUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    return `${window.location.protocol}//${window.location.hostname}:4000/api`;
  }
  return 'http://localhost:4000/api';
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
