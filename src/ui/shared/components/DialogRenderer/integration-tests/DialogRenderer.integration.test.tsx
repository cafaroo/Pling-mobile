import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { DialogRenderer } from '../DialogRenderer';
import { UIContextProvider } from '@/ui/shared/context/UIContext';
import { useUIState } from '@/ui/shared/hooks/useUIState';

// Mock UIContext hook
jest.mock('@/ui/shared/hooks/useUIState');

// Mock React Native Paper komponenter
jest.mock('react-native-paper', () => ({
  Portal: ({ children }: any) => <div testID="portal">{children}</div>,
  Dialog: ({ visible, onDismiss, children }: any) => (
    visible ? (
      <div testID="dialog" onClick={onDismiss}>
        {children}
      </div>
    ) : null
  ),
  Dialog: {
    Title: ({ children }: any) => <div testID="dialog-title">{children}</div>,
    Content: ({ children }: any) => <div testID="dialog-content">{children}</div>,
    Actions: ({ children }: any) => <div testID="dialog-actions">{children}</div>,
  },
  Button: ({ onPress, children }: any) => (
    <button testID={`button-${children}`} onClick={onPress}>
      {children}
    </button>
  ),
}));

// Testkomponent som använder dialogen
const TestComponent = () => {
  const { showDialog, hideDialog } = useUIState();
  
  const openConfirmDialog = () => {
    showDialog({
      title: 'Bekräfta åtgärd',
      message: 'Är du säker på att du vill utföra denna åtgärd?',
      confirmText: 'Ja',
      cancelText: 'Nej',
      onConfirm: jest.fn(),
      onCancel: jest.fn(),
    });
  };
  
  const openInfoDialog = () => {
    showDialog({
      title: 'Information',
      message: 'Detta är ett informationsmeddelande.',
      confirmText: 'OK',
    });
  };
  
  return (
    <div>
      <button testID="open-confirm-dialog" onClick={openConfirmDialog}>
        Öppna bekräftelsedialog
      </button>
      <button testID="open-info-dialog" onClick={openInfoDialog}>
        Öppna informationsdialog
      </button>
    </div>
  );
};

describe('DialogRenderer Integration Tests', () => {
  // Mock-implementation av useUIState
  const mockShowDialog = jest.fn();
  const mockHideDialog = jest.fn();
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();
  
  // Mock dialogstate
  let dialogState = {
    visible: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Återställ dialogstate
    dialogState = {
      visible: false,
      title: '',
      message: '',
      confirmText: '',
      cancelText: '',
      onConfirm: mockOnConfirm,
      onCancel: mockOnCancel,
    };
    
    // Konfigurera useUIState mock
    (useUIState as jest.Mock).mockImplementation(() => ({
      showDialog: mockShowDialog.mockImplementation((dialogProps) => {
        dialogState = {
          ...dialogState,
          visible: true,
          ...dialogProps,
        };
      }),
      hideDialog: mockHideDialog.mockImplementation(() => {
        dialogState.visible = false;
      }),
      dialogState,
    }));
  });
  
  it('renderar DialogRenderer utan synlig dialog som standard', () => {
    const { queryByTestId } = render(
      <UIContextProvider>
        <DialogRenderer />
      </UIContextProvider>
    );
    
    // Ingen dialog bör vara synlig
    expect(queryByTestId('dialog')).toBeNull();
  });
  
  it('visar dialog när showDialog anropas', async () => {
    // Rendera komponenten med UIContextProvider
    const { getByTestId } = render(
      <UIContextProvider>
        <TestComponent />
        <DialogRenderer />
      </UIContextProvider>
    );
    
    // Öppna dialog
    await act(async () => {
      (useUIState as jest.Mock).mockImplementation(() => ({
        showDialog: mockShowDialog,
        hideDialog: mockHideDialog,
        dialogState: {
          visible: true,
          title: 'Bekräfta åtgärd',
          message: 'Är du säker på att du vill utföra denna åtgärd?',
          confirmText: 'Ja',
          cancelText: 'Nej',
          onConfirm: mockOnConfirm,
          onCancel: mockOnCancel,
        },
      }));
    });
    
    // Uppdatera rendering
    const { getByTestId: getByTestIdAfterUpdate } = render(
      <UIContextProvider>
        <TestComponent />
        <DialogRenderer />
      </UIContextProvider>
    );
    
    // Dialog bör vara synlig
    const dialog = getByTestIdAfterUpdate('dialog');
    expect(dialog).toBeTruthy();
    
    // Verifiera dialoginnehåll
    const title = getByTestIdAfterUpdate('dialog-title');
    expect(title.textContent).toBe('Bekräfta åtgärd');
    
    const content = getByTestIdAfterUpdate('dialog-content');
    expect(content.textContent).toContain('Är du säker på att du vill utföra denna åtgärd?');
  });
  
  it('anropar onConfirm när bekräftelseknappen klickas', async () => {
    // Konfigurera useUIState för att visa dialog
    (useUIState as jest.Mock).mockImplementation(() => ({
      showDialog: mockShowDialog,
      hideDialog: mockHideDialog,
      dialogState: {
        visible: true,
        title: 'Bekräfta åtgärd',
        message: 'Är du säker på att du vill utföra denna åtgärd?',
        confirmText: 'Ja',
        cancelText: 'Nej',
        onConfirm: mockOnConfirm,
        onCancel: mockOnCancel,
      },
    }));
    
    // Rendera komponenten
    const { getByTestId } = render(
      <UIContextProvider>
        <DialogRenderer />
      </UIContextProvider>
    );
    
    // Hitta och klicka på bekräftelseknappen
    const confirmButton = getByTestId('button-Ja');
    await act(async () => {
      fireEvent.click(confirmButton);
    });
    
    // Verifiera att onConfirm anropas
    expect(mockOnConfirm).toHaveBeenCalled();
    
    // Och att hideDialog anropas (för att stänga dialogen)
    expect(mockHideDialog).toHaveBeenCalled();
  });
  
  it('anropar onCancel när avbrytknappen klickas', async () => {
    // Konfigurera useUIState för att visa dialog
    (useUIState as jest.Mock).mockImplementation(() => ({
      showDialog: mockShowDialog,
      hideDialog: mockHideDialog,
      dialogState: {
        visible: true,
        title: 'Bekräfta åtgärd',
        message: 'Är du säker på att du vill utföra denna åtgärd?',
        confirmText: 'Ja',
        cancelText: 'Nej',
        onConfirm: mockOnConfirm,
        onCancel: mockOnCancel,
      },
    }));
    
    // Rendera komponenten
    const { getByTestId } = render(
      <UIContextProvider>
        <DialogRenderer />
      </UIContextProvider>
    );
    
    // Hitta och klicka på avbrytknappen
    const cancelButton = getByTestId('button-Nej');
    await act(async () => {
      fireEvent.click(cancelButton);
    });
    
    // Verifiera att onCancel anropas
    expect(mockOnCancel).toHaveBeenCalled();
    
    // Och att hideDialog anropas (för att stänga dialogen)
    expect(mockHideDialog).toHaveBeenCalled();
  });
  
  it('stänger dialogen när den klickas utanför', async () => {
    // Konfigurera useUIState för att visa dialog
    (useUIState as jest.Mock).mockImplementation(() => ({
      showDialog: mockShowDialog,
      hideDialog: mockHideDialog,
      dialogState: {
        visible: true,
        title: 'Information',
        message: 'Detta är ett informationsmeddelande.',
        confirmText: 'OK',
        cancelText: '',
        onConfirm: mockOnConfirm,
        onCancel: mockOnCancel,
      },
    }));
    
    // Rendera komponenten
    const { getByTestId } = render(
      <UIContextProvider>
        <DialogRenderer />
      </UIContextProvider>
    );
    
    // Hitta dialogen och klicka utanför (på själva dialogen i vår mock)
    const dialog = getByTestId('dialog');
    await act(async () => {
      fireEvent.click(dialog);
    });
    
    // Verifiera att hideDialog anropas
    expect(mockHideDialog).toHaveBeenCalled();
  });
}); 