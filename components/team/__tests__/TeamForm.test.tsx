import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TeamForm from '../TeamForm';
import { ThemeProvider } from '@/context/ThemeContext';

const mockOnSubmit = jest.fn();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('TeamForm', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renderar formuläret korrekt', () => {
    const { getByText, getByPlaceholderText } = renderWithTheme(
      <TeamForm
        onSubmit={mockOnSubmit}
        submitLabel="Skapa team"
      />
    );

    expect(getByPlaceholderText('Ange teamets namn')).toBeTruthy();
    expect(getByText('Skapa team')).toBeTruthy();
  });

  it('visar felmeddelande när formuläret skickas utan namn', () => {
    const { getByText } = renderWithTheme(
      <TeamForm
        onSubmit={mockOnSubmit}
        submitLabel="Skapa team"
      />
    );

    fireEvent.press(getByText('Skapa team'));
    expect(getByText('Ange ett teamnamn')).toBeTruthy();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('anropar onSubmit med korrekt data när formuläret är giltigt', async () => {
    const { getByText, getByPlaceholderText } = renderWithTheme(
      <TeamForm
        onSubmit={mockOnSubmit}
        submitLabel="Skapa team"
      />
    );

    const input = getByPlaceholderText('Ange teamets namn');
    fireEvent.changeText(input, 'Mitt testteam');
    fireEvent.press(getByText('Skapa team'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('Mitt testteam');
    });
  });

  it('trimmar whitespace från teamnamnet', async () => {
    const { getByText, getByPlaceholderText } = renderWithTheme(
      <TeamForm
        onSubmit={mockOnSubmit}
        submitLabel="Skapa team"
      />
    );

    const input = getByPlaceholderText('Ange teamets namn');
    fireEvent.changeText(input, '  Mitt testteam  ');
    fireEvent.press(getByText('Skapa team'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('Mitt testteam');
    });
  });

  it('renderar med initialValues', () => {
    const { getByPlaceholderText } = renderWithTheme(
      <TeamForm
        onSubmit={mockOnSubmit}
        submitLabel="Uppdatera team"
        initialValues={{ name: 'Existerande team' }}
      />
    );

    const input = getByPlaceholderText('Ange teamets namn');
    expect(input.props.value).toBe('Existerande team');
  });
}); 