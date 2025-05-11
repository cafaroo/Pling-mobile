// Mock för expo-router
const React = require('react');

// Grundläggande mockning av useRouter-hook
const useRouter = jest.fn().mockReturnValue({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
  setParams: jest.fn(),
  canGoBack: jest.fn().mockReturnValue(true),
  getCurrentOptions: jest.fn().mockReturnValue({}),
});

// Enkel Link-komponent
const Link = ({ href, asChild, children, onPress, ...props }) => {
  const handlePress = (event) => {
    if (onPress) {
      onPress(event);
    }
    // Om asChild är true, anropa inte useRouter-funktionerna
    if (!asChild) {
      useRouter().push(href);
    }
  };

  if (asChild && React.isValidElement(children)) {
    // Klona det enda barnet och lägg till onPress
    return React.cloneElement(children, {
      ...props,
      onPress: handlePress,
    });
  }

  // Returnera en standardkomponent
  return React.createElement(
    'a',
    {
      ...props,
      href: href,
      onClick: handlePress,
      'data-testid': props.testID || 'expo-router-link',
    },
    children
  );
};

// Simulera Redirect-komponent
const Redirect = ({ href }) => {
  // I en testmiljö, anropa bara useRouter.replace
  useRouter().replace(href);
  return null;
};

// Mock för useLocalSearchParams
const useLocalSearchParams = jest.fn().mockReturnValue({});

// Mock för useSegments
const useSegments = jest.fn().mockReturnValue([]);

// Mock för useRootNavigationState
const useRootNavigationState = jest.fn().mockReturnValue({
  key: 'root',
  index: 0,
  routeNames: ['index'],
  routes: [{ key: 'index', name: 'index' }],
  stale: false,
  type: 'stack',
});

// Mock för router-instans (för användning utanför hooks)
const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
  setParams: jest.fn(),
  canGoBack: jest.fn().mockReturnValue(true),
};

// Skapa Stack komponent för navigering
const Stack = {
  Screen: ({ name, component, options }) => {
    return React.createElement('div', {
      'data-testid': `stack-screen-${name}`,
      'data-screen-name': name,
      'data-screen-options': JSON.stringify(options || {}),
    });
  },
};

// Skapa Tab komponent för navigering
const Tabs = {
  Screen: ({ name, component, options }) => {
    return React.createElement('div', {
      'data-testid': `tab-screen-${name}`,
      'data-screen-name': name,
      'data-screen-options': JSON.stringify(options || {}),
    });
  },
};

// SplashScreen för laddningsstatus
const SplashScreen = {
  preventAutoHideAsync: jest.fn().mockResolvedValue(true),
  hideAsync: jest.fn().mockResolvedValue(true),
};

// Exportera alla komponenter och hooks
module.exports = {
  useRouter,
  Link,
  Redirect,
  useLocalSearchParams,
  useSegments,
  useRootNavigationState,
  router,
  Stack,
  Tabs,
  SplashScreen,
  
  // För default export
  default: {
    useRouter,
    Link,
    Redirect,
    useLocalSearchParams,
    useSegments,
    useRootNavigationState,
    router,
    Stack,
    Tabs,
    SplashScreen,
  }
}; 