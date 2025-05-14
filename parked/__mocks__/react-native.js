'use strict';

// Mock för react-native modulen
const React = require('react');

// Hjälpfunktion för att skapa React-komponenter
const createComponent = (name) => {
  const Component = ({ children, ...props }) => {
    return React.createElement(name, props, children);
  };
  
  // Lägg till nödvändiga metoder/egenskaper
  Component.displayName = name;
  
  return Component;
};

// Skapa mockade varianter av vanliga React Native-komponenter
const View = createComponent('View');
const Text = createComponent('Text');
const Image = createComponent('Image');
const ScrollView = createComponent('ScrollView');
const TextInput = createComponent('TextInput');
const TouchableOpacity = createComponent('TouchableOpacity');
const TouchableHighlight = createComponent('TouchableHighlight');
const TouchableWithoutFeedback = createComponent('TouchableWithoutFeedback');
const ActivityIndicator = createComponent('ActivityIndicator');
const FlatList = createComponent('FlatList');
const SectionList = createComponent('SectionList');
const Button = createComponent('Button');
const Switch = createComponent('Switch');
const StatusBar = createComponent('StatusBar');
const SafeAreaView = createComponent('SafeAreaView');
const Modal = createComponent('Modal');
const Pressable = createComponent('Pressable');
const KeyboardAvoidingView = createComponent('KeyboardAvoidingView');
const RefreshControl = createComponent('RefreshControl');
const VirtualizedList = createComponent('VirtualizedList');

// Mock för Animated API
const Animated = {
  View: createComponent('Animated.View'),
  Text: createComponent('Animated.Text'),
  Image: createComponent('Animated.Image'),
  ScrollView: createComponent('Animated.ScrollView'),
  FlatList: createComponent('Animated.FlatList'),
  Value: jest.fn(() => ({
    setValue: jest.fn(),
    interpolate: jest.fn(() => ({
      interpolate: jest.fn(),
    })),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    stopAnimation: jest.fn(),
    timing: jest.fn(),
  })),
  timing: jest.fn(() => ({
    start: jest.fn(cb => cb && cb()),
  })),
  spring: jest.fn(() => ({
    start: jest.fn(cb => cb && cb()),
  })),
  parallel: jest.fn(() => ({
    start: jest.fn(cb => cb && cb()),
  })),
  sequence: jest.fn(() => ({
    start: jest.fn(cb => cb && cb()),
  })),
  createAnimatedComponent: jest.fn(component => component),
  event: jest.fn(() => jest.fn()),
};

// Mock för Dimensions API
const Dimensions = {
  get: jest.fn().mockReturnValue({
    width: 375,
    height: 812,
    scale: 2,
    fontScale: 1,
  }),
  addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  removeEventListener: jest.fn(),
};

// Övriga viktiga APIs
const Alert = {
  alert: jest.fn(),
};

const AppState = {
  currentState: 'active',
  addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  removeEventListener: jest.fn(),
};

const Platform = {
  OS: 'ios',
  select: jest.fn(obj => obj.ios || obj.default),
  Version: 14,
  isPad: false,
  isTV: false,
};

const StyleSheet = {
  create: jest.fn(styles => styles),
  flatten: jest.fn(style => style),
  hairlineWidth: 1,
  absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  absoluteFillObject: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
};

const Linking = {
  openURL: jest.fn(),
  addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  removeEventListener: jest.fn(),
  canOpenURL: jest.fn().mockResolvedValue(true),
  getInitialURL: jest.fn().mockResolvedValue(null),
};

const Keyboard = {
  addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  removeListener: jest.fn(),
  dismiss: jest.fn(),
};

const LayoutAnimation = {
  configureNext: jest.fn(),
  create: jest.fn(),
  Types: {
    spring: 'spring',
    linear: 'linear',
    easeInEaseOut: 'easeInEaseOut',
    easeIn: 'easeIn',
    easeOut: 'easeOut',
  },
  Properties: {
    opacity: 'opacity',
    scaleX: 'scaleX',
    scaleY: 'scaleY',
    scaleXY: 'scaleXY',
  },
};

const UIManager = {
  measure: jest.fn((node, callback) => callback(0, 0, 0, 0, 0, 0)),
};

const NativeModules = {
  StatusBarManager: {
    getHeight: jest.fn((callback) => callback(null, 44)),
    setStyle: jest.fn(),
    setHidden: jest.fn(),
  },
};

// Exportera alla komponenter och APIs
module.exports = {
  // Components
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  ActivityIndicator,
  FlatList,
  SectionList,
  Button,
  Switch,
  StatusBar,
  SafeAreaView,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  RefreshControl,
  VirtualizedList,
  
  // APIs
  Animated,
  Dimensions,
  Alert,
  Platform,
  StyleSheet,
  Linking,
  AppState,
  Keyboard,
  LayoutAnimation,
  UIManager,
  NativeModules,
  
  // Hjälpfunktioner
  requireNativeComponent: jest.fn(() => createComponent('NativeComponent')),
  createAnimatedComponent: Animated.createAnimatedComponent,
  useWindowDimensions: jest.fn(() => ({
    width: 375,
    height: 812,
    scale: 2,
    fontScale: 1,
  })),
  useColorScheme: jest.fn(() => 'light'),
  I18nManager: {
    isRTL: false,
    allowRTL: jest.fn(),
    forceRTL: jest.fn(),
    getConstants: jest.fn(() => ({ isRTL: false })),
  },
  BackHandler: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
    exitApp: jest.fn(),
  },
}; 