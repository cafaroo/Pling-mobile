# Testplan för resursbegränsningssystem

## Översikt

Detta dokument beskriver testplanen för resursbegränsningssystemet i Pling-applikationen. Testplanen omfattar både automatiserade och manuella tester för att säkerställa att systemet fungerar korrekt och ger användarna rätt feedback.

## Testområden

### 1. Enhetstester för resursbegränsningsstrategier

| ID | Testfall | Beskrivning | Förväntat resultat |
|----|----------|-------------|-------------------|
| UT-01 | BaseResourceLimitStrategy_isLimitReached | Testa isLimitReached med olika användningsvärden | Returnerar korrekt boolean-värde baserat på input |
| UT-02 | TeamLimitStrategy_calculateLimit | Testa beräkning av team-gränser för olika prenumerationsnivåer | Korrekt begränsningsvärde för varje prenumerationsnivå |
| UT-03 | TeamMemberLimitStrategy_calculateLimit | Testa beräkning av teammedlems-gränser för olika nivåer | Korrekt begränsningsvärde för varje prenumerationsnivå |
| UT-04 | ResourceLimitStrategyFactory_getStrategy | Testa fabrikens förmåga att returnera rätt strategi | Korrekt strategiimplementation för varje resurstyp |
| UT-05 | OrganizationResourceLimitStrategy_checkLimit | Testa organisationens resursbegränsningar | Korrekt begränsningskontroll för organisationsresurser |

```typescript
// Exempel på testfall för TeamLimitStrategy
describe('TeamLimitStrategy', () => {
  it('should calculate correct limit for basic plan', () => {
    const strategy = new TeamLimitStrategy();
    expect(strategy.calculateLimit('basic')).toBe(5);
  });
  
  it('should calculate correct limit for pro plan', () => {
    const strategy = new TeamLimitStrategy();
    expect(strategy.calculateLimit('pro')).toBe(25);
  });
  
  it('should calculate correct limit for enterprise plan', () => {
    const strategy = new TeamLimitStrategy();
    expect(strategy.calculateLimit('enterprise')).toBe(100);
  });
});
```

### 2. Integrationstester för ResourceTracking-service

| ID | Testfall | Beskrivning | Förväntat resultat |
|----|----------|-------------|-------------------|
| IT-01 | ResourceUsageTrackingService_updateResourceUsage | Testa uppdatering av resursanvändning | Uppdateringen lagras korrekt i databasen |
| IT-02 | ResourceUsageTrackingService_getResourceUsage | Testa hämtning av resursanvändning | Korrekt användningsdata returneras |
| IT-03 | ResourceUsageTrackingService_getResourceUsageHistory | Testa hämtning av användningshistorik | Korrekt historikdata returneras |
| IT-04 | ResourceUsageTrackingService_calculateUsageTrend | Testa beräkning av användningstrender | Korrekt trendvärde (procent) returneras |
| IT-05 | AutomaticResourceTrackingService_updateUsage | Testa automatisk uppdatering av användning | Alla resurstyper uppdateras korrekt |

```typescript
// Exempel på testfall för ResourceUsageTrackingService
describe('ResourceUsageTrackingService', () => {
  // Förbered testdatabas och testdata
  
  it('should update resource usage correctly', async () => {
    const service = new ResourceUsageTrackingService();
    const result = await service.updateResourceUsage(
      'test-org-id',
      'team',
      5
    );
    
    expect(result).toBe(true);
    
    // Verifiera databasändring
    const usageData = await supabase
      .from('resource_usage')
      .select('*')
      .eq('organization_id', 'test-org-id')
      .eq('resource_type', 'team')
      .single();
      
    expect(usageData.data.current_usage).toBe(5);
  });
});
```

### 3. Edge-case-tester för resursbegränsningar

| ID | Testfall | Beskrivning | Förväntat resultat |
|----|----------|-------------|-------------------|
| EC-01 | ResourceLimitStrategy_ZeroLimit | Testa beteende när begränsningen är 0 | Korrekt begränsningshantering |
| EC-02 | ResourceLimitStrategy_NegativeUsage | Testa med negativa användningsvärden | Korrekt felhantering/normalisering |
| EC-03 | ResourceLimitStrategy_HighVolumeUsage | Testa med extremt höga användningsvärden | Korrekt hantering utan prestandaproblem |
| EC-04 | ResourceTracking_ConcurrentUpdates | Testa samtidiga uppdateringar av samma resurs | Korrekt hantering av samtidighetsproblem |
| EC-05 | ResourceDisplayUI_MissingData | Testa UI-komponenter med saknad eller ofullständig data | Robust UI utan krascher |

### 4. Notifikationstester

| ID | Testfall | Beskrivning | Förväntat resultat |
|----|----------|-------------|-------------------|
| NT-01 | ResourceLimitNotification_NearLimit | Testa varningar när användning närmar sig gränsen | Korrekt varningsnotifikation skickas |
| NT-02 | ResourceLimitNotification_ReachedLimit | Testa notifikationer när gränsen nås | Korrekt begränsningsnotifikation skickas |
| NT-03 | PushNotificationService_DeviceRegistration | Testa registrering av enhetstoken | Token registreras korrekt i databasen |
| NT-04 | PushNotificationService_NotificationDelivery | Testa leverans av push-notifikationer | Notifikationer når testenheter |
| NT-05 | NotificationListener_ResourceWarningDisplay | Testa att NotificationListener visar varningar | Lokala notifikationer visas korrekt |

```typescript
// Exempel på testfall för ResourceLimitNotificationService
describe('ResourceLimitNotificationService', () => {
  // Mock NotificationAdapter
  const mockAdapter = {
    sendNotification: jest.fn().mockResolvedValue(undefined)
  };
  
  it('should send warning when usage is near limit', async () => {
    const service = new ResourceLimitNotificationService(mockAdapter);
    await service.sendLimitWarning(
      new UniqueId('test-org-id'),
      'team',
      8, // 80% av limit
      10,
      ['user-1', 'user-2']
    );
    
    expect(mockAdapter.sendNotification).toHaveBeenCalledTimes(1);
    expect(mockAdapter.sendNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'resource_limit_warning',
        userIds: ['user-1', 'user-2']
      })
    );
  });
});
```

### 5. UI-testning

| ID | Testfall | Beskrivning | Förväntat resultat |
|----|----------|-------------|-------------------|
| UI-01 | ResourceLimitProvider_ExposeContextData | Testa att providern exponerar all nödvändig data | Alla kontext-metoder och -data tillgängliga |
| UI-02 | ResourceLimitDisplay_ShowsCorrectValues | Testa att gränssnittsvärden är korrekta | Korrekt visning av användning och gränser |
| UI-03 | ResourceLimitDisplay_ProgressBar | Testa att förloppsindikatorn visar rätt information | Korrekt visuell representation |
| UI-04 | ResourceLimitError_ShowsErrorMessage | Testa felmeddelanden vid begränsningar | Tydliga och förståeliga felmeddelanden |
| UI-05 | UpgradePrompt_AppearsWhenNeeded | Testa att uppgraderingsförslag visas | Förslag visas vid lämpliga tillfällen |

### 6. E2E-testning

| ID | Testfall | Beskrivning | Förväntat resultat |
|----|----------|-------------|-------------------|
| E2E-01 | ResourceLimit_CreateTeam | Testa att skapa team upp till begränsningen | Korrekt begränsningshantering |
| E2E-02 | ResourceLimit_AddTeamMembers | Testa att lägga till medlemmar upp till begränsningen | Korrekt begränsningshantering |
| E2E-03 | ResourceWarning_VisualIndicator | Testa att visuella indikatorer visas vid hög användning | Korrekt varningsindikering |
| E2E-04 | ResourceLimit_UpgradeFlow | Testa uppgraderingsflödet när begränsning nås | Korrekt uppgraderingsförslag |
| E2E-05 | NotificationFlow_EndToEnd | Testa hela notifieringsflödet från gräns till notifikation | Hela notifikationsflödet fungerar |

## Testmiljö

### Testmiljöer

1. **Utvecklingsmiljö (lokal)**
   - För enhetstester och tidiga integrationstester
   - Använder mock-data för externa resurser

2. **Testmiljö (jgkfcqplopdncxbpwlyj)**
   - För fullständiga integrationstester och E2E-tester
   - Använder isolerade testorganisationer med testdata

3. **Staging-miljö**
   - För slutliga acceptanstester
   - Speglar produktionsmiljön så nära som möjligt

### Testdata

För att testa resursbegränsningar behöver vi testdata med:

1. **Organisationer med olika prenumerationsnivåer**
   - Basic-organisation (id: 'test-basic-org')
   - Pro-organisation (id: 'test-pro-org')
   - Enterprise-organisation (id: 'test-enterprise-org')

2. **Resurser nära begränsningsvärden**
   - Organisation med 4/5 team (80%, för varningar)
   - Organisation med 5/5 team (100%, för begränsningsfel)

3. **Testanvändare med olika roller**
   - Admin (id: 'test-admin-user')
   - Vanlig medlem (id: 'test-member-user')

## Testautomatisering

### Verktyg

1. **Jest** - För enhetstester och integrationstester
2. **Testing Library** - För komponenttester
3. **Detox** - För E2E-tester på mobilenheter
4. **Mock Service Worker** - För att mocka API-anrop

### CI/CD-integration

Tester ska köras automatiskt vid:
1. Pull Requests till utvecklingsbranch
2. Merge till huvudbranch
3. Schemalagd körning varje natt

## Rapportering och uppföljning

### Testrapporter

För varje testomgång ska följande dokumenteras:

1. **Testgenomförandedatum**
2. **Testversion och miljö**
3. **Antal genomförda/passerade/fallerade tester**
4. **Viktigaste upptäckta problem**
5. **Rekommendationer för åtgärder**

### Buggspårning

Alla problem som upptäcks ska loggas med:

1. **Problemkategori** (Funktionalitet, Prestanda, UI, etc.)
2. **Allvarlighetsgrad** (Kritisk, Hög, Medium, Låg)
3. **Reproducerbarhet** (Alltid, Ibland, Sällan)
4. **Steg för att reproducera**
5. **Förväntat vs. faktiskt resultat**
6. **Skärmdumpar eller loggar**

## Testkriterier för godkännande

1. **Alla enhetstester passerar** (100% passerade)
2. **Integrationstester har minst 95% passerade**
3. **Inga kritiska eller högt prioriterade buggar kvarstår**
4. **Prestandan möter definierade målvärden**
5. **E2E-testers visar korrekt beteende i verkliga scenarier**

## Ansvariga och tidplan

### Ansvariga

- **Testledare**: [Namn]
- **Ansvarig utvecklare**: [Namn]
- **QA-team**: [Namn]

### Tidplan

1. **Förberedelse av testmiljö och testdata**: 2-3 dagar
2. **Enhetstester**: 3-5 dagar
3. **Integrationstester**: 5-7 dagar
4. **UI- och E2E-tester**: 7-10 dagar
5. **Buggfixar och omtester**: 5-7 dagar
6. **Slutlig testrapport**: 2 dagar

Totalt: 3-4 veckor 