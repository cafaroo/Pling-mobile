import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MemberCardPresentation } from '../MemberCardPresentation';

describe('MemberCardPresentation', () => {
  const defaultProps = {
    displayName: 'Test User',
    memberSince: '2023-01-01',
    memberRole: 'member',
    isAdmin: true,
    showRoleOptions: false,
    roles: [
      { id: 'admin', label: 'Admin' },
      { id: 'member', label: 'Medlem' }
    ],
    onRoleChange: jest.fn(),
    onToggleRoleOptions: jest.fn(),
    onRemove: jest.fn()
  };

  it('renderar användarinformation korrekt', () => {
    const { getByText } = render(<MemberCardPresentation {...defaultProps} />);
    
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('Medlem sedan: 2023-01-01')).toBeTruthy();
    expect(getByText('Medlem')).toBeTruthy();
  });

  it('visar admin-roll korrekt', () => {
    const props = { ...defaultProps, memberRole: 'admin' };
    const { getByText } = render(<MemberCardPresentation {...props} />);
    
    expect(getByText('Admin')).toBeTruthy();
  });

  it('visar rollvalsalternativ när showRoleOptions är true', () => {
    const props = { ...defaultProps, showRoleOptions: true };
    const { getByText } = render(<MemberCardPresentation {...props} />);
    
    // Borde visa rollalternativen
    expect(getByText('Admin')).toBeTruthy();
    expect(getByText('Medlem')).toBeTruthy();
  });

  it('döljer ta bort-knappen för icke-administratörer', () => {
    const props = { ...defaultProps, isAdmin: false };
    const { queryByText } = render(<MemberCardPresentation {...props} />);
    
    expect(queryByText('Ta bort')).toBeNull();
  });

  it('anropar onToggleRoleOptions vid klick på Ändra-knappen', () => {
    const { getByText } = render(<MemberCardPresentation {...defaultProps} />);
    
    fireEvent.press(getByText('Ändra'));
    expect(defaultProps.onToggleRoleOptions).toHaveBeenCalledTimes(1);
  });

  it('anropar onRoleChange med korrekt roll vid val av roll', () => {
    const props = { ...defaultProps, showRoleOptions: true };
    const { getByText } = render(<MemberCardPresentation {...props} />);
    
    fireEvent.press(getByText('Admin'));
    expect(props.onRoleChange).toHaveBeenCalledWith('admin');
  });

  it('anropar onRemove vid klick på Ta bort-knappen', () => {
    const { getByText } = render(<MemberCardPresentation {...defaultProps} />);
    
    fireEvent.press(getByText('Ta bort'));
    expect(defaultProps.onRemove).toHaveBeenCalledTimes(1);
  });
}); 