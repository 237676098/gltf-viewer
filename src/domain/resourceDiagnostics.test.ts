import { describe, expect, it } from 'vitest';
import { findMissingResources } from './resourceDiagnostics';
import { TEXTURED_GLTF } from './sampleGltf';
import type { GltfRoot } from './gltfTypes';

function file(name: string): File {
  return new File(['content'], name);
}

function fileWithRelativePath(name: string, webkitRelativePath: string): File {
  const resource = file(name);

  Object.defineProperty(resource, 'webkitRelativePath', {
    value: webkitRelativePath,
  });

  return resource;
}

describe('resourceDiagnostics', () => {
  it('reports missing external buffer and image resources', () => {
    expect(findMissingResources(TEXTURED_GLTF, new Map())).toEqual([
      'Missing referenced resource: mesh.bin',
      'Missing referenced resource: paint.png',
    ]);
  });

  it('does not report data URI images or resources present in the map', () => {
    const gltf: GltfRoot = {
      ...TEXTURED_GLTF,
      images: [
        { uri: 'data:image/png;base64,AAAA' },
        { bufferView: 0, mimeType: 'image/png' },
        { uri: 'paint.png' },
      ],
    };
    const resources = new Map<string, File>([
      ['mesh.bin', file('mesh.bin')],
      ['paint.png', file('paint.png')],
    ]);

    expect(findMissingResources(gltf, resources)).toEqual([]);
  });

  it('resolves resources relative to the primary gltf directory', () => {
    const gltf: GltfRoot = {
      asset: { version: '2.0' },
      images: [{ uri: 'textures/baseColor.png' }],
    };
    const primary = fileWithRelativePath('model.gltf', 'models/model.gltf');
    const resources = new Map<string, File>([
      ['models/textures/baseColor.png', fileWithRelativePath('baseColor.png', 'models/textures/baseColor.png')],
    ]);

    expect(findMissingResources(gltf, resources, primary)).toEqual([]);
  });

  it('matches URL-escaped resource URIs against decoded resource keys', () => {
    const gltf: GltfRoot = {
      asset: { version: '2.0' },
      images: [{ uri: 'textures/base%20color.png' }],
    };
    const resources = new Map<string, File>([['textures/base color.png', file('base color.png')]]);

    expect(findMissingResources(gltf, resources)).toEqual([]);
  });
});
