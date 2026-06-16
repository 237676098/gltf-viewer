import { describe, expect, it } from 'vitest';
import { analyzeCoverage } from './coverageAnalyzer';
import type { GltfRoot } from './gltfTypes';
import { MINIMAL_GLTF, REQUIRED_EXTENSION_GLTF, TEXTURED_GLTF } from './sampleGltf';

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
    const rows = analyzeCoverage(
      {
        ...REQUIRED_EXTENSION_GLTF,
        extensionsRequired: ['KHR_materials_unlit', 'VENDOR_required_feature'],
      },
      new Set(['KHR_materials_unlit']),
    );
    const extensionsRequired = rows.find((row) => row.key === 'extensionsRequired');

    expect(extensionsRequired?.status).toBe('required-problem');
    expect(extensionsRequired?.note).toContain('unsupported required extension');
    expect(extensionsRequired?.values).toEqual(['VENDOR_required_feature']);
  });

  it('marks malformed required extensions as problematic without throwing', () => {
    const malformedGltf = {
      asset: { version: '2.0' },
      extensionsRequired: 'KHR_x',
    } as unknown as GltfRoot;

    expect(() => analyzeCoverage(malformedGltf, new Set())).not.toThrow();

    const rows = analyzeCoverage(malformedGltf, new Set());
    const extensionsRequired = rows.find((row) => row.key === 'extensionsRequired');

    expect(extensionsRequired?.status).toBe('required-problem');
    expect(extensionsRequired?.note).toContain('invalid shape');
    expect(extensionsRequired?.values).toBeUndefined();
  });

  it('clones string array values instead of exposing parsed input references', () => {
    const rows = analyzeCoverage(REQUIRED_EXTENSION_GLTF, new Set());
    const extensionsUsed = rows.find((row) => row.key === 'extensionsUsed');
    const extensionsRequired = rows.find((row) => row.key === 'extensionsRequired');

    expect(extensionsUsed?.values).toEqual(REQUIRED_EXTENSION_GLTF.extensionsUsed);
    expect(extensionsUsed?.values).not.toBe(REQUIRED_EXTENSION_GLTF.extensionsUsed);
    expect(extensionsRequired?.values).toEqual(REQUIRED_EXTENSION_GLTF.extensionsRequired);
    expect(extensionsRequired?.values).not.toBe(REQUIRED_EXTENSION_GLTF.extensionsRequired);
  });
});
