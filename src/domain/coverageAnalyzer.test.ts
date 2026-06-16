import { describe, expect, it } from 'vitest';
import { analyzeCoverage } from './coverageAnalyzer';
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
    const rows = analyzeCoverage(REQUIRED_EXTENSION_GLTF, new Set(['KHR_materials_unlit']));
    const extensionsRequired = rows.find((row) => row.key === 'extensionsRequired');

    expect(extensionsRequired?.status).toBe('required-problem');
    expect(extensionsRequired?.note).toContain('unsupported required extension');
    expect(extensionsRequired?.values).toEqual(['VENDOR_required_feature']);
  });
});
