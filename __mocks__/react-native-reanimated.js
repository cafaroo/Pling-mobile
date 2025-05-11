// Mock för react-native-reanimated
const ReactNativeReanimated = {
  // Animationskontroller
  useSharedValue: (initialValue) => ({ value: initialValue }),
  useAnimatedStyle: (callback) => callback(),
  useDerivedValue: (callback) => ({ value: callback() }),
  useAnimatedGestureHandler: (handlers) => handlers,
  useAnimatedScrollHandler: (handlers) => handlers,
  useAnimatedRef: () => ({ current: null }),
  useAnimatedReaction: (prepare, react) => {},
  useAnimatedProps: (callback) => callback(),
  
  // Animationsfunktioner
  withTiming: (toValue, config, callback) => toValue,
  withSpring: (toValue, config, callback) => toValue,
  withDecay: (config, callback) => 0,
  withDelay: (delayMs, animation) => animation,
  withSequence: (...animations) => animations[animations.length-1],
  withRepeat: (animation, numberOfReps, reverse, callback) => animation,
  cancelAnimation: (value) => {},
  
  // Interpolering
  interpolate: (value, inputRange, outputRange, options) => {
    return outputRange[0];
  },
  
  // Matematiska funktioner
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,
  
  // Easing
  Easing: {
    linear: (t) => t,
    ease: (t) => t,
    quad: (t) => t * t,
    cubic: (t) => t * t * t,
    bezier: () => (t) => t,
    circle: (t) => 1 - Math.sqrt(1 - t * t),
    sin: (t) => Math.sin(t),
    exp: (t) => Math.exp(t),
    inOut: (easing) => easing,
  },
  
  // Konstanter
  FadeIn: { duration: 300 },
  FadeOut: { duration: 300 },
  Layout: {
    springify: () => {},
    duration: (ms) => {},
  },
  LinearTransition: { duration: 300 },
  SlideInRight: { duration: 300 },
  SlideOutRight: { duration: 300 },
  SlideInLeft: { duration: 300 },
  SlideOutLeft: { duration: 300 },
  SlideInUp: { duration: 300 },
  SlideOutUp: { duration: 300 },
  SlideInDown: { duration: 300 },
  SlideOutDown: { duration: 300 },
  
  // Reanimerade komponenter
  View: require('react').forwardRef((props, ref) => {
    const { children, ...otherProps } = props;
    return require('react').createElement('view', { ref, ...otherProps }, children);
  }),
  Text: require('react').forwardRef((props, ref) => {
    const { children, ...otherProps } = props;
    return require('react').createElement('text', { ref, ...otherProps }, children);
  }),
  Image: require('react').forwardRef((props, ref) => {
    const { source, ...otherProps } = props;
    return require('react').createElement('image', { 
      ref, 
      ...otherProps,
      src: typeof source === 'object' && source.uri ? source.uri : source,
    });
  }),
  ScrollView: require('react').forwardRef((props, ref) => {
    const { children, ...otherProps } = props;
    return require('react').createElement('scrollview', { ref, ...otherProps }, children);
  }),
  
  // Konfiguration
  createAnimatableComponent: (component) => component,
  
  // Hjälpfunktioner
  runOnUI: (fn) => fn,
  runOnJS: (fn) => fn,
};

// Lägg till alla exporter från det mockade objektet som modulexport
Object.keys(ReactNativeReanimated).forEach((key) => {
  module.exports[key] = ReactNativeReanimated[key];
});

// Exportera allt för default export
module.exports.default = ReactNativeReanimated; 
const ReactNativeReanimated = {
  // Animationskontroller
  useSharedValue: (initialValue) => ({ value: initialValue }),
  useAnimatedStyle: (callback) => callback(),
  useDerivedValue: (callback) => ({ value: callback() }),
  useAnimatedGestureHandler: (handlers) => handlers,
  useAnimatedScrollHandler: (handlers) => handlers,
  useAnimatedRef: () => ({ current: null }),
  useAnimatedReaction: (prepare, react) => {},
  useAnimatedProps: (callback) => callback(),
  
  // Animationsfunktioner
  withTiming: (toValue, config, callback) => toValue,
  withSpring: (toValue, config, callback) => toValue,
  withDecay: (config, callback) => 0,
  withDelay: (delayMs, animation) => animation,
  withSequence: (...animations) => animations[animations.length-1],
  withRepeat: (animation, numberOfReps, reverse, callback) => animation,
  cancelAnimation: (value) => {},
  
  // Interpolering
  interpolate: (value, inputRange, outputRange, options) => {
    return outputRange[0];
  },
  
  // Matematiska funktioner
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,
  
  // Easing
  Easing: {
    linear: (t) => t,
    ease: (t) => t,
    quad: (t) => t * t,
    cubic: (t) => t * t * t,
    bezier: () => (t) => t,
    circle: (t) => 1 - Math.sqrt(1 - t * t),
    sin: (t) => Math.sin(t),
    exp: (t) => Math.exp(t),
    inOut: (easing) => easing,
  },
  
  // Konstanter
  FadeIn: { duration: 300 },
  FadeOut: { duration: 300 },
  Layout: {
    springify: () => {},
    duration: (ms) => {},
  },
  LinearTransition: { duration: 300 },
  SlideInRight: { duration: 300 },
  SlideOutRight: { duration: 300 },
  SlideInLeft: { duration: 300 },
  SlideOutLeft: { duration: 300 },
  SlideInUp: { duration: 300 },
  SlideOutUp: { duration: 300 },
  SlideInDown: { duration: 300 },
  SlideOutDown: { duration: 300 },
  
  // Reanimerade komponenter
  View: require('react').forwardRef((props, ref) => {
    const { children, ...otherProps } = props;
    return require('react').createElement('view', { ref, ...otherProps }, children);
  }),
  Text: require('react').forwardRef((props, ref) => {
    const { children, ...otherProps } = props;
    return require('react').createElement('text', { ref, ...otherProps }, children);
  }),
  Image: require('react').forwardRef((props, ref) => {
    const { source, ...otherProps } = props;
    return require('react').createElement('image', { 
      ref, 
      ...otherProps,
      src: typeof source === 'object' && source.uri ? source.uri : source,
    });
  }),
  ScrollView: require('react').forwardRef((props, ref) => {
    const { children, ...otherProps } = props;
    return require('react').createElement('scrollview', { ref, ...otherProps }, children);
  }),
  
  // Konfiguration
  createAnimatableComponent: (component) => component,
  
  // Hjälpfunktioner
  runOnUI: (fn) => fn,
  runOnJS: (fn) => fn,
};

// Lägg till alla exporter från det mockade objektet som modulexport
Object.keys(ReactNativeReanimated).forEach((key) => {
  module.exports[key] = ReactNativeReanimated[key];
});

// Exportera allt för default export
module.exports.default = ReactNativeReanimated; 