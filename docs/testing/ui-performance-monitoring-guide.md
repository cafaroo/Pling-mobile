# Guide för UI-prestandamätning i Pling-mobile

Den här guiden beskriver hur man använder prestandamätningssystemet i Pling-mobile för att övervaka, mäta och förbättra användargränssnittsresponsivitet.

## Översikt

Prestandamätningssystemet består av flera komponenter:

1. **PerformanceMonitor** - Grundläggande infrastruktur för att spåra operationer och deras prestanda
2. **UIPerformanceMonitor** - Specialiserad klass för att mäta UI-specifika prestandametriker 
3. **useUIPerformance** - React-hook för att enkelt integrera prestandamätning i funktionskomponenter
4. **withPerformanceTracking** - HOC för att automatiskt spåra komponentprestanda
5. **useNavigationPerformance** - Hook för att mäta navigationsprestanda
6. **PerformanceMonitorProvider** - Context-provider för att konfigurera och komma åt prestandadata
7. **PerformanceStatsOverlay** - Visuell komponent för att visa prestandastatistik i realtid

## Konfiguration

### 1. Lägga till PerformanceMonitorProvider i applikationen

För att aktivera prestandamätning i hela appen, lägg till `PerformanceMonitorProvider` högt upp i komponentträdet:

```tsx
// App.tsx
import { PerformanceMonitorProvider } from '@/ui/shared/providers/PerformanceMonitorProvider';

export default function App() {
  return (
    <PerformanceMonitorProvider 
      autoStartMonitoring={true}
      initialOptions={{
        slowComponentThreshold: 16, // 16ms = 1 frame vid 60fps
        slowNavigationThreshold: 300, // 300ms
        reportToConsole: false,
        sampleRate: 0.1 // Spåra 10% av renderingar för att minimera overhead
      }}
    >
      {/* Resten av appen */}
      <RestOfApp />
    </PerformanceMonitorProvider>
  );
}
```

### 2. Lägga till prestandaöverlägget (valfritt)

För att visa realtidsstatistik direkt i appen under utveckling, lägg till `PerformanceStatsOverlay`:

```tsx
// App.tsx
import { PerformanceMonitorProvider } from '@/ui/shared/providers/PerformanceMonitorProvider';
import { PerformanceStatsOverlay } from '@/ui/shared/components/PerformanceStatsOverlay';

export default function App() {
  return (
    <PerformanceMonitorProvider autoStartMonitoring={true}>
      {/* Resten av appen */}
      <RestOfApp />
      
      {/* Bara visa overlay i utvecklingsmiljö */}
      {__DEV__ && <PerformanceStatsOverlay position="bottom-right" />}
    </PerformanceMonitorProvider>
  );
}
```

## Användning

### 1. Automatisk prestandaspårning med HOC

Använd `withPerformanceTracking` HOC för att spåra en komponents prestanda:

```tsx
import { withPerformanceTracking } from '@/ui/shared/components/withPerformanceTracking';

const MyComponent = (props) => {
  // Komponentimplementation
  return (
    <View>
      {/* Komponentinnehåll */}
    </View>
  );
};

// Exportera komponenten med prestandaspårning
export default withPerformanceTracking(MyComponent, {
  trackMount: true,      // Spåra monteringstid
  trackUpdates: true,    // Spåra uppdateringar
  trackUnmount: true,    // Spåra avmontering
  trackRender: true      // Spåra renderingstid
});
```

### 2. Manuell prestandaspårning med useUIPerformance-hook

Använd `useUIPerformance`-hooken för mer detaljerad kontroll över prestandamätning:

```tsx
import { useUIPerformance } from '@/application/shared/hooks/useUIPerformance';

const MyComponent = () => {
  const { 
    startRender, 
    endRender, 
    measureRender,
    measureInteraction,
    measureList
  } = useUIPerformance('MyComponent');
  
  // Mät en komplex rendering
  const renderComplexItem = () => {
    // Starta mätning
    const opId = startRender();
    
    // Utför komplex rendering...
    
    // Avsluta mätning
    endRender(opId);
  };
  
  // Mät en användarinteraktion
  const handleButtonPress = async () => {
    await measureInteraction('buttonPress', async () => {
      // Kod som körs vid knapptryckning
      await someAsyncOperation();
    });
  };
  
  // Mät en listrenderingsoperation
  const renderList = () => {
    measureList('itemList', items.length, () => {
      // Listrenderingskod här
    });
  };
  
  return (
    <View>
      {/* Komponentinnehåll */}
      <Button onPress={handleButtonPress} title="Klicka mig" />
    </View>
  );
};
```

### 3. Mäta navigationsprestanda

Använd `useNavigationPerformance`-hooken för att mäta navigeringstider mellan skärmar:

```tsx
import { useNavigationPerformance } from '@/application/shared/hooks/useNavigationPerformance';

const MyScreen = () => {
  const { 
    navigateToWithTracking,
    goBackWithTracking
  } = useNavigationPerformance('MyScreen');
  
  const handleNavigateToDetails = async () => {
    // Navigera och mät prestanda
    await navigateToWithTracking('details', { id: '123' });
  };
  
  const handleGoBack = async () => {
    // Gå tillbaka och mät prestanda
    await goBackWithTracking();
  };
  
  return (
    <View>
      <Button onPress={handleNavigateToDetails} title="Visa detaljer" />
      <Button onPress={handleGoBack} title="Tillbaka" />
    </View>
  );
};
```

## Prestandaövervakning och insikter

### Få tillgång till prestandaövervakaren

Använd `usePerformanceMonitor`-hooken för att komma åt prestandamätningar:

```tsx
import { usePerformanceMonitor } from '@/ui/shared/providers/PerformanceMonitorProvider';

const PerformanceDebugComponent = () => {
  const { 
    measurements,
    getMeasurements, 
    clearMeasurements,
    isMonitoringEnabled,
    toggleMonitoring
  } = usePerformanceMonitor();
  
  return (
    <View>
      <Text>Antal mätningar: {measurements.length}</Text>
      <Button 
        title={isMonitoringEnabled ? "Pausa mätning" : "Starta mätning"} 
        onPress={() => toggleMonitoring(!isMonitoringEnabled)} 
      />
      <Button title="Rensa mätningar" onPress={clearMeasurements} />
    </View>
  );
};
```

### Prestandabudgetar

Systemet använder följande prestandabudgetar för att identifiera potentiella problem:

1. **Komponentrendering**: 16ms (motsvarar 1 frame vid 60fps)
2. **Skärmnavigation**: 300ms
3. **Användarinteraktioner**: Varierar beroende på typ, men bör vara under 100ms för direkt feedback

## Att mäta specifika prestandaaspekter

### 1. FlatList-prestanda

Använd `measureList` för att mäta listrenderingsprestanda:

```tsx
const MyListComponent = ({ items }) => {
  const { measureList } = useUIPerformance('MyListComponent');
  
  const renderList = () => {
    return (
      <FlatList
        data={items}
        renderItem={({ item }) => <ListItem item={item} />}
        keyExtractor={item => item.id}
      />
    );
  };
  
  return (
    <View>
      {measureList('mainList', items.length, renderList)}
    </View>
  );
};
```

### 2. Bildladdningsprestanda

Mät bildladdningstid:

```tsx
const ImageWithPerformance = ({ uri, style }) => {
  const { startRender, endRender } = useUIPerformance('ImageWithPerformance');
  const [loaded, setLoaded] = useState(false);
  
  const handleLoadStart = () => {
    const opId = startRender();
    return opId;
  };
  
  const handleLoadEnd = (opId) => {
    endRender(opId);
    setLoaded(true);
  };
  
  const opId = useRef(null);
  
  return (
    <Image
      source={{ uri }}
      style={style}
      onLoadStart={() => { opId.current = handleLoadStart(); }}
      onLoad={() => handleLoadEnd(opId.current)}
      onError={() => endRender(opId.current)}
    />
  );
};
```

### 3. Formulärprestanda

Mät formulärinteraktioner:

```tsx
const PerformanceForm = () => {
  const { measureInteraction } = useUIPerformance('PerformanceForm');
  
  const handleSubmit = async (values) => {
    await measureInteraction('formSubmit', async () => {
      // Validera formulär
      // Skicka data
      await submitFormData(values);
    });
  };
  
  return (
    <Form onSubmit={handleSubmit}>
      {/* Formulärelement */}
    </Form>
  );
};
```

## Best Practices

1. **Minimal overhead**: Använd `sampleRate` för att minska mätningarnas påverkan på prestanda
2. **Fokuserad mätning**: Mät inte allt, fokusera på kända problemområden
3. **Deaktivera i produktion**: Överväg att inaktivera eller begränsa mätningarna i produktionsmiljö
4. **Hantera mätningsdata**: Rensa mätningar regelbundet för att undvika minnesproblem

## Prestandaförbättringar

När du har identifierat prestandaproblem, överväg dessa vanliga förbättringar:

1. **Memorisera komponenter**: Använd `React.memo` för att förhindra onödiga renderingar
2. **Använd useMemo och useCallback**: Optimera funktioner och beräknade värden
3. **Virtualisera långa listor**: Använd alltid FlatList/VirtualizedList för långa listor
4. **Optimera bilder**: Använd korrekt dimensionerade bilder och lazy loading
5. **Minska konfigurationsändringar**: Ändra inte konfiguration under render (t.ex. animationsvärden)
6. **Optimera re-rendering**: Undvik att ändra objekt- och arrayreferenser i varje rendering

## Avancerad användning

### Integrera med analysverktyg

Exportera prestandadata till analysverktyg:

```tsx
const exportPerformanceData = () => {
  const { measurements } = usePerformanceMonitor();
  
  // Konvertera mätningar till lämpligt format
  const formattedData = measurements.map(m => ({
    name: m.name,
    duration: m.duration,
    timestamp: m.startTime,
    success: m.success,
    // Ytterligare metainfo
  }));
  
  // Skicka till analysverktyg
  Analytics.logPerformanceMetrics(formattedData);
};
```

### Anpassa mätkategorier

Utöka UIPerformanceMetricType-enum för att lägga till egna mätkategorier:

```typescript
// Specialiserad prestandamätning för en viss del av appen
const { startRender, endRender } = useUIPerformance('CustomFeature');

const customMetric = startRender();
// Specialiserad kod...
endRender(customMetric);
```

## Felsökning

### Vanliga problem

1. **Hög mätnings-overhead**: Minska sampling rate eller begränsa vilka komponenter som spåras
2. **Minnesproblem**: Rensa mätningar regelbundet med `clearMeasurements`
3. **Inkonsekventa mätningar**: Säkerställ att start/end-anrop är balanserade

### Loggning av prestandaproblem

Konfigurera automatisk loggning av prestandaproblem:

```tsx
// I din App.tsx eller liknande
useEffect(() => {
  const monitor = UIPerformanceMonitor.getInstance({
    enabled: true,
    slowComponentThreshold: 16,
    slowNavigationThreshold: 300,
    reportToConsole: true
  });
  
  // Konfigurera intervall för rapportering
  const intervalId = setInterval(() => {
    const measurements = monitor.getUIMeasurements();
    
    // Filtrera problematiska mätningar
    const slowRenders = measurements.filter(m => 
      m.duration && m.duration > 16 && 
      m.parameters?.type === UIPerformanceMetricType.COMPONENT_RENDER
    );
    
    if (slowRenders.length > 0) {
      console.warn('Detected slow renders:', slowRenders);
      // Skicka till loggningssystem
    }
  }, 30000); // Var 30:e sekund
  
  return () => clearInterval(intervalId);
}, []);
```

## Slutsats

Prestandamätningssystemet ger dig möjlighet att övervaka, mäta och förbättra UI-responsiviteten i Pling-mobile-appen. Genom att integrera det med dina komponenter kan du:

1. Identifiera prestandaflaskhalsar
2. Mäta effekten av optimeringar 
3. Sätta konkreta prestandamål
4. Etablera kontinuerlig prestationsmätning inom utvecklingsprocessen

Använd dessa verktyg förnuftigt och du kommer att kunna skapa en snabbare, mer responsiv app för användarna. 