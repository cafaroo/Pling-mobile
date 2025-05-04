import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { TeamForm } from '../TeamForm';
import { renderWithProviders } from './test-utils.jsx';
import Toast from 'react-native-toast-message';

jest.mock('react-native-toast-message', () => ({
  show: jest.fn()
}));

describe('TeamForm', () => {
  const mockOnSubmit = jest.fn();
  
  beforeEach(() => {
    mockOnSubmit.mockClear();
    Toast.show.mockClear();
  });
  
  it('renderar formuläret korrekt', () => {
    const { getByTestId, getByText } = renderWithProviders(
      <TeamForm
        onSubmit={mockOnSubmit}
        submitLabel="Skapa team"
      />
    );
    
    expect(getByTestId('team-form')).toBeTruthy();
    expect(getByText('Skapa team')).toBeTruthy();
  });
  
  it('uppdaterar namn-fältet korrekt', () => {
    const { getByTestId } = renderWithProviders(
      <TeamForm
        onSubmit={mockOnSubmit}
        submitLabel="Skapa team"
      />
    );
    
    const nameInput = getByTestId('team-name-input');
    fireEvent.changeText(nameInput, 'Nytt teamnamn');
    
    expect(nameInput.props.value).toBe('Nytt teamnamn');
  });
  
  it('validerar obligatoriska fält', async () => {
    const { getByTestId, getByText } = renderWithProviders(
      <TeamForm
        onSubmit={mockOnSubmit}
        submitLabel="Skapa team"
      />
    );
    
    const submitButton = getByText('Skapa team');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error'
        })
      );
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
  
  it('hanterar giltigt formulär', async () => {
    const { getByTestId, getByText } = renderWithProviders(
      <TeamForm
        onSubmit={mockOnSubmit}
        submitLabel="Skapa team"
      />
    );
    
    const nameInput = getByTestId('team-name-input');
    fireEvent.changeText(nameInput, 'Nytt teamnamn');
    
    const descriptionInput = getByTestId('team-description-input');
    fireEvent.changeText(descriptionInput, 'En beskrivning');
    
    const submitButton = getByText('Skapa team');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Nytt teamnamn',
          description: 'En beskrivning'
        })
      );
    });
  });
  
  it('hanterar initialValues korrekt', () => {
    const initialValues = {
      name: 'Existerande team',
      description: 'Befintlig beskrivning',
      is_private: true
    };
    
    const { getByTestId } = renderWithProviders(
      <TeamForm
        onSubmit={mockOnSubmit}
        submitLabel="Uppdatera team"
        initialValues={initialValues}
      />
    );
    
    const nameInput = getByTestId('team-name-input');
    const descriptionInput = getByTestId('team-description-input');
    
    expect(nameInput.props.value).toBe('Existerande team');
    expect(descriptionInput.props.value).toBe('Befintlig beskrivning');
  });
}); 