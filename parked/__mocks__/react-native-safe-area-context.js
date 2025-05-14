const React = require('react');

// Skapa en enkel SafeAreaView-komponent
const SafeAreaView = ({ children, ...props }) => {
  return React.createElement('view', {
    ...props,
    testID: props.testID || 'safe-area-view',
  }, children);
};
SafeAreaView.displayName = 'SafeAreaView';

// SafeAreaProvider-komponent
const SafeAreaProvider = ({ children, ...props }) => {
  return React.createElement('view', {
    ...props,
    testID: props.testID || 'safe-area-provider',
  }, children);
};
SafeAreaProvider.displayName = 'SafeAreaProvider';

// SafeAreaInsetsContext
const SafeAreaInsetsContext = {
  Consumer: ({ children }) => {
    const insets = { top: 20, right: 0, bottom: 20, left: 0 };
    return children(insets);
  },
  Provider: ({ children, value }) => {
    return React.createElement('view', {
      testID: 'safe-area-insets-provider',
    }, children);
  },
};

// useSafeAreaInsets hook
const useSafeAreaInsets = () => {
  return {
    top: 20,
    right: 0,
    bottom: 20,
    left: 0,
  };
};

// useSafeAreaFrame hook
const useSafeAreaFrame = () => {
  return {
    x: 0,
    y: 0,
    width: 375,
    height: 812,
  };
};

// initialWindowMetrics
const initialWindowMetrics = {
  frame: {
    x: 0,
    y: 0,
    width: 375,
    height: 812,
  },
  insets: {
    top: 20,
    right: 0,
    bottom: 20,
    left: 0,
  },
};

// SafeAreaContext
const SafeAreaContext = React.createContext({
  insets: {
    top: 20,
    right: 0,
    bottom: 20,
    left: 0,
  },
  frame: {
    x: 0,
    y: 0,
    width: 375,
    height: 812,
  },
});

// Extra komponenter
const SafeAreaFrameContext = React.createContext({
  x: 0,
  y: 0,
  width: 375,
  height: 812,
});

module.exports = {
  SafeAreaView,
  SafeAreaProvider,
  SafeAreaInsetsContext,
  SafeAreaContext,
  SafeAreaFrameContext,
  useSafeAreaInsets,
  useSafeAreaFrame,
  initialWindowMetrics,
}; 