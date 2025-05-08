    # Team-kommunikation - Implementationssammanfattning

    ## Översikt
    Detta dokument beskriver implementationen av team-kommunikationsfunktionaliteten i Pling-appen. Funktionaliteten möjliggör realtidsmeddelandehantering mellan medlemmar i ett team, med stöd för bilagor, reaktioner och omnämnanden.

    ## Domänmodell

    ### Entiteter och värdesobjekt

    #### TeamMessage (Aggregatrot)
    - Representerar ett enskilt meddelande inom ett team
    - Innehåller information om avsändare, innehåll, bilagor, omnämnanden och reaktioner
    - Har stöd för redigering, borttagning och reaktioner
    - Publicerar domänhändelser vid skapande, redigering, radering och reaktioner

    #### MessageAttachment (Värdesobjekt)
    - Representerar en bilaga till ett meddelande (bild, fil eller länk)
    - Innehåller metadata som URL, namn, storlek och MIME-typ
    - Har hjälpmetoder för att formatera och validera bilagor

    #### MessageMention (Värdesobjekt)
    - Representerar ett omnämnande av en användare i ett meddelande
    - Innehåller användarens ID samt position och längd i meddelandet
    - Har hjälpmetoder för att identifiera överlappningar och extrahera omnämnanden

    #### MessageReaction (Värdesobjekt)
    - Representerar en emoji-reaktion från en eller flera användare
    - Spårar vilka användare som har reagerat med en viss emoji
    - Har metoder för att lägga till, ta bort och hantera användarreaktioner

    ### Domänhändelser
    - **TeamMessageCreated**: När ett nytt meddelande skapas
    - **TeamMessageEdited**: När ett meddelande redigeras
    - **TeamMessageDeleted**: När ett meddelande tas bort
    - **TeamMessageReacted**: När en användare reagerar på ett meddelande

    ## Databasmodell

    En SQL-migrering (team_messages.sql) definierar följande tabeller:

    - **team_messages**: Huvudtabell för meddelanden med innehåll, avsändare, team och metadata
    - **team_message_attachments**: Bilagor till meddelanden
    - **team_message_reactions**: Reaktioner på meddelanden från olika användare
    - **team_message_mentions**: Omnämnanden av användare i meddelanden
    - **team_message_read_status**: Lässtatus för meddelanden, för att spåra olästa meddelanden

    Tabellerna har optimerade index och RLS-policyer (Row Level Security) för att säkerställa att endast behöriga användare kan se, skapa eller redigera meddelanden.

    ## Repository-lager

    **TeamMessageRepository** definierar gränssnittet för persistens med följande metoder:
    - findById: Hämta ett specifikt meddelande
    - findByTeamId: Hämta alla meddelanden för ett team
    - searchMessages: Sök efter meddelanden med specifik sökterm
    - findMentionsForUser: Hitta meddelanden där en användare omnämns
    - save/update: Spara eller uppdatera ett meddelande
    - delete: Radera ett meddelande (logisk radering)
    - getUnreadCount: Hämta antal olästa meddelanden
    - markAllAsRead: Markera alla meddelanden som lästa

    **SupabaseTeamMessageRepository** implementerar detta gränssnitt med Supabase som datakälla, med optimerad hantering av relationer mellan meddelanden, bilagor, reaktioner och omnämnanden.

    ## Applikationslager

    ### CreateTeamMessageUseCase
    - Hanterar validering och skapande av nya meddelanden
    - Verifierar att användaren är medlem i teamet
    - Anropar domänmodellen och repository för att spara meddelandet

    ### useTeamMessages (React Query Hook)
    - Hanterar laddning, paginering och cachning av meddelanden med React Query
    - Stöder sökning och filtrering av meddelanden
    - Hanterar CRUD-operationer för meddelanden (skapa, läsa, uppdatera, radera)
    - Implementerar realtidsuppdateringar med Supabase-prenumerationer
    - Hanterar reaktioner, redigering och borttagning av meddelanden
    - Spårar lässtatus och olästa meddelanden

    ## UI-komponenter

    ### TeamChatContainer
    - Huvud-container som integrerar alla chat-komponenter
    - Hanterar sökning och navigering i chatten
    - Visa laddnings- och feltillstånd

    ### TeamMessageList
    - Visar meddelanden i en virtualiserad lista
    - Hanterar infinite-scroll för att ladda fler meddelanden
    - Optimerad för prestanda med memo och virtualisering

    ### TeamMessageItem
    - Visar ett enskilt meddelande
    - Hanterar användarinteraktioner (redigeringsmeny, reaktioner)
    - Visar avsändarinformation, tidsstämpel och status (redigerad/borttagen)

    ### MessageComposer
    - Gränssnitt för att skriva och skicka nya meddelanden
    - Stöd för att bifoga bilder och filer
    - Integrerar med Expo-komponenter för fil- och bildval

    ### MessageAttachmentView
    - Renderar bilagor baserat på typ (bild, fil, länk)
    - Ger korrekt visuell representation av olika filtyper
    - Hanterar klick-händelser för att öppna/visa bilagor

    ### MessageReactionsBar
    - Visar reaktioner på meddelanden
    - Låter användare växla egna reaktioner
    - Visar antal reaktioner per emoji

    ### MessageEditor
    - Gränssnitt för att redigera befintliga meddelanden
    - Hanterar spara/avbryt-funktionalitet
    - Validerar meddelandeinnehåll

    ## Realtidsfunktionalitet
    - Implementerad med Supabase Realtime för att lyssna på databasändringar
    - Automatiskt uppdatera UI när nya meddelanden skapas eller befintliga ändras
    - Optimerad för att hantera flera samtidiga användare 

    ## Säkerhet och behörigheter
    - Row Level Security för att säkerställa att endast teammedlemmar kan se eller ändra meddelanden
    - Validering av användarens teammedlemskap vid varje operation
    - Policies för att begränsa åtkomst baserat på användarroll och avsändare

    ## Sammanfattning
    Implementationen följer DDD-principer (Domain-Driven Design) med en tydlig separation av ansvarsområden:
    - Domänlager för affärslogik
    - Repository-lager för persistens
    - Applikationslager för orkestrering
    - UI-lager för presentation och interaktion

    Systemet är byggt för att vara skalbart, underhållbart och prestandaoptimerat, med fokus på användarupplevelse och realtidsinteraktion. 

## Implementation av Chatt-trådning (Planerad)

För att utöka chattfunktionaliteten med stöd för trådade meddelanden planeras följande uppgifter:

### 1. Domänmodell
- **Modifiera `TeamMessage`-entiteten:**
    - Lägg till `parentId: UniqueId | null` (för att länka svar till ett huvudmeddelande).
    - Lägg till `threadReplyCount: number` (för att visa antal svar i en tråd).
    - Lägg till `lastReplyAt: Date | null` (för sortering och indikering av senaste aktivitet i tråden).
- **Definiera ny domänhändelse:**
    - `ThreadReplyCreated`: När ett nytt svar skapas i en tråd.

### 2. Databasmodell (utökning av `team_messages.sql`) ✅
- **Uppdatera `team_messages`-tabellen:** ✅
    - Lägg till kolumnen `parent_message_id UUID REFERENCES team_messages(id) ON DELETE SET NULL DEFAULT NULL`. ✅
    - Lägg till kolumnen `thread_reply_count INTEGER NOT NULL DEFAULT 0`. ✅
    - Lägg till kolumnen `last_reply_at TIMESTAMPTZ DEFAULT NULL`. ✅
- **Implementera logik (triggers eller applikationslogik):**
    - För att automatiskt uppdatera `thread_reply_count` och `last_reply_at` på det överordnade meddelandet när ett nytt trådsvar skapas eller tas bort.

### 3. Repository-lager (`TeamMessageRepository`)
- **Nya metoder:**
    - `findByParentId(parentId: UniqueId, paginationOptions): Promise<TeamMessage[]>`: För att hämta alla svar i en specifik tråd.
- **Uppdatera befintliga metoder:**
    - `save/update`: Säkerställ hantering av `thread_reply_count` och `last_reply_at` på föräldrameddelandet vid skapande/uppdatering av trådsvar.

### 4. Applikationslager
- **Nytt Användarfall (Use Case):**
    - `CreateThreadReplyUseCase`:
        - Validering av att `parentId` är ett giltigt meddelande.
        - Skapande av nytt `TeamMessage` med `parentId` satt.
        - Anrop till repository för att spara.
        - Initiering av uppdatering av räknare på föräldrameddelandet.
- **Uppdatera `useTeamMessages` (React Query Hook):**
    - Funktion för att hämta meddelanden för en specifik tråd (använder `findByParentId`).
    - Mutation för att skapa ett svar i en tråd (använder `CreateThreadReplyUseCase`).
    - Säkerställ att `threadReplyCount` och `lastReplyAt` hämtas för huvudlistan av meddelanden för att kunna visa trådindikatorer.

### 5. UI-komponenter
- **Modifiera `TeamMessageItem`:**
    - Visa en "Svara i tråd"-knapp/ikon.
    - Om `threadReplyCount > 0`, visa antalet svar och eventuellt avatars/namn på de som svarat, samt en länk/knapp för att öppna tråden.
    - Visuellt skilja på om meddelandet visas i huvudflödet eller som en del av en specifik trådvy.
- **Ny komponent: `ThreadView` (eller `ThreadDetailPanel`, `ThreadScreen`):**
    - Visar det ursprungliga (förälder) meddelandet tydligt överst.
    - Listar alla svar på det meddelandet (återanvänder `TeamMessageItem`-komponenter).
    - Innehåller en `MessageComposer` längst ner, kontextuellt kopplad för att skriva nya svar i den aktuella tråden.
- **Modifiera `MessageComposer`:**
    - Måste kunna ta emot och använda en `parentId` när ett svar i en tråd komponeras.

### 6. Realtidsfunktionalitet
- **Utöka Supabase Realtime-prenumerationer:**
    - Säkerställ att UI uppdateras i realtid när nya svar läggs till i en tråd.
    - Uppdatera `threadReplyCount` och `lastReplyAt` på föräldrameddelandet i huvudlistan när ett nytt svar kommer in.

### 7. Testning
- **Enhetstester:**
    - För ny och modifierad domänlogik i `TeamMessage`.
    - För det nya användarfallet `CreateThreadReplyUseCase`.
- **Integrationstester:**
    - För `TeamMessageRepository` med fokus på trådrelaterade operationer (hämta svar, uppdatera räknare).
- **UI-tester:**
    - För interaktioner med "Svara i tråd".
    - För visning och interaktion inom `ThreadView`.
    - För att säkerställa att `MessageComposer` fungerar korrekt i trådkontext.
- **End-to-End-tester (vid behov):**
    - För hela flödet av att skapa och visa trådade meddelanden. 