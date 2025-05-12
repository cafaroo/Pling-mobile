import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { OrganizationResourceDetails } from '../OrganizationResourceDetails';
import { ResourceType } from '@/domain/organization/value-objects/ResourceType';
import { ResourcePermission } from '@/domain/organization/value-objects/ResourcePermission';
import { OrganizationResource } from '@/domain/organization/entities/OrganizationResource';
import { UniqueId } from '@/shared/core/UniqueId';
import { useOrganization } from '../OrganizationProvider';
import { useAuth } from '@/hooks/useAuth';

// Mocka useOrganization-hooken och useAuth-hooken
jest.mock('../OrganizationProvider', () => ({
  useOrganization: jest.fn()
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Mocka React Native Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn()
}));

describe('OrganizationResourceDetails', () => {
  // Testdata
  const resourceId = new UniqueId().toString();
  const organizationId = new UniqueId().toString();
  const ownerId = new UniqueId().toString();
  const userId = new UniqueId().toString();
  const teamId = new UniqueId().toString();
  
  const mockResource = {
    id: new UniqueId(resourceId),
    name: 'Test Resource',
    description: 'Test resource description',
    type: ResourceType.DOCUMENT,
    organizationId: new UniqueId(organizationId),
    ownerId: new UniqueId(ownerId),
    metadata: { isPublic: true, version: 1 },
    permissionAssignments: [
      {
        userId: new UniqueId(userId),
        permissions: [ResourcePermission.VIEW, ResourcePermission.EDIT]
      },
      {
        teamId: new UniqueId(teamId),
        permissions: [ResourcePermission.VIEW]
      },
      {
        role: 'member',
        permissions: [ResourcePermission.VIEW]
      }
    ],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
    domainEvents: [],
    clearEvents: jest.fn(),
    addPermission: jest.fn(),
    removePermission: jest.fn(),
    update: jest.fn(),
    markAsDeleted: jest.fn()
  } as unknown as OrganizationResource;

  const mockGetResourceById = jest.fn().mockResolvedValue(mockResource);
  const mockDeleteResource = jest.fn().mockResolvedValue({ success: true });
  
  const mockOnBack = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnAddPermission = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useOrganization as jest.Mock).mockReturnValue({
      getResourceById: mockGetResourceById,
      deleteResource: mockDeleteResource
    });
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: userId }
    });
  });

  test('ResourceDetails_ShouldDisplayResource', async () => {
    const { getByText } = render(
      <OrganizationResourceDetails
        resourceId={resourceId}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        onAddPermission={mockOnAddPermission}
      />
    );

    // Vänta på att resurs laddas
    await waitFor(() => {
      expect(mockGetResourceById).toHaveBeenCalledWith(resourceId);
    });

    // Kontrollera att resursdetaljer visas
    expect(getByText('Test Resource')).toBeDefined();
    expect(getByText('Dokument')).toBeDefined();
    expect(getByText('Test resource description')).toBeDefined();
    
    // Kontrollera att metadata visas
    expect(getByText('isPublic:')).toBeDefined();
    expect(getByText('version:')).toBeDefined();
    
    // Kontrollera att datum visas
    expect(getByText(/2023-01-01/)).toBeDefined();
    expect(getByText(/2023-01-02/)).toBeDefined();
  });

  test('ResourceDetails_ShouldDisplayPermissions', async () => {
    const { getByText } = render(
      <OrganizationResourceDetails
        resourceId={resourceId}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        onAddPermission={mockOnAddPermission}
      />
    );

    // Vänta på att resurs laddas
    await waitFor(() => {
      expect(mockGetResourceById).toHaveBeenCalledWith(resourceId);
    });

    // Kontrollera att behörigheter visas
    expect(getByText(`Användare: ${userId}`)).toBeDefined();
    expect(getByText(`Team: ${teamId}`)).toBeDefined();
    expect(getByText('Roll: member')).toBeDefined();
    
    // Kontrollera att behörighetstyper visas
    expect(getByText('Visa')).toBeDefined();
    expect(getByText('Redigera')).toBeDefined();
  });

  test('ResourceDetails_ShouldRespectUserPermissions', async () => {
    // Konfigurera useAuth för att simulera att användaren är ägare
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: ownerId }
    });

    const { getByText } = render(
      <OrganizationResourceDetails
        resourceId={resourceId}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        onAddPermission={mockOnAddPermission}
      />
    );

    // Vänta på att resurs laddas
    await waitFor(() => {
      expect(mockGetResourceById).toHaveBeenCalledWith(resourceId);
    });

    // Kontrollera att ägaren ser redigeringsknappen
    expect(getByText('Redigera')).toBeDefined();
    
    // Kontrollera att ägaren ser borttagningsknappen
    expect(getByText('Ta bort')).toBeDefined();
    
    // Kontrollera att ägaren ser behörighetsknappen
    expect(getByText('Lägg till')).toBeDefined();
  });

  test('ResourceDetails_ShouldHandleDelete', async () => {
    // Mocka Alert
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      // Simulera att användaren klickar på "Ta bort"
      const deleteButton = buttons?.find(button => button.text === 'Ta bort');
      if (deleteButton && deleteButton.onPress) {
        deleteButton.onPress();
      }
    });

    // Konfigurera useAuth för att simulera att användaren är ägare
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: ownerId }
    });

    const { getByText } = render(
      <OrganizationResourceDetails
        resourceId={resourceId}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        onAddPermission={mockOnAddPermission}
      />
    );

    // Vänta på att resurs laddas
    await waitFor(() => {
      expect(mockGetResourceById).toHaveBeenCalledWith(resourceId);
    });

    // Klicka på borttagningsknappen
    fireEvent.press(getByText('Ta bort'));

    // Vänta på att borttagningen genomförs
    await waitFor(() => {
      expect(mockDeleteResource).toHaveBeenCalledWith(resourceId);
    });

    // Verifiera att onDelete anropades
    expect(mockOnDelete).toHaveBeenCalled();
  });

  test('ResourceDetails_ShouldHandleNotFound', async () => {
    // Konfigurera mockGetResourceById för att simulera att resursen inte hittades
    mockGetResourceById.mockResolvedValue(null);

    const { getByText } = render(
      <OrganizationResourceDetails
        resourceId={resourceId}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        onAddPermission={mockOnAddPermission}
      />
    );

    // Vänta på att resursen försöker laddas
    await waitFor(() => {
      expect(mockGetResourceById).toHaveBeenCalledWith(resourceId);
    });

    // Verifiera att felmeddelandet visas
    expect(getByText('Resursen finns inte')).toBeDefined();
    
    // Verifiera att tillbakaknappen visas
    expect(getByText('Tillbaka')).toBeDefined();
  });

  test('ResourceDetails_ShouldHandleBackButton', async () => {
    const { getByText } = render(
      <OrganizationResourceDetails
        resourceId={resourceId}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        onAddPermission={mockOnAddPermission}
      />
    );

    // Vänta på att resurs laddas
    await waitFor(() => {
      expect(mockGetResourceById).toHaveBeenCalledWith(resourceId);
    });

    // Klicka på tillbakaknappen
    fireEvent.press(getByText('Tillbaka'));

    // Verifiera att onBack anropades
    expect(mockOnBack).toHaveBeenCalled();
  });
}); 