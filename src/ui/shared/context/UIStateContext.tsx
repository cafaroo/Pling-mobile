import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Typdefinitioner för UI-tillstånd
export interface UIState {
  // Tema-inställningar
  theme: {
    isDarkMode: boolean;
    colorScheme: 'system' | 'light' | 'dark';
  };
  // Modala fönster
  modals: {
    activeModals: Array<{
      id: string;
      props?: Record<string, any>;
    }>;
  };
  // Toast-meddelanden
  toasts: {
    messages: Array<{
      id: string;
      type: 'success' | 'error' | 'info' | 'warning';
      message: string;
      duration?: number;
    }>;
  };
  // Navigation
  navigation: {
    previousScreen?: string;
    history: string[];
  };
}

// Tillgängliga actions för reducern
type UIAction =
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_THEME_MODE', payload: 'system' | 'light' | 'dark' }
  | { type: 'SHOW_MODAL', payload: { id: string, props?: Record<string, any> } }
  | { type: 'HIDE_MODAL', payload: { id: string } }
  | { type: 'SHOW_TOAST', payload: { id: string, type: 'success' | 'error' | 'info' | 'warning', message: string, duration?: number } }
  | { type: 'HIDE_TOAST', payload: { id: string } }
  | { type: 'NAVIGATE', payload: { screen: string } };

// Initialt tillstånd
const initialState: UIState = {
  theme: {
    isDarkMode: false,
    colorScheme: 'system',
  },
  modals: {
    activeModals: [],
  },
  toasts: {
    messages: [],
  },
  navigation: {
    history: [],
  },
};

// Reducer för att hantera tillståndsförändringar
function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'TOGGLE_THEME':
      return {
        ...state,
        theme: {
          ...state.theme,
          isDarkMode: !state.theme.isDarkMode,
        },
      };
    case 'SET_THEME_MODE':
      return {
        ...state,
        theme: {
          ...state.theme,
          colorScheme: action.payload,
          isDarkMode: action.payload === 'dark' || (action.payload === 'system' && /* Här skulle vi kontrollera systemets tema */ false),
        },
      };
    case 'SHOW_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          activeModals: [
            ...state.modals.activeModals,
            { id: action.payload.id, props: action.payload.props }
          ],
        },
      };
    case 'HIDE_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          activeModals: state.modals.activeModals.filter(
            modal => modal.id !== action.payload.id
          ),
        },
      };
    case 'SHOW_TOAST':
      return {
        ...state,
        toasts: {
          ...state.toasts,
          messages: [
            ...state.toasts.messages,
            { 
              id: action.payload.id,
              type: action.payload.type,
              message: action.payload.message,
              duration: action.payload.duration,
            }
          ],
        },
      };
    case 'HIDE_TOAST':
      return {
        ...state,
        toasts: {
          ...state.toasts,
          messages: state.toasts.messages.filter(
            toast => toast.id !== action.payload.id
          ),
        },
      };
    case 'NAVIGATE':
      return {
        ...state,
        navigation: {
          previousScreen: state.navigation.history[state.navigation.history.length - 1],
          history: [...state.navigation.history, action.payload.screen],
        },
      };
    default:
      return state;
  }
}

// Kontext för att tillhandahålla tillståndet och handlingshanterare
interface UIContextValue {
  state: UIState;
  dispatch: React.Dispatch<UIAction>;
  // Hjälpmetoder
  toggleTheme: () => void;
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
  showModal: (id: string, props?: Record<string, any>) => void;
  hideModal: (id: string) => void;
  showToast: (options: { type: 'success' | 'error' | 'info' | 'warning', message: string, duration?: number }) => string;
  hideToast: (id: string) => void;
  navigate: (screen: string) => void;
}

// Skapa kontext
const UIStateContext = createContext<UIContextValue | undefined>(undefined);

// Provider-komponent
interface UIStateProviderProps {
  children: ReactNode;
  initialUIState?: Partial<UIState>;
}

export const UIStateProvider: React.FC<UIStateProviderProps> = ({ 
  children,
  initialUIState,
}) => {
  const [state, dispatch] = useReducer(
    uiReducer, 
    { ...initialState, ...initialUIState }
  );

  // Hjälpmetoder för UI-interaktioner
  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };

  const setThemeMode = (mode: 'system' | 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME_MODE', payload: mode });
  };

  const showModal = (id: string, props?: Record<string, any>) => {
    dispatch({ type: 'SHOW_MODAL', payload: { id, props } });
  };

  const hideModal = (id: string) => {
    dispatch({ type: 'HIDE_MODAL', payload: { id } });
  };

  const showToast = (options: { 
    type: 'success' | 'error' | 'info' | 'warning', 
    message: string, 
    duration?: number 
  }): string => {
    const id = `toast-${Date.now()}`;
    dispatch({ 
      type: 'SHOW_TOAST', 
      payload: { 
        id, 
        type: options.type,
        message: options.message,
        duration: options.duration || 3000,
      } 
    });
    return id;
  };

  const hideToast = (id: string) => {
    dispatch({ type: 'HIDE_TOAST', payload: { id } });
  };

  const navigate = (screen: string) => {
    dispatch({ type: 'NAVIGATE', payload: { screen } });
  };

  return (
    <UIStateContext.Provider
      value={{
        state,
        dispatch,
        toggleTheme,
        setThemeMode,
        showModal,
        hideModal,
        showToast,
        hideToast,
        navigate,
      }}
    >
      {children}
    </UIStateContext.Provider>
  );
};

// Hook för att använda UI-tillståndet i komponenter
export const useUIState = (): UIContextValue => {
  const context = useContext(UIStateContext);
  if (context === undefined) {
    throw new Error('useUIState måste användas inom en UIStateProvider');
  }
  return context;
}; 