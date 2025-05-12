import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { OrganizationResourceList } from '../OrganizationResourceList';
import { ResourceType } from '@/domain/organization/value-objects/ResourceType';
import { OrganizationResource } from '@/domain/organization/entities/OrganizationResource';
import { UniqueId } from '@/shared/core/UniqueId';
import { useOrganization } from '../OrganizationProvider';

// Mocka useOrganization-hooken
jest.mock('../OrganizationProvider', () => ({
  useOrganization: jest.fn()
}));

describe('OrganizationResourceList', () => {
  // Testdata
  const organizationId = new UniqueId().toString();
  const mockResources = [
    {
      id: new UniqueId(),
      name: 'Test Resource 1',
      description: 'Description 1',
      type: ResourceType.DOCUMENT,
      organizationId: new UniqueId(organizationId),
      ownerId: new UniqueId(),
      metadata: {},
      permissionAssignments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      domainEvents: [],
      clearEvents: jest.fn(),
      addPermission: jest.fn(),
      removePermission: jest.fn(),
      update: jest.fn(),
      markAsDeleted: jest.fn()
    },
    {
      id: new UniqueId(),
      name: 'Test Resource 2',
      description: 'Description 2',
      type: ResourceType.PROJECT,
      organizationId: new UniqueId(organizationId),
      ownerId: new UniqueId(),
      metadata: {},
      permissionAssignments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      domainEvents: [],
      clearEvents: jest.fn(),
      addPermission: jest.fn(),
      removePermission: jest.fn(),
      update: jest.fn(),
      markAsDeleted: jest.fn()
    }
  ] as unknown as OrganizationResource[];

  const mockOnSelectResource = jest.fn();
  const mockOnCreateResource = jest.fn();
  const mockGetResourcesByOrganizationId = jest.fn().mockResolvedValue(mockResources);
  const mockGetResourcesByType = jest.fn().mockResolvedValue([mockResources[0]]);

  beforeEach(() => {
    jest.clearAllMocks();
    (useOrganization as jest.Mock).mockReturnValue({
      getResourcesByOrganizationId: mockGetResourcesByOrganizationId,
      getResourcesByType: mockGetResourcesByType
    });
  });

  test('ResourceList_ShouldDisplayResources', async () => {
    const { getByText, getAllByText } = render(
      <OrganizationResourceList
        organizationId={organizationId}
        onSelectResource={mockOnSelectResource}
        onCreateResource={mockOnCreateResource}
      />
    );

    // Vänta på att resurser laddas
    await waitFor(() => {
      expect(mockGetResourcesByOrganizationId).toHaveBeenCalledWith(organizationId);
    });

    // Kontrollera att resurser visas
    expect(getByText('Test Resource 1')).toBeDefined();
    expect(getByText('Test Resource 2')).toBeDefined();
    expect(getByText('Dokument')).toBeDefined();
    expect(getByText('Projekt')).toBeDefined();
  });

  test('ResourceList_ShouldFilterByType', async () => {
    const { getByText, queryByText } = render(
      <OrganizationResourceList
        organizationId={organizationId}
        resourceType={ResourceType.DOCUMENT}
        onSelectResource={mockOnSelectResource}
        onCreateResource={mockOnCreateResource}
      />
    );

    // Vänta på att resurser laddas
    await waitFor(() => {
      expect(mockGetResourcesByType).toHaveBeenCalledWith(organizationId, ResourceType.DOCUMENT);
    });

    // Kontrollera att endast dokument visas
    expect(getByText('Test Resource 1')).toBeDefined();
    expect(getByText('Dokument')).toBeDefined();
    expect(queryByText('Test Resource 2')).toBeNull();
    expect(queryByText('Projekt')).toBeNull();
  });

  test('ResourceList_ShouldHandleEmpty', async () => {
    // Konfigurera mock för att returnera tom lista
    mockGetResourcesByOrganizationId.mockResolvedValue([]);

    const { getByText } = render(
      <OrganizationResourceList
        organizationId={organizationId}
        onSelectResource={mockOnSelectResource}
        onCreateResource={mockOnCreateResource}
      />
    );

    // Vänta på att resurser laddas
    await waitFor(() => {
      expect(mockGetResourcesByOrganizationId).toHaveBeenCalled();
    });

    // Kontrollera att meddelande för tom lista visas
    expect(getByText('Inga resurser hittades')).toBeDefined();
    expect(getByText('Skapa resurs')).toBeDefined();
  });

  test('ResourceList_ShouldHandleLoading', async () => {
    // Fördröj resolvning av promise för att visa laddningsstatus
    mockGetResourcesByOrganizationId.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve(mockResources), 100);
      });
    });

    const { getByText } = render(
      <OrganizationResourceList
        organizationId={organizationId}
        onSelectResource={mockOnSelectResource}
        onCreateResource={mockOnCreateResource}
      />
    );

    // Kontrollera att laddningsmeddelande visas
    expect(getByText('Laddar resurser...')).toBeDefined();
  });

  test('ResourceList_ShouldHandleErrors', async () => {
    // Konfigurera mock för att kasta ett fel
    mockGetResourcesByOrganizationId.mockRejectedValue(new Error('API Error'));

    const { getByText } = render(
      <OrganizationResourceList
        organizationId={organizationId}
        onSelectResource={mockOnSelectResource}
        onCreateResource={mockOnCreateResource}
      />
    );

    // Vänta på att fel visas
    await waitFor(() => {
      expect(getByText('Kunde inte hämta resurser. Försök igen senare.')).toBeDefined();
    });

    // Kontrollera att "försök igen"-knappen visas
    expect(getByText('Försök igen')).toBeDefined();
  });

  test('ResourceList_ShouldCallOnSelectResource', async () => {
    const { getByText } = render(
      <OrganizationResourceList
        organizationId={organizationId}
        onSelectResource={mockOnSelectResource}
        onCreateResource={mockOnCreateResource}
      />
    );

    // Vänta på att resurser laddas
    await waitFor(() => {
      expect(mockGetResourcesByOrganizationId).toHaveBeenCalled();
    });

    // Klicka på en resurs
    fireEvent.press(getByText('Test Resource 1'));

    // Verifiera att onSelectResource anropades med rätt resurs
    expect(mockOnSelectResource).toHaveBeenCalledWith(mockResources[0]);
  });

  test('ResourceList_ShouldCallOnCreateResource', async () => {
    // Konfigurera mock för att returnera tom lista
    mockGetResourcesByOrganizationId.mockResolvedValue([]);

    const { getByText } = render(
      <OrganizationResourceList
        organizationId={organizationId}
        onSelectResource={mockOnSelectResource}
        onCreateResource={mockOnCreateResource}
      />
    );

    // Vänta på att resurser laddas
    await waitFor(() => {
      expect(mockGetResourcesByOrganizationId).toHaveBeenCalled();
    });

    // Klicka på "Skapa resurs"
    fireEvent.press(getByText('Skapa resurs'));

    // Verifiera att onCreateResource anropades
    expect(mockOnCreateResource).toHaveBeenCalled();
  });
}); 