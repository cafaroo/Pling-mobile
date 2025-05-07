import { createContext, useContext } from 'react';

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    error: string;
    success: string;
    warning: string;
  };
}

const defaultTheme: Theme = {
  colors: {
    primary: '#000000',
    secondary: '#0000FF',
    background: '#FFFFFF',
    text: '#000000',
    error: '#FF0000',
    success: '#00FF00',
    warning: '#FFA500'
  },
};

export const ThemeContext = createContext<Theme>(defaultTheme);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ThemeContext.Provider; 