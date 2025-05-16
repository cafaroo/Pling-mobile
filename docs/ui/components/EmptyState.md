# EmptyState

## Översikt

EmptyState är en komponent som används för att visa information till användaren när data saknas eller ännu inte har laddats. Den ger en visuell indikation om att innehållet inte är tillgängligt och kan innehålla en åtgärdsknapp som låter användaren vidta åtgärder för att adressera det tomma tillståndet.

## Props

| Prop | Typ | Standard | Beskrivning |
|------|-----|----------|-------------|
| `title` | `string` | - | Titel som visas i det tomma tillståndet |
| `message` | `string` | - | Beskrivande meddelande som förklarar det tomma tillståndet |
| `onAction` | `() => void` | `undefined` | Funktion som anropas när användaren klickar på åtgärdsknappen |
| `actionText` | `string` | `undefined` | Text som visas på åtgärdsknappen |
| `icon` | `React.ReactNode` | `undefined` | Ikon-komponent att visa över titeln |
| `style` | `ViewStyle` | `undefined` | Container style override för att anpassa utseendet |

## Användningsexempel

### Grundläggande användning

```tsx
import { EmptyState } from '@/ui/shared/components/EmptyState';

const TeamsList = ({ teams }) => {
  if (teams.length === 0) {
    return (
      <EmptyState
        title="Inga team hittades"
        message="Du har inte skapat några team än."
      />
    );
  }
  
  return (
    <TeamListView teams={teams} />
  );
};
```

### Med åtgärdsknapp

```tsx
import { EmptyState } from '@/ui/shared/components/EmptyState';
import { useRouter } from 'expo-router';

const TeamsList = ({ teams }) => {
  const router = useRouter();
  
  if (teams.length === 0) {
    return (
      <EmptyState
        title="Inga team hittades"
        message="Du har inte skapat några team än. Skapa ditt första team för att komma igång."
        onAction={() => router.push('/teams/create')}
        actionText="Skapa team"
      />
    );
  }
  
  return (
    <TeamListView teams={teams} />
  );
};
```

### Med ikon

```tsx
import { EmptyState } from '@/ui/shared/components/EmptyState';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TeamsList = ({ teams }) => {
  if (teams.length === 0) {
    return (
      <EmptyState
        title="Inga team hittades"
        message="Du har inte skapat några team än."
        icon={
          <MaterialCommunityIcons 
            name="account-group-outline" 
            size={48} 
            color="#007AFF" 
          />
        }
      />
    );
  }
  
  return (
    <TeamListView teams={teams} />
  );
};
```

## Varianter

Komponenten har följande varianter:

### Information

Används för att informera användaren om avsaknad av data utan att erbjuda någon åtgärd:

```tsx
<EmptyState
  title="Inga resultat"
  message="Din sökning gav inga träffar."
/>
```

### Med åtgärd

Används när det finns en specifik åtgärd användaren kan vidta för att adressera det tomma tillståndet:

```tsx
<EmptyState
  title="Tomt notifikationscenter"
  message="Du har inga notifikationer för tillfället."
  onAction={() => markAllAsRead()}
  actionText="Uppdatera"
/>
```

### Med ikon

Används för att ge en visuell förstärkning av det tomma tillståndet:

```tsx
<EmptyState
  title="Inga dokument"
  message="Du har inte laddat upp några dokument än."
  icon={<DocumentIcon />}
/>
```

## Tillgänglighet

EmptyState-komponenten stödjer tillgänglighet genom:

- Tydlig visuell hierarki med titel och beskrivande meddelande
- Åtgärdsknappen är tydligt urskiljbar och har tillräcklig kontrast
- Knappar har lämplig storlek för att vara enkla att interagera med
- Stöd för skärmläsare genom att använda semantisk markup

## Kända problem

1. Ikonstödet kräver att användaren förser komponenten med en tillgänglig ikon
2. Stilar är för närvarande hårdkodade och använder inte temavärden

## Relaterade komponenter

- [LoadingSpinner](./LoadingSpinner.md) - Används innan data är tillgänglig
- [ErrorMessage](./ErrorMessage.md) - Visas när ett fel har uppstått vid datahämtning
- [Card](./Card.md) - Kan användas för att rama in EmptyState

## Implementation

```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

interface EmptyStateProps {
  title: string;
  message: string;
  onAction?: () => void;
  actionText?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const EmptyState = ({
  title,
  message,
  onAction,
  actionText,
  icon,
  style,
}: EmptyStateProps) => {
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      {onAction && actionText && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginVertical: 20,
    minHeight: 200,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
```

## Testning

Exempel på hur man testar EmptyState-komponenten:

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renderar titel och meddelande korrekt', () => {
    const { getByText } = render(
      <EmptyState 
        title="Testtitel" 
        message="Testmeddelande" 
      />
    );
    
    expect(getByText('Testtitel')).toBeTruthy();
    expect(getByText('Testmeddelande')).toBeTruthy();
  });
  
  it('visar inte åtgärdsknappen om onAction saknas', () => {
    const { queryByText } = render(
      <EmptyState 
        title="Testtitel" 
        message="Testmeddelande" 
        actionText="Klicka här"
      />
    );
    
    expect(queryByText('Klicka här')).toBeNull();
  });
  
  it('visar inte åtgärdsknappen om actionText saknas', () => {
    const onAction = jest.fn();
    const { queryByText } = render(
      <EmptyState 
        title="Testtitel" 
        message="Testmeddelande" 
        onAction={onAction}
      />
    );
    
    expect(queryByText('Klicka här')).toBeNull();
  });
  
  it('anropar onAction när åtgärdsknappen klickas', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState 
        title="Testtitel" 
        message="Testmeddelande" 
        onAction={onAction}
        actionText="Klicka här"
      />
    );
    
    fireEvent.press(getByText('Klicka här'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
  
  it('renderar ikonen om den tillhandahålls', () => {
    const TestIcon = () => <View testID="test-icon" />;
    
    const { getByTestId } = render(
      <EmptyState 
        title="Testtitel" 
        message="Testmeddelande" 
        icon={<TestIcon />}
      />
    );
    
    expect(getByTestId('test-icon')).toBeTruthy();
  });
}); 