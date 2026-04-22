# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:3000 (auto-opens browser)
npm run build     # Build to ./dist/
```

There are no tests or linting scripts configured.

## Architecture Overview

SP-R1 is a React + TypeScript + Vite prototype for a **Student Placement Management (SPM)** system used in Norwegian healthcare education. It is entirely frontend-only with mock data — no live backend calls are made during normal use.

### Entry point

`src/main.tsx` → `src/App.tsx`. All application state lives in `App.tsx` (no global state library). Views are rendered conditionally based on `currentView` state.

### Routing model

There is no router. `App.tsx` holds a `currentView` string and renders the appropriate component inline. Navigation is done by calling `setCurrentView(...)`. The `EnhancedSidebar` component drives top-level navigation.

### View hierarchy

| `currentView` value | Component rendered |
|---|---|
| `"dashboard"` | `<Dashboard>` |
| `"placements"` | `<TableView>` / `<GanttView>` (filtered list) |
| `"placementtask"` | `<PlacementTaskView>` (detail for one placement) |
| `"praksisplaces"` | `<PraksisPlacesView>` / `<PraksisPlaceDetailView>` / `<CreatePraksisPlaceView>` |
| `"quotas"` | `<CoordinatorQuotasView>` |
| `"settings"` | `<SettingsView>` |
| `"analytics"` | `<AnalyticsAI>` |
| `"onboarding-comments"` | `<OnboardingCommentsView>` (restricted to access code `E8W6B4C3`) |

### Domain model

The core types in `src/types/` are:

- **`StudentPlacement`** (`studentPlacement.ts`) — A batch placement event (year/semester/subject). Status progression: `draft → upload → select → publish → completed`.
- **`PlacementTaskState`** (`studentPlacement.ts`) — Working state for one placement: which tasks are done, which students are imported, which quotas are selected.
- **`PraksisPlace`** (`praksisPlace.ts`) — A healthcare placement site (hospital/clinic). Has `departments[]`, each with supervisors, capacity, and assigned students.
- **`Department`** (`praksisPlace.ts`) — A unit within a PraksisPlace. Supervisors and students are attached here.
- **`QuotaRequest`** (`praksisPlace.ts`) — Created by PK (coordinator) inside a placement workflow; records a fixed or request quota for a department.
- **`CoordinatorQuotaRequest`** (`coordinatorQuotaRequest.ts`) — The PK-side request asking a PraksisPlace (SK person) for capacity. Status: `pending → approved/rejected → fulfilled`. Supports `entityDistributions[]` for distributing quota across multiple departments.
- **`QuotaOffering`** (`quotaOffering.ts`) — The SK-side proactive offer of capacity to a university/program.
- **`OrganizationNode`** / `OrganizationType` (`organizationStructure.ts`) — Two hierarchy types: `HF` (Helseforetak: 5 levels) and `Kommune` (4 levels). Used within PraksisPlace detail.

### The two user roles (prototype)

The app currently only implements the **PK (Placement Coordinator)** role. The user is hardcoded as `"John Coordinator"`. The SK (Site Coordinator / "Stedkontakt") role is referenced in the quota approval flow but the approver is hardcoded as `"Sarah Contact"`.

### Authentication

`src/components/LoginScreen.tsx` validates against a static list of 8-character alphanumeric codes in `src/types/access-codes.ts`. Auth state is persisted to `localStorage` (`spm_authenticated`, `spm_access_code`). The special code `E8W6B4C3` grants access to the onboarding comments admin view.

### Placement task workflow

`PlacementTaskView.tsx` is the most complex component. It drives a 7-step task checklist defined in `src/types/placementTask.ts` (`placementTasks[]`):
1. Import students
2. Select quotas (via `SlideOverManageQuota`)
3. Assign students to departments (via `SlideOverAssignStudent` / `QuickAssignStudentsModal`)
4. First publish
5. Final publish
6. Attach documents
7. Mark as completed

State for each step is stored in `PlacementTaskState` and lifted to `App.tsx`.

### UI components

`src/components/ui/` contains shadcn/ui components. Import them from `./ui/<component>` — they are pre-configured with Tailwind and Radix UI primitives.

### Vite aliases

`vite.config.ts` maps versioned package names (e.g. `sonner@2.0.3`) to their unversioned equivalents. When importing library components in source, use the versioned form (e.g. `import { toast } from "sonner@2.0.3"`) as the Figma-generated code does. The alias in `vite.config.ts` resolves these at build time.

### Supabase backend (comments only)

`src/supabase/functions/server/` contains a Deno + Hono edge function for persisting onboarding comments to a KV store. This is only used by `OnboardingOverlay.tsx` and `OnboardingCommentsView.tsx`. It is **not** used for any core placement data — everything else is in-memory mock data.

### Figma assets

`figma:asset/<hash>.png` imports in components (e.g. `PlacementTaskView.tsx`) are resolved by the `figmaAssetResolver` Vite plugin to files under `src/assets/`. SVG data is imported from `src/imports/svg-*.ts` as string maps.

### Persistence

The only data persisted across page reloads is:
- `localStorage.spm_authenticated` / `spm_access_code` — login state
- `localStorage.coordinatorQuotaRequests` — quota requests (synced via `useEffect` in `App.tsx`)

All other state (placements, praksis places, etc.) resets on page reload to the values in `mockStudentPlacements`, `mockPraksisPlaces`, etc.
