import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeId = "warm" | "dark" | "bright" | "forest";

export const themes: { id: ThemeId; label: string }[] = [
  { id: "warm", label: "Warm & Earthy" },
  { id: "dark", label: "Dark & Bold" },
  { id: "bright", label: "Clean & Bright" },
  { id: "forest", label: "Forest & Deep" },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    return (localStorage.getItem("rc-theme") as ThemeId) || "warm";
  });

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem("rc-theme", t);
  };

  useEffect(() => {
    document.documentElement.className = `theme-${theme}`;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
