import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Lang, TranslationKey } from '@/constants/translations';

type I18nContextType = {
  lang: Lang;
  setLang: (lang: Lang) => Promise<void>;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
};

const I18nContext = createContext<I18nContextType | null>(null);

const RTL_LANGS: Lang[] = ['darija'];

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');

  useEffect(() => {
    AsyncStorage.getItem('lang').then((stored) => {
      if (stored && (stored === 'fr' || stored === 'en' || stored === 'darija')) {
        setLangState(stored as Lang);
      }
    });
  }, []);

  const setLang = async (newLang: Lang) => {
    await AsyncStorage.setItem('lang', newLang);
    setLangState(newLang);
  };

  const t = (key: TranslationKey): string => {
    return translations[lang][key] ?? translations.fr[key] ?? key;
  };

  const isRTL = RTL_LANGS.includes(lang);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n doit être utilisé dans I18nProvider');
  return ctx;
}
