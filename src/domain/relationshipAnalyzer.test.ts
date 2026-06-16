import { describe, expect, it } from 'vitest';
import type { GltfRoot } from './gltfTypes';
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
        textureSlot: 'pbrMetallicRoughness.baseColorTexture',
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

  it('traverses child nodes from scene roots and avoids cycles', () => {
    const gltf: GltfRoot = {
      ...TEXTURED_GLTF,
      scenes: [{ nodes: [0], name: 'Scene' }],
      nodes: [
        { children: [1], name: 'Root Node' },
        { mesh: 0, children: [0], name: 'Child Node' },
      ],
    };

    const relationships = analyzeRelationships(gltf);

    expect(relationships.sceneChains).toContainEqual({
      scene: 'Scene 0: Scene',
      node: 'Node 1: Child Node',
      mesh: 'Mesh 0: Triangle',
      primitive: 'Primitive 0',
      material: 'Material 0: Paint',
      texture: 'Texture 0',
      image: 'Image 0: paint.png',
      textureSlot: 'pbrMetallicRoughness.baseColorTexture',
    });
    expect(relationships.sceneChains).toHaveLength(2);
  });

  it('labels a single non-base-color texture slot', () => {
    const relationships = analyzeRelationships({
      ...TEXTURED_GLTF,
      materials: [{ name: 'Paint', normalTexture: { index: 0 } }],
    });

    expect(relationships.sceneChains).toEqual([
      {
        scene: 'Scene 0: Scene',
        node: 'Node 0: Root Node',
        mesh: 'Mesh 0: Triangle',
        primitive: 'Primitive 0',
        material: 'Material 0: Paint',
        textureSlot: 'normalTexture',
        texture: 'Texture 0',
        image: 'Image 0: paint.png',
      },
    ]);
  });

  it('emits a row for each common material texture slot', () => {
    const gltf: GltfRoot = {
      ...TEXTURED_GLTF,
      materials: [
        {
          name: 'Paint',
          pbrMetallicRoughness: {
            baseColorTexture: { index: 0 },
            metallicRoughnessTexture: { index: 1 },
          },
          normalTexture: { index: 2 },
          occlusionTexture: { index: 3 },
          emissiveTexture: { index: 4 },
        },
      ],
      textures: [{ source: 0 }, { source: 1 }, { source: 2 }, { source: 3 }, { source: 4 }],
      images: [
        { uri: 'base.png' },
        { uri: 'metallic-roughness.png' },
        { uri: 'normal.png' },
        { uri: 'occlusion.png' },
        { uri: 'emissive.png' },
      ],
    };

    const relationships = analyzeRelationships(gltf);

    expect(relationships.sceneChains).toEqual([
      expect.objectContaining({
        textureSlot: 'pbrMetallicRoughness.baseColorTexture',
        texture: 'Texture 0',
        image: 'Image 0: base.png',
      }),
      expect.objectContaining({
        textureSlot: 'pbrMetallicRoughness.metallicRoughnessTexture',
        texture: 'Texture 1',
        image: 'Image 1: metallic-roughness.png',
      }),
      expect.objectContaining({
        textureSlot: 'normalTexture',
        texture: 'Texture 2',
        image: 'Image 2: normal.png',
      }),
      expect.objectContaining({
        textureSlot: 'occlusionTexture',
        texture: 'Texture 3',
        image: 'Image 3: occlusion.png',
      }),
      expect.objectContaining({
        textureSlot: 'emissiveTexture',
        texture: 'Texture 4',
        image: 'Image 4: emissive.png',
      }),
    ]);
  });

  it('includes primitive indices in buffer chains', () => {
    const gltf: GltfRoot = {
      ...TEXTURED_GLTF,
      meshes: [
        {
          name: 'Triangle',
          primitives: [
            {
              attributes: { POSITION: 0 },
              indices: 1,
            },
          ],
        },
      ],
      accessors: [
        { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
        { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' },
      ],
    };

    const relationships = analyzeRelationships(gltf);

    expect(relationships.bufferChains).toContainEqual({
      mesh: 'Mesh 0: Triangle',
      primitive: 'Primitive 0',
      attribute: 'INDICES',
      accessor: 'Accessor 1: SCALAR x 3',
      bufferView: 'BufferView 1: 24 bytes',
      buffer: 'Buffer 0: mesh.bin',
    });
  });

  it('labels missing scene node, mesh, material, texture, and image references', () => {
    const gltf: GltfRoot = {
      ...TEXTURED_GLTF,
      scenes: [{ nodes: [99, 0], name: 'Scene' }],
      nodes: [{ mesh: 7, name: 'Root Node' }],
      meshes: [
        {
          name: 'Triangle',
          primitives: [{ attributes: { POSITION: 0 }, material: 3 }],
        },
      ],
      materials: [
        {
          name: 'Paint',
          pbrMetallicRoughness: { baseColorTexture: { index: 4 } },
        },
      ],
      textures: [{ source: 8 }],
    };

    const relationships = analyzeRelationships(gltf);

    expect(relationships.sceneChains).toContainEqual({
      scene: 'Scene 0: Scene',
      node: 'Node 99 (missing)',
    });
    expect(relationships.sceneChains).toContainEqual({
      scene: 'Scene 0: Scene',
      node: 'Node 0: Root Node',
      mesh: 'Mesh 7 (missing)',
    });
    expect(
      analyzeRelationships({
        ...TEXTURED_GLTF,
        meshes: [
          {
            name: 'Triangle',
            primitives: [{ attributes: { POSITION: 0 }, material: 3 }],
          },
        ],
      }).sceneChains,
    ).toContainEqual(
      expect.objectContaining({
        material: 'Material 3 (missing)',
      }),
    );
    expect(
      analyzeRelationships({
        ...TEXTURED_GLTF,
        materials: [{ pbrMetallicRoughness: { baseColorTexture: { index: 4 } } }],
      }).sceneChains,
    ).toContainEqual(
      expect.objectContaining({
        texture: 'Texture 4 (missing)',
      }),
    );
    expect(
      analyzeRelationships({
        ...TEXTURED_GLTF,
        textures: [{ source: 8 }],
      }).sceneChains,
    ).toContainEqual(
      expect.objectContaining({
        image: 'Image 8 (missing)',
      }),
    );
  });

  it('labels malformed texture slot references as invalid', () => {
    const missingIndexRelationships = analyzeRelationships({
      ...TEXTURED_GLTF,
      materials: [{ name: 'Paint', normalTexture: {} }],
    });
    const nonNumericIndexRelationships = analyzeRelationships({
      ...TEXTURED_GLTF,
      materials: [{ name: 'Paint', normalTexture: { index: 'bad' } }],
    });

    expect(missingIndexRelationships.sceneChains).toContainEqual(
      expect.objectContaining({
        textureSlot: 'normalTexture',
        texture: 'Texture normalTexture (invalid)',
      }),
    );
    expect(nonNumericIndexRelationships.sceneChains).toContainEqual(
      expect.objectContaining({
        textureSlot: 'normalTexture',
        texture: 'Texture normalTexture (invalid)',
      }),
    );
  });

  it('labels missing accessor, bufferView, and buffer references in buffer chains', () => {
    const relationships = analyzeRelationships({
      ...TEXTURED_GLTF,
      meshes: [
        {
          name: 'Triangle',
          primitives: [
            {
              attributes: {
                POSITION: 12,
                NORMAL: 1,
                TEXCOORD_0: 2,
              },
            },
          ],
        },
      ],
      accessors: [
        { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
        { bufferView: 2, componentType: 5126, count: 3, type: 'VEC3' },
        { bufferView: 1, componentType: 5126, count: 3, type: 'VEC2' },
      ],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: 72 },
        { buffer: 1, byteOffset: 72, byteLength: 24 },
      ],
    });

    expect(relationships.bufferChains).toContainEqual(
      expect.objectContaining({
        attribute: 'POSITION',
        accessor: 'Accessor 12 (missing)',
      }),
    );
    expect(relationships.bufferChains).toContainEqual(
      expect.objectContaining({
        attribute: 'NORMAL',
        bufferView: 'BufferView 2 (missing)',
      }),
    );
    expect(relationships.bufferChains).toContainEqual(
      expect.objectContaining({
        attribute: 'TEXCOORD_0',
        buffer: 'Buffer 1 (missing)',
      }),
    );
  });
});
