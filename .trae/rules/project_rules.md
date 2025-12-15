# MediaPicGen Rules (React/TS/Electron)

## 1. Arch: Feature-based
- `src/features/{name}/`: `components`, `hooks`, `logic`, `types`.
- `src/components/ui/`: Dumb UI only.
- `src/hooks|utils|types`: Global.

## 2. Standards
- UI (.tsx): Render only.
- Logic: Extract to hooks/pure funcs in `logic/`.
- No God Files: Split complex logic.
- Types: Strict interfaces. No `any`.

## 3. Stack
- State: Context/Local.
- Style: Tailwind.
- Canvas: Fabric.js (encapsulated).
- Electron: IPC for main process.

## 4. Workflow
- `pnpm`.
- New Feature: `src/features/`.
- Naming: Comp(Pascal), Hook(useCamel), Util(camel).
