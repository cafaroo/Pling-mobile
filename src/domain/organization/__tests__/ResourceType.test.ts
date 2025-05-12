import { ResourceType, ResourceTypeLabels, ResourceTypeDescriptions } from '../value-objects/ResourceType';

describe('ResourceType', () => {
  test('ResourceType_ShouldHaveCorrectLabels', () => {
    // Alla resurstyper ska ha en svensk etikett
    Object.values(ResourceType).forEach(type => {
      expect(ResourceTypeLabels[type]).toBeDefined();
      expect(typeof ResourceTypeLabels[type]).toBe('string');
      expect(ResourceTypeLabels[type].length).toBeGreaterThan(0);
    });

    // Kontrollera några specifika etiketter
    expect(ResourceTypeLabels[ResourceType.DOCUMENT]).toBe('Dokument');
    expect(ResourceTypeLabels[ResourceType.PROJECT]).toBe('Projekt');
    expect(ResourceTypeLabels[ResourceType.GOAL]).toBe('Mål');
  });

  test('ResourceType_ShouldHaveCorrectDescriptions', () => {
    // Alla resurstyper ska ha en beskrivning
    Object.values(ResourceType).forEach(type => {
      expect(ResourceTypeDescriptions[type]).toBeDefined();
      expect(typeof ResourceTypeDescriptions[type]).toBe('string');
      expect(ResourceTypeDescriptions[type].length).toBeGreaterThan(0);
    });

    // Kontrollera några specifika beskrivningar
    expect(ResourceTypeDescriptions[ResourceType.DOCUMENT]).toContain('Dokument');
    expect(ResourceTypeDescriptions[ResourceType.PROJECT]).toContain('Projekt');
    expect(ResourceTypeDescriptions[ResourceType.GOAL]).toContain('Mål');
  });

  test('ResourceType_ShouldHaveConsistentStructure', () => {
    // Säkerställ att alla typer har både etikett och beskrivning
    expect(Object.keys(ResourceType).length).toBe(Object.keys(ResourceTypeLabels).length);
    expect(Object.keys(ResourceType).length).toBe(Object.keys(ResourceTypeDescriptions).length);
  });
}); 