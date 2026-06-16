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
