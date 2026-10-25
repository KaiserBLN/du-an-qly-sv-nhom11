import React, { createContext, useContext } from 'react';

interface ThemeContextValue {
  isModern: true;
}

const ThemeContext = createContext<ThemeContextValue>({
  isModern: true
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ isModern: true }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
