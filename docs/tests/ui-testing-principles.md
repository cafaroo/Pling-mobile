# Principer för UI-testning i Pling Mobile

UI-testning fokuserar på att verifiera att användargränssnittskomponenter och interaktioner fungerar korrekt. Dessa tester körs i en jsdom-miljö.

## Grundläggande principer

1. **Testa beteenden, inte implementation** - Fokusera på vad användaren kan se och göra
2. **Använd `@testing-library/react-native`** - Följ deras riktlinjer för att hitta element
3. **Simulera användarinteraktioner** - Testa klick, input, scrollning, etc.
4. **Testa tillgänglighet** - Säkerställ att komponenter är tillgängliga
5. **Mockade kontext och providers** - Förse komponenter med rätt kontext

## Teststruktur för UI-komponenter

```typescript
describe('<KomponentNamn />', () => {
  // Setup och teardown
  beforeEach(() => {
    // Förbered tester
  });
  
  it('ska rendera med standardprops', () => {
    // Rendering test
  });
  
  it('ska reagera korrekt på användarinteraktion', () => {
    // Interaktionstest
  });
  
  it('ska rendera olika tillstånd korrekt', () => {
    // Tillståndstest
  });
  
  it('ska integrera korrekt med andra komponenter', () => {
    // Integrationstest
  });
});
```

## Renderingsstrategier

### 1. Standard rendering

```typescript
import { render } from '@testing-library/react-native';
import { Button } from '../Button';

it('ska rendera med korrekt text', () => {
  const { getByText } = render(<Button title="Tryck här" />);
  expect(getByText('Tryck här')).toBeTruthy();
});
```

### 2. Rendering med providers

```typescript
import { renderWithProviders } from '@/test-utils';
import { ProfileScreen } from '../ProfileScreen';

it('ska rendera profil med användardata', () => {
  const mockUser = {
    id: '123',
    name: 'Test User',
    email: 'test@example.com'
  };
  
  const { getByText } = renderWithProviders(<ProfileScreen />, {
    contextValues: {
      user: mockUser
    }
  });
  
  expect(getByText('Test User')).toBeTruthy();
  expect(getByText('test@example.com')).toBeTruthy();
});
```

### 3. Rendering med tema

```typescript
import { renderWithTheme } from '@/test-utils';
import { ThemedButton } from '../ThemedButton';

it('ska använda rätt temafärger', () => {
  const { getByTestId } = renderWithTheme(<ThemedButton />, 'dark');
  
  const button = getByTestId('themed-button');
  expect(button.props.style.backgroundColor).toBe('#121212'); // Mörkt tema färg
});
```

## Testning av användarinteraktioner

### 1. Klickhändelser

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

it('ska anropa onPress när den trycks', () => {
  const onPressMock = jest.fn();
  const { getByText } = render(<Button title="Tryck här" onPress={onPressMock} />);
  
  fireEvent.press(getByText('Tryck här'));
  
  expect(onPressMock).toHaveBeenCalledTimes(1);
});
```

### 2. Formulärinput

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { TextInput } from '../TextInput';

it('ska uppdatera text och anropa onChangeText', () => {
  const onChangeTextMock = jest.fn();
  const { getByPlaceholderText } = render(
    <TextInput placeholder="Skriv något" onChangeText={onChangeTextMock} />
  );
  
  const input = getByPlaceholderText('Skriv något');
  fireEvent.changeText(input, 'Ny text');
  
  expect(onChangeTextMock).toHaveBeenCalledWith('Ny text');
});
```

### 3. Swipe och Scroll

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { SwipeableItem } from '../SwipeableItem';

it('ska anropa onSwipe när den sveps', () => {
  const onSwipeMock = jest.fn();
  const { getByTestId } = render(<SwipeableItem onSwipe={onSwipeMock} />);
  
  const swipeableItem = getByTestId('swipeable-item');
  fireEvent(swipeableItem, 'swipe', { dx: -200 });
  
  expect(onSwipeMock).toHaveBeenCalledTimes(1);
});
```

## Asynkront beteende

### 1. Vänta på asynkrona uppdateringar

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AsyncButton } from '../AsyncButton';

it('ska uppdatera text efter asynkron operation', async () => {
  const { getByText, queryByText } = render(<AsyncButton />);
  
  // Initialt tillstånd
  expect(getByText('Klicka här')).toBeTruthy();
  expect(queryByText('Laddar...')).toBeNull();
  
  // Klicka på knappen
  fireEvent.press(getByText('Klicka här'));
  
  // Efter klick, ladda-tillstånd
  expect(getByText('Laddar...')).toBeTruthy();
  
  // Vänta på att operationen slutförs
  await waitFor(() => {
    expect(getByText('Klart!')).toBeTruthy();
    expect(queryByText('Laddar...')).toBeNull();
  });
});
```

### 2. Mocka timers

```typescript
import { render, fireEvent, act } from '@testing-library/react-native';
import { Timer } from '../Timer';

it('ska uppdatera timer korrekt', () => {
  jest.useFakeTimers();
  
  const { getByText } = render(<Timer initialSeconds={60} />);
  expect(getByText('01:00')).toBeTruthy();
  
  // Framåt 10 sekunder
  act(() => {
    jest.advanceTimersByTime(10000);
  });
  
  expect(getByText('00:50')).toBeTruthy();
  
  jest.useRealTimers();
});
```

## Mockning för UI-tester

### 1. Navigeringsmockar

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { ProfileButton } from '../ProfileButton';

// Mocka navigationskontext
const mockNavigation = {
  navigate: jest.fn()
};

it('ska navigera till profilskärmen vid klick', () => {
  const { getByText } = render(
    <ProfileButton navigation={mockNavigation} />
  );
  
  fireEvent.press(getByText('Gå till profil'));
  
  expect(mockNavigation.navigate).toHaveBeenCalledWith('Profile');
});
```

### 2. Context-mockar

```typescript
import { render } from '@testing-library/react-native';
import { UserProfile } from '../UserProfile';
import { UserContext } from '../../context/UserContext';

it('ska visa användardata från context', () => {
  const mockUser = {
    name: 'Test User',
    email: 'test@example.com'
  };
  
  const { getByText } = render(
    <UserContext.Provider value={{ user: mockUser }}>
      <UserProfile />
    </UserContext.Provider>
  );
  
  expect(getByText('Test User')).toBeTruthy();
  expect(getByText('test@example.com')).toBeTruthy();
});
```

### 3. API-mockar

```typescript
import { render, waitFor } from '@testing-library/react-native';
import { UserList } from '../UserList';

// Mocka API-anrop
jest.mock('@/api/userApi', () => ({
  fetchUsers: jest.fn(() => Promise.resolve([
    { id: '1', name: 'User 1' },
    { id: '2', name: 'User 2' }
  ]))
}));

it('ska visa användarlista från API', async () => {
  const { getByText } = render(<UserList />);
  
  // Vänta på att API-anropet slutförs
  await waitFor(() => {
    expect(getByText('User 1')).toBeTruthy();
    expect(getByText('User 2')).toBeTruthy();
  });
});
```

## Testning av olika tillstånd

### 1. Loading-tillstånd

```typescript
it('ska visa laddningsindikator', () => {
  const { getByTestId } = render(<DataComponent isLoading={true} />);
  expect(getByTestId('loading-indicator')).toBeTruthy();
});
```

### 2. Error-tillstånd

```typescript
it('ska visa felmeddelande', () => {
  const { getByText } = render(
    <DataComponent error="Kunde inte ladda data" />
  );
  expect(getByText('Kunde inte ladda data')).toBeTruthy();
});
```

### 3. Tom-tillstånd

```typescript
it('ska visa meddelande för tom lista', () => {
  const { getByText } = render(<List items={[]} />);
  expect(getByText('Inga objekt att visa')).toBeTruthy();
});
```

## Testning av form-komponenter

```typescript
describe('<LoginForm />', () => {
  it('ska validera e-postadress', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<LoginForm />);
    
    // Hitta input
    const emailInput = getByPlaceholderText('E-post');
    const submitButton = getByText('Logga in');
    
    // Ange ogiltig e-post och submit
    fireEvent.changeText(emailInput, 'invalidemail');
    fireEvent.press(submitButton);
    
    // Kontrollera att valideringsfel visas
    expect(getByText('Ogiltig e-postadress')).toBeTruthy();
    
    // Ange giltig e-post och submit
    fireEvent.changeText(emailInput, 'valid@example.com');
    fireEvent.press(submitButton);
    
    // Kontrollera att felet försvann
    expect(queryByText('Ogiltig e-postadress')).toBeNull();
  });
});
```

## Snapshottest

```typescript
import { render } from '@testing-library/react-native';
import { Badge } from '../Badge';

it('ska matcha snapshot', () => {
  const { toJSON } = render(<Badge text="Nytt" color="red" />);
  expect(toJSON()).toMatchSnapshot();
});
```

## Vanliga fallgropar

1. **Undvik implementationsdetaljer** - Testa inte intern state eller privata metoder
2. **Hitta element med tillgängliga attribut** - Använd text, testID eller tillgänglighetsroller
3. **Uppdatera snapshots med försiktighet** - Kontrollera faktiska ändringar
4. **Hantera timeouts** - Använd korta timeouts för snabba tester
5. **Rensa after mocks** - Återställ alla mockade funktioner efter tester

## Förbättra testens läsbarhet

```typescript
// Gör testnamnen läsbara för människor
it('ska visa felmeddelande när nätverket inte är tillgängligt', () => {
  // Test implementation
});

// Gruppera relaterade tester
describe('när användaren är inloggad', () => {
  it('ska visa användarnamn', () => {
    // Test implementation
  });
  
  it('ska visa logga ut-knapp', () => {
    // Test implementation
  });
});

// Använd hjälpfunktioner för repetitiva uppgifter
function renderComponentWithUser(userProps = {}) {
  const defaultProps = {
    name: 'Test User',
    email: 'test@example.com'
  };
  
  const user = { ...defaultProps, ...userProps };
  
  return render(
    <UserContext.Provider value={{ user }}>
      <UserProfile />
    </UserContext.Provider>
  );
}
```

## Debugging av UI-tester

1. **Använd debug-metoden**
   ```typescript
   const { debug } = render(<MyComponent />);
   debug(); // Skriver ut komponentträdet
   ```

2. **Logga DOM-element**
   ```typescript
   const { getByTestId } = render(<MyComponent />);
   const element = getByTestId('my-element');
   console.log(element.props); // Visa elementets props
   ```

3. **Inspektera testresultat**
   ```typescript
   const { container } = render(<MyComponent />);
   console.log(container.toJSON()); // Visa hela komponentträdet
   ``` 