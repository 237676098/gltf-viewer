import { useMemo, useRef, useState } from 'react';
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
  const importRequestIdRef = useRef(0);

  const coverageRows = useMemo<CoverageRow[]>(() => {
    return asset ? analyzeCoverage(asset.gltf, SUPPORTED_EXTENSIONS) : [];
  }, [asset]);

  const selectedRow = coverageRows.find((row) => row.key === selectedKey) ?? coverageRows[0];
  const relationships = useMemo(() => (asset ? analyzeRelationships(asset.gltf) : null), [asset]);

  async function handleFiles(files: File[]) {
    const requestId = importRequestIdRef.current + 1;
    importRequestIdRef.current = requestId;
    const classified = classifyFiles(files);

    if (!classified.primary || classified.kind === 'unsupported') {
      setMessages(classified.errors);
      setAsset(null);
      return;
    }

    try {
      const parsed = await parseGltfFile(classified.primary, classified.kind);
      if (requestId !== importRequestIdRef.current) {
        return;
      }

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
      if (requestId !== importRequestIdRef.current) {
        return;
      }

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
