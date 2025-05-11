import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { InviteUserForm } from '../InviteUserForm';
import { useOrganization } from '../OrganizationProvider';

// Mocka useOrganization-hook direkt
jest.mock('../OrganizationProvider', () => ({
  useOrganization: jest.fn()
}));

describe('InviteUserForm', () => {
  // Standardmock för useOrganization-hook
  const mockOrganizationHook = {
    inviteUserToOrganization: jest.fn().mockResolvedValue({ success: true }),
    // Lägg till andra egenskaper som används av komponenten
    organizations: [],
    userInvitations: [],
    loadingOrganizations: false,
    loadingInvitations: false,
    createOrganization: jest.fn(),
    selectedOrganization: null,
    selectOrganization: jest.fn(),
    members: [],
    loadingMembers: false,
    fetchMembers: jest.fn(),
    removeMember: jest.fn(),
    acceptInvitation: jest.fn(),
    declineInvitation: jest.fn()
  };

  // Testdata
  const testOrganizationId = 'test-org-id';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Återställ mock av useOrganization med standardvärden
    (useOrganization as jest.Mock).mockReturnValue({
      ...mockOrganizationHook
    });
  });
  
  // Hjälpfunktion för att ställa in mockat värde för ett test
  const mockUseOrganization = (mockValues: Partial<typeof mockOrganizationHook>) => {
    (useOrganization as jest.Mock).mockReturnValue({
      ...mockOrganizationHook,
      ...mockValues
    });
  };
  
  it('ska visa formuläret korrekt', () => {
    // Agera
    const { getByText, getByPlaceholderText } = render(<InviteUserForm organizationId={testOrganizationId} />);
    
    // Kontrollera
    expect(getByText('Bjud in användare')).toBeTruthy();
    expect(getByPlaceholderText('Ange e-postadress')).toBeTruthy();
    expect(getByText('Bjud in')).toBeTruthy();
  });
  
  it('ska hantera inmatning av e-post', () => {
    // Agera
    const { getByPlaceholderText } = render(<InviteUserForm organizationId={testOrganizationId} />);
    const emailInput = getByPlaceholderText('Ange e-postadress');
    
    fireEvent.changeText(emailInput, 'test@exempel.se');
    
    // Kontrollera
    expect((emailInput as any).props.value).toBe('test@exempel.se');
  });
  
  it('ska anropa inviteUserToOrganization när formuläret skickas', async () => {
    // Arrangera
    const mockInviteUser = jest.fn().mockResolvedValue({ success: true });
    mockUseOrganization({ inviteUserToOrganization: mockInviteUser });
    
    // Agera
    const { getByPlaceholderText, getByText } = render(<InviteUserForm organizationId={testOrganizationId} />);
    
    const emailInput = getByPlaceholderText('Ange e-postadress');
    fireEvent.changeText(emailInput, 'test@exempel.se');
    
    const submitButton = getByText('Bjud in');
    fireEvent.press(submitButton);
    
    // Kontrollera
    await waitFor(() => {
      expect(mockInviteUser).toHaveBeenCalledWith(
        testOrganizationId, 
        'test@exempel.se', 
        'test@exempel.se'
      );
    });
  });
  
  it('ska visa ett felmeddelande vid ogiltig e-postadress', async () => {
    // Agera
    const { getByPlaceholderText, getByText, findByText } = render(<InviteUserForm organizationId={testOrganizationId} />);
    
    const emailInput = getByPlaceholderText('Ange e-postadress');
    fireEvent.changeText(emailInput, 'ogiltigt-format');
    
    const submitButton = getByText('Bjud in');
    fireEvent.press(submitButton);
    
    // Kontrollera
    await findByText('Vänligen ange en giltig e-postadress');
    expect(mockOrganizationHook.inviteUserToOrganization).not.toHaveBeenCalled();
  });
  
  it('ska visa ett felmeddelande om inviteUserToOrganization misslyckas', async () => {
    // Arrangera
    const mockInviteUser = jest.fn().mockResolvedValue({ 
      success: false, 
      error: 'Användaren är redan inbjuden' 
    });
    mockUseOrganization({ inviteUserToOrganization: mockInviteUser });
    
    // Agera
    const { getByPlaceholderText, getByText, findByText } = render(<InviteUserForm organizationId={testOrganizationId} />);
    
    const emailInput = getByPlaceholderText('Ange e-postadress');
    fireEvent.changeText(emailInput, 'test@exempel.se');
    
    const submitButton = getByText('Bjud in');
    fireEvent.press(submitButton);
    
    // Kontrollera
    await findByText('Användaren är redan inbjuden');
    expect(mockInviteUser).toHaveBeenCalledWith(
      testOrganizationId, 
      'test@exempel.se', 
      'test@exempel.se'
    );
  });
  
  it('ska visa ett bekräftelsemeddelande när inbjudan skickas', async () => {
    // Arrangera
    const mockInviteUser = jest.fn().mockResolvedValue({ success: true });
    mockUseOrganization({ inviteUserToOrganization: mockInviteUser });
    
    // Agera
    const { getByPlaceholderText, getByText, queryByText } = render(<InviteUserForm organizationId={testOrganizationId} />);
    
    const emailInput = getByPlaceholderText('Ange e-postadress');
    fireEvent.changeText(emailInput, 'test@exempel.se');
    
    const submitButton = getByText('Bjud in');
    fireEvent.press(submitButton);
    
    // Kontrollera
    await waitFor(() => {
      expect(mockInviteUser).toHaveBeenCalledWith(
        testOrganizationId, 
        'test@exempel.se', 
        'test@exempel.se'
      );
      // Efter framgångsrik inbjudan bör formuläret återställas
      expect((emailInput as any).props.value).toBe('');
    });
  });
  
  it('ska anropa onSuccess när inbjudan skickas', async () => {
    // Arrangera
    const mockInviteUser = jest.fn().mockResolvedValue({ success: true });
    mockUseOrganization({ inviteUserToOrganization: mockInviteUser });
    
    const mockOnSuccess = jest.fn();
    
    // Agera
    const { getByPlaceholderText, getByText } = render(
      <InviteUserForm organizationId={testOrganizationId} onSuccess={mockOnSuccess} />
    );
    
    const emailInput = getByPlaceholderText('Ange e-postadress');
    fireEvent.changeText(emailInput, 'test@exempel.se');
    
    const submitButton = getByText('Bjud in');
    fireEvent.press(submitButton);
    
    // Kontrollera
    await waitFor(() => {
      expect(mockInviteUser).toHaveBeenCalledWith(
        testOrganizationId, 
        'test@exempel.se', 
        'test@exempel.se'
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
}); 