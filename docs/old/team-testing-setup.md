# Test-uppsättning för Team-modulen

## Översikt

Detta dokument beskriver hur testmiljön har konfigurerats för team-modulen i Pling-applikationen. Testerna använder Jest och React Testing Library tillsammans med Expo.

## Konfigurationsfiler

### jest.config.js

Konfigurationsfil för Jest som ställer in testmiljön för React Native och Expo. Viktigaste inställningar:

- Använder `jest-expo` preset
- Konfigurerar transformIgnorePatterns för att hantera node_modules
- Ställer in moduleNameMapper för att hantera alias och statiska filer
- Använder `node` testmiljö istället för `jsdom`

### jest.setup.js

Setup-fil som körs före testerna för att mocka olika beroenden:

- Mockar React Native-komponenter
- Mockar Expo-komponenter
- Mockar React Native Paper
- Mockar Supabase-klienten
- Mockar ikoner från lucide-react-native
- Mockar AsyncStorage och andra native-moduler

## Testverktyg

### components/team/__tests__/test-utils.jsx

Innehåller hjälpfunktioner och data för tester:

- `renderWithProviders`: Funktion för att rendera komponenter med ThemeProvider och QueryClientProvider
- `mockTeams`: Testdata för team
- `createTestProps`: Funktion för att skapa mock-props för komponenter
- `mockSupabaseClient`: Mock för Supabase-klienten

## Testfiler

### components/team/__tests__/TeamBasic.test.jsx

Ett enkelt test för att verifiera att testmiljön fungerar korrekt.

```jsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// En enkel komponent för att verifiera att testmiljön fungerar
const TeamBasic = ({ teamName }) => (
  <View testID="team-basic">
    <Text testID="team-name">{teamName}</Text>
  </View>
);

describe('TeamBasic', () => {
  it('renderar namnet på teamet korrekt', () => {
    const { getByTestId } = render(<TeamBasic teamName="Test Team" />);
    
    const teamNameElement = getByTestId('team-name');
    expect(teamNameElement.props.children).toBe('Test Team');
  });
});
```

### components/team/__tests__/TeamCard.test.jsx

Test för TeamCard-komponenten.

```jsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TeamCard } from '../../ui/TeamCard';
import { renderWithProviders } from './test-utils.jsx';

describe('TeamCard', () => {
  const mockTeam = {
    id: '1',
    name: 'Test Team',
    // ... övriga team-egenskaper
  };

  it('renderar teamnamnet', () => {
    const { getByText } = renderWithProviders(
      <TeamCard 
        team={mockTeam} 
        onPress={() => {}}
      />
    );

    expect(getByText('Test Team')).toBeTruthy();
  });

  // ... övriga tester
});
```

### components/team/__tests__/TeamList.test.jsx

Test för TeamList-komponenten.

```jsx
import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { TeamList } from '../TeamList';
import { renderWithProviders, mockTeams } from './test-utils.jsx';

describe('TeamList', () => {
  it('renderar en lista med team korrekt', () => {
    const { getByTestId, getAllByTestId } = renderWithProviders(
      <TeamList
        teams={mockTeams}
        onSelectTeam={() => {}}
        selectedTeamId={null}
      />
    );

    expect(getByTestId('team-list')).toBeTruthy();
    const teamCards = getAllByTestId(/^team-card-/);
    expect(teamCards).toHaveLength(2);
  });

  // ... övriga tester
});
```

## Köra tester

För att köra alla tester:

```bash
npm test
```

För att köra specifika tester:

```bash
npx jest components/team/__tests__/TeamBasic.test.jsx
npx jest components/team/__tests__/TeamCard.test.jsx
npx jest components/team/__tests__/TeamList.test.jsx
```

För att köra alla team-relaterade tester:

```bash
npx jest components/team/__tests__
```

## Att tänka på vid skapande av tester

1. Använd alltid `renderWithProviders` från test-utils.jsx för att rendera komponenter
2. Använd testID-attribut för att hitta element i testerna
3. Undvik att testa implementation-detaljer, testa istället användarbeteende
4. Använd mock-data från test-utils.jsx när det är möjligt
5. Skapa egna mockar för tjänster och hooks som används i komponenten som testas

## Kända problem

1. React Native Paper-komponenter kan vara svåra att mocka korrekt
2. Vissa nativa-moduler kräver speciella mockar
3. JSX i TypeScript-filer kan orsaka syntax-fel i tester

## Resurser

- [React Testing Library dokumentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest dokumentation](https://jestjs.io/docs/getting-started)
- [Expo Testing dokumentation](https://docs.expo.dev/guides/testing/) 