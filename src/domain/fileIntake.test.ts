import { describe, expect, it } from 'vitest';
import { classifyFiles, createResourceMap } from './fileIntake';

function file(name: string, type = ''): File {
  return new File(['content'], name, { type });
}

function fileWithRelativePath(name: string, webkitRelativePath: string): File {
  const resource = file(name);

  Object.defineProperty(resource, 'webkitRelativePath', {
    value: webkitRelativePath,
  });

  return resource;
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

  it('uses webkit relative paths when available', () => {
    const resource = fileWithRelativePath('baseColor.png', 'textures/baseColor.png');
    const map = createResourceMap([resource]);

    expect(map.get('textures/baseColor.png')).toBe(resource);
    expect(map.get('baseColor.png')).toBe(resource);
  });
});
