# Pling-mobile Komponentbibliotek

Det här dokumentet ger en översikt över grundläggande UI-komponenter i Pling-mobile-applikationen. Komponentbiblioteket är organiserat efter funktion och användningsområde för att göra det enkelt att hitta och återanvända komponenter.

## Struktur

Komponentbiblioteket är strukturerat enligt följande:

1. **Grundläggande komponenter** - Återanvändbara byggstenar (knappar, textfält, kort, etc.)
2. **Sammansatta komponenter** - Kombinerar flera grundläggande komponenter (formulär, listor, etc.)
3. **Skärmspecifika komponenter** - Specialiserade komponenter för specifika skärmar/funktioner
4. **Providers och kontext** - Komponenter för tillstånd och data över komponentträdet
5. **HOC (Higher-Order Components)** - Komponenter som tillför funktionalitet genom wrapping

## Allmänna designprinciper

Alla komponenter i Pling-mobile följer dessa designprinciper:

1. **Container/Presentation-mönstret** - Separerar affärslogik från presentation
2. **Återanvändbarhet** - Komponenter utformas för att vara återanvändbara
3. **Testbarhet** - Komponenter designas för att vara enkla att testa
4. **Tillgänglighet** - Tillgänglighetsstöd som standard
5. **Konsekvent utseende** - Följer designsystemet

## Användning av dette bibliotek

För att använda en komponent från detta bibliotek:

1. Identifiera vilken typ av komponent du behöver
2. Läs dokumentationen för komponenten
3. Se användningsexempel för bästa praxis
4. Importera och använd komponenten i din kod

Exempel:

```tsx
import { Button } from '@/ui/shared/components/Button';

// Användning
<Button 
  label="Klicka här"
  variant="primary" 
  onPress={() => handlePress()} 
/>
```

## Komponentindex

### Grundläggande komponenter

- [Button](./components/Button.md)
- [TextField](./components/TextField.md)
- [Card](./components/Card.md)
- [Typography](./components/Typography.md)
- [Icon](./components/Icon.md)
- [Divider](./components/Divider.md)
- [Checkbox](./components/Checkbox.md)
- [RadioButton](./components/RadioButton.md)
- [Switch](./components/Switch.md)

### Sammansatta komponenter

- [Form](./components/Form.md)
- [List](./components/List.md)
- [Dialog](./components/Dialog.md)
- [Modal](./components/Modal.md)
- [DropdownMenu](./components/DropdownMenu.md)
- [TabView](./components/TabView.md)
- [SearchBar](./components/SearchBar.md)

### Skärmspecifika komponenter

- [TeamMemberList](./components/TeamMemberList.md)
- [TeamPermissionManager](./components/TeamPermissionManager.md)
- [ActivityFeed](./components/ActivityFeed.md)
- [UserProfileCard](./components/UserProfileCard.md)
- [SettingsForm](./components/SettingsForm.md)

### Providers och kontext

- [ThemeProvider](./providers/ThemeProvider.md)
- [SnackbarProvider](./providers/SnackbarProvider.md)
- [DialogProvider](./providers/DialogProvider.md)
- [UIStateProvider](./providers/UIStateProvider.md)

### HOC

- [withErrorBoundary](./hoc/withErrorBoundary.md)
- [withPerformanceTracking](./hoc/withPerformanceTracking.md)
- [withTheme](./hoc/withTheme.md)

## Organisering för komponentdokument

Varje komponentdokument följer samma struktur:

1. **Översikt** - Kort beskrivning av komponenten
2. **Props** - Tabell över alla props med typer och beskrivningar
3. **Användningsexempel** - Kod för olika användningssätt
4. **Varianter** - Olika utseenden eller beteenden för komponenten
5. **Tillgänglighetsinformation** - Stöd för skärmläsare, färgkontrast, etc.
6. **Kända problem** - Eventuella begränsningar eller problem
7. **Relaterade komponenter** - Andra komponenter som ofta används tillsammans med denna

## Implementation

Komponentdokumentationen i detta bibliotek kommer att fortsätta uppdateras allt eftersom nya komponenter läggs till eller befintliga komponenter förändras. Implementationsplanen är:

1. Dokumentera de mest grundläggande komponenter först
2. Lägga till sammansatta komponenter
3. Dokumentera specifika funktionsområden
4. Förbättra dokumentationen med fler användningsexempel

## Bidragande

För att lägga till eller uppdatera dokumentation för en komponent:

1. Följ den standardiserade strukturen beskriven ovan
2. Inkludera relevanta kod- och användningsexempel
3. Specificera alla props med typer och beskrivningar
4. Visa olika varianter och användningssätt
5. Dokumentera eventuella begränsningar eller specialöverväganden 