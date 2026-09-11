import { useState, useEffect } from "react";
import { ThemeContext } from "./theme-context";

export function ThemeProvider({ children }) {
  const [lowPower, setLowPower] = useState(() => localStorage.getItem("ergo-lowpower") === "1");

  useEffect(() => {
    const root = document.documentElement;
    if (lowPower) {
      root.classList.add("dark");
      localStorage.setItem("ergo-lowpower", "1");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("ergo-lowpower", "0");
    }
  }, [lowPower]);

  return (
    <ThemeContext.Provider value={{ lowPower, setLowPower, toggle: () => setLowPower((v) => !v) }}>
      {children}
    </ThemeContext.Provider>
  );
}

