import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AddMemberFormPresentation } from '../AddMemberFormPresentation';

describe('AddMemberFormPresentation', () => {
  const defaultProps = {
    userId: '',
    role: 'member',
    error: null,
    isLoading: false,
    progress: null,
    onUserIdChange: jest.fn(),
    onRoleChange: jest.fn(),
    onSubmit: jest.fn(),
  };

  it('renderar formuläret korrekt', () => {
    const { getByText, getByPlaceholderText } = render(
      <AddMemberFormPresentation {...defaultProps} />
    );
    
    expect(getByText('Lägg till ny medlem')).toBeTruthy();
    expect(getByText('Användare-ID:')).toBeTruthy();
    expect(getByText('Roll:')).toBeTruthy();
    expect(getByPlaceholderText('Ange användar-ID')).toBeTruthy();
    expect(getByText('Lägg till medlem')).toBeTruthy();
  });

  it('visar felmeddelande när det finns ett fel', () => {
    const props = { ...defaultProps, error: 'Testfel' };
    const { getByText } = render(<AddMemberFormPresentation {...props} />);
    
    expect(getByText('Testfel')).toBeTruthy();
  });

  it('anropar onUserIdChange när användar-ID ändras', () => {
    const { getByPlaceholderText } = render(
      <AddMemberFormPresentation {...defaultProps} />
    );
    
    const input = getByPlaceholderText('Ange användar-ID');
    fireEvent.changeText(input, 'testuser');
    
    expect(defaultProps.onUserIdChange).toHaveBeenCalledWith('testuser');
  });

  it('anropar onRoleChange när rollen ändras', () => {
    const { getByText } = render(<AddMemberFormPresentation {...defaultProps} />);
    
    fireEvent.press(getByText('Admin'));
    
    expect(defaultProps.onRoleChange).toHaveBeenCalledWith('admin');
  });

  it('anropar onSubmit när formuläret skickas', () => {
    const { getByText } = render(<AddMemberFormPresentation {...defaultProps} />);
    
    fireEvent.press(getByText('Lägg till medlem'));
    
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it('visar laddningsindikator när isLoading är true', () => {
    const progress = { message: 'Laddar...', percent: 50 };
    const props = { ...defaultProps, isLoading: true, progress };
    
    const { getByText } = render(<AddMemberFormPresentation {...props} />);
    
    expect(getByText('Laddar...')).toBeTruthy();
    expect(getByText('Lägger till...')).toBeTruthy(); // Text på submit-knappen
  });

  it('inaktiverar input och knappar när isLoading är true', () => {
    const props = { ...defaultProps, isLoading: true, progress: { percent: 50 } };
    const { getByText, getByPlaceholderText } = render(
      <AddMemberFormPresentation {...props} />
    );
    
    const input = getByPlaceholderText('Ange användar-ID');
    const submitButton = getByText('Lägger till...');
    
    expect(input.props.editable).toBe(false);
    expect(submitButton.props.disabled).toBe(true);
  });
}); 