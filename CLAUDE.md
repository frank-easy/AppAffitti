# AppAffitti — CLAUDE.md

> Contesto operativo per Claude Code. Aggiornato post-consolidamento documentazione: 2026-03-14.
> Obiettivo corrente: raggiungere V1 distribuibile via TestFlight / Expo Go a beta tester reali.

---

## Stack

| Layer | Tecnologia |
|-------|-----------|
| Framework | React Native 0.81.5 + Expo SDK 54 |
| Linguaggio | TypeScript (strict) |
| Navigazione | React Navigation 7 (native-stack) |
| Backend | Supabase — Postgres, Auth, Storage, Realtime |
| Swiper | react-native-deck-swiper ^2.0.19 |
| Icone | @expo/vector-icons (Ionicons) |

---

## Struttura attiva

Lavora SOLO in `src/`. Le cartelle legacy nella root (`screens/`, `components/`, `navigation/`, `lib/`) sono state eliminate.

```
App.tsx                        → Entry: SafeAreaProvider > NavigationContainer > AppNavigator
src/
  navigation/AppNavigator.tsx  → Stack root (tutte le route)
  screens/
    IntroScreen.tsx            → Landing con modal auth inline (duplica logica AuthScreen)
    RoleSelectionScreen.tsx    → Selezione ruolo — usa replace(), no back
    AuthScreen.tsx             → Login + Signup via Supabase Auth
    ProfileSetupScreen.tsx     → Setup profilo post-registrazione
    TenantApp.tsx              → Shell tenant: tab home/chat/profile via useState custom
    OwnerApp.tsx               → Shell owner: idem
    AddApartmentScreen.tsx     → CRUD appartamento (owner)
    ChatDetailScreen.tsx       → Chat 1:1 realtime
    ChatListComponent.tsx      → Lista match/chat (usata in entrambe le shell)
    LikedApartmentsScreen.tsx  → Appartamenti salvati (tenant) — raggiungibile da MyProfileView
    MyProfileView.tsx          → Profilo personale (usata in entrambe le shell)
  components/
    BottomMenu.tsx             → Tab bar custom (home/chat/profile)
    FilterModal.tsx            → Filtri ricerca appartamenti
    ApartmentDetailModal.tsx   → Dettaglio appartamento (read-only)
    ApartmentDetailEditModal.tsx → Dettaglio + edit appartamento (owner)
    ProfileDetailModal.tsx     → Dettaglio + edit profilo
    UserProfileOverlay.tsx     → Overlay profilo utente in chat
    FullScreenPhotoOverlay.tsx → Foto fullscreen
    AppHeader.tsx              → Header standard
    intro/
      IntroShapes.tsx          → Layer decorativo su IntroScreen: sfera wireframe + semicerchi SVG + cerchio puntato (posizionamento assoluto, pointerEvents none)
      WireframeSphere.tsx      → Sfera wireframe SVG con meridiani e paralleli, usata da IntroShapes
      OrganicBlobs.tsx         → Placeholder vuoto (da implementare)
  lib/supabase.ts              → Client Supabase (usa process.env)
  utils/
    imageUpload.ts             → Upload a Supabase Storage
    constants.ts               → COLORS, dimensioni schermo
  styles/commonStyles.ts       → StyleSheet condivisi
```

---

## Regole operative

- **Mai `any`** su navigation props — usa i tipi di React Navigation o `NativeStackNavigationProp`
- **Stili**: riutilizzabili → `commonStyles.ts`, locali → inline `StyleSheet.create()`
- **Supabase**: sempre via `src/lib/supabase.ts`
- **`react-native-url-polyfill/auto`**: non commentare mai questo import in `src/lib/supabase.ts` — senza di esso l'URL API di React Native non è spec-compliant e Supabase Auth risponde "invalid api key" anche con credenziali corrette
- **Upload immagini**: passa `{ uri, name, type }` direttamente a `supabase.storage.upload()` — no FormData
- **Navigazione dopo auth**: usa sempre `replace()`, mai `navigate()`, per evitare back stack verso schermate di login
- **Realtime subscriptions**: crea solo quando l'userId è disponibile, cleanup obbligatorio nel return del useEffect

---

## Variabili d'ambiente

File `.env` nella root (non committato, escluso da .gitignore):

```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Dev quick-login (solo __DEV__, tree-shaken in produzione)
EXPO_PUBLIC_DEV_TENANT_EMAIL=tenant@test.com
EXPO_PUBLIC_DEV_TENANT_PASSWORD=<password>
EXPO_PUBLIC_DEV_OWNER_EMAIL=owner@test.com
EXPO_PUBLIC_DEV_OWNER_PASSWORD=<password>
```

Riferimento: `.env.example` in root.

---

## Database — Tabelle principali

### profiles
| Campo | Tipo | Note |
|-------|------|-------|
| id | uuid | = auth.uid |
| full_name | text | |
| dob | date | data di nascita |
| gender | text | |
| occupation | text | |
| bio | text | |
| avatar_url | text | path su Storage bucket images |
| role | text | 'tenant' o 'owner' |

### apartments
| Campo | Tipo | Note |
|-------|------|-------|
| id | uuid | |
| owner_id | uuid | → profiles |
| title | text | |
| description | text | |
| city | text | |
| price | numeric | |
| utility_cost | numeric | spese incluse |
| sq_meters | numeric | |
| allowed_gender | text | hard filter |
| allow_smokers | boolean | hard filter |
| allowed_occupation | text | hard filter |
| image_url | text[] | array di URL pubblici, max 5 foto |

### swipes
| Campo | Tipo | Note |
|-------|------|-------|
| id | uuid | |
| tenant_id | uuid | → profiles |
| apartment_id | uuid | → apartments |
| direction | text | 'left' o 'right' |

### matches
| Campo | Tipo | Note |
|-------|------|-------|
| id | uuid | |
| tenant_id | uuid | → profiles |
| owner_id | uuid | → profiles |
| apartment_id | uuid | → apartments |

### messages
| Campo | Tipo | Note |
|-------|------|-------|
| id | uuid | |
| match_id | uuid | → matches |
| sender_id | uuid | → profiles |
| content | text | |
| created_at | timestamptz | |
| is_read | boolean | |

Storage bucket: `images` (pubblico) — avatar e foto appartamenti.
Hard filters su `apartments`: `allowed_gender`, `allow_smokers`, `allowed_occupation` — applicati a query time nel feed tenant.

---

## Design patterns

**Preview → Modal → Edit**
Il pattern standard per visualizzare ed editare entità:
- Profilo: `MyProfileView` → `ProfileDetailModal` (edit inline nel modal)
- Annuncio owner: lista → `ApartmentDetailEditModal` (edit inline nel modal)
- Annuncio tenant: swiper → `ApartmentDetailModal` (read-only)

**Optimistic UI**
Usato in `ChatDetailScreen`: il messaggio appare immediatamente nella lista, viene rimosso solo in caso di errore DB. Non usare altrove senza valutazione.

**Hard Filters a query time**
I filtri `allowed_gender`, `allow_smokers`, `allowed_occupation` vengono applicati direttamente nella query Supabase in `TenantApp`, non in post-processing. Mantieni questa convenzione per qualsiasi nuovo filtro strutturale.

---

## Feature map — Stato post-stabilizzazione

| Feature | Stato | Note |
|---------|-------|------|
| Auth login/signup | ✅ | Logica duplicata in IntroScreen e AuthScreen (tech debt, non toccare ora) |
| Selezione ruolo | ✅ | — |
| Profile setup | ✅ | — |
| Swiper feed (tenant) | ✅ | Hard filters attivi |
| Filtri ricerca | ✅ | Input validato contro NaN |
| Owner leads dashboard | ✅ | — |
| Match → Chat | ✅ | — |
| Chat realtime | ✅ | Guard su myId, cleanup subscription ok |
| Upload foto | ✅ | Fix post-stabilizzazione (no più FormData) |
| Appartamenti salvati | ✅ | Raggiungibile da MyProfileView |
| Dev quick-login bar | ✅ | Barra `__DEV__` in basso su IntroScreen — due pulsanti "⚡ Tenant" / "⚡ Owner", legge credenziali da `EXPO_PUBLIC_DEV_*`, tree-shaken in produzione |
| Owner analytics | ✅ | Tab ANALYTICS in OwnerApp — 3 stat card: appartamenti pubblicati, swipe ricevuti, match attivi |
| Profile edit | ❌ | ProfileEditScreen eliminato (dead code). Si usa ProfileDetailModal |
| Paginazione feed | ❌ | Carica tutto — limite da aggiungere |
| Push notifications | 🚫 | Out of scope V1 |
| Password reset | 🚫 | Out of scope V1 |
| Pagamenti / Premium | 🚫 | Out of scope V1 |

---

## Roadmap V1 — Task rimanenti

Questi sono gli unici task che portano alla V1 distribuibile. Lavorali in ordine.

### Sprint corrente
- [x] **Owner analytics reali** — sostituire `<Text>Analytics WIP</Text>` in `OwnerApp` con stats da Supabase: n. appartamenti pubblicati, n. swipe ricevuti totali, n. match attivi
- [ ] **Paginazione feed** — aggiungere `limit(20)` + load-more alla query appartamenti in `TenantApp`
- [ ] **Verifica upload foto end-to-end** — testare su device fisico che il bucket `images` accetti upload e ritorni URL pubblico corretto

### Pulizia pre-beta
- [x] Eliminare cartelle legacy dalla root (`screens/`, `components/`, `navigation/`, `lib/`) — 17 file rimossi
- [x] Unificare i due `supabase.ts` (tenere solo `src/lib/supabase.ts`)

### Tech debt noto (post-beta)
- Tab navigation custom in TenantApp/OwnerApp → refactor verso `@react-navigation/bottom-tabs`
- Navigation props typati (eliminare `any`)
- Deduplicare logica auth da IntroScreen e AuthScreen

---

## Lookup — Funzionalità → File

| Funzionalità | File principale |
|--------------|----------------|
| Navigazione e route | src/navigation/AppNavigator.tsx |
| Auth (login/signup) | src/screens/AuthScreen.tsx |
| Landing e onboarding | src/screens/IntroScreen.tsx |
| Selezione ruolo | src/screens/RoleSelectionScreen.tsx |
| Setup profilo post-registrazione | src/screens/ProfileSetupScreen.tsx |
| Shell e tab tenant | src/screens/TenantApp.tsx |
| Shell e tab owner | src/screens/OwnerApp.tsx |
| Feed swiper + hard filters | src/screens/TenantApp.tsx |
| Aggiunta / modifica appartamento | src/screens/AddApartmentScreen.tsx |
| Chat 1:1 realtime | src/screens/ChatDetailScreen.tsx |
| Lista match e chat | src/screens/ChatListComponent.tsx |
| Appartamenti salvati (tenant) | src/screens/LikedApartmentsScreen.tsx |
| Profilo personale (entrambi i ruoli) | src/screens/MyProfileView.tsx |
| Tab bar custom | src/components/BottomMenu.tsx |
| Filtri ricerca | src/components/FilterModal.tsx |
| Dettaglio appartamento (read-only) | src/components/ApartmentDetailModal.tsx |
| Dettaglio + edit appartamento (owner) | src/components/ApartmentDetailEditModal.tsx |
| Dettaglio + edit profilo | src/components/ProfileDetailModal.tsx |
| Overlay profilo in chat | src/components/UserProfileOverlay.tsx |
| Foto fullscreen | src/components/FullScreenPhotoOverlay.tsx |
| Header standard | src/components/AppHeader.tsx |
| Decorazioni geometriche IntroScreen | src/components/intro/IntroShapes.tsx |
| Sfera wireframe SVG | src/components/intro/WireframeSphere.tsx |
| Blobs organici (placeholder) | src/components/intro/OrganicBlobs.tsx |
| Client Supabase | src/lib/supabase.ts |
| Upload immagini a Storage | src/utils/imageUpload.ts |
| Colori e dimensioni schermo | src/utils/constants.ts |
| Stili condivisi | src/styles/commonStyles.ts |

---

## Comandi

```bash
npx expo start          # dev server
npx expo start --clear  # con cache pulita — usare se comportamenti strani post-modifica
```

---

## Colori brand

```
Tenant:  #84A98C  (verde muted)
Owner:   #A7754D  (copper)
```
