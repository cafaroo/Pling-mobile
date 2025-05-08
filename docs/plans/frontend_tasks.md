# Frontend UI/UX Implementation Tasks

## Introduktion

Detta dokument beskriver en föreslagen plan för design och implementation av användargränssnitt (UI) och användarupplevelse (UX) för Pling-applikationens kärnfunktioner: Autentisering (Auth), Användare (Profil) och Team. Planen bygger på principerna och komponenterna definierade i `frontend-design-guide.md`.

Om en "legacy setup" finns kan den användas som ytterligare inspiration vid behov.

## Allmänna UI/UX Principer

Alla implementationer bör sträva efter att följa dessa riktlinjer:

-   **Konsistens med Designguide:** Följ `frontend-design-guide.md` avseende färger, typografi, ikoner, spacing, komponentbibliotek (t.ex. `react-native-paper`) och interaktionsmönster.
-   **Responsiv Design:** Säkerställ god användbarhet på olika skärmstorlekar (mobil, surfplatta – även om fokus primärt är mobil enligt projektet).
-   **Tillgänglighet (Accessibility):** Sträva efter WCAG AA-nivå där det är möjligt. Inkludera semantisk HTML (React Native accessibility props), tillräcklig kontrast, och testning med skärmläsare.
-   **Tydliga Tillstånd:** Implementera tydliga visuella indikatorer för laddning (skelettk laddare, spinners), tomma tillstånd (med illustrationer och guidande text), och felhantering (inline, toasts, etc. enligt designguide).
-   **Intuitiv Navigation:** Säkerställ logiska flöden och enkel navigering mellan olika vyer och funktioner.
-   **Prestanda:** Optimera för snabba laddningstider och responsiva interaktioner.

## Prioriteringslegend

-   **P1 - Hög:** Kärnfunktionalitet som behövs för en grundläggande fungerande applikation.
-   **P2 - Medium:** Viktiga funktioner som förbättrar användarupplevelsen och kompletterar kärnfunktionerna.
-   **P3 - Låg:** Funktioner som kan implementeras senare eller "nice-to-haves".

## Uppdelning av Arbete per Domän

### Domän: Autentisering (Auth)

Syfte: Säker och användarvänlig process för inloggning och registrering.

| Prioritet | Uppgift                                                                    | Beskrivning och UX-noteringar                                                                                                                                                           | Referens (Designguide)                   |
| :-------- | :------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------- |
| P1        | **Inloggningsskärm**                                                       | Design och implementation av inloggningsformulär (e-post/lösenord). Tydliga felmeddelanden. "Glömt lösenord"-länk.                                                                          | Form Elements, Buttons, Error States     |
| P1        | **Registreringsskärm**                                                     | Design och implementation av registreringsformulär. Validering och tydliga felmeddelanden. Hantering av användarvillkor/integritetspolicy. Lösenordsstyrkeindikator kan övervägas.         | Form Elements, Buttons, Error States     |
| P1        | **"Glömt lösenord"-flöde**                                                 | Skärm för att ange e-post. Instruktioner för återställning (t.ex. via e-postlänk). Skärm för att ange nytt lösenord.                                                                          | Form Elements, Buttons                   |
| P2        | **Sociala Inloggningar** (om aktuellt)                                     | Implementation av knappar och flöden för t.ex. Google/Apple-inloggning.                                                                                                                    | Buttons                                  |
| P1        | **Laddningsindikatorer för Auth**                                          | Tydliga spinners/blockering av UI vid nätverksanrop under inloggning/registrering.                                                                                                         | Progress Indicators, Loading States      |

### Domän: Användare (Profil)

Syfte: Ge användaren en översikt och möjlighet att hantera sin personliga information och inställningar.

| Prioritet | Uppgift                                                                    | Beskrivning och UX-noteringar                                                                                                                                                           | Referens (Designguide)                   |
| :-------- | :------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------- |
| P1        | **Profilvy (Visa Profil)**                                                 | Visa användarinformation (avatar, namn, e-post). Snygg presentation. Länk till "Redigera profil". "Logga ut"-knapp.                                                                       | Cards, Avatar (från react-native-paper)  |
| P1        | **Redigera Profil-skärm**                                                  | Formulär för att redigera namn, ladda upp/ändra avatar, eventuell bio. Tydlig validering och spara/avbryt-funktioner. Använd befintlig bildhantering (liknande `MessageComposer`).            | Form Elements, Buttons, Cards            |
| P2        | **Användarinställningar-skärm**                                              | Samlingssida för diverse app-inställningar (t.ex. notifikationer - se `notification_tasks.md`). Länk till "Byt lösenord", "Ta bort konto". Strukturera logiskt.                                | Lists, Navigation                        |
| P2        | **Byt Lösenord-flöde**                                                     | Kräver nuvarande lösenord och nytt lösenord (med bekräftelse). Tydlig feedback.                                                                                                          | Form Elements, Buttons                   |
| P3        | **Ta Bort Konto-flöde**                                                    | Tydlig varning om konsekvenser. Kräver bekräftelse (t.ex. ange lösenord igen).                                                                                                             | Buttons, Functional Colors (Error)       |

### Domän: Team

Syfte: Hantera team, medlemskap och team-intern kommunikation (chatt).

| Prioritet | Uppgift                                                                    | Beskrivning och UX-noteringar                                                                                                                                                           | Referens (Designguide)                   |
| :-------- | :------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------- |
| P1        | **Team Översikt/Dashboard** (`app/team/index.tsx` eller liknande)            | Lista användarens team (använd `Card` per team). "Skapa nytt team"-knapp (CTA). Tydlig ingång till varje teams detaljvy. Tomt tillstånd om inga team finns.                                 | Cards, Buttons, Empty States             |
| P1        | **Skapa Team-skärm**                                                       | Formulär för teamnamn, beskrivning. Eventuella grundinställningar (privat/publikt). Tydlig validering och feedback.                                                                          | Form Elements, Buttons                   |
| P1        | **Team Detaljvy (Grundstruktur)**                                          | Huvudvy för ett enskilt team. Header med teamnamn. Tab-navigering för olika sektioner (Chatt, Medlemmar, Inställningar).                                                                  | Headers, Tab Bar (eller motsvarande)     |
| P1        | **Team Chatt-flik (Implementation av Trådning)**                           | Visa meddelandelista (`TeamMessageList`, `TeamMessageItem`). `MessageComposer` längst ner. Implementation av `ThreadView` för att visa trådar (kan vara modal, sidopanel, ny skärm).           | Lists, Cards, Buttons, Progress Ind.   |
|         |   - `TeamMessageItem`: Anpassningar för trådning klara (visa antal svar, "Svara i tråd"-knapp som anropar `onOpenThread`).                                                          |                                          |
|         |   - `MessageComposer`: Anpassningar för trådning klara (accepterar `parentId` för att skicka svar).                                                                                  |                                          |
| P1        |   - **Ny `ThreadView`-komponent**                                          | Visa rotmeddelande överst (återanvänd `TeamMessageItem` med `isInThreadView: true`). Lista svar (återanvänd `TeamMessageItem`). Inkludera `MessageComposer` med `parentId`.                      |                                          |
| P1        |   - Hook för att hämta trådsvar (`useThreadMessages`)                        | Ny React Query-hook som använder `teamMessageRepository.findByParentId()` för att ladda meddelanden i en tråd.                                                                               |                                          |
| P2        |   - Realtidsuppdateringar för chatt och trådar                             | Säkerställ att nya meddelanden och trådsvar visas i realtid.                                                                                                                            |                                          |
| P2        | **Team Medlemmar-flik**                                                    | Lista medlemmar (avatar, namn, roll). "Bjud in medlem"-knapp. Hantering av medlemsroller (för admin/ägare).                                                                                  | Lists, Buttons, Avatar                   |
| P2        | **Bjud In Medlem-flöde**                                                   | UI för att söka/ange e-post/användarnamn för inbjudan. Feedback vid skickad inbjudan.                                                                                                    | Form Elements, Buttons                   |
| P2        | **Team Inställningar-flik** (för admin/ägare)                              | Redigera teamnamn, beskrivning. Hantera teamets synlighet/anslutningspolicy. "Ta bort team"-funktion (med bekräftelse).                                                                    | Form Elements, Buttons, Functional Colors|
| P3        | **Avancerade Teamfunktioner** (enl. `team_tasks.md`)                       | UI för Team-mål (visa, skapa, uppföljning). UI för Team-statistik/aktivitet.                                                                                                              | Cards, Progress Indicators               |

### Övergripande Funktioner (Cross-Cutting Concerns)

| Prioritet | Uppgift                                                                    | Beskrivning                                                                                                                                                                            | Referens (Designguide)                |
| :-------- | :------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------ |
| P1        | **Global Laddningsindikator**                                              | Implementera en global, återanvändbar komponent eller state för att visa laddning vid större operationer/sidladdningar.                                                               | Progress Indicators (Spinner)         |
| P1        | **Standardiserad Felhantering**                                            | Konsekvent visning av fel (t.ex. Toasts, inline-meddelanden) enligt designguide.                                                                                                        | Error States, Functional Colors       |
| P1        | **Pekytor (Touch Targets)**                                                | Säkerställ att alla klickbara element uppfyller minimikraven för storlek (44x44px) och avstånd från designguiden.                                                                         | Layout & Spacing, Accessibility       |
| P2        | **Färgkontrast**                                                           | Granska och säkerställ tillräcklig kontrast (minst 4.5:1 för text, 3:1 för UI-element) enligt designguide.                                                                                 | Colors, Accessibility                 |
| P2        | **Skelettladdare (Skeleton Loaders)**                                      | Använd för innehållstunga områden (t.ex. meddelandelistor, teamlistor) för att förbättra upplevd prestanda.                                                                             | Loading States                        |

## Nästa Steg och Framtida Överväganden

-   **Användartester:** Planera och genomför användartester tidigt och iterativt för att samla feedback.
-   **Ytterligare Tillgänglighetstester:** Djupare tester med skärmläsare, tangentbordsnavigering, etc.
-   **Optimeringar:** Kontinuerlig prestandaoptimering av UI-komponenter och rendering.
-   **Animationer och Mikrointeraktioner:** Implementera subtila animationer enligt designguiden för att förbättra UX, men utan att överbelasta. 