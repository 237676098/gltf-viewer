import type { GltfRoot } from './gltfTypes';

export interface SceneChain {
  scene: string;
  node: string;
  mesh?: string;
  primitive?: string;
  material?: string;
  textureSlot?: string;
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

function missingLabel(prefix: string, index: number): string {
  return `${prefix} ${index} (missing)`;
}

function indexedLabel<T extends { name?: string }>(
  collection: T[] | undefined,
  prefix: string,
  index: number,
  suffix: (item: T) => string | undefined = (item) => item.name,
): string {
  const item = collection?.[index];

  return item ? label(prefix, index, suffix(item)) : missingLabel(prefix, index);
}

function textureImageLabel(gltf: GltfRoot, textureIndex: number): { texture: string; image?: string } {
  const texture = gltf.textures?.[textureIndex];

  if (!texture) {
    return {
      texture: missingLabel('Texture', textureIndex),
    };
  }

  const imageIndex = texture.source;
  const image = imageIndex !== undefined ? gltf.images?.[imageIndex] : undefined;
  const imageName = image?.uri ?? image?.name;

  return {
    texture: label('Texture', textureIndex, texture.name),
    image: imageIndex !== undefined ? (image ? label('Image', imageIndex, imageName) : missingLabel('Image', imageIndex)) : undefined,
  };
}

function textureIndexFrom(textureInfo: unknown): number | undefined {
  const index = (textureInfo as Record<string, unknown> | undefined)?.index;

  return typeof index === 'number' ? index : undefined;
}

interface MaterialTextureSlot {
  slot: string;
  textureIndex?: number;
  invalid?: boolean;
}

function materialTextureSlots(material: Record<string, unknown>): MaterialTextureSlot[] {
  const pbr = material.pbrMetallicRoughness as Record<string, unknown> | undefined;
  const candidates: Array<[string, unknown]> = [
    ['pbrMetallicRoughness.baseColorTexture', pbr?.baseColorTexture],
    ['pbrMetallicRoughness.metallicRoughnessTexture', pbr?.metallicRoughnessTexture],
    ['normalTexture', material.normalTexture],
    ['occlusionTexture', material.occlusionTexture],
    ['emissiveTexture', material.emissiveTexture],
  ];

  return candidates.flatMap(([slot, textureInfo]): MaterialTextureSlot[] => {
    if (textureInfo === undefined) {
      return [];
    }

    const textureIndex = textureIndexFrom(textureInfo);

    return textureIndex === undefined ? [{ slot, invalid: true }] : [{ slot, textureIndex }];
  });
}

function accessorLabel(gltf: GltfRoot, accessorIndex: number): string {
  const accessor = gltf.accessors?.[accessorIndex];
  if (!accessor) {
    return missingLabel('Accessor', accessorIndex);
  }

  const shape = accessor?.type && accessor?.count !== undefined ? `${accessor.type} x ${accessor.count}` : accessor?.name;

  return label('Accessor', accessorIndex, shape);
}

function bufferViewLabel(gltf: GltfRoot, bufferViewIndex: number): string {
  const bufferView = gltf.bufferViews?.[bufferViewIndex];
  if (!bufferView) {
    return missingLabel('BufferView', bufferViewIndex);
  }

  const suffix = bufferView?.byteLength !== undefined ? `${bufferView.byteLength} bytes` : bufferView?.name;

  return label('BufferView', bufferViewIndex, suffix);
}

function bufferLabel(gltf: GltfRoot, bufferIndex: number): string {
  const buffer = gltf.buffers?.[bufferIndex];
  if (!buffer) {
    return missingLabel('Buffer', bufferIndex);
  }

  const suffix = buffer?.uri ?? buffer?.name;

  return label('Buffer', bufferIndex, suffix);
}

function bufferChainForAccessor(gltf: GltfRoot, meshIndex: number, primitiveIndex: number, attribute: string, accessorIndex: number): BufferChain {
  const accessor = gltf.accessors?.[accessorIndex];
  const bufferViewIndex = accessor?.bufferView;
  const bufferView = bufferViewIndex !== undefined ? gltf.bufferViews?.[bufferViewIndex] : undefined;
  const bufferIndex = bufferView?.buffer;

  return {
    mesh: indexedLabel(gltf.meshes, 'Mesh', meshIndex),
    primitive: label('Primitive', primitiveIndex),
    attribute,
    accessor: accessorLabel(gltf, accessorIndex),
    bufferView: bufferViewIndex !== undefined ? bufferViewLabel(gltf, bufferViewIndex) : undefined,
    buffer: bufferIndex !== undefined ? bufferLabel(gltf, bufferIndex) : undefined,
  };
}

export function analyzeRelationships(gltf: GltfRoot): RelationshipReport {
  const sceneChains: SceneChain[] = [];
  const bufferChains: BufferChain[] = [];

  gltf.scenes?.forEach((scene, sceneIndex) => {
    const visitNode = (nodeIndex: number, visited: Set<number>) => {
      const node = gltf.nodes?.[nodeIndex];

      if (!node) {
        sceneChains.push({
          scene: label('Scene', sceneIndex, scene.name),
          node: missingLabel('Node', nodeIndex),
        });
        return;
      }

      if (visited.has(nodeIndex)) {
        return;
      }
      visited.add(nodeIndex);

      const meshIndex = node.mesh;
      const mesh = meshIndex !== undefined ? gltf.meshes?.[meshIndex] : undefined;

      if (meshIndex === undefined) {
        sceneChains.push({
          scene: label('Scene', sceneIndex, scene.name),
          node: label('Node', nodeIndex, node.name),
        });
      } else if (!mesh) {
        sceneChains.push({
          scene: label('Scene', sceneIndex, scene.name),
          node: label('Node', nodeIndex, node.name),
          mesh: missingLabel('Mesh', meshIndex),
        });
      } else {
        mesh.primitives?.forEach((primitive, primitiveIndex) => {
          const materialIndex = primitive.material;
          const material = materialIndex !== undefined ? gltf.materials?.[materialIndex] : undefined;
          const textureSlots = material ? materialTextureSlots(material) : [];
          const sceneChainBase = {
            scene: label('Scene', sceneIndex, scene.name),
            node: label('Node', nodeIndex, node.name),
            mesh: label('Mesh', meshIndex, mesh.name),
            primitive: label('Primitive', primitiveIndex),
            material:
              materialIndex !== undefined
                ? material
                  ? label('Material', materialIndex, material.name)
                  : missingLabel('Material', materialIndex)
                : undefined,
          };

          if (textureSlots.length === 0) {
            sceneChains.push(sceneChainBase);
            return;
          }

          textureSlots.forEach(({ slot, textureIndex, invalid }) => {
            const textureLabels =
              invalid || textureIndex === undefined ? { texture: `Texture ${slot} (invalid)` } : textureImageLabel(gltf, textureIndex);

            sceneChains.push({
              ...sceneChainBase,
              textureSlot: slot,
              texture: textureLabels.texture,
              image: textureLabels.image,
            });
          });
        });
      }

      node.children?.forEach((childNodeIndex) => {
        visitNode(childNodeIndex, visited);
      });
    };

    scene.nodes?.forEach((nodeIndex) => {
      visitNode(nodeIndex, new Set<number>());
    });
  });

  gltf.meshes?.forEach((mesh, meshIndex) => {
    mesh.primitives?.forEach((primitive, primitiveIndex) => {
      Object.entries(primitive.attributes ?? {}).forEach(([attribute, accessorIndex]) => {
        bufferChains.push(bufferChainForAccessor(gltf, meshIndex, primitiveIndex, attribute, accessorIndex));
      });

      if (primitive.indices !== undefined) {
        bufferChains.push(bufferChainForAccessor(gltf, meshIndex, primitiveIndex, 'INDICES', primitive.indices));
      }
    });
  });

  return {
    sceneChains,
    bufferChains,
  };
}
