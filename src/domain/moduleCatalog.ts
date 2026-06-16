import type { GltfModuleKey } from './gltfTypes';

export interface ModuleDefinition {
  key: GltfModuleKey;
  label: string;
  explanation: string;
  absenceNote: string;
  expected: 'required' | 'optional';
}

export const GLTF_MODULES: readonly ModuleDefinition[] = [
  { key: 'asset', label: 'Asset', explanation: 'Metadata for the glTF file, including the glTF version and optional generator information.', absenceNote: 'The asset object is expected in valid glTF files.', expected: 'required' },
  { key: 'scenes', label: 'Scenes', explanation: 'Scene definitions group root nodes into renderable scene graphs.', absenceNote: 'A file without scenes has no explicit scene graph to display.', expected: 'optional' },
  { key: 'scene', label: 'Default Scene', explanation: 'The index of the default scene the author expects a viewer to open first.', absenceNote: 'If absent, viewers can choose the first scene when scenes exist.', expected: 'optional' },
  { key: 'nodes', label: 'Nodes', explanation: 'Transform hierarchy entries that can reference meshes, cameras, skins, and child nodes.', absenceNote: 'No nodes means there is no transform hierarchy.', expected: 'optional' },
  { key: 'meshes', label: 'Meshes', explanation: 'Geometry containers made of primitives, attributes, indices, and material references.', absenceNote: 'No meshes means the asset may contain metadata, cameras, or animations but no visible mesh geometry.', expected: 'optional' },
  { key: 'materials', label: 'Materials', explanation: 'Material surface appearance data such as base color, metallic-roughness values, textures, and alpha mode.', absenceNote: 'Missing materials are valid; renderers can use default material behavior.', expected: 'optional' },
  { key: 'textures', label: 'Textures', explanation: 'Texture objects connect image sources and sampler settings to material slots.', absenceNote: 'Missing textures are normal for models that use constants or default material values.', expected: 'optional' },
  { key: 'images', label: 'Images', explanation: 'Image resources referenced by textures, either external URI files or embedded buffer views.', absenceNote: 'Missing images are normal when the asset has no texture-backed materials.', expected: 'optional' },
  { key: 'samplers', label: 'Samplers', explanation: 'Texture filtering and wrapping settings.', absenceNote: 'Missing samplers are valid; viewers use default sampler behavior.', expected: 'optional' },
  { key: 'animations', label: 'Animations', explanation: 'Keyframe animation data that targets node transforms or morph weights.', absenceNote: 'Missing animations mean the asset is static.', expected: 'optional' },
  { key: 'skins', label: 'Skins', explanation: 'Skeletal skinning data linking joints to meshes.', absenceNote: 'Missing skins are normal for rigid or static models.', expected: 'optional' },
  { key: 'cameras', label: 'Cameras', explanation: 'Author-provided perspective or orthographic cameras.', absenceNote: 'Missing cameras are normal; the viewer can create its own camera.', expected: 'optional' },
  { key: 'buffers', label: 'Buffers', explanation: 'Binary payload containers for geometry, animation, skinning, and embedded images.', absenceNote: 'Missing buffers are suspicious when geometry, accessors, or buffer views exist.', expected: 'optional' },
  { key: 'bufferViews', label: 'Buffer Views', explanation: 'Slices of buffers used by accessors or embedded images.', absenceNote: 'Missing buffer views are suspicious when accessors or embedded images exist.', expected: 'optional' },
  { key: 'accessors', label: 'Accessors', explanation: 'Typed views over binary data, describing counts, component types, and vector shapes.', absenceNote: 'Missing accessors are suspicious when meshes or animations exist.', expected: 'optional' },
  { key: 'extensionsUsed', label: 'Extensions Used', explanation: 'Extensions used by the asset for optional or advanced glTF features.', absenceNote: 'Missing extensionsUsed means the asset declares no glTF extensions.', expected: 'optional' },
  { key: 'extensionsRequired', label: 'Extensions Required', explanation: 'Extensions a viewer must support to fully load the asset.', absenceNote: 'Missing extensionsRequired means no extension support is required for core interpretation.', expected: 'optional' },
];

export function getModuleDefinition(key: GltfModuleKey): ModuleDefinition {
  const definition = GLTF_MODULES.find((module) => module.key === key);

  if (!definition) {
    throw new Error(`Unknown glTF module: ${key}`);
  }

  return definition;
}
