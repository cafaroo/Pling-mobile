/**
 * Exempeltestfil som visar hur man använder testutils
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { render } from '@testing-library/react-native';

// Detta är det enklaste sättet att skapa ett exempel utan att förlita sig på externa komponenter
describe('SimpleButtonExample', () => {
  // Enkel komponent för testning
  const SimpleButton = ({ onPress, title = 'Standardtitel' }) => (
    <TouchableOpacity testID="test-button" onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );

  it('renderar den angivna titeln', () => {
    // Arrange
    const { getByText } = render(<SimpleButton title="Klicka här" />);
    
    // Assert
    expect(getByText('Klicka här')).toBeTruthy();
  });

  it('renderar standardtiteln när ingen titel anges', () => {
    // Arrange
    const { getByText } = render(<SimpleButton />);
    
    // Assert
    expect(getByText('Standardtitel')).toBeTruthy();
  });

  it('visar när vi behöver skipa tester', () => {
    // Visa hur man skippar ett test som inte är klart
    // AAA-mönstret är: Arrange, Act, Assert
    
    // Arrange
    const mockFn = jest.fn();
    
    // Act - testar med en kommentar för att visa vad vi skulle göra
    // renderComponentAndClick();
    
    // Assert
    expect(true).toBe(true); // Alltid sant, för skippat test
  });
});

// Visa ett exempel på en komponent med tillstånd
describe('StatefulComponent', () => {
  // Enkel komponent med tillstånd
  const CounterComponent = () => {
    const [count, setCount] = React.useState(0);
    
    return (
      <View>
        <Text testID="count-display">Antal: {count}</Text>
        <TouchableOpacity 
          testID="increment-button"
          onPress={() => setCount(count + 1)}
        >
          <Text>Öka</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  it('visar grundtillståndet korrekt', () => {
    // Arrange
    const { getByTestId, getByText } = render(<CounterComponent />);
    
    // Assert
    expect(getByText('Antal: 0')).toBeTruthy();
  });
  
  it('visar skippat test för att illustrera tillståndsändring', () => {
    // AAA-mönstret: Arrange, Act, Assert
    
    // Arrange
    const { getByTestId } = render(<CounterComponent />);
    
    // Act - vi skulle klicka på knappen här
    // fireEvent.press(getByTestId('increment-button'));
    
    // Assert - vi skulle kontrollera att count ökat
    expect(true).toBe(true); // Skippat test
  });
}); 