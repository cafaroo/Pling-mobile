import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Types
interface Dialog {
  id: string;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface UIState {
  // Tema och visuella inställningar
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  
  // Navigationstillstånd
  currentScreen: string | null;
  previousScreen: string | null;
  
  // Dialog/modal tillstånd
  activeDialog: Dialog | null;
  isModalVisible: boolean;
  
  // UI-relaterade användarpreferenser
  listViewMode: 'grid' | 'list';
  sortOrder: 'asc' | 'desc';
  sortField: string;
}

interface UIStateContextValue extends UIState {
  // Tema-relaterade metoder
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  
  // Navigations-relaterade metoder
  setCurrentScreen: (screen: string) => void;
  
  // Dialog-relaterade metoder
  showDialog: (dialog: Omit<Dialog, 'id'>) => string;
  hideDialog: (id?: string) => void;
  showModal: () => void;
  hideModal: () => void;
  
  // Användarpreferens-relaterade metoder
  setListViewMode: (mode: 'grid' | 'list') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setSortField: (field: string) => void;
}

// Default-värden
const defaultUIState: UIState = {
  theme: 'system',
  fontSize: 'medium',
  currentScreen: null,
  previousScreen: null,
  activeDialog: null,
  isModalVisible: false,
  listViewMode: 'list',
  sortOrder: 'asc',
  sortField: 'name',
};

// Skapa context
const UIStateContext = createContext<UIStateContextValue | null>(null);

/**
 * Provider-komponent för UI-tillstånd
 */
export const UIStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<UIState>(defaultUIState);
  
  // Tema-relaterade metoder
  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    setState(prev => ({ ...prev, theme }));
  }, []);
  
  const setFontSize = useCallback((fontSize: 'small' | 'medium' | 'large') => {
    setState(prev => ({ ...prev, fontSize }));
  }, []);
  
  // Navigations-relaterade metoder
  const setCurrentScreen = useCallback((screen: string) => {
    setState(prev => ({ 
      ...prev, 
      previousScreen: prev.currentScreen,
      currentScreen: screen 
    }));
  }, []);
  
  // Dialog-relaterade metoder
  const showDialog = useCallback((dialog: Omit<Dialog, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setState(prev => ({ 
      ...prev, 
      activeDialog: { ...dialog, id } 
    }));
    return id;
  }, []);
  
  const hideDialog = useCallback((id?: string) => {
    setState(prev => {
      // Om inget id anges eller om id matchar aktivt dialogfönster
      if (!id || (prev.activeDialog && prev.activeDialog.id === id)) {
        return { ...prev, activeDialog: null };
      }
      return prev;
    });
  }, []);
  
  const showModal = useCallback(() => {
    setState(prev => ({ ...prev, isModalVisible: true }));
  }, []);
  
  const hideModal = useCallback(() => {
    setState(prev => ({ ...prev, isModalVisible: false }));
  }, []);
  
  // Användarpreferens-relaterade metoder
  const setListViewMode = useCallback((listViewMode: 'grid' | 'list') => {
    setState(prev => ({ ...prev, listViewMode }));
  }, []);
  
  const setSortOrder = useCallback((sortOrder: 'asc' | 'desc') => {
    setState(prev => ({ ...prev, sortOrder }));
  }, []);
  
  const setSortField = useCallback((sortField: string) => {
    setState(prev => ({ ...prev, sortField }));
  }, []);
  
  const value: UIStateContextValue = {
    ...state,
    setTheme,
    setFontSize,
    setCurrentScreen,
    showDialog,
    hideDialog,
    showModal,
    hideModal,
    setListViewMode,
    setSortOrder,
    setSortField,
  };
  
  return (
    <UIStateContext.Provider value={value}>
      {children}
    </UIStateContext.Provider>
  );
};

/**
 * Hook för att använda UI-tillstånd
 */
export const useUIState = (): UIStateContextValue => {
  const context = useContext(UIStateContext);
  
  if (!context) {
    throw new Error('useUIState måste användas inom en UIStateProvider');
  }
  
  return context;
}; 