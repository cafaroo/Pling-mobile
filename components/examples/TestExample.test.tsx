/**
 * Exempeltestfil som visar hur man använder testutils
 */
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { renderWithProviders, mockNavigation } from '../../src/test-utils';

// Enkel exempelkomponent
const ExampleComponent = ({ onPress, title, navigation }: any) => {
  return React.createElement(
    TouchableOpacity,
    {
      testID: "example-button",
      onPress: () => {
        onPress?.();
        navigation?.navigate('Details');
      }
    },
    React.createElement(Text, null, title || 'Default Titel')
  );
};

describe('ExampleComponent', () => {
  it('renderar med standardtitel när ingen titel ges', () => {
    const { getByText } = renderWithProviders(
      React.createElement(ExampleComponent, null)
    );
    expect(getByText('Default Titel')).toBeTruthy();
  });

  it('renderar med angiven titel', () => {
    const { getByText } = renderWithProviders(
      React.createElement(ExampleComponent, { title: "Testknapp" })
    );
    expect(getByText('Testknapp')).toBeTruthy();
  });

  it('anropar onPress när den trycks på', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      React.createElement(ExampleComponent, { onPress: mockOnPress })
    );
    
    const button = getByTestId('example-button');
    button.props.onPress();
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('navigerar till Details när den trycks på', () => {
    const mockNavigate = jest.fn();
    const navigation = mockNavigation(mockNavigate);
    
    const { getByTestId } = renderWithProviders(
      React.createElement(ExampleComponent, { navigation })
    );
    
    const button = getByTestId('example-button');
    button.props.onPress();
    
    expect(mockNavigate).toHaveBeenCalledWith('Details');
  });
}); 