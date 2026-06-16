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
