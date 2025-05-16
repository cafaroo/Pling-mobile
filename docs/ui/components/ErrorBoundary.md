# ErrorBoundary

## Översikt

ErrorBoundary är en komponent som fångar JavaScript-fel i sitt komponentträd och visar en användarvänlig fallback istället för att krascha hela applikationen. Den är särskilt användbar för att hantera förväntade och oförväntade fel på ett kontrollerat sätt i produktionsmiljö.

## Props

| Prop | Typ | Standard | Beskrivning |
|------|-----|----------|-------------|
| `children` | `ReactNode` | - | Komponenter som ska wrappas och övervakas för fel |
| `fallback` | `React.FC<{ error: Error; resetError: () => void; }>` | `undefined` | Anpassad felkomponent som visas när ett fel inträffar. Om ingen angavs används standardfallback |

## Användningsexempel

### Grundläggande användning

```tsx
import { ErrorBoundary } from '@/ui/shared/components/ErrorBoundary';

const MyComponent = () => {
  return (
    <ErrorBoundary>
      <ComponentThatMightError />
    </ErrorBoundary>
  );
};
```

### Med anpassad felmeddelandekomponent

```tsx
import { ErrorBoundary } from '@/ui/shared/components/ErrorBoundary';

const CustomErrorFallback = ({ error, resetError }) => (
  <View style={styles.customErrorContainer}>
    <Text style={styles.customErrorTitle}>Oj, något gick fel!</Text>
    <Text style={styles.customErrorMessage}>{error.message}</Text>
    <Button title="Försök igen" onPress={resetError} />
  </View>
);

const MyComponent = () => {
  return (
    <ErrorBoundary fallback={CustomErrorFallback}>
      <ComponentThatMightError />
    </ErrorBoundary>
  );
};
```

### Nästlade ErrorBoundaries

```tsx
import { ErrorBoundary } from '@/ui/shared/components/ErrorBoundary';

const MyComponent = () => {
  return (
    <ErrorBoundary> {/* Fångar fel i hela komponentträdet */}
      <SafeComponent />
      <ErrorBoundary> {/* Fångar endast fel i UnsafeFeature */}
        <UnsafeFeature />
      </ErrorBoundary>
      <AnotherSafeComponent />
    </ErrorBoundary>
  );
};
```

## Varianter

Komponenten har följande varianter:

### Standardfallback

Om ingen anpassad fallback-komponent anges används standardfallback:

```tsx
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

Detta visar ett standardgränssnitt med felinformation och en "Försök igen"-knapp.

### Anpassad fallback

Om en anpassad fallback-komponent anges kommer denna att användas istället för standardfallback:

```tsx
<ErrorBoundary fallback={CustomFallback}>
  <MyComponent />
</ErrorBoundary>
```

## Tillgänglighet

ErrorBoundary-komponenten stödjer tillgänglighet genom:

- Tydliga felmeddelanden som hjälper användaren att förstå vad som gick fel
- "Försök igen"-knapp som är tillgänglig via skärmläsare
- Kontrasterande färger för texten (röd för felrubrik, svart för beskrivningen)
- Tabbordning för enkel navigering via tangentbord

## Kända problem

1. Fångar inte fel i:
   - Händelsehanterare (event handlers)
   - Asynkron kod (promises, async/await utan korrekt felhantering)
   - Server-side rendering
   - Själva ErrorBoundary-komponenten

2. För React Native specifikt:
   - Native-fel (t.ex. Java/Objective-C fel) fångas inte av ErrorBoundary

## Relaterade komponenter

- [ErrorMessage](./ErrorMessage.md) - För visning av specifika felmeddelanden
- [QueryErrorHandler](./QueryErrorHandler.md) - För hantering av förfrågningsfel
- [withErrorBoundary](../hoc/withErrorBoundary.md) - HOC-variant av ErrorBoundary

## Implementation

```tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.FC<{ 
    error: Error; 
    resetError: () => void;
  }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary fångade ett fel:', error, errorInfo);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback: CustomFallback } = this.props;

    if (hasError && error) {
      if (CustomFallback) {
        return <CustomFallback error={error} resetError={this.resetError} />;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Något gick fel</Text>
          <Text style={styles.description}>
            Ett oväntat fel inträffade i applikationen. 
          </Text>
          <View style={styles.errorDetails}>
            <Text style={styles.errorName}>{error.name}</Text>
            <Text style={styles.errorMessage}>{error.message}</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={this.resetError}>
            <Text style={styles.buttonText}>Försök igen</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return children;
  }
}
```

## Testning

Exempel på hur man testar ErrorBoundary-komponenten:

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from './ErrorBoundary';

// Skapa en komponent som genererar ett fel
const BuggyComponent = () => {
  throw new Error('Test error');
  return null;
};

describe('ErrorBoundary', () => {
  // Tysta konsolfelmeddelanden för att undvika brus i testerna
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalConsoleError;
  });
  
  it('ska visa standardfallback när ett fel inträffar', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    );
    
    expect(getByText('Något gick fel')).toBeTruthy();
    expect(getByText('Ett oväntat fel inträffade i applikationen.')).toBeTruthy();
    expect(getByText('Error')).toBeTruthy(); // Felnamn
    expect(getByText('Test error')).toBeTruthy(); // Felmeddelande
  });
  
  it('ska återställa felet när användaren klickar på "Försök igen"', () => {
    // Detta test kräver en mer robust implementation för att testa omrendering
    // efter att felet har återställts
  });
  
  it('ska använda anpassad fallback om angiven', () => {
    const CustomFallback = ({ error, resetError }) => (
      <View>
        <Text>Anpassat fel: {error.message}</Text>
        <TouchableOpacity onPress={resetError} testID="reset-button">
          <Text>Återställ</Text>
        </TouchableOpacity>
      </View>
    );
    
    const { getByText, getByTestId } = render(
      <ErrorBoundary fallback={CustomFallback}>
        <BuggyComponent />
      </ErrorBoundary>
    );
    
    expect(getByText('Anpassat fel: Test error')).toBeTruthy();
    expect(getByTestId('reset-button')).toBeTruthy();
  });
}); 