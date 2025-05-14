// Mock för react-native-gesture-handler
const React = require('react');

// Hjälpfunktion för att skapa mock-komponenter
const createComponentMock = (name) => {
  const Component = ({ children, ...props }) => {
    return React.createElement('view', {
      ...props,
      testID: props.testID || `gesture-${name}`,
      'data-component': name,
    }, children);
  };
  Component.displayName = name;
  return Component;
};

// Skapa mockimplementationer för huvudkomponenter
const Swipeable = ({ children, renderLeftActions, renderRightActions, onSwipeableOpen, ...props }) => {
  return React.createElement('view', {
    ...props,
    testID: props.testID || 'gesture-swipeable',
    'data-component': 'Swipeable',
    'data-has-left-actions': !!renderLeftActions,
    'data-has-right-actions': !!renderRightActions,
  }, children);
};

const TouchableOpacity = ({ children, onPress, ...props }) => {
  return React.createElement('button', {
    ...props,
    testID: props.testID || 'gesture-touchable-opacity',
    'data-component': 'TouchableOpacity',
    onClick: onPress,
  }, children);
};

const RectButton = ({ children, onPress, ...props }) => {
  return React.createElement('button', {
    ...props,
    testID: props.testID || 'gesture-rect-button',
    'data-component': 'RectButton',
    onClick: onPress,
  }, children);
};

const BorderlessButton = ({ children, onPress, ...props }) => {
  return React.createElement('button', {
    ...props,
    testID: props.testID || 'gesture-borderless-button',
    'data-component': 'BorderlessButton',
    onClick: onPress,
  }, children);
};

const BaseButton = ({ children, onPress, ...props }) => {
  return React.createElement('button', {
    ...props,
    testID: props.testID || 'gesture-base-button',
    'data-component': 'BaseButton',
    onClick: onPress,
  }, children);
};

const GestureHandlerRootView = ({ children, ...props }) => {
  return React.createElement('view', {
    ...props,
    testID: props.testID || 'gesture-handler-root-view',
    'data-component': 'GestureHandlerRootView',
  }, children);
};

// Skapa mockimplementationer för ytterligare komponenter
const PanGestureHandler = createComponentMock('PanGestureHandler');
const TapGestureHandler = createComponentMock('TapGestureHandler');
const LongPressGestureHandler = createComponentMock('LongPressGestureHandler');
const RotationGestureHandler = createComponentMock('RotationGestureHandler');
const PinchGestureHandler = createComponentMock('PinchGestureHandler');
const FlingGestureHandler = createComponentMock('FlingGestureHandler');
const ForceTouchGestureHandler = createComponentMock('ForceTouchGestureHandler');

// Tilläggsmockningar för specialkomponenter
const createNativeWrapper = jest.fn(
  (Component, config = {}) => {
    return ({ children, ...props }) => {
      return React.createElement(
        'view',
        {
          ...props,
          testID: props.testID || 'native-wrapper',
          'data-component': 'NativeViewGestureHandler',
          'data-wrapped-component': Component.displayName || 'UnknownComponent',
        },
        children
      );
    };
  }
);

// Konstanter som används i gesture-handler
const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
};

const Direction = {
  RIGHT: 1,
  LEFT: 2,
  UP: 4,
  DOWN: 8,
};

// Exportera allt
module.exports = {
  Swipeable,
  TouchableOpacity,
  RectButton,
  BorderlessButton,
  BaseButton,
  GestureHandlerRootView,
  PanGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  RotationGestureHandler,
  PinchGestureHandler,
  FlingGestureHandler,
  ForceTouchGestureHandler,
  createNativeWrapper,
  State,
  Direction,
  
  // Lägg till funktioner för att hantera händelsehanterare
  attachGestureHandler: jest.fn(),
  createGestureHandler: jest.fn(),
  dropGestureHandler: jest.fn(),
  updateGestureHandler: jest.fn(),
  enableGestureHandlerSystemWideProps: jest.fn(),
  closeGestureHandlersRegistry: jest.fn(),
  gestureHandlerRootHOC: jest.fn((Component, containerStyles) => Component),
  
  // Extraexporteringar för testkonfigureringar
  TouchableHighlight: createComponentMock('TouchableHighlight'),
  TouchableWithoutFeedback: createComponentMock('TouchableWithoutFeedback'),
  TouchableNativeFeedback: createComponentMock('TouchableNativeFeedback'),
  ScrollView: createComponentMock('ScrollView'),
  Switch: createComponentMock('Switch'),
  TextInput: createComponentMock('TextInput'),
  NativeViewGestureHandler: createComponentMock('NativeViewGestureHandler'),
  
  // Helpers för testningar
  __createComponentMock: createComponentMock,
}; 
const React = require('react');

// Hjälpfunktion för att skapa mock-komponenter
const createComponentMock = (name) => {
  const Component = ({ children, ...props }) => {
    return React.createElement('view', {
      ...props,
      testID: props.testID || `gesture-${name}`,
      'data-component': name,
    }, children);
  };
  Component.displayName = name;
  return Component;
};

// Skapa mockimplementationer för huvudkomponenter
const Swipeable = ({ children, renderLeftActions, renderRightActions, onSwipeableOpen, ...props }) => {
  return React.createElement('view', {
    ...props,
    testID: props.testID || 'gesture-swipeable',
    'data-component': 'Swipeable',
    'data-has-left-actions': !!renderLeftActions,
    'data-has-right-actions': !!renderRightActions,
  }, children);
};

const TouchableOpacity = ({ children, onPress, ...props }) => {
  return React.createElement('button', {
    ...props,
    testID: props.testID || 'gesture-touchable-opacity',
    'data-component': 'TouchableOpacity',
    onClick: onPress,
  }, children);
};

const RectButton = ({ children, onPress, ...props }) => {
  return React.createElement('button', {
    ...props,
    testID: props.testID || 'gesture-rect-button',
    'data-component': 'RectButton',
    onClick: onPress,
  }, children);
};

const BorderlessButton = ({ children, onPress, ...props }) => {
  return React.createElement('button', {
    ...props,
    testID: props.testID || 'gesture-borderless-button',
    'data-component': 'BorderlessButton',
    onClick: onPress,
  }, children);
};

const BaseButton = ({ children, onPress, ...props }) => {
  return React.createElement('button', {
    ...props,
    testID: props.testID || 'gesture-base-button',
    'data-component': 'BaseButton',
    onClick: onPress,
  }, children);
};

const GestureHandlerRootView = ({ children, ...props }) => {
  return React.createElement('view', {
    ...props,
    testID: props.testID || 'gesture-handler-root-view',
    'data-component': 'GestureHandlerRootView',
  }, children);
};

// Skapa mockimplementationer för ytterligare komponenter
const PanGestureHandler = createComponentMock('PanGestureHandler');
const TapGestureHandler = createComponentMock('TapGestureHandler');
const LongPressGestureHandler = createComponentMock('LongPressGestureHandler');
const RotationGestureHandler = createComponentMock('RotationGestureHandler');
const PinchGestureHandler = createComponentMock('PinchGestureHandler');
const FlingGestureHandler = createComponentMock('FlingGestureHandler');
const ForceTouchGestureHandler = createComponentMock('ForceTouchGestureHandler');

// Tilläggsmockningar för specialkomponenter
const createNativeWrapper = jest.fn(
  (Component, config = {}) => {
    return ({ children, ...props }) => {
      return React.createElement(
        'view',
        {
          ...props,
          testID: props.testID || 'native-wrapper',
          'data-component': 'NativeViewGestureHandler',
          'data-wrapped-component': Component.displayName || 'UnknownComponent',
        },
        children
      );
    };
  }
);

// Konstanter som används i gesture-handler
const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
};

const Direction = {
  RIGHT: 1,
  LEFT: 2,
  UP: 4,
  DOWN: 8,
};

// Exportera allt
module.exports = {
  Swipeable,
  TouchableOpacity,
  RectButton,
  BorderlessButton,
  BaseButton,
  GestureHandlerRootView,
  PanGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  RotationGestureHandler,
  PinchGestureHandler,
  FlingGestureHandler,
  ForceTouchGestureHandler,
  createNativeWrapper,
  State,
  Direction,
  
  // Lägg till funktioner för att hantera händelsehanterare
  attachGestureHandler: jest.fn(),
  createGestureHandler: jest.fn(),
  dropGestureHandler: jest.fn(),
  updateGestureHandler: jest.fn(),
  enableGestureHandlerSystemWideProps: jest.fn(),
  closeGestureHandlersRegistry: jest.fn(),
  gestureHandlerRootHOC: jest.fn((Component, containerStyles) => Component),
  
  // Extraexporteringar för testkonfigureringar
  TouchableHighlight: createComponentMock('TouchableHighlight'),
  TouchableWithoutFeedback: createComponentMock('TouchableWithoutFeedback'),
  TouchableNativeFeedback: createComponentMock('TouchableNativeFeedback'),
  ScrollView: createComponentMock('ScrollView'),
  Switch: createComponentMock('Switch'),
  TextInput: createComponentMock('TextInput'),
  NativeViewGestureHandler: createComponentMock('NativeViewGestureHandler'),
  
  // Helpers för testningar
  __createComponentMock: createComponentMock,
}; 