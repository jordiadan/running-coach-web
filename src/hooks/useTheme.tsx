import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeId = "warm" | "dark" | "bright" | "forest";

export const themes: { id: ThemeId; label: string }[] = [
  { id: "warm", label: "Warm & Earthy" },
  { id: "dark", label: "Dark & Bold" },
  { id: "bright", label: "Clean & Bright" },
  { id: "forest", label: "Forest & Deep" },
];

const themeIds = themes.map((item) => item.id);
// Literal classes keep every supported theme in Tailwind's generated CSS.
const themeClasses: Record<ThemeId, string> = {
  warm: "theme-warm",
  dark: "theme-dark",
  bright: "theme-bright",
  forest: "theme-forest",
};

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const stored = localStorage.getItem("rc-theme") as ThemeId | null;
    return stored && themeIds.includes(stored) ? stored : "warm";
  });

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem("rc-theme", t);
  };

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("dark");
    themeIds.forEach((themeId) => root.classList.remove(themeClasses[themeId]));
    root.classList.add(themeClasses[theme]);

    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.style.colorScheme = "light";
    }
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
