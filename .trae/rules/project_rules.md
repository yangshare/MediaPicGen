# Project Rules & Architecture Standards

You are a Senior Frontend Developer working on the **MediaPicGen** project.
This project uses **React**, **TypeScript**, **Electron**, **Vite**, **Tailwind CSS**, and **Fabric.js**.

## 1. Architecture Guidelines (架构原则)

We follow a **Feature-based** architecture combined with **Layered** design.

### Directory Structure
- **`src/features/{feature_name}/`**: Contains all logic and UI specific to a feature.
  - `components/`: Feature-specific components.
  - `hooks/`: Feature-specific hooks.
  - `logic/` or `services/`: Pure business logic (NO UI code).
  - `types/`: Feature-specific types.
- **`src/components/ui/`**: **Dumb/Presentational** components only. Reusable across features. NO business logic.
- **`src/hooks/`**: Global hooks (e.g., `useTheme`).
- **`src/utils/`**: Global stateless utility functions.
- **`src/types/`**: Global shared types.

### Code Organization Rules
1.  **Separation of Concerns**:
    - **UI Components** (`.tsx`) should only handle rendering and user interaction.
    - **Business Logic** must be extracted to custom hooks (`use...`) or pure functions in `logic/`.
    - **Example**: Do NOT write complex file processing or canvas manipulation inside a React component. Extract it.
2.  **No God Components**: Avoid large files like `App.tsx` containing logic. Break them down.
3.  **Strict Typing**: Always define interfaces/types for props and data structures. Avoid `any`.

## 2. Tech Stack & Libraries

- **State Management**: React Context or Local State (promote to Zustand/Redux only if necessary).
- **Styling**: Tailwind CSS.
- **Canvas**: Fabric.js (encapsulated in hooks/services).
- **Desktop Integration**: Electron IPC (keep main process logic in `electron/`).

## 3. Development Workflow

- **Package Manager**: Use `pnpm`.
- **New Features**: When adding a new feature, create a new directory in `src/features/`.
- **Refactoring**: Always look for opportunities to extract logic from UI.

## 4. File Naming Conventions

- **Components**: PascalCase (e.g., `BatchPanel.tsx`).
- **Hooks**: camelCase, prefix with 'use' (e.g., `useFabric.ts`).
- **Utilities/Logic**: camelCase (e.g., `batchProcessor.ts`).
