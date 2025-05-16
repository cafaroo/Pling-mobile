import React from 'react';
import { fireEvent, act, waitFor } from '@testing-library/react-native';
import { TeamMembersScreenContainer } from '../TeamMembersScreenContainer';
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { UITestHelper } from '@/test-utils/helpers/UITestHelper';
import { Result } from '@/shared/core/Result';

// Mock beroenden
jest.mock('@/application/team/hooks/useTeamWithStandardHook');
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ teamId: 'team-123' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));

// Mock React Native komponenter
jest.mock('react-native-paper', () => ({
  ActivityIndicator: () => <div data-testid="loading-indicator" />,
  Button: ({ onPress, children, testID, disabled }: any) => (
    <button data-testid={testID || `button-${children}`} onClick={onPress} disabled={disabled}>
      {children}
    </button>
  ),
  Dialog: {
    Title: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
    Content: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
    Actions: ({ children }: any) => <div data-testid="dialog-actions">{children}</div>,
  },
  Dialog: ({ visible, children }: any) => visible ? <div data-testid="dialog">{children}</div> : null,
  IconButton: ({ icon, onPress, testID }: any) => (
    <button data-testid={testID || `icon-button-${icon}`} onClick={onPress}>
      {icon}
    </button>
  ),
  Text: ({ children, style, testID }: any) => <span data-testid={testID}>{children}</span>,
  TextInput: ({ label, value, onChangeText, testID }: any) => (
    <input 
      type="text" 
      placeholder={label} 
      value={value} 
      onChange={(e) => onChangeText(e.target.value)} 
      data-testid={testID}
    />
  ),
  Chip: ({ children, onPress, selected, testID }: any) => (
    <button 
      data-testid={testID || `chip-${children}`} 
      onClick={onPress}
      style={{ backgroundColor: selected ? 'blue' : 'gray' }}
    >
      {children}
    </button>
  ),
  Menu: {
    Item: ({ title, onPress, testID }: any) => (
      <div data-testid={testID || `menu-item-${title}`} onClick={onPress}>{title}</div>
    ),
  },
  FAB: ({ onPress, icon, testID }: any) => (
    <button data-testid={testID || 'fab-button'} onClick={onPress}>
      {icon}
    </button>
  ),
  Surface: ({ children, style }: any) => <div>{children}</div>,
  Divider: () => <hr />,
}));

// Mock FlatList
jest.mock('react-native', () => {
  const original = jest.requireActual('react-native');
  return {
    ...original,
    FlatList: ({ data, renderItem, keyExtractor, testID }: any) => (
      <div data-testid={testID || 'flat-list'}>
        {data?.map((item: any) => (
          <div key={keyExtractor ? keyExtractor(item) : item.id} data-testid={`member-item-${item.id}`}>
            {renderItem({ item })}
          </div>
        ))}
      </div>
    ),
  };
});

// Mock UI-komponenter
jest.mock('@/ui/components/Screen', () => ({
  Screen: ({ children }: any) => <>{children}</>,
}));

describe('TeamMembersScreen - Medlemshanteringsflöde', () => {
  // Testdata
  const mockTeamId = 'team-123';
  const mockTeam = UITestHelper.mockData.team();
  const mockMembers = UITestHelper.mockData.teamMembers(3);
  
  // Mock för hooks och funktioner
  const mockGetTeamMembers = jest.fn();
  const mockAddTeamMember = jest.fn().mockImplementation(() => Promise.resolve(Result.ok(true)));
  const mockRemoveTeamMember = jest.fn().mockImplementation(() => Promise.resolve(Result.ok(true)));
  const mockUpdateTeamMemberRole = jest.fn().mockImplementation(() => Promise.resolve(Result.ok(true)));
  
  // Setup för varje test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Konfigurera hook-returnvärde
    (useTeamWithStandardHook as jest.Mock).mockReturnValue({
      getTeamMembers: {
        data: mockMembers,
        isLoading: false,
        error: null,
        execute: mockGetTeamMembers,
      },
      addTeamMember: {
        isLoading: false,
        error: null,
        execute: mockAddTeamMember,
      },
      removeTeamMember: {
        isLoading: false,
        error: null,
        execute: mockRemoveTeamMember,
      },
      updateTeamMemberRole: {
        isLoading: false,
        error: null,
        execute: mockUpdateTeamMemberRole,
      },
      getTeam: {
        data: mockTeam,
        isLoading: false,
        error: null,
        execute: jest.fn(),
      },
    });
  });
  
  it('hämtar teammedlemmar vid montering', async () => {
    // Rendera componenten
    UITestHelper.renderWithQueryClient(<TeamMembersScreenContainer />);
    
    // Verifiera att getData anropas med rätt teamId
    expect(mockGetTeamMembers).toHaveBeenCalledWith({ teamId: mockTeamId });
  });
  
  it('visar medlemslistan med korrekt data', async () => {
    // Rendera componenten
    const { getAllByTestId, getByText } = UITestHelper.renderWithQueryClient(<TeamMembersScreenContainer />);
    
    // Verifiera att alla medlemmar visas
    const memberItems = getAllByTestId(/member-item/);
    expect(memberItems).toHaveLength(3);
    
    // Verifiera att medlemsnamnen visas
    mockMembers.forEach(member => {
      expect(getByText(member.name)).toBeTruthy();
    });
  });
  
  it('kan lägga till en ny teammedlem', async () => {
    // Rendera komponenten
    const { getByTestId, getByPlaceholderText, getByText } = UITestHelper.renderWithQueryClient(
      <TeamMembersScreenContainer />
    );
    
    // Öppna formuläret för att lägga till medlemmar
    const addButton = getByTestId('fab-button');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    // Verifiera att formuläret visas
    expect(getByTestId('add-member-form')).toBeTruthy();
    
    // Fyll i e-postadress för ny medlem
    const emailInput = getByPlaceholderText('E-post');
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'new-member@example.com' } });
    });
    
    // Välj roll (medlem)
    const roleSelect = getByTestId('role-select');
    await act(async () => {
      fireEvent.change(roleSelect, { target: { value: 'member' } });
    });
    
    // Klicka på "Lägg till"-knappen
    const submitButton = getByText('Lägg till');
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Verifiera att addTeamMember anropades med rätt parametrar
    await waitFor(() => {
      expect(mockAddTeamMember).toHaveBeenCalledWith({
        teamId: mockTeamId,
        email: 'new-member@example.com',
        role: 'member',
      });
    });
  });
  
  it('kan ta bort en teammedlem', async () => {
    // Rendera komponenten
    const { getByTestId, queryByTestId, getByText } = UITestHelper.renderWithQueryClient(
      <TeamMembersScreenContainer />
    );
    
    // Hitta och klicka på borttagningsknappen för den första medlemmen
    const memberToRemove = mockMembers[1]; // Välj en icke-admin medlem
    const removeButton = getByTestId(`remove-${memberToRemove.id}-button`);
    await act(async () => {
      fireEvent.click(removeButton);
    });
    
    // Verifiera att bekräftelsedialogen visas
    expect(getByTestId('dialog')).toBeTruthy();
    expect(getByText(/Ta bort medlem/)).toBeTruthy();
    
    // Klicka på bekräfta-knappen
    const confirmButton = getByText('Ta bort');
    await act(async () => {
      fireEvent.click(confirmButton);
    });
    
    // Verifiera att removeTeamMember anropades med rätt parametrar
    await waitFor(() => {
      expect(mockRemoveTeamMember).toHaveBeenCalledWith({
        teamId: mockTeamId,
        userId: memberToRemove.id,
      });
    });
    
    // Dialog bör ha försvunnit
    expect(queryByTestId('dialog')).toBeNull();
  });
  
  it('kan ändra en medlems roll', async () => {
    // Rendera komponenten
    const { getByTestId, getByText } = UITestHelper.renderWithQueryClient(
      <TeamMembersScreenContainer />
    );
    
    // Hitta och klicka på redigera-knappen för den första medlemmen
    const memberToEdit = mockMembers[1]; // Välj en icke-admin medlem
    const editButton = getByTestId(`edit-${memberToEdit.id}-button`);
    await act(async () => {
      fireEvent.click(editButton);
    });
    
    // Verifiera att rolleditering visas
    expect(getByTestId('dialog')).toBeTruthy();
    expect(getByText(/Ändra roll/)).toBeTruthy();
    
    // Välj admin-rollen
    const adminRoleButton = getByTestId('role-admin-button');
    await act(async () => {
      fireEvent.click(adminRoleButton);
    });
    
    // Klicka på spara-knappen
    const saveButton = getByText('Spara');
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    // Verifiera att updateTeamMemberRole anropades med rätt parametrar
    await waitFor(() => {
      expect(mockUpdateTeamMemberRole).toHaveBeenCalledWith({
        teamId: mockTeamId,
        userId: memberToEdit.id,
        role: 'admin',
      });
    });
  });
  
  it('visar felmeddelande om tillägg av medlem misslyckas', async () => {
    // Konfigurera mock för att returnera ett fel
    (useTeamWithStandardHook as jest.Mock).mockReturnValue({
      getTeamMembers: {
        data: mockMembers,
        isLoading: false,
        error: null,
        execute: mockGetTeamMembers,
      },
      addTeamMember: {
        isLoading: false,
        error: null,
        execute: jest.fn().mockImplementation(() => 
          Promise.resolve(Result.err(new Error('Användaren finns redan i teamet')))
        ),
      },
      removeTeamMember: {
        isLoading: false,
        error: null,
        execute: mockRemoveTeamMember,
      },
      updateTeamMemberRole: {
        isLoading: false,
        error: null,
        execute: mockUpdateTeamMemberRole,
      },
      getTeam: {
        data: mockTeam,
        isLoading: false,
        error: null,
        execute: jest.fn(),
      },
    });
    
    // Rendera komponenten
    const { getByTestId, getByPlaceholderText, getByText } = UITestHelper.renderWithQueryClient(
      <TeamMembersScreenContainer />
    );
    
    // Öppna formuläret för att lägga till medlemmar
    const addButton = getByTestId('fab-button');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    // Fyll i e-postadress för ny medlem
    const emailInput = getByPlaceholderText('E-post');
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'existing-member@example.com' } });
    });
    
    // Välj roll (medlem)
    const roleSelect = getByTestId('role-select');
    await act(async () => {
      fireEvent.change(roleSelect, { target: { value: 'member' } });
    });
    
    // Klicka på "Lägg till"-knappen
    const submitButton = getByText('Lägg till');
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Verifiera att felmeddelandet visas
    await waitFor(() => {
      expect(getByText('Användaren finns redan i teamet')).toBeTruthy();
    });
  });
  
  it('visar laddningstillstånd när medlemmar hämtas', async () => {
    // Konfigurera hook för laddningstillstånd
    (useTeamWithStandardHook as jest.Mock).mockReturnValue({
      getTeamMembers: {
        data: null,
        isLoading: true,
        error: null,
        execute: mockGetTeamMembers,
      },
      addTeamMember: {
        isLoading: false,
        error: null,
        execute: mockAddTeamMember,
      },
      removeTeamMember: {
        isLoading: false,
        error: null,
        execute: mockRemoveTeamMember,
      },
      updateTeamMemberRole: {
        isLoading: false,
        error: null,
        execute: mockUpdateTeamMemberRole,
      },
      getTeam: {
        data: mockTeam,
        isLoading: false,
        error: null,
        execute: jest.fn(),
      },
    });
    
    // Rendera komponenten
    const { getByTestId } = UITestHelper.renderWithQueryClient(<TeamMembersScreenContainer />);
    
    // Verifiera att laddningsindikator visas
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
  
  it('visar laddningstillstånd vid borttagning av medlem', async () => {
    // Konfigurera hook för laddningstillstånd vid borttagning
    (useTeamWithStandardHook as jest.Mock).mockReturnValue({
      getTeamMembers: {
        data: mockMembers,
        isLoading: false,
        error: null,
        execute: mockGetTeamMembers,
      },
      addTeamMember: {
        isLoading: false,
        error: null,
        execute: mockAddTeamMember,
      },
      removeTeamMember: {
        isLoading: true,
        error: null,
        execute: mockRemoveTeamMember,
      },
      updateTeamMemberRole: {
        isLoading: false,
        error: null,
        execute: mockUpdateTeamMemberRole,
      },
      getTeam: {
        data: mockTeam,
        isLoading: false,
        error: null,
        execute: jest.fn(),
      },
    });
    
    // Rendera komponenten
    const { getByTestId, getByText } = UITestHelper.renderWithQueryClient(<TeamMembersScreenContainer />);
    
    // Hitta och klicka på borttagningsknappen för den första medlemmen
    const memberToRemove = mockMembers[1];
    const removeButton = getByTestId(`remove-${memberToRemove.id}-button`);
    await act(async () => {
      fireEvent.click(removeButton);
    });
    
    // Klicka på bekräfta-knappen
    const confirmButton = getByText('Ta bort');
    await act(async () => {
      fireEvent.click(confirmButton);
    });
    
    // Verifiera att laddningsindikator visas
    expect(getByTestId('remove-loading-indicator')).toBeTruthy();
  });
  
  it('visar tomt tillstånd när inga medlemmar finns', async () => {
    // Konfigurera hook för tomt tillstånd
    (useTeamWithStandardHook as jest.Mock).mockReturnValue({
      getTeamMembers: {
        data: [],
        isLoading: false,
        error: null,
        execute: mockGetTeamMembers,
      },
      addTeamMember: {
        isLoading: false,
        error: null,
        execute: mockAddTeamMember,
      },
      removeTeamMember: {
        isLoading: false,
        error: null,
        execute: mockRemoveTeamMember,
      },
      updateTeamMemberRole: {
        isLoading: false,
        error: null,
        execute: mockUpdateTeamMemberRole,
      },
      getTeam: {
        data: mockTeam,
        isLoading: false,
        error: null,
        execute: jest.fn(),
      },
    });
    
    // Rendera komponenten
    const { getByTestId, getByText } = UITestHelper.renderWithQueryClient(<TeamMembersScreenContainer />);
    
    // Verifiera att tomt tillstånd visas
    expect(getByTestId('empty-state')).toBeTruthy();
    expect(getByText(/Inga medlemmar/)).toBeTruthy();
  });
  
  it('kan avbryta tillägg av medlem genom att stänga formuläret', async () => {
    // Rendera komponenten
    const { getByTestId, queryByTestId } = UITestHelper.renderWithQueryClient(<TeamMembersScreenContainer />);
    
    // Öppna formuläret för att lägga till medlemmar
    const addButton = getByTestId('fab-button');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    // Verifiera att formuläret visas
    expect(getByTestId('add-member-form')).toBeTruthy();
    
    // Klicka på stäng-knappen
    const closeButton = getByTestId('close-form-button');
    await act(async () => {
      fireEvent.click(closeButton);
    });
    
    // Verifiera att formuläret har stängts
    expect(queryByTestId('add-member-form')).toBeNull();
  });
  
  it('kan avbryta borttagning av medlem genom att klicka på avbryt', async () => {
    // Rendera komponenten
    const { getByTestId, queryByTestId, getByText } = UITestHelper.renderWithQueryClient(
      <TeamMembersScreenContainer />
    );
    
    // Hitta och klicka på borttagningsknappen för den första medlemmen
    const memberToRemove = mockMembers[1];
    const removeButton = getByTestId(`remove-${memberToRemove.id}-button`);
    await act(async () => {
      fireEvent.click(removeButton);
    });
    
    // Verifiera att bekräftelsedialogen visas
    expect(getByTestId('dialog')).toBeTruthy();
    
    // Klicka på avbryt-knappen
    const cancelButton = getByText('Avbryt');
    await act(async () => {
      fireEvent.click(cancelButton);
    });
    
    // Verifiera att dialogen stängts
    expect(queryByTestId('dialog')).toBeNull();
    
    // Verifiera att removeTeamMember inte anropades
    expect(mockRemoveTeamMember).not.toHaveBeenCalled();
  });
}); 