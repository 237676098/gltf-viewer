import type { GltfRoot } from './gltfTypes';

export interface SceneChain {
  scene: string;
  node: string;
  mesh?: string;
  primitive?: string;
  material?: string;
  texture?: string;
  image?: string;
}

export interface BufferChain {
  mesh: string;
  primitive: string;
  attribute: string;
  accessor?: string;
  bufferView?: string;
  buffer?: string;
}

export interface RelationshipReport {
  sceneChains: SceneChain[];
  bufferChains: BufferChain[];
}

function label(prefix: string, index: number, name?: string): string {
  return name ? `${prefix} ${index}: ${name}` : `${prefix} ${index}`;
}

function textureImageLabel(gltf: GltfRoot, textureIndex: number | undefined): { texture?: string; image?: string } {
  if (textureIndex === undefined) {
    return {};
  }

  const texture = gltf.textures?.[textureIndex];
  const imageIndex = texture?.source;
  const image = imageIndex !== undefined ? gltf.images?.[imageIndex] : undefined;
  const imageName = image?.uri ?? image?.name;

  return {
    texture: label('Texture', textureIndex, texture?.name),
    image: imageIndex !== undefined ? label('Image', imageIndex, imageName) : undefined,
  };
}

function firstMaterialTextureIndex(material: Record<string, unknown> | undefined): number | undefined {
  const pbr = material?.pbrMetallicRoughness as Record<string, unknown> | undefined;
  const baseColorTexture = pbr?.baseColorTexture as Record<string, unknown> | undefined;
  const metallicRoughnessTexture = pbr?.metallicRoughnessTexture as Record<string, unknown> | undefined;
  const normalTexture = material?.normalTexture as Record<string, unknown> | undefined;
  const textureInfo = baseColorTexture ?? metallicRoughnessTexture ?? normalTexture;
  const index = textureInfo?.index;

  return typeof index === 'number' ? index : undefined;
}

function accessorLabel(gltf: GltfRoot, accessorIndex: number): string {
  const accessor = gltf.accessors?.[accessorIndex];
  const shape = accessor?.type && accessor?.count !== undefined ? `${accessor.type} x ${accessor.count}` : accessor?.name;

  return label('Accessor', accessorIndex, shape);
}

function bufferViewLabel(gltf: GltfRoot, bufferViewIndex: number): string {
  const bufferView = gltf.bufferViews?.[bufferViewIndex];
  const suffix = bufferView?.byteLength !== undefined ? `${bufferView.byteLength} bytes` : bufferView?.name;

  return label('BufferView', bufferViewIndex, suffix);
}

function bufferLabel(gltf: GltfRoot, bufferIndex: number): string {
  const buffer = gltf.buffers?.[bufferIndex];
  const suffix = buffer?.uri ?? buffer?.name;

  return label('Buffer', bufferIndex, suffix);
}

export function analyzeRelationships(gltf: GltfRoot): RelationshipReport {
  const sceneChains: SceneChain[] = [];
  const bufferChains: BufferChain[] = [];

  gltf.scenes?.forEach((scene, sceneIndex) => {
    scene.nodes?.forEach((nodeIndex) => {
      const node = gltf.nodes?.[nodeIndex];
      const meshIndex = node?.mesh;
      const mesh = meshIndex !== undefined ? gltf.meshes?.[meshIndex] : undefined;

      if (!node) {
        return;
      }

      if (!mesh || meshIndex === undefined) {
        sceneChains.push({
          scene: label('Scene', sceneIndex, scene.name),
          node: label('Node', nodeIndex, node.name),
        });
        return;
      }

      mesh.primitives?.forEach((primitive, primitiveIndex) => {
        const materialIndex = primitive.material;
        const material = materialIndex !== undefined ? gltf.materials?.[materialIndex] : undefined;
        const textureIndex = firstMaterialTextureIndex(material);
        const textureLabels = textureImageLabel(gltf, textureIndex);

        sceneChains.push({
          scene: label('Scene', sceneIndex, scene.name),
          node: label('Node', nodeIndex, node.name),
          mesh: label('Mesh', meshIndex, mesh.name),
          primitive: label('Primitive', primitiveIndex),
          material: materialIndex !== undefined ? label('Material', materialIndex, material?.name) : undefined,
          texture: textureLabels.texture,
          image: textureLabels.image,
        });
      });
    });
  });

  gltf.meshes?.forEach((mesh, meshIndex) => {
    mesh.primitives?.forEach((primitive, primitiveIndex) => {
      Object.entries(primitive.attributes ?? {}).forEach(([attribute, accessorIndex]) => {
        const accessor = gltf.accessors?.[accessorIndex];
        const bufferViewIndex = accessor?.bufferView;
        const bufferView = bufferViewIndex !== undefined ? gltf.bufferViews?.[bufferViewIndex] : undefined;
        const bufferIndex = bufferView?.buffer;

        bufferChains.push({
          mesh: label('Mesh', meshIndex, mesh.name),
          primitive: label('Primitive', primitiveIndex),
          attribute,
          accessor: accessorLabel(gltf, accessorIndex),
          bufferView: bufferViewIndex !== undefined ? bufferViewLabel(gltf, bufferViewIndex) : undefined,
          buffer: bufferIndex !== undefined ? bufferLabel(gltf, bufferIndex) : undefined,
        });
      });
    });
  });

  return {
    sceneChains,
    bufferChains,
  };
}
