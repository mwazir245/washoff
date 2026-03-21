import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PlatformLanguage } from "@/features/content/model/platform-content";

const PLATFORM_LANGUAGE_STORAGE_KEY = "washoff:platform:language";

interface PlatformLanguageContextValue {
  language: PlatformLanguage;
  direction: "rtl" | "ltr";
  setLanguage: (language: PlatformLanguage) => void;
  toggleLanguage: () => void;
}

const PlatformLanguageContext = createContext<PlatformLanguageContextValue | null>(null);

const resolveStoredLanguage = (): PlatformLanguage => {
  if (typeof window === "undefined") {
    return "ar";
  }

  const stored = window.localStorage.getItem(PLATFORM_LANGUAGE_STORAGE_KEY);
  return stored === "en" ? "en" : "ar";
};

export const PlatformLanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<PlatformLanguage>(resolveStoredLanguage);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(PLATFORM_LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "en" ? "ltr" : "rtl";
  }, [language]);

  const value = useMemo<PlatformLanguageContextValue>(
    () => ({
      language,
      direction: language === "en" ? "ltr" : "rtl",
      setLanguage: (nextLanguage) => setLanguageState(nextLanguage),
      toggleLanguage: () =>
        setLanguageState((currentLanguage) => (currentLanguage === "ar" ? "en" : "ar")),
    }),
    [language],
  );

  return (
    <PlatformLanguageContext.Provider value={value}>
      {children}
    </PlatformLanguageContext.Provider>
  );
};

export const usePlatformLanguage = () => {
  const context = useContext(PlatformLanguageContext);

  if (!context) {
    throw new Error("usePlatformLanguage must be used within PlatformLanguageProvider.");
  }

  return context;
};
