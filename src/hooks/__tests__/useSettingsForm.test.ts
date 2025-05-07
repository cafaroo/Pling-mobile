import { renderHook, act } from '@testing-library/react-hooks';
import { useSettingsForm } from '../useSettingsForm';
import { useUser } from '../useUser';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

// Mocka beroenden
jest.mock('../useUser');
jest.mock('../../utils/toast');

describe('useSettingsForm', () => {
  const mockUser = {
    settings: {
      notifications: {
        email: true,
        push: true,
        teamUpdates: false,
      },
      theme: 'dark',
      language: 'sv',
    },
  };

  const mockUpdateUserSettings = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      updateUserSettings: mockUpdateUserSettings,
    });
  });

  it('initialiserar formuläret med användarens nuvarande inställningar', () => {
    const { result } = renderHook(() => useSettingsForm());

    expect(result.current.form.getValues()).toEqual({
      notifications: {
        email: true,
        push: true,
        teamUpdates: false,
      },
      theme: 'dark',
      language: 'sv',
    });
  });

  it('använder standardvärden när användarinställningar saknas', () => {
    (useUser as jest.Mock).mockReturnValue({
      user: { settings: {} },
      updateUserSettings: mockUpdateUserSettings,
    });

    const { result } = renderHook(() => useSettingsForm());

    expect(result.current.form.getValues()).toEqual({
      notifications: {
        email: true,
        push: true,
        teamUpdates: true,
      },
      theme: 'system',
      language: 'sv',
    });
  });

  it('uppdaterar inställningar och visar bekräftelse vid framgång', async () => {
    mockUpdateUserSettings.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSettingsForm());

    const newSettings = {
      notifications: {
        email: false,
        push: true,
        teamUpdates: true,
      },
      theme: 'light',
      language: 'en',
    };

    await act(async () => {
      await result.current.onSubmit(newSettings);
    });

    expect(mockUpdateUserSettings).toHaveBeenCalledWith(newSettings);
    expect(showSuccessToast).toHaveBeenCalledWith('Inställningarna har sparats');
  });

  it('hanterar fel vid uppdatering', async () => {
    const mockError = new Error('Uppdateringsfel');
    mockUpdateUserSettings.mockRejectedValue(mockError);
    const { result } = renderHook(() => useSettingsForm());

    await act(async () => {
      await result.current.onSubmit({
        notifications: {
          email: true,
          push: true,
          teamUpdates: true,
        },
        theme: 'dark',
        language: 'sv',
      });
    });

    expect(showErrorToast).toHaveBeenCalledWith('Kunde inte spara inställningarna');
  });

  it('validerar inställningsvärden korrekt', () => {
    const { result } = renderHook(() => useSettingsForm());

    // Testa ogiltig tema-inställning
    act(() => {
      result.current.form.setValue('theme', 'invalid' as any);
    });
    expect(result.current.form.formState.errors.theme).toBeTruthy();

    // Testa ogiltigt språk
    act(() => {
      result.current.form.setValue('language', 'invalid' as any);
    });
    expect(result.current.form.formState.errors.language).toBeTruthy();

    // Testa ogiltig notifikationsinställning
    act(() => {
      result.current.form.setValue('notifications.email', 'invalid' as any);
    });
    expect(result.current.form.formState.errors.notifications?.email).toBeTruthy();
  });
}); 