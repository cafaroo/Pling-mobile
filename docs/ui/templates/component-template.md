# [KomponentNamn]

## Översikt

Kort beskrivning av komponenten, dess syfte och huvudfunktionalitet.

## Props

| Prop | Typ | Standard | Beskrivning |
|------|-----|----------|-------------|
| `propNamn` | `propTyp` | `standardVärde` | Beskrivning av prop |
| `children` | `ReactNode` | - | Innehåll att rendera inom komponenten |
| `disabled` | `boolean` | `false` | Om knappen ska vara inaktiverad |

## Användningsexempel

### Grundläggande användning

```tsx
import { KomponentNamn } from '@/ui/shared/components/KomponentNamn';

const MyComponent = () => {
  return (
    <KomponentNamn 
      propNamn="värde"
      onEvent={() => handleEvent()}
    >
      Innehåll
    </KomponentNamn>
  );
};
```

### Avancerad användning

```tsx
import { KomponentNamn } from '@/ui/shared/components/KomponentNamn';

const MyComponent = () => {
  // Exempelkod för mer avancerad användning
  return (
    <KomponentNamn 
      propNamn="värde"
      customProp={complexData}
      onEvent={handleComplexEvent}
    >
      <CustomChild />
    </KomponentNamn>
  );
};
```

## Varianter

Komponenten har följande varianter:

### Variant 1

Beskrivning av variant 1 och dess användningsområde.

```tsx
<KomponentNamn variant="variant1" />
```

### Variant 2

Beskrivning av variant 2 och dess användningsområde.

```tsx
<KomponentNamn variant="variant2" />
```

## Tillgänglighet

Information om hur komponenten stödjer tillgänglighet:

- Stödjer skärmläsare genom att...
- Har tillräcklig färgkontrast...
- Kan kontrolleras via tangentbord...
- ARIA-roller och attribut...

## Kända problem

Lista över kända begränsningar eller problem:

1. Problem 1 - Beskrivning och eventuell lösning
2. Problem 2 - Beskrivning och eventuell lösning

## Relaterade komponenter

- [RelateredKomponent1](./RelateredKomponent1.md) - Relation till denna komponent
- [RelateredKomponent2](./RelateredKomponent2.md) - Relation till denna komponent

## Implementation

```tsx
// Förenklad kod som visar huvudimplementationen
import React from 'react';
import { View, Text } from 'react-native';

interface KomponentNamnProps {
  propNamn: string;
  children?: React.ReactNode;
  onEvent?: () => void;
}

export const KomponentNamn: React.FC<KomponentNamnProps> = ({
  propNamn,
  children,
  onEvent,
}) => {
  return (
    <View>
      <Text>{propNamn}</Text>
      {children}
    </View>
  );
};
```

## Testning

Exempel på hur man testar denna komponent:

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { KomponentNamn } from './KomponentNamn';

describe('KomponentNamn', () => {
  it('renderar korrekt med standardprops', () => {
    const { getByText } = render(<KomponentNamn propNamn="test" />);
    expect(getByText('test')).toBeTruthy();
  });
  
  it('anropar onEvent när integrerad med', () => {
    const mockFn = jest.fn();
    const { getByTestId } = render(
      <KomponentNamn propNamn="test" onEvent={mockFn} />
    );
    fireEvent.press(getByTestId('komponent-interaktion'));
    expect(mockFn).toHaveBeenCalled();
  });
});
``` 