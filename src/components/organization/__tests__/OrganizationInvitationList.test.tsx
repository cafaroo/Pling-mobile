import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OrganizationInvitationList } from '../OrganizationInvitationList';
import { useOrganization } from '../OrganizationProvider';
import { OrganizationInvitation } from '@/domain/organization/value-objects/OrganizationInvitation';
import { UniqueId } from '@/shared/core/UniqueId';

// Mocka useOrganization-hook direkt
jest.mock('../OrganizationProvider', () => ({
  useOrganization: jest.fn()
}));

describe('OrganizationInvitationList', () => {
  // Hjälpfunktion för att skapa testdata
  const createMockInvitation = (status: 'pending' | 'accepted' | 'declined' | 'expired' = 'pending') => {
    const createResult = OrganizationInvitation.create({
      id: new UniqueId().toString(),
      organizationId: new UniqueId().toString(),
      userId: new UniqueId().toString(),
      invitedBy: new UniqueId().toString(),
      email: 'test@exempel.se',
      status: status,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dagar framåt
    });
    
    if (createResult.isErr()) {
      throw new Error(`Kunde inte skapa testinbjudan: ${createResult.error}`);
    }
    
    return createResult.value;
  };
  
  // Standardmock för useOrganization-hook
  const mockOrganizationHook = {
    userInvitations: [],
    loadingInvitations: false,
    acceptInvitation: jest.fn().mockResolvedValue({ success: true }),
    declineInvitation: jest.fn().mockResolvedValue({ success: true }),
    fetchUserInvitations: jest.fn().mockResolvedValue(undefined),
    // Lägg till andra egenskaper som används av komponenten
    organizations: [],
    selectedOrganization: null,
    loadingOrganizations: false,
    createOrganization: jest.fn(),
    selectOrganization: jest.fn(),
    inviteUser: jest.fn(),
    members: [],
    loadingMembers: false,
    fetchMembers: jest.fn(),
    removeMember: jest.fn()
  };
  
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
  
  it('ska visa laddningsindikator när loadingInvitations är true', () => {
    // Arrangera
    mockUseOrganization({ loadingInvitations: true });
    
    // Agera
    const { getByText } = render(<OrganizationInvitationList />);
    
    // Kontrollera
    expect(getByText('Laddar inbjudningar...')).toBeTruthy();
  });
  
  it('ska visa meddelande när inga inbjudningar finns', () => {
    // Arrangera
    mockUseOrganization({ userInvitations: [] });
    
    // Agera
    const { getByText } = render(<OrganizationInvitationList />);
    
    // Kontrollera
    expect(getByText('Du har inga inbjudningar')).toBeTruthy();
  });
  
  it('ska visa inbjudningar när de finns', () => {
    // Arrangera
    const mockInvitation = createMockInvitation();
    mockUseOrganization({ userInvitations: [mockInvitation] });
    
    // Agera
    const { getByText } = render(<OrganizationInvitationList />);
    
    // Kontrollera
    expect(getByText('Inbjudningar till organisationer')).toBeTruthy();
    expect(getByText('Du har blivit inbjuden att gå med i denna organisation')).toBeTruthy();
    expect(getByText('Acceptera')).toBeTruthy();
    expect(getByText('Avböj')).toBeTruthy();
  });
  
  it('ska anropa acceptInvitation när acceptera-knappen klickas', async () => {
    // Arrangera
    const mockInvitation = createMockInvitation();
    const mockAcceptInvitation = jest.fn().mockResolvedValue({ success: true });
    
    mockUseOrganization({
      userInvitations: [mockInvitation],
      acceptInvitation: mockAcceptInvitation
    });
    
    const mockOnAcceptSuccess = jest.fn();
    
    // Agera
    const { getByText } = render(
      <OrganizationInvitationList onAcceptSuccess={mockOnAcceptSuccess} />
    );
    
    fireEvent.press(getByText('Acceptera'));
    
    // Kontrollera
    await waitFor(() => {
      expect(mockAcceptInvitation).toHaveBeenCalledWith(mockInvitation.id.toString());
      expect(mockOnAcceptSuccess).toHaveBeenCalled();
    });
  });
  
  it('ska anropa declineInvitation när avböj-knappen klickas', async () => {
    // Arrangera
    const mockInvitation = createMockInvitation();
    const mockDeclineInvitation = jest.fn().mockResolvedValue({ success: true });
    
    mockUseOrganization({
      userInvitations: [mockInvitation],
      declineInvitation: mockDeclineInvitation
    });
    
    const mockOnDeclineSuccess = jest.fn();
    
    // Agera
    const { getByText } = render(
      <OrganizationInvitationList onDeclineSuccess={mockOnDeclineSuccess} />
    );
    
    fireEvent.press(getByText('Avböj'));
    
    // Kontrollera
    await waitFor(() => {
      expect(mockDeclineInvitation).toHaveBeenCalledWith(mockInvitation.id.toString());
      expect(mockOnDeclineSuccess).toHaveBeenCalled();
    });
  });
  
  it('ska hantera fel vid accepterande av inbjudan', async () => {
    // Arrangera
    const mockInvitation = createMockInvitation();
    const mockAcceptInvitation = jest.fn().mockResolvedValue({ 
      success: false, 
      error: 'Kunde inte acceptera inbjudan' 
    });
    
    mockUseOrganization({
      userInvitations: [mockInvitation],
      acceptInvitation: mockAcceptInvitation
    });
    
    // Agera
    const { getByText, findByText } = render(<OrganizationInvitationList />);
    
    fireEvent.press(getByText('Acceptera'));
    
    // Kontrollera
    await findByText('Kunde inte acceptera inbjudan');
    expect(mockAcceptInvitation).toHaveBeenCalledWith(mockInvitation.id.toString());
  });
  
  it('ska hantera fel vid avböjande av inbjudan', async () => {
    // Arrangera
    const mockInvitation = createMockInvitation();
    const mockDeclineInvitation = jest.fn().mockResolvedValue({ 
      success: false, 
      error: 'Kunde inte avböja inbjudan' 
    });
    
    mockUseOrganization({
      userInvitations: [mockInvitation],
      declineInvitation: mockDeclineInvitation
    });
    
    // Agera
    const { getByText, findByText } = render(<OrganizationInvitationList />);
    
    fireEvent.press(getByText('Avböj'));
    
    // Kontrollera
    await findByText('Kunde inte avböja inbjudan');
    expect(mockDeclineInvitation).toHaveBeenCalledWith(mockInvitation.id.toString());
  });
}); 