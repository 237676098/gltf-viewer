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
