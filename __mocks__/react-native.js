/**
 * Mock för React Native för testmiljön
 */
const reactNative = {
  Platform: {
    OS: 'android',
    select: (obj) => obj.android || obj.default,
    Version: 28
  },
  Dimensions: {
    get: jest.fn().mockReturnValue({ width: 360, height: 640 }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  NativeModules: {
    SettingsManager: {
      settings: {
        AppleLocale: 'sv_SE',
        AppleLanguages: ['sv-SE']
      }
    }
  },
  StyleSheet: {
    create: styles => styles,
    compose: (style1, style2) => ({ ...style1, ...style2 }),
    flatten: jest.fn(style => style)
  },
  Animated: {
    View: 'Animated.View',
    Text: 'Animated.Text',
    Image: 'Animated.Image',
    createAnimatedComponent: jest.fn(component => `Animated.${component}`),
    timing: jest.fn(() => ({
      start: jest.fn(cb => cb && cb({ finished: true }))
    })),
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      interpolate: jest.fn(() => ({
        interpolate: jest.fn()
      }))
    }))
  },
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  Image: 'Image',
  TouchableOpacity: 'TouchableOpacity',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  Pressable: 'Pressable',
  Alert: {
    alert: jest.fn()
  }
};

module.exports = reactNative; 