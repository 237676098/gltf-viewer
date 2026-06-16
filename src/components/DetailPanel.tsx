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
