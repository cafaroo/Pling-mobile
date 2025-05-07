import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { UserFeedback, FeedbackType, useFeedback } from '../UserFeedback';

// Mock av Portal-komponenten från react-native-paper
jest.mock('react-native-paper', () => {
  const RealModule = jest.requireActual('react-native-paper');
  const mockComponent = (name) => {
    const component = ({ children, ...props }) => {
      return React.createElement('mock-' + name.toLowerCase(), props, children);
    };
    component.displayName = name;
    return component;
  };
  
  return {
    ...RealModule,
    Portal: ({ children }) => children,
    Modal: ({ children, visible, ...props }) => visible ? children : null,
    Surface: mockComponent('Surface'),
    IconButton: mockComponent('IconButton'),
    Button: mockComponent('Button'),
    Text: ({ children, ...props }) => React.createElement('mock-text', props, children),
    useTheme: () => ({
      colors: {
        primary: '#2196F3',
        secondary: '#9C27B0',
        error: '#F44336'
      }
    })
  };
});

// Mock av MaterialCommunityIcons från @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: ({ name, size, color, ...props }) => 
    React.createElement('mock-icon', { 'data-name': name, 'data-size': size, 'data-color': color, ...props })
}));

// Mock timer
jest.useFakeTimers();

describe('UserFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });
  
  it('ska visa feedback när visible är true', () => {
    const { getByText } = render(
      <UserFeedback
        visible={true}
        type={FeedbackType.SUCCESS}
        title="Test titel"
        message="Test meddelande"
      />
    );
    
    expect(getByText('Test titel')).toBeTruthy();
    expect(getByText('Test meddelande')).toBeTruthy();
  });
  
  it('ska inte visa feedback när visible är false', () => {
    const { queryByText } = render(
      <UserFeedback
        visible={false}
        type={FeedbackType.SUCCESS}
        title="Test titel"
        message="Test meddelande"
      />
    );
    
    expect(queryByText('Test titel')).toBeNull();
    expect(queryByText('Test meddelande')).toBeNull();
  });
  
  it('ska anropa onDismiss när feedback stängs', () => {
    const onDismissMock = jest.fn();
    
    const { UNSAFE_getByType } = render(
      <UserFeedback
        visible={true}
        type={FeedbackType.SUCCESS}
        title="Test titel"
        message="Test meddelande"
        onDismiss={onDismissMock}
      />
    );
    
    // Hitta stängknappen med mock-typen och simulera klick
    const closeButton = UNSAFE_getByType('mock-iconbutton');
    fireEvent.press(closeButton);
    
    // Fast-forward alla timers för att köra klart animationen
    act(() => {
      jest.runAllTimers();
    });
    
    expect(onDismissMock).toHaveBeenCalled();
  });
  
  it('ska dölja feedback automatiskt efter timeout för success', () => {
    const onDismissMock = jest.fn();
    
    render(
      <UserFeedback
        visible={true}
        type={FeedbackType.SUCCESS}
        title="Test titel"
        message="Test meddelande"
        onDismiss={onDismissMock}
      />
    );
    
    // Fast-forward timer till efter den automatiska döljtiden (3000ms + lite extra för animation)
    act(() => {
      jest.advanceTimersByTime(3500);
    });
    
    expect(onDismissMock).toHaveBeenCalled();
  });
  
  it('ska visa retry-knapp endast för error typ', () => {
    const onRetryMock = jest.fn();
    
    // Med error-typ
    const { UNSAFE_getAllByType: errorGetAllByType } = render(
      <UserFeedback
        visible={true}
        type={FeedbackType.ERROR}
        title="Test fel"
        message="Något gick fel"
        onRetry={onRetryMock}
      />
    );
    
    // Hitta alla iconbuttons (bör finnas 2 - stäng och retry)
    const errorButtons = errorGetAllByType('mock-iconbutton');
    expect(errorButtons.length).toBe(2);
    
    // Med success-typ
    const { UNSAFE_getAllByType: successGetAllByType } = render(
      <UserFeedback
        visible={true}
        type={FeedbackType.SUCCESS}
        title="Test success"
        message="Allt gick bra"
        onRetry={onRetryMock}
      />
    );
    
    // Hitta alla iconbuttons (bör finnas 1 - bara stäng)
    const successButtons = successGetAllByType('mock-iconbutton');
    expect(successButtons.length).toBe(1);
  });
});

describe('useFeedback hook', () => {
  it('ska visa error-feedback korrekt', () => {
    const TestComponent = () => {
      const { FeedbackComponent, showError } = useFeedback();
      
      return (
        <>
          <FeedbackComponent />
          <mock-button testID="error-button" onPress={() => showError('Ett fel', 'Något gick fel')} />
        </>
      );
    };
    
    const { getByTestId, queryByText, getByText } = render(<TestComponent />);
    
    // Inget meddelande syns från början
    expect(queryByText('Ett fel')).toBeNull();
    
    // Tryck på knappen för att visa felet
    fireEvent.press(getByTestId('error-button'));
    
    // Nu ska felmeddelandet synas
    expect(getByText('Ett fel')).toBeTruthy();
    expect(getByText('Något gick fel')).toBeTruthy();
  });
  
  it('ska visa success-feedback korrekt', () => {
    const TestComponent = () => {
      const { FeedbackComponent, showSuccess } = useFeedback();
      
      return (
        <>
          <FeedbackComponent />
          <mock-button testID="success-button" onPress={() => showSuccess('Succé', 'Operationen lyckades')} />
        </>
      );
    };
    
    const { getByTestId, queryByText, getByText } = render(<TestComponent />);
    
    // Inget meddelande syns från början
    expect(queryByText('Succé')).toBeNull();
    
    // Tryck på knappen för att visa succé
    fireEvent.press(getByTestId('success-button'));
    
    // Nu ska meddelandet synas
    expect(getByText('Succé')).toBeTruthy();
    expect(getByText('Operationen lyckades')).toBeTruthy();
  });
  
  it('ska kunna dölja feedback via hideFeedback', async () => {
    const TestComponent = () => {
      const { FeedbackComponent, showInfo, hideFeedback } = useFeedback();
      
      return (
        <>
          <FeedbackComponent />
          <mock-button testID="show-button" onPress={() => showInfo('Info', 'Information')} />
          <mock-button testID="hide-button" onPress={hideFeedback} />
        </>
      );
    };
    
    const { getByTestId, queryByText, getByText } = render(<TestComponent />);
    
    // Visa info
    fireEvent.press(getByTestId('show-button'));
    expect(getByText('Info')).toBeTruthy();
    
    // Tryck på hide-knappen
    fireEvent.press(getByTestId('hide-button'));
    
    // Fast-forward alla timers för att köra klart animationen
    act(() => {
      jest.runAllTimers();
    });
    
    // Efter animation bör komponenten vara borta från DOM
    await waitFor(() => {
      expect(queryByText('Info')).toBeNull();
    });
  });
}); 