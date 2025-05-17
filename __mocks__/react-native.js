/**
 * Mock för react-native i testerna
 */

const reactNativeMock = {
  Platform: {
    OS: 'web',
    select: function(obj) {
      return obj.web || obj.default;
    }
  },
  Dimensions: {
    get: function() {
      return {
        width: 375,
        height: 667
      };
    }
  },
  StyleSheet: {
    create: jest.fn(styles => styles)
  },
  Animated: {
    Value: jest.fn(() => ({
      interpolate: jest.fn(),
      setValue: jest.fn(),
      addListener: jest.fn()
    })),
    timing: jest.fn(() => ({
      start: jest.fn(cb => cb && cb())
    })),
    spring: jest.fn(() => ({
      start: jest.fn(cb => cb && cb())
    }))
  },
  Alert: {
    alert: jest.fn()
  }
};

module.exports = reactNativeMock; 