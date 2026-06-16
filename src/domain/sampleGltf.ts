import type { GltfRoot } from './gltfTypes';

export const MINIMAL_GLTF: GltfRoot = {
  asset: {
    version: '2.0',
    generator: 'unit-test',
  },
};

export const TEXTURED_GLTF: GltfRoot = {
  asset: {
    version: '2.0',
    generator: 'unit-test',
  },
  scene: 0,
  scenes: [{ nodes: [0], name: 'Scene' }],
  nodes: [{ mesh: 0, name: 'Root Node' }],
  meshes: [
    {
      name: 'Triangle',
      primitives: [
        {
          attributes: { POSITION: 0 },
          material: 0,
        },
      ],
    },
  ],
  materials: [{ name: 'Paint', pbrMetallicRoughness: { baseColorTexture: { index: 0 } } }],
  textures: [{ source: 0, sampler: 0 }],
  images: [{ uri: 'paint.png' }],
  samplers: [{ magFilter: 9729, minFilter: 9987 }],
  buffers: [{ uri: 'mesh.bin', byteLength: 96 }],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: 72 },
    { buffer: 0, byteOffset: 72, byteLength: 24 },
  ],
  accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' }],
};

export const REQUIRED_EXTENSION_GLTF: GltfRoot = {
  ...TEXTURED_GLTF,
  extensionsUsed: ['KHR_materials_unlit', 'VENDOR_required_feature'],
  extensionsRequired: ['VENDOR_required_feature'],
};
