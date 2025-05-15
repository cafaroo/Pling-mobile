# Testguide för Team-modulen

## Översikt

Denna guide beskriver hur man testar Team-modulen i Pling-applikationen. Guiden täcker både manuella testprocedurer och automatiserade tester för att säkerställa att alla team-funktioner fungerar korrekt.

## Innehållsförteckning

1. [Manuella testprocedurer](#manuella-testprocedurer)
2. [Automatiserade tester](#automatiserade-tester)
3. [Prestandatestning](#prestandatestning)
4. [Tillgänglighetstestning](#tillgänglighetstestning)
5. [Testmiljöer](#testmiljöer)

## Manuella testprocedurer

### 1. Team-hantering

#### 1.1 Skapa team

**Förutsättningar:**
- Inloggad användare med behörighet att skapa team

**Testprocedur:**
1. Navigera till Team-skärmen
2. Klicka på "Skapa team"-knappen
3. Fyll i teamnamn: "Testteam"
4. Fyll i beskrivning: "Detta är ett testteam"
5. Ladda upp en profilbild för teamet
6. Klicka på "Skapa"-knappen

**Förväntade resultat:**
- Teamet skapas utan fel
- Användaren navigeras till den nya teamvyn
- Teamnamn, beskrivning och profilbild visas korrekt
- Användaren är automatiskt tilldelad rollen "owner"

#### 1.2 Redigera team

**Förutsättningar:**
- Inloggad användare med "owner" eller "admin"-roll i ett team

**Testprocedur:**
1. Navigera till Team-skärmen
2. Välj ett befintligt team
3. Klicka på "Inställningar"-fliken
4. Ändra teamnamn till "Uppdaterat testteam"
5. Ändra beskrivning
6. Ladda upp en ny profilbild
7. Klicka på "Spara"-knappen

**Förväntade resultat:**
- Förändringarna sparas utan fel
- Uppdaterad information visas omedelbart i UI
- Bekräftelsemeddelande visas till användaren

#### 1.3 Ta bort team

**Förutsättningar:**
- Inloggad användare med "owner"-roll i ett team

**Testprocedur:**
1. Navigera till Team-skärmen
2. Välj ett befintligt team
3. Klicka på "Inställningar"-fliken
4. Scrolla ner till "Fara zonen"
5. Klicka på "Ta bort team"-knappen
6. Bekräfta borttagning i bekräftelsedialogen

**Förväntade resultat:**
- Teamet tas bort utan fel
- Användaren navigeras tillbaka till startskärmen för team
- Teamet visas inte längre i teamlistan

### 2. Medlemshantering

#### 2.1 Bjuda in medlemmar

**Förutsättningar:**
- Inloggad användare med "owner" eller "admin"-roll i ett team

**Testprocedur:**
1. Navigera till Team-skärmen
2. Välj ett befintligt team
3. Klicka på "Medlemmar"-fliken
4. Klicka på "Bjud in medlemmar"-knappen
5. Ange e-postadress: "test@example.com"
6. Välj roll: "medlem"
7. Klicka på "Skicka inbjudan"-knappen

**Förväntade resultat:**
- Inbjudan skickas utan fel
- Bekräftelsemeddelande visas till användaren
- Inbjudan visas i listan över väntande inbjudningar

#### 2.2 Hantera medlemsroller

**Förutsättningar:**
- Inloggad användare med "owner"-roll i ett team
- Minst en annan användare är medlem i teamet

**Testprocedur:**
1. Navigera till Team-skärmen
2. Välj ett befintligt team
3. Klicka på "Medlemmar"-fliken
4. Hitta en medlem i listan
5. Klicka på rollrullgardinsmenyn
6. Ändra medlemmens roll från "medlem" till "admin"
7. Bekräfta rollförändringen

**Förväntade resultat:**
- Rollförändringen sparas utan fel
- Medlemslistan uppdateras omedelbart med den nya rollen
- Bekräftelsemeddelande visas till användaren

#### 2.3 Ta bort medlemmar

**Förutsättningar:**
- Inloggad användare med "owner" eller "admin"-roll i ett team
- Minst en annan användare med lägre roll är medlem i teamet

**Testprocedur:**
1. Navigera till Team-skärmen
2. Välj ett befintligt team
3. Klicka på "Medlemmar"-fliken
4. Hitta en medlem i listan
5. Klicka på "Ta bort"-knappen bredvid medlemmen
6. Bekräfta borttagningen i bekräftelsedialogen

**Förväntade resultat:**
- Medlemmen tas bort från teamet utan fel
- Medlemslistan uppdateras omedelbart utan den borttagna medlemmen
- Bekräftelsemeddelande visas till användaren

### 3. Inbjudningshantering

#### 3.1 Acceptera inbjudan

**Förutsättningar:**
- Användare har mottagit en inbjudan via e-post

**Testprocedur:**
1. Klicka på inbjudningslänken i e-postmeddelandet
2. Logga in om du inte redan är inloggad
3. Granska teaminformationen
4. Klicka på "Acceptera inbjudan"-knappen

**Förväntade resultat:**
- Användaren läggs till i teamet utan fel
- Användaren navigeras till teamvyn
- Användaren har den roll som angavs i inbjudan

#### 3.2 Avböja inbjudan

**Förutsättningar:**
- Användare har mottagit en inbjudan via e-post

**Testprocedur:**
1. Klicka på inbjudningslänken i e-postmeddelandet
2. Logga in om du inte redan är inloggad
3. Granska teaminformationen
4. Klicka på "Avböj inbjudan"-knappen

**Förväntade resultat:**
- Inbjudan markeras som avböjd utan fel
- Användaren navigeras till sin startskärm
- Om användaren navigerar till team-skärmen visas inte det avböjda teamet

## Automatiserade tester

### 1. Komponenttester

#### 1.1 TeamMemberList

```typescript
// tests/components/TeamMemberList.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TeamMemberList } from '@/components/team/TeamMemberList';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('TeamMemberList', () => {
  const queryClient = new QueryClient();
  
  const mockMembers = [
    {
      id: '1',
      user_id: '1',
      team_id: 'team1',
      role: 'owner',
      status: 'active',
      created_at: new Date().toISOString(),
      joined_at: new Date().toISOString(),
      user: {
        id: '1',
        name: 'Teamägare',
        email: 'owner@example.com',
        avatar_url: 'https://example.com/avatar1.png'
      }
    },
    {
      id: '2',
      user_id: '2',
      team_id: 'team1',
      role: 'member',
      status: 'active',
      created_at: new Date().toISOString(),
      joined_at: new Date().toISOString(),
      user: {
        id: '2',
        name: 'Teammedlem',
        email: 'member@example.com',
        avatar_url: 'https://example.com/avatar2.png'
      }
    }
  ];
  
  it('renderar medlemslistan korrekt', () => {
    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <TeamMemberList
          members={mockMembers}
          currentUserRole="owner"
          variant="default"
          showRoleBadges={true}
          showStatusBadges={true}
        />
      </QueryClientProvider>
    );
    
    expect(getByText('Teamägare')).toBeTruthy();
    expect(getByText('Teammedlem')).toBeTruthy();
  });
  
  it('visar inga kontroller för medlemmar med lägre behörighet', () => {
    const { queryByText } = render(
      <QueryClientProvider client={queryClient}>
        <TeamMemberList
          members={mockMembers}
          currentUserRole="member"
          variant="default"
          showRoleBadges={true}
          showStatusBadges={true}
        />
      </QueryClientProvider>
    );
    
    expect(queryByText('Ta bort')).toBeNull();
    expect(queryByText('Ändra roll')).toBeNull();
  });
});
```

#### 1.2 TeamSettings

```typescript
// tests/components/TeamSettings.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TeamSettings } from '@/components/team/TeamSettings';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/hooks/useTeamMutations', () => ({
  useUpdateTeam: () => ({
    mutate: jest.fn(),
    isLoading: false
  })
}));

describe('TeamSettings', () => {
  const queryClient = new QueryClient();
  
  const mockTeam = {
    id: 'team1',
    name: 'Testteam',
    description: 'Testbeskrivning',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const mockSubscription = {
    id: 'sub1',
    team_id: 'team1',
    tier: 'basic',
    status: 'active',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  it('renderar teaminställningar korrekt', () => {
    const { getByText, getByDisplayValue } = render(
      <QueryClientProvider client={queryClient}>
        <TeamSettings
          team={mockTeam}
          subscription={mockSubscription}
        />
      </QueryClientProvider>
    );
    
    expect(getByText('Teaminställningar')).toBeTruthy();
    expect(getByDisplayValue('Testteam')).toBeTruthy();
    expect(getByDisplayValue('Testbeskrivning')).toBeTruthy();
  });
  
  it('visar abonnemangsinformation', () => {
    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <TeamSettings
          team={mockTeam}
          subscription={mockSubscription}
        />
      </QueryClientProvider>
    );
    
    expect(getByText('Abonnemang')).toBeTruthy();
    expect(getByText('Basic')).toBeTruthy();
    expect(getByText('Aktivt')).toBeTruthy();
  });
});
```

### 2. Integrationstester

#### 2.1 Team-skärm med React Query

```typescript
// tests/screens/TeamScreen.test.tsx
import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { TeamScreen } from '@/app/(tabs)/team';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { teamService } from '@/services/teamService';

// Mock teamService
jest.mock('@/services/teamService', () => ({
  teamService: {
    getUserTeams: jest.fn(),
    getTeam: jest.fn()
  }
}));

describe('TeamScreen', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  beforeEach(() => {
    // Reset mock implementations
    jest.clearAllMocks();
  });
  
  it('visar laddningstillstånd när data laddas', async () => {
    // Mock implementation för getUserTeams
    teamService.getUserTeams.mockResolvedValue({
      data: null,
      error: null,
      status: 'success'
    });
    
    let getByTestId;
    
    await act(async () => {
      const result = render(
        <QueryClientProvider client={queryClient}>
          <TeamScreen />
        </QueryClientProvider>
      );
      getByTestId = result.getByTestId;
    });
    
    expect(getByTestId('loading-state')).toBeTruthy();
  });
  
  it('visar "skapa team" när användaren inte har team', async () => {
    // Mock implementation för getUserTeams - tom array
    teamService.getUserTeams.mockResolvedValue({
      data: [],
      error: null,
      status: 'success'
    });
    
    let getByText;
    
    await act(async () => {
      const result = render(
        <QueryClientProvider client={queryClient}>
          <TeamScreen />
        </QueryClientProvider>
      );
      getByText = result.getByText;
    });
    
    await waitFor(() => {
      expect(getByText('Skapa ditt första team')).toBeTruthy();
    });
  });
  
  it('visar teamdata när användaren har team', async () => {
    // Mock implementation för getUserTeams och getTeam
    const mockTeam = {
      id: 'team1',
      name: 'Testteam',
      description: 'En testbeskrivning',
      members: [
        {
          id: 'member1',
          user_id: 'user1',
          team_id: 'team1',
          role: 'owner',
          status: 'active'
        }
      ]
    };
    
    teamService.getUserTeams.mockResolvedValue({
      data: [mockTeam],
      error: null,
      status: 'success'
    });
    
    teamService.getTeam.mockResolvedValue({
      data: mockTeam,
      error: null,
      status: 'success'
    });
    
    let getByText;
    
    await act(async () => {
      const result = render(
        <QueryClientProvider client={queryClient}>
          <TeamScreen />
        </QueryClientProvider>
      );
      getByText = result.getByText;
    });
    
    await waitFor(() => {
      expect(getByText('Testteam')).toBeTruthy();
    });
  });
});
```

### 3. Enhetstester för teamService

```typescript
// tests/services/teamService.test.ts
import { teamService } from '@/services/teamService';
import { supabase } from '@/lib/supabase';

// Mock Supabase klient
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

describe('teamService', () => {
  beforeEach(() => {
    // Reset mock implementations
    jest.clearAllMocks();
  });
  
  describe('getTeam', () => {
    it('returnerar teamdata vid framgångsrik hämtning', async () => {
      const mockTeam = { id: 'team1', name: 'Testteam' };
      
      // Mock implementation för Supabase-anrop
      supabase.from.mockReturnThis();
      supabase.select.mockReturnThis();
      supabase.eq.mockReturnThis();
      supabase.single.mockResolvedValue({
        data: mockTeam,
        error: null
      });
      
      const result = await teamService.getTeam('team1');
      
      expect(supabase.from).toHaveBeenCalledWith('teams');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.eq).toHaveBeenCalledWith('id', 'team1');
      expect(result).toEqual({
        data: mockTeam,
        error: null,
        status: 'success'
      });
    });
    
    it('hanterar fel korrekt', async () => {
      // Mock implementation för Supabase-anrop med fel
      supabase.from.mockReturnThis();
      supabase.select.mockReturnThis();
      supabase.eq.mockReturnThis();
      supabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Teamet hittades inte' }
      });
      
      const result = await teamService.getTeam('nonexistent');
      
      expect(result).toEqual({
        data: null,
        error: 'Teamet hittades inte',
        status: 'error'
      });
    });
  });
  
  describe('createTeam', () => {
    it('skapar ett nytt team framgångsrikt', async () => {
      const newTeam = { name: 'Nytt team', description: 'Beskrivning' };
      const mockResponse = { 
        id: 'new-team-id', 
        ...newTeam, 
        created_at: new Date().toISOString() 
      };
      
      // Mock implementation för Supabase-anrop
      supabase.from.mockReturnThis();
      supabase.insert.mockResolvedValue({
        data: mockResponse,
        error: null
      });
      
      const result = await teamService.createTeam(newTeam);
      
      expect(supabase.from).toHaveBeenCalledWith('teams');
      expect(supabase.insert).toHaveBeenCalledWith(newTeam);
      expect(result).toEqual({
        data: mockResponse,
        error: null,
        status: 'success'
      });
    });
  });
});
```

## Prestandatestning

### 1. Lista med många teammedlemmar

**Testprocedur:**
1. Skapa ett test-team med 100+ medlemmar i testmiljön
2. Navigera till teamets medlemsskärm
3. Mät tid till första rendering (FCP)
4. Mät tid för interaktion (TTI)
5. Mät fps vid scrollning genom listan

**Förväntade resultat:**
- FCP: < 500ms
- TTI: < 1000ms
- Scrollning bör hålla 60fps utan märkbara hack

### 2. Optimistiska uppdateringar

**Testprocedur:**
1. Sätt nätverkshastigheten till "Slow 3G" i utvecklarverktygen
2. Ändra ett teamnamn och mät tid till UI-uppdatering
3. Ändra en medlems roll och mät tid till UI-uppdatering

**Förväntade resultat:**
- UI bör uppdateras omedelbart (< 100ms) trots långsam nätverksanslutning
- När nätverksanropet är klart bör ingen flimmer uppstå

## Tillgänglighetstestning

### 1. Skärmläsare

**Testprocedur:**
1. Aktivera TalkBack (Android) eller VoiceOver (iOS)
2. Navigera genom team-skärmen
3. Interagera med alla element på skärmen

**Förväntade resultat:**
- Alla interaktiva element bör ha meningsfulla beskrivningar
- Navigationsordningen bör vara logisk
- Alla åtgärder ska kunna utföras med endast skärmläsare

### 2. Kontrast och färgblindhet

**Testprocedur:**
1. Använd ett verktyg för kontrastanalys på UI-element
2. Testa gränssnittet med olika färgblindhetsimulatorer

**Förväntade resultat:**
- Alla text/bakgrundskombinationer bör ha en kontrastkvot på minst 4.5:1
- Alla interaktiva element bör vara tydligt synliga oavsett färgblindhet

## Testmiljöer

### 1. Utveckling

- **Syfte**: Snabb iterationsutveckling och enhetstester
- **Miljö**: Lokalt utvecklingsapi
- **Data**: Testdata, regelbundet återställd

### 2. Testmiljö

- **Syfte**: Integrationstester och användaracceptanstester
- **Miljö**: Isolerad Supabase-instans
- **Data**: Stabil testdatamängd

### 3. Produktionsspegelmiljö

- **Syfte**: Prestandatestning och slutlig QA
- **Miljö**: Spegel av produktionsmiljön
- **Data**: Anonymiserad kopia av produktionsdata

## Krav för testgodkännande

För att godkänna en ny funktion i team-modulen måste följande kriterier uppfyllas:

1. Alla automatiserade enhetstester passerar
2. Alla automatiserade integrationstester passerar
3. Alla manuella testfall har utförts utan fel
4. Prestandamålen uppfylls
5. Inga högt prioriterade tillgänglighetsproblem finns
6. Kodgranskning är slutförd utan kritiska kommentarer

## Testrapportering

För varje testad funktion bör en standardiserad testrapport skapas som inkluderar:

- Testade användningsfall
- Testresultat (Godkänd/Underkänd)
- Eventuella avvikelser med allvarlighetsgrad
- Skärmdumpar eller videoupptagningar för visuell verifiering
- Prestandamätningar
- Rekommendationer för förbättringar 