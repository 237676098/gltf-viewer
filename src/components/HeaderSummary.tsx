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
        <p>
          {kind.toUpperCase()} · {formatBytes(file.size)}
        </p>
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
