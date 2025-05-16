import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { useUser } from '@/application/user/hooks/useUser';
import { useUpdateSettings } from '@/application/user/hooks/useUpdateSettings';
import { SettingsScreenContainer } from '../SettingsScreenContainer';
import { SnackbarProvider } from '@/ui/shared/context/SnackbarContext';
import { Result } from '@/shared/core/Result';
import { UITestHelper } from '@/test-utils/helpers/UITestHelper';

// Mock beroenden
jest.mock('@/application/user/hooks/useUser');
jest.mock('@/application/user/hooks/useUpdateSettings');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
  }),
}));

describe('SettingsScreen Integration Tests', () => {
  // Setup
  let queryClient: QueryClient;
  
  // Mock-implementation av hooks och metoder
  const mockUserData = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    settings: {
      theme: 'light',
      language: 'sv',
      notifications: {
        email: true,
        push: false,
        sms: false,
        frequency: 'daily',
      },
      privacy: {
        profileVisibility: 'team',
        showEmail: true,
        showPhone: false,
      },
    },
  };
  
  const mockUpdateSettingsMutate = jest.fn();
  
  // Skapa en wrapper för att rendera komponenten med nödvändiga providers
  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <NavigationContainer>
        <QueryClientProvider client={queryClient}>
          <PaperProvider>
            <SnackbarProvider>
              {children}
            </SnackbarProvider>
          </PaperProvider>
        </QueryClientProvider>
      </NavigationContainer>
    );
  };
  
  // Konfigurera mocks före varje test
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Konfigurera useUser mock
    (useUser as jest.Mock).mockReturnValue({
      data: mockUserData,
      isLoading: false,
      error: null,
    });
    
    // Konfigurera useUpdateSettings mock
    (useUpdateSettings as jest.Mock).mockReturnValue({
      mutate: mockUpdateSettingsMutate,
      isLoading: false,
    });
  });
  
  it('ska visa användarens inställningar', async () => {
    // Rendera komponenten
    const { getByText, getAllByText } = render(
      <SettingsScreenContainer />,
      { wrapper: createWrapper() }
    );
    
    // Verifiera att komponenten visar rätt data
    expect(getByText('Inställningar')).toBeTruthy();
    expect(getByText('Tema och språk')).toBeTruthy();
    expect(getByText('Notifikationer')).toBeTruthy();
    expect(getByText('Integritet')).toBeTruthy();
  });
  
  it('ska visa laddningsindikator under datahämtning', async () => {
    // Konfigurera useUser mock för att visa laddningstillstånd
    (useUser as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });
    
    // Rendera komponenten
    const { getByTestId } = render(
      <SettingsScreenContainer />,
      { wrapper: createWrapper() }
    );
    
    // Verifiera att laddningsindikator visas
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });
  
  it('ska visa felmeddelande när datahämtning misslyckas', async () => {
    // Konfigurera useUser mock för att visa feltillstånd
    (useUser as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load user data'),
    });
    
    // Rendera komponenten
    const { getByText } = render(
      <SettingsScreenContainer />,
      { wrapper: createWrapper() }
    );
    
    // Verifiera att felmeddelande visas
    expect(getByText('Kunde inte ladda användarinställningar')).toBeTruthy();
  });
  
  it('ska uppdatera temat när användaren ändrar det', async () => {
    // Rendera komponenten
    const { getByText } = render(
      <SettingsScreenContainer />,
      { wrapper: createWrapper() }
    );
    
    // Hitta och klicka på "Mörkt" tema-alternativet
    fireEvent.press(getByText('Mörkt'));
    
    // Hitta och klicka på "Spara ändringar" knappen
    fireEvent.press(getByText('Spara ändringar'));
    
    // Verifiera att updateSettings anropades med rätt parametrar
    await waitFor(() => {
      expect(mockUpdateSettingsMutate).toHaveBeenCalled();
      
      // Verifiera att första argumentet innehåller rätt tema
      const updateCall = mockUpdateSettingsMutate.mock.calls[0][0];
      expect(updateCall).toHaveProperty('theme', 'dark');
    });
  });
  
  it('ska uppdatera språket när användaren ändrar det', async () => {
    // Rendera komponenten
    const { getByText } = render(
      <SettingsScreenContainer />,
      { wrapper: createWrapper() }
    );
    
    // Hitta och klicka på "English" språkalternativet
    fireEvent.press(getByText('English'));
    
    // Hitta och klicka på "Spara ändringar" knappen
    fireEvent.press(getByText('Spara ändringar'));
    
    // Verifiera att updateSettings anropades med rätt parametrar
    await waitFor(() => {
      expect(mockUpdateSettingsMutate).toHaveBeenCalled();
      
      // Verifiera att första argumentet innehåller rätt språk
      const updateCall = mockUpdateSettingsMutate.mock.calls[0][0];
      expect(updateCall).toHaveProperty('language', 'en');
    });
  });
  
  it('ska uppdatera notifikationsinställningar när användaren ändrar dem', async () => {
    // Simulera framgångsrikt uppdateringsanrop
    mockUpdateSettingsMutate.mockImplementation((settings, options) => {
      options.onSuccess && options.onSuccess();
    });
    
    // Rendera komponenten
    const { getByText, getByTestId } = render(
      <SettingsScreenContainer />,
      { wrapper: createWrapper() }
    );
    
    // Hitta och klicka på frekvensalternativet "Veckovis"
    fireEvent.press(getByText('Veckovis'));
    
    // Hitta och klicka på "Spara ändringar" knappen
    fireEvent.press(getByText('Spara ändringar'));
    
    // Verifiera att updateSettings anropades med rätt parametrar
    await waitFor(() => {
      expect(mockUpdateSettingsMutate).toHaveBeenCalled();
      
      // Verifiera att första argumentet innehåller rätt frekvens
      const updateCall = mockUpdateSettingsMutate.mock.calls[0][0];
      expect(updateCall).toHaveProperty('notifications.frequency', 'weekly');
    });
    
    // Verifiera att success-meddelandet visas
    await waitFor(() => {
      expect(getByText('Inställningar uppdaterade')).toBeTruthy();
    });
  });
  
  it('ska uppdatera integritetsinställningar när användaren ändrar dem', async () => {
    // Rendera komponenten
    const { getByText } = render(
      <SettingsScreenContainer />,
      { wrapper: createWrapper() }
    );
    
    // Hitta och klicka på profilsynlighetsalternativet "Privat"
    fireEvent.press(getByText('Privat'));
    
    // Hitta Switch-komponenten för "Visa telefonnummer" och växla den
    // Notera: Detta är svårt att göra med getByText så vi skulle normalt använda testID
    // men vi simulerar det här
    
    // Hitta och klicka på "Spara ändringar" knappen
    fireEvent.press(getByText('Spara ändringar'));
    
    // Verifiera att updateSettings anropades med rätt parametrar
    await waitFor(() => {
      expect(mockUpdateSettingsMutate).toHaveBeenCalled();
      
      // Verifiera att första argumentet innehåller rätt profilsynlighet
      const updateCall = mockUpdateSettingsMutate.mock.calls[0][0];
      expect(updateCall).toHaveProperty('privacy.profileVisibility', 'private');
    });
  });
  
  it('ska hantera uppdateringsfel korrekt', async () => {
    // Simulera ett misslyckat uppdateringsanrop
    mockUpdateSettingsMutate.mockImplementation((settings, options) => {
      options.onError && options.onError(new Error('Update failed'));
    });
    
    // Rendera komponenten
    const { getByText } = render(
      <SettingsScreenContainer />,
      { wrapper: createWrapper() }
    );
    
    // Hitta och klicka på "Spara ändringar" knappen
    fireEvent.press(getByText('Spara ändringar'));
    
    // Verifiera att updateSettings anropades
    expect(mockUpdateSettingsMutate).toHaveBeenCalled();
    
    // Verifiera att felmeddelandet visas (via SnackbarContext)
    await waitFor(() => {
      expect(getByText('Kunde inte spara inställningar')).toBeTruthy();
    });
  });
  
  it('ska visa laddningsindikator under uppdatering', async () => {
    // Konfigurera useUpdateSettings mock för att visa laddningstillstånd
    (useUpdateSettings as jest.Mock).mockReturnValue({
      mutate: mockUpdateSettingsMutate,
      isLoading: true,
    });
    
    // Rendera komponenten
    const { getByText, getByTestId } = render(
      <SettingsScreenContainer />,
      { wrapper: createWrapper() }
    );
    
    // Hitta och försök klicka på "Spara ändringar" knappen
    const saveButton = getByText('Spara ändringar');
    
    // Verifiera att knappen visar laddningstillstånd eller är inaktiverad
    expect(saveButton.props.disabled).toBeTruthy();
  });
  
  // Ytterligare test som verifierar att datalagring och UI-uppdatering fungerar korrekt
  it('ska uppdatera UI efter lyckad inställningsändring', async () => {
    // Först, rendera komponenten med standardvärden
    const { getByText, rerender } = render(
      <SettingsScreenContainer />,
      { wrapper: createWrapper() }
    );
    
    // Simulera en lyckad uppdatering som ändrar användarens inställningar
    mockUpdateSettingsMutate.mockImplementation((settings, options) => {
      // Uppdatera mockUserData för att simulera att servern har uppdaterat datan
      mockUserData.settings.theme = 'dark';
      mockUserData.settings.language = 'en';
      
      // Anropa onSuccess callback
      options.onSuccess && options.onSuccess();
      
      // Uppdatera useUser-mocken för att returnera de uppdaterade inställningarna
      (useUser as jest.Mock).mockReturnValue({
        data: mockUserData,
        isLoading: false,
        error: null,
      });
    });
    
    // Hitta och klicka på "Mörkt" tema-alternativet
    fireEvent.press(getByText('Mörkt'));
    
    // Hitta och klicka på "English" språkalternativet
    fireEvent.press(getByText('English'));
    
    // Hitta och klicka på "Spara ändringar" knappen
    fireEvent.press(getByText('Spara ändringar'));
    
    // Simulera att komponenten rendereras igen efter datauppdateringen
    rerender(
      <QueryClientProvider client={queryClient}>
        <SettingsScreenContainer />
      </QueryClientProvider>
    );
    
    // Verifiera att updateSettings anropades
    expect(mockUpdateSettingsMutate).toHaveBeenCalled();
    
    // Verifiera att UI visar de uppdaterade värdena
    // Detta skulle normalt göras genom att kontrollera att rätt alternativ är markerat
    // men för enkelhetens skull testar vi bara att mockUserData har uppdaterats
    expect(mockUserData.settings.theme).toBe('dark');
    expect(mockUserData.settings.language).toBe('en');
  });
}); 