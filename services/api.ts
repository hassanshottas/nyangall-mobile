import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IP locale du PC de développement sur le réseau Wi-Fi — utilisée par l'app native
// (APK) en dev quand aucune EXPO_PUBLIC_API_URL n'est fournie, car elle ne peut pas
// déduire l'hôte comme le fait le web via window.location.
const DEV_LAN_IP = '192.168.1.150';

// URL de production/preview injectée à la compilation par EAS (voir eas.json → env).
// C'est la seule façon pour un build installé sur un vrai téléphone (hors de ton
// Wi-Fi) de savoir où joindre l'API.
const PROD_API_URL = process.env.EXPO_PUBLIC_API_URL;

// Sur le web, on déduit l'hôte du backend depuis celui utilisé pour charger l'app
// (localhost en local sur le PC, l'IP du réseau quand on y accède depuis un téléphone),
// sauf si EXPO_PUBLIC_API_URL est explicitement défini (ex: build web de prod).
// Ainsi un seul et même lien fonctionne peu importe l'appareil.
function resolveApiUrl() {
  if (PROD_API_URL) return PROD_API_URL;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    return `${window.location.protocol}//${window.location.hostname}:4000/api`;
  }

  if (__DEV__) return `http://${DEV_LAN_IP}:4000/api`;

  throw new Error(
    "EXPO_PUBLIC_API_URL n'est pas définie. Ce build de production n'a pas d'URL d'API — " +
    "renseigne-la dans les profils EAS (eas.json) avant de compiler."
  );
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
