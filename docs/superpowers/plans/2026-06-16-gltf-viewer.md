# glTF Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-file glTF/GLB learning and inspection workbench with a module coverage report and Three.js preview.

**Architecture:** Use a React + Vite + TypeScript app. Keep glTF parsing, module coverage, and relationship analysis in pure TypeScript modules that can be tested without browser rendering; keep Three.js scene ownership inside a dedicated preview component.

**Tech Stack:** React, Vite, TypeScript, Vitest, Testing Library, Three.js, lucide-react.

---

## File Structure

- `package.json`: npm scripts and dependencies.
- `index.html`: Vite HTML entry.
- `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts`: TypeScript, Vite, and test configuration.
- `src/main.tsx`: React app entry.
- `src/App.tsx`: top-level app state, import flow, and page composition.
- `src/styles.css`: application styling.
- `src/domain/gltfTypes.ts`: minimal glTF TypeScript types used by analyzers.
- `src/domain/moduleCatalog.ts`: supported glTF module definitions and explanations.
- `src/domain/coverageAnalyzer.ts`: pure module coverage analyzer.
- `src/domain/relationshipAnalyzer.ts`: pure relationship graph analyzer.
- `src/domain/fileIntake.ts`: local file classification and resource lookup helpers.
- `src/domain/gltfParser.ts`: `.gltf` JSON parsing and `.glb` JSON chunk extraction.
- `src/domain/sampleGltf.ts`: reusable test fixtures.
- `src/components/DropZone.tsx`: local-file import UI.
- `src/components/HeaderSummary.tsx`: imported asset summary.
- `src/components/CoveragePanel.tsx`: left-side module checklist.
- `src/components/DetailPanel.tsx`: selected module details and JSON summary.
- `src/components/ReferenceChains.tsx`: common glTF relationship chains.
- `src/components/PreviewPane.tsx`: Three.js loader, scene setup, controls, toggles, and animation controls.
- `src/components/StatusBanner.tsx`: warning/error display.
- `src/test/setup.ts`: test environment setup.
- `src/domain/*.test.ts`: unit tests for pure logic.

---

### Task 1: Create The Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Initialize git**

Run:

```bash
git init
```

Expected: a new `.git` directory exists and `git status --short` works.

- [ ] **Step 2: Create npm package metadata**

Create `package.json`:

```json
{
  "name": "gltf-viewer",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "preview": "vite preview"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "lucide-react": "^0.468.0",
    "three": "^0.171.0",
    "vite": "^6.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8",
    "jsdom": "^25.0.1"
  }
}
```

- [ ] **Step 3: Install dependencies**

Run:

```bash
npm install
```

Expected: `node_modules` and `package-lock.json` are created.

- [ ] **Step 4: Add Vite and TypeScript config files**

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>glTF Viewer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

- [ ] **Step 5: Add minimal React entry files**

Create `src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Create `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <section className="empty-state">
        <h1>glTF Viewer</h1>
        <p>Drop a .glb or .gltf file set to inspect its structure and preview the model.</p>
      </section>
    </main>
  );
}
```

Create `src/styles.css`:

```css
:root {
  color: #17202a;
  background: #f5f7fa;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
}

.empty-state {
  display: grid;
  min-height: 100vh;
  place-content: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
}

.empty-state h1 {
  margin: 0;
  font-size: 40px;
}

.empty-state p {
  margin: 0;
  color: #52616f;
}
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: Verify scaffold**

Run:

```bash
npm test
npm run build
```

Expected: both commands pass. `npm test` should report no test files or no failing tests, depending on Vitest output.

- [ ] **Step 7: Commit scaffold**

Run:

```bash
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts vitest.config.ts src
git commit -m "chore: scaffold gltf viewer app"
```

Expected: commit succeeds.

---

### Task 2: Add glTF Domain Types And Module Catalog

**Files:**
- Create: `src/domain/gltfTypes.ts`
- Create: `src/domain/moduleCatalog.ts`
- Create: `src/domain/moduleCatalog.test.ts`

- [ ] **Step 1: Write catalog tests**

Create `src/domain/moduleCatalog.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { GLTF_MODULES, getModuleDefinition } from './moduleCatalog';

describe('moduleCatalog', () => {
  it('lists the first-version glTF modules in UI order', () => {
    expect(GLTF_MODULES.map((module) => module.key)).toEqual([
      'asset',
      'scenes',
      'scene',
      'nodes',
      'meshes',
      'materials',
      'textures',
      'images',
      'samplers',
      'animations',
      'skins',
      'cameras',
      'buffers',
      'bufferViews',
      'accessors',
      'extensionsUsed',
      'extensionsRequired',
    ]);
  });

  it('provides explanations and absence notes for modules', () => {
    const materials = getModuleDefinition('materials');

    expect(materials.label).toBe('Materials');
    expect(materials.explanation).toContain('surface');
    expect(materials.absenceNote).toContain('default material');
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- src/domain/moduleCatalog.test.ts
```

Expected: FAIL because `moduleCatalog.ts` does not exist.

- [ ] **Step 3: Add glTF types**

Create `src/domain/gltfTypes.ts`:

```ts
export type GltfModuleKey =
  | 'asset'
  | 'scenes'
  | 'scene'
  | 'nodes'
  | 'meshes'
  | 'materials'
  | 'textures'
  | 'images'
  | 'samplers'
  | 'animations'
  | 'skins'
  | 'cameras'
  | 'buffers'
  | 'bufferViews'
  | 'accessors'
  | 'extensionsUsed'
  | 'extensionsRequired';

export interface GltfAsset {
  version?: string;
  generator?: string;
  copyright?: string;
  [key: string]: unknown;
}

export interface GltfRoot {
  asset?: GltfAsset;
  scene?: number;
  scenes?: Array<{ name?: string; nodes?: number[]; [key: string]: unknown }>;
  nodes?: Array<{ name?: string; mesh?: number; camera?: number; skin?: number; children?: number[]; [key: string]: unknown }>;
  meshes?: Array<{ name?: string; primitives?: Array<{ attributes?: Record<string, number>; indices?: number; material?: number; [key: string]: unknown }>; [key: string]: unknown }>;
  materials?: Array<{ name?: string; [key: string]: unknown }>;
  textures?: Array<{ name?: string; source?: number; sampler?: number; [key: string]: unknown }>;
  images?: Array<{ name?: string; uri?: string; mimeType?: string; bufferView?: number; [key: string]: unknown }>;
  samplers?: Array<Record<string, unknown>>;
  animations?: Array<{ name?: string; channels?: unknown[]; samplers?: unknown[]; [key: string]: unknown }>;
  skins?: Array<{ name?: string; joints?: number[]; skeleton?: number; [key: string]: unknown }>;
  cameras?: Array<{ name?: string; type?: string; [key: string]: unknown }>;
  buffers?: Array<{ name?: string; uri?: string; byteLength?: number; [key: string]: unknown }>;
  bufferViews?: Array<{ name?: string; buffer?: number; byteOffset?: number; byteLength?: number; [key: string]: unknown }>;
  accessors?: Array<{ name?: string; bufferView?: number; componentType?: number; count?: number; type?: string; [key: string]: unknown }>;
  extensionsUsed?: string[];
  extensionsRequired?: string[];
  [key: string]: unknown;
}
```

- [ ] **Step 4: Add module catalog**

Create `src/domain/moduleCatalog.ts`:

```ts
import type { GltfModuleKey } from './gltfTypes';

export interface ModuleDefinition {
  key: GltfModuleKey;
  label: string;
  explanation: string;
  absenceNote: string;
  expected: 'required' | 'optional';
}

export const GLTF_MODULES: ModuleDefinition[] = [
  {
    key: 'asset',
    label: 'Asset',
    explanation: 'Metadata for the glTF file, including the glTF version and optional generator information.',
    absenceNote: 'The asset object is expected in valid glTF files.',
    expected: 'required',
  },
  {
    key: 'scenes',
    label: 'Scenes',
    explanation: 'Scene definitions group root nodes into renderable scene graphs.',
    absenceNote: 'A file without scenes has no explicit scene graph to display.',
    expected: 'optional',
  },
  {
    key: 'scene',
    label: 'Default Scene',
    explanation: 'The index of the default scene the author expects a viewer to open first.',
    absenceNote: 'If absent, viewers can choose the first scene when scenes exist.',
    expected: 'optional',
  },
  {
    key: 'nodes',
    label: 'Nodes',
    explanation: 'Transform hierarchy entries that can reference meshes, cameras, skins, and child nodes.',
    absenceNote: 'No nodes means there is no transform hierarchy.',
    expected: 'optional',
  },
  {
    key: 'meshes',
    label: 'Meshes',
    explanation: 'Geometry containers made of primitives, attributes, indices, and material references.',
    absenceNote: 'No meshes means the asset may contain metadata, cameras, or animations but no visible mesh geometry.',
    expected: 'optional',
  },
  {
    key: 'materials',
    label: 'Materials',
    explanation: 'Surface appearance data such as base color, metallic-roughness values, textures, and alpha mode.',
    absenceNote: 'Missing materials are valid; renderers can use default material behavior.',
    expected: 'optional',
  },
  {
    key: 'textures',
    label: 'Textures',
    explanation: 'Texture objects connect image sources and sampler settings to material slots.',
    absenceNote: 'Missing textures are normal for models that use constants or default material values.',
    expected: 'optional',
  },
  {
    key: 'images',
    label: 'Images',
    explanation: 'Image resources referenced by textures, either external URI files or embedded buffer views.',
    absenceNote: 'Missing images are normal when the asset has no texture-backed materials.',
    expected: 'optional',
  },
  {
    key: 'samplers',
    label: 'Samplers',
    explanation: 'Texture filtering and wrapping settings.',
    absenceNote: 'Missing samplers are valid; viewers use default sampler behavior.',
    expected: 'optional',
  },
  {
    key: 'animations',
    label: 'Animations',
    explanation: 'Keyframe animation data that targets node transforms or morph weights.',
    absenceNote: 'Missing animations mean the asset is static.',
    expected: 'optional',
  },
  {
    key: 'skins',
    label: 'Skins',
    explanation: 'Skeletal skinning data linking joints to meshes.',
    absenceNote: 'Missing skins are normal for rigid or static models.',
    expected: 'optional',
  },
  {
    key: 'cameras',
    label: 'Cameras',
    explanation: 'Author-provided perspective or orthographic cameras.',
    absenceNote: 'Missing cameras are normal; the viewer can create its own camera.',
    expected: 'optional',
  },
  {
    key: 'buffers',
    label: 'Buffers',
    explanation: 'Binary payload containers for geometry, animation, skinning, and embedded images.',
    absenceNote: 'Missing buffers are suspicious when geometry, accessors, or buffer views exist.',
    expected: 'optional',
  },
  {
    key: 'bufferViews',
    label: 'Buffer Views',
    explanation: 'Slices of buffers used by accessors or embedded images.',
    absenceNote: 'Missing buffer views are suspicious when accessors or embedded images exist.',
    expected: 'optional',
  },
  {
    key: 'accessors',
    label: 'Accessors',
    explanation: 'Typed views over binary data, describing counts, component types, and vector shapes.',
    absenceNote: 'Missing accessors are suspicious when meshes or animations exist.',
    expected: 'optional',
  },
  {
    key: 'extensionsUsed',
    label: 'Extensions Used',
    explanation: 'Extensions used by the asset for optional or advanced glTF features.',
    absenceNote: 'Missing extensionsUsed means the asset declares no glTF extensions.',
    expected: 'optional',
  },
  {
    key: 'extensionsRequired',
    label: 'Extensions Required',
    explanation: 'Extensions a viewer must support to fully load the asset.',
    absenceNote: 'Missing extensionsRequired means no extension support is required for core interpretation.',
    expected: 'optional',
  },
];

export function getModuleDefinition(key: GltfModuleKey): ModuleDefinition {
  const definition = GLTF_MODULES.find((module) => module.key === key);

  if (!definition) {
    throw new Error(`Unknown glTF module: ${key}`);
  }

  return definition;
}
```

- [ ] **Step 5: Verify module catalog**

Run:

```bash
npm test -- src/domain/moduleCatalog.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit domain catalog**

Run:

```bash
git add src/domain/gltfTypes.ts src/domain/moduleCatalog.ts src/domain/moduleCatalog.test.ts
git commit -m "feat: add gltf module catalog"
```

Expected: commit succeeds.

---

### Task 3: Implement Module Coverage Analyzer

**Files:**
- Create: `src/domain/sampleGltf.ts`
- Create: `src/domain/coverageAnalyzer.ts`
- Create: `src/domain/coverageAnalyzer.test.ts`

- [ ] **Step 1: Write failing coverage tests**

Create `src/domain/coverageAnalyzer.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { analyzeCoverage } from './coverageAnalyzer';
import { MINIMAL_GLTF, TEXTURED_GLTF, REQUIRED_EXTENSION_GLTF } from './sampleGltf';

describe('analyzeCoverage', () => {
  it('marks asset as present and optional modules as missing for a minimal file', () => {
    const rows = analyzeCoverage(MINIMAL_GLTF, new Set());
    const byKey = Object.fromEntries(rows.map((row) => [row.key, row]));

    expect(byKey.asset.status).toBe('present');
    expect(byKey.asset.count).toBe(1);
    expect(byKey.materials.status).toBe('missing');
    expect(byKey.materials.note).toContain('default material');
    expect(byKey.animations.status).toBe('missing');
    expect(byKey.animations.note).toContain('static');
  });

  it('counts array modules when data is present', () => {
    const rows = analyzeCoverage(TEXTURED_GLTF, new Set());
    const byKey = Object.fromEntries(rows.map((row) => [row.key, row]));

    expect(byKey.scenes.count).toBe(1);
    expect(byKey.nodes.count).toBe(1);
    expect(byKey.meshes.count).toBe(1);
    expect(byKey.materials.count).toBe(1);
    expect(byKey.textures.count).toBe(1);
    expect(byKey.images.count).toBe(1);
    expect(byKey.buffers.count).toBe(1);
    expect(byKey.bufferViews.count).toBe(2);
    expect(byKey.accessors.count).toBe(1);
  });

  it('marks unsupported required extensions as problematic', () => {
    const rows = analyzeCoverage(REQUIRED_EXTENSION_GLTF, new Set(['KHR_materials_unlit']));
    const extensionsRequired = rows.find((row) => row.key === 'extensionsRequired');

    expect(extensionsRequired?.status).toBe('required-problem');
    expect(extensionsRequired?.note).toContain('unsupported required extension');
    expect(extensionsRequired?.values).toEqual(['VENDOR_required_feature']);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- src/domain/coverageAnalyzer.test.ts
```

Expected: FAIL because `coverageAnalyzer.ts` and `sampleGltf.ts` do not exist.

- [ ] **Step 3: Add test fixtures**

Create `src/domain/sampleGltf.ts`:

```ts
import type { GltfRoot } from './gltfTypes';

export const MINIMAL_GLTF: GltfRoot = {
  asset: {
    version: '2.0',
    generator: 'unit-test',
  },
};

export const TEXTURED_GLTF: GltfRoot = {
  asset: {
    version: '2.0',
    generator: 'unit-test',
  },
  scene: 0,
  scenes: [{ nodes: [0], name: 'Scene' }],
  nodes: [{ mesh: 0, name: 'Root Node' }],
  meshes: [
    {
      name: 'Triangle',
      primitives: [
        {
          attributes: { POSITION: 0 },
          material: 0,
        },
      ],
    },
  ],
  materials: [{ name: 'Paint', pbrMetallicRoughness: { baseColorTexture: { index: 0 } } }],
  textures: [{ source: 0, sampler: 0 }],
  images: [{ uri: 'paint.png' }],
  samplers: [{ magFilter: 9729, minFilter: 9987 }],
  buffers: [{ uri: 'mesh.bin', byteLength: 96 }],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: 72 },
    { buffer: 0, byteOffset: 72, byteLength: 24 },
  ],
  accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' }],
};

export const REQUIRED_EXTENSION_GLTF: GltfRoot = {
  ...TEXTURED_GLTF,
  extensionsUsed: ['KHR_materials_unlit', 'VENDOR_required_feature'],
  extensionsRequired: ['VENDOR_required_feature'],
};
```

- [ ] **Step 4: Add coverage analyzer**

Create `src/domain/coverageAnalyzer.ts`:

```ts
import type { GltfModuleKey, GltfRoot } from './gltfTypes';
import { GLTF_MODULES } from './moduleCatalog';

export type CoverageStatus = 'present' | 'missing' | 'required-problem';

export interface CoverageRow {
  key: GltfModuleKey;
  label: string;
  status: CoverageStatus;
  count: number;
  explanation: string;
  note: string;
  values?: string[];
}

function isPresent(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null;
}

function countValue(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }

  return isPresent(value) ? 1 : 0;
}

function getModuleValue(gltf: GltfRoot, key: GltfModuleKey): unknown {
  return gltf[key];
}

function hasUnsupportedRequiredExtensions(gltf: GltfRoot, supportedExtensions: Set<string>): boolean {
  return (gltf.extensionsRequired ?? []).some((extension) => !supportedExtensions.has(extension));
}

function buildPresentNote(key: GltfModuleKey, count: number): string {
  if (key === 'extensionsRequired') {
    return count > 0
      ? 'This asset declares extensions that must be supported for complete loading.'
      : 'No required extensions are declared.';
  }

  return count === 1 ? '1 entry is present.' : `${count} entries are present.`;
}

export function analyzeCoverage(gltf: GltfRoot, supportedExtensions: Set<string>): CoverageRow[] {
  return GLTF_MODULES.map((definition) => {
    const value = getModuleValue(gltf, definition.key);
    const present = isPresent(value);
    const count = countValue(value);

    if (definition.key === 'asset' && (!gltf.asset || gltf.asset.version !== '2.0')) {
      return {
        key: definition.key,
        label: definition.label,
        status: 'required-problem',
        count,
        explanation: definition.explanation,
        note: 'The asset object is missing or does not declare glTF version 2.0.',
      };
    }

    if (definition.key === 'extensionsRequired' && hasUnsupportedRequiredExtensions(gltf, supportedExtensions)) {
      return {
        key: definition.key,
        label: definition.label,
        status: 'required-problem',
        count,
        explanation: definition.explanation,
        note: 'The asset declares an unsupported required extension, so preview may be incomplete.',
        values: gltf.extensionsRequired ?? [],
      };
    }

    return {
      key: definition.key,
      label: definition.label,
      status: present ? 'present' : 'missing',
      count,
      explanation: definition.explanation,
      note: present ? buildPresentNote(definition.key, count) : definition.absenceNote,
      values: Array.isArray(value) && value.every((entry) => typeof entry === 'string') ? value : undefined,
    };
  });
}
```

- [ ] **Step 5: Verify analyzer**

Run:

```bash
npm test -- src/domain/coverageAnalyzer.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit analyzer**

Run:

```bash
git add src/domain/sampleGltf.ts src/domain/coverageAnalyzer.ts src/domain/coverageAnalyzer.test.ts
git commit -m "feat: analyze gltf module coverage"
```

Expected: commit succeeds.

---

### Task 4: Implement File Intake And glTF Parsing

**Files:**
- Create: `src/domain/fileIntake.ts`
- Create: `src/domain/fileIntake.test.ts`
- Create: `src/domain/gltfParser.ts`
- Create: `src/domain/gltfParser.test.ts`

- [ ] **Step 1: Write failing file intake tests**

Create `src/domain/fileIntake.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { classifyFiles, createResourceMap } from './fileIntake';

function file(name: string, type = ''): File {
  return new File(['content'], name, { type });
}

describe('fileIntake', () => {
  it('selects a glb primary file', () => {
    const result = classifyFiles([file('model.glb')]);

    expect(result.primary?.name).toBe('model.glb');
    expect(result.kind).toBe('glb');
    expect(result.errors).toEqual([]);
  });

  it('selects a gltf primary file and keeps companion resources', () => {
    const result = classifyFiles([file('model.gltf'), file('mesh.bin'), file('baseColor.png')]);

    expect(result.primary?.name).toBe('model.gltf');
    expect(result.kind).toBe('gltf');
    expect(result.resources.map((resource) => resource.name)).toEqual(['mesh.bin', 'baseColor.png']);
  });

  it('reports unsupported file sets', () => {
    const result = classifyFiles([file('notes.txt')]);

    expect(result.primary).toBeUndefined();
    expect(result.kind).toBe('unsupported');
    expect(result.errors[0]).toContain('Drop a .glb or .gltf');
  });

  it('creates resource lookups by exact name and uri suffix', () => {
    const map = createResourceMap([file('textures/baseColor.png'), file('mesh.bin')]);

    expect(map.get('textures/baseColor.png')?.name).toBe('textures/baseColor.png');
    expect(map.get('baseColor.png')?.name).toBe('textures/baseColor.png');
    expect(map.get('mesh.bin')?.name).toBe('mesh.bin');
  });
});
```

- [ ] **Step 2: Write failing parser tests**

Create `src/domain/gltfParser.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseGltfFile } from './gltfParser';

function jsonChunkBytes(json: string): Uint8Array {
  const encoder = new TextEncoder();
  const raw = encoder.encode(json);
  const paddedLength = Math.ceil(raw.length / 4) * 4;
  const padded = new Uint8Array(paddedLength);
  padded.set(raw);
  padded.fill(0x20, raw.length);
  return padded;
}

function createGlb(json: string): File {
  const jsonBytes = jsonChunkBytes(json);
  const totalLength = 12 + 8 + jsonBytes.byteLength;
  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);
  let offset = 0;

  view.setUint32(offset, 0x46546c67, true);
  offset += 4;
  view.setUint32(offset, 2, true);
  offset += 4;
  view.setUint32(offset, totalLength, true);
  offset += 4;
  view.setUint32(offset, jsonBytes.byteLength, true);
  offset += 4;
  view.setUint32(offset, 0x4e4f534a, true);
  offset += 4;
  new Uint8Array(buffer, offset).set(jsonBytes);

  return new File([buffer], 'model.glb');
}

describe('parseGltfFile', () => {
  it('parses a text gltf file', async () => {
    const file = new File([JSON.stringify({ asset: { version: '2.0' } })], 'model.gltf', {
      type: 'model/gltf+json',
    });

    const result = await parseGltfFile(file, 'gltf');

    expect(result.gltf.asset?.version).toBe('2.0');
  });

  it('extracts the JSON chunk from a glb file', async () => {
    const file = createGlb(JSON.stringify({ asset: { version: '2.0' }, scenes: [] }));

    const result = await parseGltfFile(file, 'glb');

    expect(result.gltf.asset?.version).toBe('2.0');
    expect(result.gltf.scenes).toEqual([]);
  });

  it('throws a readable error for invalid glb magic', async () => {
    const file = new File([new ArrayBuffer(16)], 'broken.glb');

    await expect(parseGltfFile(file, 'glb')).rejects.toThrow('Invalid GLB header');
  });
});
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```bash
npm test -- src/domain/fileIntake.test.ts src/domain/gltfParser.test.ts
```

Expected: FAIL because implementation files do not exist.

- [ ] **Step 4: Add file intake helpers**

Create `src/domain/fileIntake.ts`:

```ts
export type FileKind = 'gltf' | 'glb' | 'unsupported';

export interface ClassifiedFiles {
  kind: FileKind;
  primary?: File;
  resources: File[];
  errors: string[];
}

function extensionOf(file: File): string {
  const dotIndex = file.name.lastIndexOf('.');
  return dotIndex >= 0 ? file.name.slice(dotIndex + 1).toLowerCase() : '';
}

export function classifyFiles(files: File[]): ClassifiedFiles {
  const glb = files.find((file) => extensionOf(file) === 'glb');
  const gltf = files.find((file) => extensionOf(file) === 'gltf');
  const primary = glb ?? gltf;

  if (!primary) {
    return {
      kind: 'unsupported',
      resources: files,
      errors: ['Drop a .glb or .gltf file. For .gltf, include referenced .bin and image files.'],
    };
  }

  return {
    kind: extensionOf(primary) as 'gltf' | 'glb',
    primary,
    resources: files.filter((file) => file !== primary),
    errors: [],
  };
}

export function createResourceMap(files: File[]): Map<string, File> {
  const map = new Map<string, File>();

  for (const file of files) {
    const normalized = file.name.replaceAll('\\', '/');
    const basename = normalized.split('/').at(-1);

    map.set(normalized, file);

    if (basename) {
      map.set(basename, file);
    }
  }

  return map;
}
```

- [ ] **Step 5: Add glTF parser**

Create `src/domain/gltfParser.ts`:

```ts
import type { FileKind } from './fileIntake';
import type { GltfRoot } from './gltfTypes';

export interface ParsedGltf {
  gltf: GltfRoot;
  jsonText: string;
}

const GLB_MAGIC = 0x46546c67;
const GLB_VERSION = 2;
const JSON_CHUNK_TYPE = 0x4e4f534a;

function parseJson(text: string): GltfRoot {
  const parsed = JSON.parse(text) as unknown;

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('glTF JSON root must be an object.');
  }

  return parsed as GltfRoot;
}

async function parseTextGltf(file: File): Promise<ParsedGltf> {
  const jsonText = await file.text();

  return {
    gltf: parseJson(jsonText),
    jsonText,
  };
}

async function parseGlb(file: File): Promise<ParsedGltf> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);

  if (buffer.byteLength < 20 || view.getUint32(0, true) !== GLB_MAGIC || view.getUint32(4, true) !== GLB_VERSION) {
    throw new Error('Invalid GLB header.');
  }

  const declaredLength = view.getUint32(8, true);

  if (declaredLength > buffer.byteLength) {
    throw new Error('Invalid GLB length.');
  }

  const chunkLength = view.getUint32(12, true);
  const chunkType = view.getUint32(16, true);

  if (chunkType !== JSON_CHUNK_TYPE) {
    throw new Error('First GLB chunk is not JSON.');
  }

  const jsonBytes = new Uint8Array(buffer, 20, chunkLength);
  const jsonText = new TextDecoder().decode(jsonBytes).trim();

  return {
    gltf: parseJson(jsonText),
    jsonText,
  };
}

export async function parseGltfFile(file: File, kind: Exclude<FileKind, 'unsupported'>): Promise<ParsedGltf> {
  return kind === 'glb' ? parseGlb(file) : parseTextGltf(file);
}
```

- [ ] **Step 6: Verify file intake and parser**

Run:

```bash
npm test -- src/domain/fileIntake.test.ts src/domain/gltfParser.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit file intake and parser**

Run:

```bash
git add src/domain/fileIntake.ts src/domain/fileIntake.test.ts src/domain/gltfParser.ts src/domain/gltfParser.test.ts
git commit -m "feat: parse local gltf inputs"
```

Expected: commit succeeds.

---

### Task 5: Implement Relationship Analyzer

**Files:**
- Create: `src/domain/relationshipAnalyzer.ts`
- Create: `src/domain/relationshipAnalyzer.test.ts`

- [ ] **Step 1: Write failing relationship tests**

Create `src/domain/relationshipAnalyzer.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { analyzeRelationships } from './relationshipAnalyzer';
import { TEXTURED_GLTF } from './sampleGltf';

describe('analyzeRelationships', () => {
  it('builds scene-to-image and primitive-to-buffer chains', () => {
    const relationships = analyzeRelationships(TEXTURED_GLTF);

    expect(relationships.sceneChains).toEqual([
      {
        scene: 'Scene 0: Scene',
        node: 'Node 0: Root Node',
        mesh: 'Mesh 0: Triangle',
        primitive: 'Primitive 0',
        material: 'Material 0: Paint',
        texture: 'Texture 0',
        image: 'Image 0: paint.png',
      },
    ]);

    expect(relationships.bufferChains).toEqual([
      {
        mesh: 'Mesh 0: Triangle',
        primitive: 'Primitive 0',
        attribute: 'POSITION',
        accessor: 'Accessor 0: VEC3 x 3',
        bufferView: 'BufferView 0: 72 bytes',
        buffer: 'Buffer 0: mesh.bin',
      },
    ]);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- src/domain/relationshipAnalyzer.test.ts
```

Expected: FAIL because `relationshipAnalyzer.ts` does not exist.

- [ ] **Step 3: Add relationship analyzer**

Create `src/domain/relationshipAnalyzer.ts`:

```ts
import type { GltfRoot } from './gltfTypes';

export interface SceneChain {
  scene: string;
  node: string;
  mesh?: string;
  primitive?: string;
  material?: string;
  texture?: string;
  image?: string;
}

export interface BufferChain {
  mesh: string;
  primitive: string;
  attribute: string;
  accessor?: string;
  bufferView?: string;
  buffer?: string;
}

export interface RelationshipReport {
  sceneChains: SceneChain[];
  bufferChains: BufferChain[];
}

function label(prefix: string, index: number, name?: string): string {
  return name ? `${prefix} ${index}: ${name}` : `${prefix} ${index}`;
}

function textureImageLabel(gltf: GltfRoot, textureIndex: number | undefined): { texture?: string; image?: string } {
  if (textureIndex === undefined) {
    return {};
  }

  const texture = gltf.textures?.[textureIndex];
  const imageIndex = texture?.source;
  const image = imageIndex !== undefined ? gltf.images?.[imageIndex] : undefined;
  const imageName = image?.uri ?? image?.name;

  return {
    texture: label('Texture', textureIndex, texture?.name),
    image: imageIndex !== undefined ? label('Image', imageIndex, imageName) : undefined,
  };
}

function firstMaterialTextureIndex(material: Record<string, unknown> | undefined): number | undefined {
  const pbr = material?.pbrMetallicRoughness as Record<string, unknown> | undefined;
  const baseColorTexture = pbr?.baseColorTexture as Record<string, unknown> | undefined;
  const metallicRoughnessTexture = pbr?.metallicRoughnessTexture as Record<string, unknown> | undefined;
  const normalTexture = material?.normalTexture as Record<string, unknown> | undefined;
  const textureInfo = baseColorTexture ?? metallicRoughnessTexture ?? normalTexture;
  const index = textureInfo?.index;

  return typeof index === 'number' ? index : undefined;
}

function accessorLabel(gltf: GltfRoot, accessorIndex: number): string {
  const accessor = gltf.accessors?.[accessorIndex];
  const shape = accessor?.type && accessor?.count !== undefined ? `${accessor.type} x ${accessor.count}` : accessor?.name;

  return label('Accessor', accessorIndex, shape);
}

function bufferViewLabel(gltf: GltfRoot, bufferViewIndex: number): string {
  const bufferView = gltf.bufferViews?.[bufferViewIndex];
  const suffix = bufferView?.byteLength !== undefined ? `${bufferView.byteLength} bytes` : bufferView?.name;

  return label('BufferView', bufferViewIndex, suffix);
}

function bufferLabel(gltf: GltfRoot, bufferIndex: number): string {
  const buffer = gltf.buffers?.[bufferIndex];
  const suffix = buffer?.uri ?? buffer?.name;

  return label('Buffer', bufferIndex, suffix);
}

export function analyzeRelationships(gltf: GltfRoot): RelationshipReport {
  const sceneChains: SceneChain[] = [];
  const bufferChains: BufferChain[] = [];

  gltf.scenes?.forEach((scene, sceneIndex) => {
    scene.nodes?.forEach((nodeIndex) => {
      const node = gltf.nodes?.[nodeIndex];
      const meshIndex = node?.mesh;
      const mesh = meshIndex !== undefined ? gltf.meshes?.[meshIndex] : undefined;

      if (!node) {
        return;
      }

      if (!mesh || meshIndex === undefined) {
        sceneChains.push({
          scene: label('Scene', sceneIndex, scene.name),
          node: label('Node', nodeIndex, node.name),
        });
        return;
      }

      mesh.primitives?.forEach((primitive, primitiveIndex) => {
        const materialIndex = primitive.material;
        const material = materialIndex !== undefined ? gltf.materials?.[materialIndex] : undefined;
        const textureIndex = firstMaterialTextureIndex(material);
        const textureLabels = textureImageLabel(gltf, textureIndex);

        sceneChains.push({
          scene: label('Scene', sceneIndex, scene.name),
          node: label('Node', nodeIndex, node.name),
          mesh: label('Mesh', meshIndex, mesh.name),
          primitive: label('Primitive', primitiveIndex),
          material: materialIndex !== undefined ? label('Material', materialIndex, material?.name) : undefined,
          texture: textureLabels.texture,
          image: textureLabels.image,
        });
      });
    });
  });

  gltf.meshes?.forEach((mesh, meshIndex) => {
    mesh.primitives?.forEach((primitive, primitiveIndex) => {
      Object.entries(primitive.attributes ?? {}).forEach(([attribute, accessorIndex]) => {
        const accessor = gltf.accessors?.[accessorIndex];
        const bufferViewIndex = accessor?.bufferView;
        const bufferView = bufferViewIndex !== undefined ? gltf.bufferViews?.[bufferViewIndex] : undefined;
        const bufferIndex = bufferView?.buffer;

        bufferChains.push({
          mesh: label('Mesh', meshIndex, mesh.name),
          primitive: label('Primitive', primitiveIndex),
          attribute,
          accessor: accessorLabel(gltf, accessorIndex),
          bufferView: bufferViewIndex !== undefined ? bufferViewLabel(gltf, bufferViewIndex) : undefined,
          buffer: bufferIndex !== undefined ? bufferLabel(gltf, bufferIndex) : undefined,
        });
      });
    });
  });

  return {
    sceneChains,
    bufferChains,
  };
}
```

- [ ] **Step 4: Verify relationship analyzer**

Run:

```bash
npm test -- src/domain/relationshipAnalyzer.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit relationship analyzer**

Run:

```bash
git add src/domain/relationshipAnalyzer.ts src/domain/relationshipAnalyzer.test.ts
git commit -m "feat: analyze gltf relationships"
```

Expected: commit succeeds.

---

### Task 6: Build Import Flow And Data Panels

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Create: `src/components/DropZone.tsx`
- Create: `src/components/HeaderSummary.tsx`
- Create: `src/components/CoveragePanel.tsx`
- Create: `src/components/DetailPanel.tsx`
- Create: `src/components/ReferenceChains.tsx`
- Create: `src/components/StatusBanner.tsx`
- Create: `src/App.test.tsx`

- [ ] **Step 1: Write failing app flow test**

Create `src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('imports a gltf file and shows module coverage', async () => {
    render(<App />);

    const input = screen.getByLabelText('Choose glTF files');
    const file = new File([JSON.stringify({ asset: { version: '2.0', generator: 'test' } })], 'minimal.gltf', {
      type: 'model/gltf+json',
    });

    await userEvent.upload(input, file);

    expect(await screen.findByText('minimal.gltf')).toBeInTheDocument();
    expect(screen.getByText('Asset')).toBeInTheDocument();
    expect(screen.getByText('Materials')).toBeInTheDocument();
    expect(screen.getByText('Missing')).toBeInTheDocument();
    expect(screen.getByText('glTF version')).toBeInTheDocument();
    expect(screen.getByText('2.0')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Install user-event and run failing test**

Run:

```bash
npm install -D @testing-library/user-event
npm test -- src/App.test.tsx
```

Expected: FAIL because the app does not include import UI or coverage panels.

- [ ] **Step 3: Add UI components**

Create `src/components/DropZone.tsx`:

```tsx
import { Upload } from 'lucide-react';
import type { ChangeEvent, DragEvent } from 'react';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
}

export function DropZone({ onFiles }: DropZoneProps) {
  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    onFiles(Array.from(event.target.files ?? []));
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    onFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <label
      className="drop-zone"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <Upload aria-hidden="true" />
      <span className="drop-zone-title">Drop .glb or .gltf files</span>
      <span className="drop-zone-subtitle">For .gltf, include referenced .bin and image resources.</span>
      <input aria-label="Choose glTF files" type="file" multiple accept=".glb,.gltf,.bin,.png,.jpg,.jpeg,.webp" onChange={handleInput} />
    </label>
  );
}
```

Create `src/components/StatusBanner.tsx`:

```tsx
interface StatusBannerProps {
  messages: string[];
  tone: 'warning' | 'error';
}

export function StatusBanner({ messages, tone }: StatusBannerProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className={`status-banner status-banner-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {messages.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  );
}
```

Create `src/components/HeaderSummary.tsx`:

```tsx
import type { GltfRoot } from '../domain/gltfTypes';

interface HeaderSummaryProps {
  file: File;
  kind: 'gltf' | 'glb';
  gltf: GltfRoot;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function HeaderSummary({ file, kind, gltf }: HeaderSummaryProps) {
  return (
    <header className="header-summary">
      <div>
        <h1>{file.name}</h1>
        <p>{kind.toUpperCase()} · {formatBytes(file.size)}</p>
      </div>
      <dl>
        <div>
          <dt>glTF version</dt>
          <dd>{gltf.asset?.version ?? 'Unknown'}</dd>
        </div>
        <div>
          <dt>Generator</dt>
          <dd>{gltf.asset?.generator ?? 'Not declared'}</dd>
        </div>
        <div>
          <dt>Copyright</dt>
          <dd>{gltf.asset?.copyright ?? 'Not declared'}</dd>
        </div>
      </dl>
    </header>
  );
}
```

Create `src/components/CoveragePanel.tsx`:

```tsx
import { AlertTriangle, CheckCircle2, CircleHelp } from 'lucide-react';
import type { CoverageRow } from '../domain/coverageAnalyzer';
import type { GltfModuleKey } from '../domain/gltfTypes';

interface CoveragePanelProps {
  rows: CoverageRow[];
  selectedKey: GltfModuleKey;
  onSelect: (key: GltfModuleKey) => void;
}

function statusLabel(row: CoverageRow): string {
  if (row.status === 'present') {
    return 'Present';
  }

  if (row.status === 'required-problem') {
    return 'Problem';
  }

  return 'Missing';
}

function StatusIcon({ row }: { row: CoverageRow }) {
  if (row.status === 'present') {
    return <CheckCircle2 aria-hidden="true" className="status-icon present" />;
  }

  if (row.status === 'required-problem') {
    return <AlertTriangle aria-hidden="true" className="status-icon problem" />;
  }

  return <CircleHelp aria-hidden="true" className="status-icon missing" />;
}

export function CoveragePanel({ rows, selectedKey, onSelect }: CoveragePanelProps) {
  return (
    <section className="coverage-panel" aria-label="glTF module coverage">
      <h2>Format Coverage</h2>
      <div className="coverage-list">
        {rows.map((row) => (
          <button
            key={row.key}
            className={`coverage-row ${selectedKey === row.key ? 'selected' : ''}`}
            type="button"
            onClick={() => onSelect(row.key)}
          >
            <StatusIcon row={row} />
            <span className="coverage-label">{row.label}</span>
            <span className={`coverage-status ${row.status}`}>{statusLabel(row)}</span>
            <span className="coverage-count">{row.count}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
```

Create `src/components/DetailPanel.tsx`:

```tsx
import type { CoverageRow } from '../domain/coverageAnalyzer';
import type { GltfModuleKey, GltfRoot } from '../domain/gltfTypes';

interface DetailPanelProps {
  gltf: GltfRoot;
  row: CoverageRow;
}

function moduleValue(gltf: GltfRoot, key: GltfModuleKey): unknown {
  return gltf[key];
}

function summarize(value: unknown): string {
  if (value === undefined) {
    return 'No data for this module.';
  }

  return JSON.stringify(value, null, 2);
}

export function DetailPanel({ gltf, row }: DetailPanelProps) {
  const value = moduleValue(gltf, row.key);

  return (
    <section className="detail-panel" aria-label="Selected module details">
      <div className="detail-heading">
        <h2>{row.label}</h2>
        <span>{row.status}</span>
      </div>
      <p>{row.explanation}</p>
      <p className="detail-note">{row.note}</p>
      {row.values && row.values.length > 0 ? (
        <ul className="value-list">
          {row.values.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      ) : null}
      <pre>{summarize(value)}</pre>
    </section>
  );
}
```

Create `src/components/ReferenceChains.tsx`:

```tsx
import type { RelationshipReport } from '../domain/relationshipAnalyzer';

interface ReferenceChainsProps {
  relationships: RelationshipReport;
}

export function ReferenceChains({ relationships }: ReferenceChainsProps) {
  const hasSceneChains = relationships.sceneChains.length > 0;
  const hasBufferChains = relationships.bufferChains.length > 0;

  return (
    <section className="reference-chains" aria-label="glTF reference chains">
      <h2>Reference Chains</h2>
      <h3>scene -&gt; node -&gt; mesh -&gt; material -&gt; texture -&gt; image</h3>
      {hasSceneChains ? (
        <ul>
          {relationships.sceneChains.map((chain, index) => (
            <li key={`${chain.scene}-${chain.node}-${index}`}>
              {[chain.scene, chain.node, chain.mesh, chain.primitive, chain.material, chain.texture, chain.image]
                .filter(Boolean)
                .join(' -> ')}
            </li>
          ))}
        </ul>
      ) : (
        <p>No scene reference chains found.</p>
      )}
      <h3>mesh primitive -&gt; accessor -&gt; bufferView -&gt; buffer</h3>
      {hasBufferChains ? (
        <ul>
          {relationships.bufferChains.map((chain, index) => (
            <li key={`${chain.mesh}-${chain.primitive}-${chain.attribute}-${index}`}>
              {[chain.mesh, chain.primitive, chain.attribute, chain.accessor, chain.bufferView, chain.buffer]
                .filter(Boolean)
                .join(' -> ')}
            </li>
          ))}
        </ul>
      ) : (
        <p>No buffer reference chains found.</p>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Wire App state**

Replace `src/App.tsx` with:

```tsx
import { useMemo, useState } from 'react';
import { CoveragePanel } from './components/CoveragePanel';
import { DetailPanel } from './components/DetailPanel';
import { DropZone } from './components/DropZone';
import { HeaderSummary } from './components/HeaderSummary';
import { ReferenceChains } from './components/ReferenceChains';
import { StatusBanner } from './components/StatusBanner';
import { analyzeCoverage, type CoverageRow } from './domain/coverageAnalyzer';
import { classifyFiles, createResourceMap, type FileKind } from './domain/fileIntake';
import { parseGltfFile } from './domain/gltfParser';
import type { GltfModuleKey, GltfRoot } from './domain/gltfTypes';
import { analyzeRelationships } from './domain/relationshipAnalyzer';

interface LoadedAsset {
  file: File;
  kind: Exclude<FileKind, 'unsupported'>;
  gltf: GltfRoot;
  jsonText: string;
  resources: Map<string, File>;
}

const SUPPORTED_EXTENSIONS = new Set<string>(['KHR_materials_unlit']);

export default function App() {
  const [asset, setAsset] = useState<LoadedAsset | null>(null);
  const [selectedKey, setSelectedKey] = useState<GltfModuleKey>('asset');
  const [messages, setMessages] = useState<string[]>([]);

  const coverageRows = useMemo<CoverageRow[]>(() => {
    return asset ? analyzeCoverage(asset.gltf, SUPPORTED_EXTENSIONS) : [];
  }, [asset]);

  const selectedRow = coverageRows.find((row) => row.key === selectedKey) ?? coverageRows[0];
  const relationships = useMemo(() => (asset ? analyzeRelationships(asset.gltf) : null), [asset]);

  async function handleFiles(files: File[]) {
    const classified = classifyFiles(files);

    if (!classified.primary || classified.kind === 'unsupported') {
      setMessages(classified.errors);
      setAsset(null);
      return;
    }

    try {
      const parsed = await parseGltfFile(classified.primary, classified.kind);
      setAsset({
        file: classified.primary,
        kind: classified.kind,
        gltf: parsed.gltf,
        jsonText: parsed.jsonText,
        resources: createResourceMap(classified.resources),
      });
      setSelectedKey('asset');
      setMessages(classified.errors);
    } catch (error) {
      setMessages([error instanceof Error ? error.message : 'Unable to parse glTF file.']);
      setAsset(null);
    }
  }

  if (!asset) {
    return (
      <main className="app-shell">
        <section className="empty-state">
          <div>
            <h1>glTF Viewer</h1>
            <p>Inspect glTF data coverage and preview local assets.</p>
          </div>
          <DropZone onFiles={handleFiles} />
          <StatusBanner messages={messages} tone="error" />
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell workbench">
      <HeaderSummary file={asset.file} kind={asset.kind} gltf={asset.gltf} />
      <StatusBanner messages={messages} tone="warning" />
      <div className="workspace-grid">
        <aside className="data-column">
          <CoveragePanel rows={coverageRows} selectedKey={selectedKey} onSelect={setSelectedKey} />
          {selectedRow ? <DetailPanel gltf={asset.gltf} row={selectedRow} /> : null}
          {relationships ? <ReferenceChains relationships={relationships} /> : null}
        </aside>
        <section className="preview-column" aria-label="3D preview">
          <div className="preview-standby">
            <h2>3D Preview</h2>
            <p>The Three.js preview is added in the next task.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Replace styling**

Replace `src/styles.css` with:

```css
:root {
  color: #17202a;
  background: #f3f6f8;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  min-height: 100vh;
}

.empty-state {
  display: grid;
  min-height: 100vh;
  place-content: center;
  gap: 24px;
  padding: 24px;
  text-align: center;
}

.empty-state h1 {
  margin: 0 0 8px;
  font-size: 40px;
}

.empty-state p {
  margin: 0;
  color: #52616f;
}

.drop-zone {
  display: grid;
  gap: 8px;
  width: min(560px, calc(100vw - 48px));
  min-height: 180px;
  place-content: center;
  border: 1px dashed #8ca0b3;
  border-radius: 8px;
  background: #ffffff;
  color: #17202a;
}

.drop-zone svg {
  justify-self: center;
  color: #2e6f95;
}

.drop-zone input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.drop-zone-title {
  font-weight: 700;
}

.drop-zone-subtitle {
  color: #52616f;
}

.workbench {
  display: grid;
  grid-template-rows: auto auto 1fr;
  min-height: 100vh;
}

.header-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 20px;
  border-bottom: 1px solid #d7e0e8;
  background: #ffffff;
}

.header-summary h1 {
  margin: 0;
  font-size: 20px;
}

.header-summary p {
  margin: 4px 0 0;
  color: #52616f;
}

.header-summary dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  gap: 16px;
  margin: 0;
}

.header-summary dt {
  color: #52616f;
  font-size: 12px;
}

.header-summary dd {
  margin: 2px 0 0;
  font-weight: 700;
}

.status-banner {
  margin: 12px 20px 0;
  padding: 10px 12px;
  border-radius: 6px;
  text-align: left;
}

.status-banner p {
  margin: 0;
}

.status-banner-error {
  border: 1px solid #d65c5c;
  background: #fff2f2;
}

.status-banner-warning {
  border: 1px solid #d8a23a;
  background: #fff8e7;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(360px, 42vw) minmax(0, 1fr);
  gap: 16px;
  min-height: 0;
  padding: 16px 20px 20px;
}

.data-column {
  display: grid;
  grid-template-rows: auto minmax(220px, 1fr) auto;
  gap: 12px;
  min-height: 0;
}

.coverage-panel,
.detail-panel,
.reference-chains,
.preview-column {
  border: 1px solid #d7e0e8;
  border-radius: 8px;
  background: #ffffff;
}

.coverage-panel,
.detail-panel,
.reference-chains {
  padding: 12px;
}

.coverage-panel h2,
.detail-panel h2,
.reference-chains h2 {
  margin: 0 0 10px;
  font-size: 16px;
}

.coverage-list {
  display: grid;
  gap: 6px;
}

.coverage-row {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto 32px;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 36px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: #f7f9fb;
  color: #17202a;
  text-align: left;
}

.coverage-row.selected {
  border-color: #2e6f95;
  background: #edf7fa;
}

.status-icon.present {
  color: #21764b;
}

.status-icon.missing {
  color: #607080;
}

.status-icon.problem {
  color: #b24d21;
}

.coverage-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coverage-status {
  font-size: 12px;
  font-weight: 700;
}

.coverage-count {
  color: #52616f;
  text-align: right;
}

.detail-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.detail-panel {
  min-height: 0;
  overflow: auto;
}

.detail-panel p,
.reference-chains p {
  color: #52616f;
}

.detail-note {
  font-weight: 700;
}

.detail-panel pre {
  overflow: auto;
  max-height: 280px;
  padding: 12px;
  border-radius: 6px;
  background: #111820;
  color: #d9e8f2;
  font-size: 12px;
}

.value-list {
  margin: 0 0 12px;
  padding-left: 20px;
}

.reference-chains {
  max-height: 220px;
  overflow: auto;
}

.reference-chains h3 {
  margin: 12px 0 6px;
  font-size: 13px;
}

.reference-chains ul {
  margin: 0;
  padding-left: 18px;
}

.reference-chains li {
  margin: 4px 0;
  color: #33475b;
  font-size: 12px;
}

.preview-column {
  min-height: 480px;
  overflow: hidden;
}

.preview-standby {
  display: grid;
  height: 100%;
  place-content: center;
  gap: 8px;
  color: #52616f;
  text-align: center;
}

.preview-standby h2 {
  margin: 0;
  color: #17202a;
}

.preview-standby p {
  margin: 0;
}

@media (max-width: 900px) {
  .header-summary {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-summary dl {
    width: 100%;
    grid-template-columns: 1fr;
  }

  .workspace-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Verify app flow**

Run:

```bash
npm test -- src/App.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit import UI**

Run:

```bash
git add package.json package-lock.json src/App.tsx src/App.test.tsx src/styles.css src/components
git commit -m "feat: add gltf import and data panels"
```

Expected: commit succeeds.

---

### Task 7: Add Three.js Preview Pane

**Files:**
- Create: `src/components/PreviewPane.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add preview component**

Create `src/components/PreviewPane.tsx`:

```tsx
import { Box, Grid3X3, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { GltfRoot } from '../domain/gltfTypes';

interface PreviewPaneProps {
  file: File;
  kind: 'gltf' | 'glb';
  resources: Map<string, File>;
  gltf: GltfRoot;
  onWarning: (message: string) => void;
}

function makeObjectUrlMap(file: File, resources: Map<string, File>): Map<string, string> {
  const urls = new Map<string, string>();
  urls.set(file.name, URL.createObjectURL(file));

  for (const [name, resource] of resources) {
    if (!urls.has(name)) {
      urls.set(name, URL.createObjectURL(resource));
    }
  }

  return urls;
}

function disposeObjectUrlMap(urls: Map<string, string>) {
  for (const url of new Set(urls.values())) {
    URL.revokeObjectURL(url);
  }
}

export function PreviewPane({ file, kind, resources, gltf, onWarning }: PreviewPaneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const sceneRootRef = useRef<THREE.Object3D | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showBox, setShowBox] = useState(false);
  const [darkBackground, setDarkBackground] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeAnimation, setActiveAnimation] = useState(0);
  const [animations, setAnimations] = useState<string[]>([]);

  const sceneOptions = useMemo(() => gltf.scenes?.map((scene, index) => scene.name ?? `Scene ${index}`) ?? [], [gltf]);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(darkBackground ? '#111820' : '#eef3f7');

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.01, 1000);
    camera.position.set(3, 2, 4);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x445566, 2.5);
    scene.add(hemi);

    const directional = new THREE.DirectionalLight(0xffffff, 2);
    directional.position.set(5, 8, 6);
    scene.add(directional);

    const grid = new THREE.GridHelper(10, 10, '#95a5a6', '#d0d7de');
    grid.visible = showGrid;
    scene.add(grid);

    const boxHelper = new THREE.BoxHelper(new THREE.Object3D(), '#e05a47');
    boxHelper.visible = false;
    scene.add(boxHelper);

    const urls = makeObjectUrlMap(file, resources);
    const loader = new GLTFLoader();

    loader.manager.setURLModifier((url) => {
      const normalized = url.replaceAll('\\', '/');
      const basename = normalized.split('/').at(-1) ?? normalized;
      return urls.get(normalized) ?? urls.get(basename) ?? url;
    });

    const sourceUrl = urls.get(file.name);

    if (!sourceUrl) {
      onWarning('Unable to create a preview URL for the selected file.');
      return;
    }

    loader.load(
      sourceUrl,
      (loaded) => {
        scene.add(loaded.scene);
        sceneRootRef.current = loaded.scene;
        boxHelper.setFromObject(loaded.scene);
        boxHelper.visible = showBox;

        const box = new THREE.Box3().setFromObject(loaded.scene);
        const size = box.getSize(new THREE.Vector3()).length();
        const center = box.getCenter(new THREE.Vector3());
        const distance = size > 0 ? size * 1.2 : 4;

        camera.position.set(center.x + distance, center.y + distance * 0.6, center.z + distance);
        camera.lookAt(center);
        controls.target.copy(center);
        controls.update();

        setAnimations(loaded.animations.map((clip, index) => clip.name || `Animation ${index + 1}`));

        if (loaded.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(loaded.scene);
          mixerRef.current = mixer;
          mixer.clipAction(loaded.animations[0]).play();
        }
      },
      undefined,
      (error) => {
        onWarning(error instanceof Error ? error.message : 'Three.js failed to load the asset.');
      },
    );

    const clock = new THREE.Clock();
    let frame = 0;

    function resize() {
      if (!mount) {
        return;
      }

      camera.aspect = mount.clientWidth / Math.max(mount.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }

    function animate() {
      frame = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (isPlaying) {
        mixerRef.current?.update(delta);
      }
      controls.update();
      if (sceneRootRef.current && showBox) {
        boxHelper.setFromObject(sceneRootRef.current);
      }
      renderer.render(scene, camera);
    }

    window.addEventListener('resize', resize);
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      disposeObjectUrlMap(urls);
    };
  }, [file, resources, kind, onWarning]);

  useEffect(() => {
    mixerRef.current?.stopAllAction();
    setIsPlaying(true);
  }, [activeAnimation]);

  function resetView() {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const root = sceneRootRef.current;

    if (!camera || !controls || !root) {
      return;
    }

    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());
    const distance = size > 0 ? size * 1.2 : 4;

    camera.position.set(center.x + distance, center.y + distance * 0.6, center.z + distance);
    controls.target.copy(center);
    controls.update();
  }

  return (
    <section className="preview-pane" aria-label="3D preview">
      <div className={`preview-canvas ${darkBackground ? 'dark' : ''}`} ref={mountRef} />
      <div className="preview-toolbar" aria-label="Preview controls">
        <button type="button" title="Reset view" onClick={resetView}>
          <RotateCcw aria-hidden="true" />
        </button>
        <button type="button" title="Toggle grid" aria-pressed={showGrid} onClick={() => setShowGrid((value) => !value)}>
          <Grid3X3 aria-hidden="true" />
        </button>
        <button type="button" title="Toggle bounding box" aria-pressed={showBox} onClick={() => setShowBox((value) => !value)}>
          <Box aria-hidden="true" />
        </button>
        <button type="button" title="Toggle background" aria-pressed={darkBackground} onClick={() => setDarkBackground((value) => !value)}>
          BG
        </button>
        {animations.length > 0 ? (
          <>
            <button type="button" title="Play or pause animation" onClick={() => setIsPlaying((value) => !value)}>
              {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            </button>
            <select aria-label="Animation" value={activeAnimation} onChange={(event) => setActiveAnimation(Number(event.target.value))}>
              {animations.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
          </>
        ) : null}
        {sceneOptions.length > 1 ? (
          <select aria-label="Scene" defaultValue={gltf.scene ?? 0}>
            {sceneOptions.map((name, index) => (
              <option key={`${name}-${index}`} value={index}>
                {name}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire PreviewPane into App**

Modify `src/App.tsx`:

```tsx
import { useCallback, useMemo, useState } from 'react';
import { CoveragePanel } from './components/CoveragePanel';
import { DetailPanel } from './components/DetailPanel';
import { DropZone } from './components/DropZone';
import { HeaderSummary } from './components/HeaderSummary';
import { PreviewPane } from './components/PreviewPane';
import { ReferenceChains } from './components/ReferenceChains';
import { StatusBanner } from './components/StatusBanner';
import { analyzeCoverage, type CoverageRow } from './domain/coverageAnalyzer';
import { classifyFiles, createResourceMap, type FileKind } from './domain/fileIntake';
import { parseGltfFile } from './domain/gltfParser';
import type { GltfModuleKey, GltfRoot } from './domain/gltfTypes';
import { analyzeRelationships } from './domain/relationshipAnalyzer';

interface LoadedAsset {
  file: File;
  kind: Exclude<FileKind, 'unsupported'>;
  gltf: GltfRoot;
  jsonText: string;
  resources: Map<string, File>;
}

const SUPPORTED_EXTENSIONS = new Set<string>(['KHR_materials_unlit']);

export default function App() {
  const [asset, setAsset] = useState<LoadedAsset | null>(null);
  const [selectedKey, setSelectedKey] = useState<GltfModuleKey>('asset');
  const [messages, setMessages] = useState<string[]>([]);

  const coverageRows = useMemo<CoverageRow[]>(() => {
    return asset ? analyzeCoverage(asset.gltf, SUPPORTED_EXTENSIONS) : [];
  }, [asset]);

  const selectedRow = coverageRows.find((row) => row.key === selectedKey) ?? coverageRows[0];
  const relationships = useMemo(() => (asset ? analyzeRelationships(asset.gltf) : null), [asset]);

  const addWarning = useCallback((message: string) => {
    setMessages((current) => (current.includes(message) ? current : [...current, message]));
  }, []);

  async function handleFiles(files: File[]) {
    const classified = classifyFiles(files);

    if (!classified.primary || classified.kind === 'unsupported') {
      setMessages(classified.errors);
      setAsset(null);
      return;
    }

    try {
      const parsed = await parseGltfFile(classified.primary, classified.kind);
      setAsset({
        file: classified.primary,
        kind: classified.kind,
        gltf: parsed.gltf,
        jsonText: parsed.jsonText,
        resources: createResourceMap(classified.resources),
      });
      setSelectedKey('asset');
      setMessages(classified.errors);
    } catch (error) {
      setMessages([error instanceof Error ? error.message : 'Unable to parse glTF file.']);
      setAsset(null);
    }
  }

  if (!asset) {
    return (
      <main className="app-shell">
        <section className="empty-state">
          <div>
            <h1>glTF Viewer</h1>
            <p>Inspect glTF data coverage and preview local assets.</p>
          </div>
          <DropZone onFiles={handleFiles} />
          <StatusBanner messages={messages} tone="error" />
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell workbench">
      <HeaderSummary file={asset.file} kind={asset.kind} gltf={asset.gltf} />
      <StatusBanner messages={messages} tone="warning" />
      <div className="workspace-grid">
        <aside className="data-column">
          <CoveragePanel rows={coverageRows} selectedKey={selectedKey} onSelect={setSelectedKey} />
          {selectedRow ? <DetailPanel gltf={asset.gltf} row={selectedRow} /> : null}
          {relationships ? <ReferenceChains relationships={relationships} /> : null}
        </aside>
        <PreviewPane
          file={asset.file}
          kind={asset.kind}
          resources={asset.resources}
          gltf={asset.gltf}
          onWarning={addWarning}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Add preview styles**

Append to `src/styles.css`:

```css
.preview-pane {
  position: relative;
  min-height: 480px;
  overflow: hidden;
  border: 1px solid #d7e0e8;
  border-radius: 8px;
  background: #eef3f7;
}

.preview-canvas {
  width: 100%;
  height: 100%;
  min-height: 480px;
}

.preview-canvas.dark {
  background: #111820;
}

.preview-canvas canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.preview-toolbar {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border: 1px solid #d7e0e8;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
}

.preview-toolbar button {
  display: grid;
  width: 34px;
  height: 34px;
  place-content: center;
  border: 1px solid #d7e0e8;
  border-radius: 6px;
  background: #ffffff;
  color: #17202a;
}

.preview-toolbar button[aria-pressed="true"] {
  border-color: #2e6f95;
  background: #edf7fa;
}

.preview-toolbar svg {
  width: 18px;
  height: 18px;
}

.preview-toolbar select {
  max-width: 180px;
  height: 34px;
  border: 1px solid #d7e0e8;
  border-radius: 6px;
  background: #ffffff;
}
```

- [ ] **Step 4: Verify build and existing tests**

Run:

```bash
npm test
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit preview**

Run:

```bash
git add src/App.tsx src/components/PreviewPane.tsx src/styles.css
git commit -m "feat: add threejs gltf preview"
```

Expected: commit succeeds.

---

### Task 8: Add Missing Resource Warnings

**Files:**
- Create: `src/domain/resourceDiagnostics.ts`
- Create: `src/domain/resourceDiagnostics.test.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing diagnostics tests**

Create `src/domain/resourceDiagnostics.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { findMissingResources } from './resourceDiagnostics';
import { TEXTURED_GLTF } from './sampleGltf';

describe('findMissingResources', () => {
  it('reports missing external buffers and images', () => {
    const messages = findMissingResources(TEXTURED_GLTF, new Map());

    expect(messages).toEqual([
      'Missing referenced resource: mesh.bin',
      'Missing referenced resource: paint.png',
    ]);
  });

  it('does not report data URIs or resources present in the map', () => {
    const gltf = {
      ...TEXTURED_GLTF,
      images: [{ uri: 'data:image/png;base64,AAAA' }],
    };
    const resources = new Map<string, File>([['mesh.bin', new File(['x'], 'mesh.bin')]]);

    expect(findMissingResources(gltf, resources)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
npm test -- src/domain/resourceDiagnostics.test.ts
```

Expected: FAIL because `resourceDiagnostics.ts` does not exist.

- [ ] **Step 3: Add resource diagnostics**

Create `src/domain/resourceDiagnostics.ts`:

```ts
import type { GltfRoot } from './gltfTypes';

function isExternalUri(uri: string | undefined): uri is string {
  return Boolean(uri && !uri.startsWith('data:'));
}

function hasResource(resources: Map<string, File>, uri: string): boolean {
  const normalized = uri.replaceAll('\\', '/');
  const basename = normalized.split('/').at(-1) ?? normalized;

  return resources.has(normalized) || resources.has(basename);
}

export function findMissingResources(gltf: GltfRoot, resources: Map<string, File>): string[] {
  const uris = new Set<string>();

  for (const buffer of gltf.buffers ?? []) {
    if (isExternalUri(buffer.uri)) {
      uris.add(buffer.uri);
    }
  }

  for (const image of gltf.images ?? []) {
    if (isExternalUri(image.uri)) {
      uris.add(image.uri);
    }
  }

  return Array.from(uris)
    .filter((uri) => !hasResource(resources, uri))
    .map((uri) => `Missing referenced resource: ${uri}`);
}
```

- [ ] **Step 4: Wire diagnostics into App**

Modify the successful branch of `handleFiles` in `src/App.tsx`:

```tsx
import { findMissingResources } from './domain/resourceDiagnostics';
```

Replace:

```tsx
setAsset({
  file: classified.primary,
  kind: classified.kind,
  gltf: parsed.gltf,
  jsonText: parsed.jsonText,
  resources: createResourceMap(classified.resources),
});
setSelectedKey('asset');
setMessages(classified.errors);
```

with:

```tsx
const resources = createResourceMap(classified.resources);
setAsset({
  file: classified.primary,
  kind: classified.kind,
  gltf: parsed.gltf,
  jsonText: parsed.jsonText,
  resources,
});
setSelectedKey('asset');
setMessages([...classified.errors, ...findMissingResources(parsed.gltf, resources)]);
```

- [ ] **Step 5: Verify diagnostics**

Run:

```bash
npm test -- src/domain/resourceDiagnostics.test.ts src/App.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit diagnostics**

Run:

```bash
git add src/domain/resourceDiagnostics.ts src/domain/resourceDiagnostics.test.ts src/App.tsx
git commit -m "feat: warn for missing gltf resources"
```

Expected: commit succeeds.

---

### Task 9: Final Verification And Manual Run

**Files:**
- No new files required.

- [ ] **Step 1: Run full automated verification**

Run:

```bash
npm test
npm run build
```

Expected: all unit/component tests pass and Vite produces a production build.

- [ ] **Step 2: Start the dev server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL such as `http://127.0.0.1:5173/`.

- [ ] **Step 3: Manual smoke test**

Use the local URL and verify:

- The initial screen shows the drop zone.
- Importing a minimal `.gltf` shows the header summary and coverage checklist.
- `materials`, `animations`, `skins`, and `cameras` show as missing with explanatory notes.
- Importing a `.gltf` that references missing `.bin` or image files shows missing resource warnings while the JSON report remains visible.
- Importing a valid `.glb` renders a model in the Three.js preview.
- Preview controls for reset, grid, background, and bounding box are visible and clickable.

- [ ] **Step 4: Commit final verification notes if any test fixtures or docs changed**

Run:

```bash
git status --short
```

Expected: no uncommitted changes. If verification produced intentional file changes, commit them with:

```bash
git add <changed-files>
git commit -m "test: finalize gltf viewer verification"
```

---

## Self-Review

- Spec coverage: the plan covers local `.gltf`/`.glb` import, module coverage, explanations for missing modules, relationship chains, Three.js preview, animation controls, resource warnings, parser errors, and testing.
- Scope: the plan does not include editing, exporting, URL loading, material editing, screenshots, optimization, or full schema validation.
- Type consistency: shared domain types define `GltfRoot`, `GltfModuleKey`, coverage rows, relationship reports, file kind, and parsed glTF shape before those names are used by UI tasks.
- Red-flag scan: no task depends on an undefined future decision.
