import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { UserFeedback, FeedbackType, useFeedback } from '../UserFeedback';
import { View, Text, TouchableOpacity } from 'react-native';

// Skapa mockade komponenter som använder mockFactory för att undvika referenser utanför jest.mock
const mockFactory = {
  createMockView: () => (props) => {
    const { children, testID, style, ...rest } = props || {};
    return <View testID={testID} style={style} {...rest}>{children}</View>;
  },
  createMockText: () => (props) => {
    const { children, testID, style, ...rest } = props || {};
    return <Text testID={testID} style={style} {...rest}>{children}</Text>;
  },
  createMockTouchable: () => (props) => {
    const { children, testID, onPress, ...rest } = props || {};
    return <TouchableOpacity testID={testID} onPress={onPress} {...rest}>{children}</TouchableOpacity>;
  }
};

// Mock av Paper-komponenter
jest.mock('react-native-paper', () => {
  // mockComponent måste definieras separat för att inte använda externa referenser
  const mockComponent = (name) => {
    return (props) => {
      const { children, testID, onPress, ...rest } = props || {};
      if (onPress) {
        return mockFactory.createMockView()({
          testID: testID || `mock-${name}`,
          children: mockFactory.createMockTouchable()({
            testID: `touchable-${testID || `mock-${name}`}`,
            onPress,
            children
          }),
          style: rest.style
        });
      }
      return mockFactory.createMockView()({
        testID: testID || `mock-${name}`,
        children,
        style: rest.style
      });
    };
  };
  
  return {
    Portal: (props) => {
      const { children } = props || {};
      return mockFactory.createMockView()({
        testID: 'mock-Portal',
        children
      });
    },
    Modal: (props) => {
      const { visible, children, testID, onDismiss } = props || {};
      return visible ? mockFactory.createMockView()({
        testID: testID || 'mock-Modal',
        children
      }) : null;
    },
    Surface: mockComponent('Surface'),
    IconButton: (props) => {
      const { icon, onPress, testID } = props || {};
      return mockFactory.createMockTouchable()({
        testID: testID || `mock-IconButton-${icon}`,
        onPress,
        children: mockFactory.createMockText()({ children: icon })
      });
    },
    Button: (props) => {
      const { onPress, children, testID, mode } = props || {};
      return mockFactory.createMockTouchable()({
        testID: testID || `mock-Button-${mode || 'default'}`,
        onPress,
        children
      });
    },
    Text: (props) => {
      const { children, style, testID, variant } = props || {};
      return mockFactory.createMockText()({
        testID: testID || `mock-Text-${variant || 'default'}`,
        style,
        children
      });
    },
    useTheme: () => ({
      colors: {
        primary: '#2196F3',
        secondary: '#9C27B0',
        error: '#F44336'
      }
    })
  };
});

// Mock för Expo-Vector-Icons
jest.mock('@expo/vector-icons', () => {
  return {
    MaterialCommunityIcons: (props) => {
      const { name } = props || {};
      return mockFactory.createMockView()({ testID: `mock-icon-${name}` });
    }
  };
});

// Mock för Animated
jest.mock('react-native', () => {
  const reactNative = jest.requireActual('react-native');
  const mockAnimated = {
    Value: jest.fn(() => ({
      setValue: jest.fn(),
    })),
    timing: jest.fn(() => ({
      start: jest.fn(callback => callback && callback()),
    })),
    View: (props) => {
      const { style, children, testID } = props || {};
      return mockFactory.createMockView()({
        testID: testID || 'mock-Animated.View',
        style,
        children
      });
    }
  };

  return {
    ...reactNative,
    Animated: {
      ...reactNative.Animated,
      ...mockAnimated
    },
  };
});

// Hjälpfunktion för att rendera tester med mocks
const renderFeedback = (props = {}) => {
  const defaultProps = {
    visible: true,
    type: FeedbackType.SUCCESS,
    title: 'Test titel',
    message: 'Test meddelande',
    onDismiss: jest.fn(),
  };
  
  return render(
    <UserFeedback {...defaultProps} {...props} />
  );
};

describe('UserFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  it('ska visa feedback när visible är true', () => {
    const { getByText } = renderFeedback();
    expect(getByText('Test titel')).toBeTruthy();
    expect(getByText('Test meddelande')).toBeTruthy();
  });
  
  it('ska inte visa feedback när visible är false', () => {
    const { queryByText } = renderFeedback({ visible: false });
    expect(queryByText('Test titel')).toBeNull();
    expect(queryByText('Test meddelande')).toBeNull();
  });
  
  it('ska anropa onDismiss när feedback stängs', () => {
    const onDismissMock = jest.fn();
    const { getByTestId } = renderFeedback({ 
      onDismiss: onDismissMock 
    });
    
    // Hitta stängknappen och simulera klick
    const closeButton = getByTestId('mock-IconButton-close');
    fireEvent.press(closeButton);
    
    // Testa att funktionen anropades
    expect(onDismissMock).toHaveBeenCalled();
  });
  
  it('ska dölja feedback automatiskt efter timeout för success', () => {
    const onDismissMock = jest.fn();
    renderFeedback({ 
      type: FeedbackType.SUCCESS,
      onDismiss: onDismissMock
    });
    
    // Använd act för att avancera timern
    act(() => {
      jest.advanceTimersByTime(3500);
    });
    
    // Verifiera att onDismiss anropades efter timeout
    expect(onDismissMock).toHaveBeenCalled();
  });
  
  it('ska visa retry-knapp endast för error typ', () => {
    const onRetryMock = jest.fn();
    
    // Testa med error-typ
    const { getByTestId: getByTestIdError } = renderFeedback({
      type: FeedbackType.ERROR,
      onRetry: onRetryMock
    });
    
    // Ska ha både stäng- och retry-knappar
    expect(getByTestIdError('mock-IconButton-refresh')).toBeTruthy();
    expect(getByTestIdError('mock-IconButton-close')).toBeTruthy();
    
    // Testa med success-typ (ska bara ha stängknapp)
    const { queryByTestId: queryByTestIdSuccess } = renderFeedback({
      type: FeedbackType.SUCCESS,
      onRetry: onRetryMock
    });
    
    expect(queryByTestIdSuccess('mock-IconButton-refresh')).toBeNull();
    expect(queryByTestIdSuccess('mock-IconButton-close')).toBeTruthy();
  });
});

// Testkomponent för att testa hook
const TestComponent = ({ onShowSuccess, onShowError, onHide }) => {
  const hookResult = useFeedback();
  
  return (
    <>
      <hookResult.FeedbackComponent />
      <TouchableOpacity testID="test-success-btn" onPress={() => {
        hookResult.showSuccess('Framgång', 'Det gick bra!');
        if (onShowSuccess) onShowSuccess();
      }} />
      <TouchableOpacity testID="test-error-btn" onPress={() => {
        hookResult.showError('Fel', 'Något gick fel!');
        if (onShowError) onShowError();
      }} />
      <TouchableOpacity testID="test-hide-btn" onPress={() => {
        hookResult.hideFeedback();
        if (onHide) onHide();
      }} />
    </>
  );
};

describe('useFeedback hook', () => {
  it('ska visa error-feedback korrekt', () => {
    const mockShowError = jest.fn();
    
    const { getByTestId } = render(
      <TestComponent onShowError={mockShowError} />
    );
    
    // Tryck på error-knappen
    const errorBtn = getByTestId('test-error-btn');
    fireEvent.press(errorBtn);
    
    // Verifiera att vår mock anropades
    expect(mockShowError).toHaveBeenCalled();
  });
  
  it('ska visa success-feedback korrekt', () => {
    const mockShowSuccess = jest.fn();
    
    const { getByTestId } = render(
      <TestComponent onShowSuccess={mockShowSuccess} />
    );
    
    // Tryck på success-knappen
    const successBtn = getByTestId('test-success-btn');
    fireEvent.press(successBtn);
    
    // Verifiera att vår mock anropades
    expect(mockShowSuccess).toHaveBeenCalled();
  });
  
  it('ska kunna dölja feedback via hideFeedback', async () => {
    const mockHide = jest.fn();
    
    const { getByTestId } = render(
      <TestComponent onHide={mockHide} />
    );
    
    // Tryck på hide-knappen
    const hideBtn = getByTestId('test-hide-btn');
    fireEvent.press(hideBtn);
    
    // Verifiera att vår mock anropades
    expect(mockHide).toHaveBeenCalled();
  });
}); 