import { describe, expect, it } from 'vitest';
import { analyzeRelationships } from './relationshipAnalyzer';
import { TEXTURED_GLTF } from './sampleGltf';

describe('analyzeRelationships', () => {
  it('builds scene-to-image and primitive-to-buffer chains', () => {
    const relationships = analyzeRelationships(TEXTURED_GLTF);

    expect(relationships.sceneChains).toEqual([
      {
        scene: 'Scene 0: Scene',
        node: 'Node 0: Root Node',
        mesh: 'Mesh 0: Triangle',
        primitive: 'Primitive 0',
        material: 'Material 0: Paint',
        texture: 'Texture 0',
        image: 'Image 0: paint.png',
      },
    ]);

    expect(relationships.bufferChains).toEqual([
      {
        mesh: 'Mesh 0: Triangle',
        primitive: 'Primitive 0',
        attribute: 'POSITION',
        accessor: 'Accessor 0: VEC3 x 3',
        bufferView: 'BufferView 0: 72 bytes',
        buffer: 'Buffer 0: mesh.bin',
      },
    ]);
  });
});
