export type GltfModuleKey =
  | 'asset'
  | 'scenes'
  | 'scene'
  | 'nodes'
  | 'meshes'
  | 'materials'
  | 'textures'
  | 'images'
  | 'samplers'
  | 'animations'
  | 'skins'
  | 'cameras'
  | 'buffers'
  | 'bufferViews'
  | 'accessors'
  | 'extensionsUsed'
  | 'extensionsRequired';

export interface GltfAsset {
  version?: string;
  generator?: string;
  copyright?: string;
  [key: string]: unknown;
}

export interface GltfRoot {
  asset?: GltfAsset;
  scene?: number;
  scenes?: Array<{ name?: string; nodes?: number[]; [key: string]: unknown }>;
  nodes?: Array<{ name?: string; mesh?: number; camera?: number; skin?: number; children?: number[]; [key: string]: unknown }>;
  meshes?: Array<{ name?: string; primitives?: Array<{ attributes?: Record<string, number>; indices?: number; material?: number; [key: string]: unknown }>; [key: string]: unknown }>;
  materials?: Array<{ name?: string; [key: string]: unknown }>;
  textures?: Array<{ name?: string; source?: number; sampler?: number; [key: string]: unknown }>;
  images?: Array<{ name?: string; uri?: string; mimeType?: string; bufferView?: number; [key: string]: unknown }>;
  samplers?: Array<Record<string, unknown>>;
  animations?: Array<{ name?: string; channels?: unknown[]; samplers?: unknown[]; [key: string]: unknown }>;
  skins?: Array<{ name?: string; joints?: number[]; skeleton?: number; [key: string]: unknown }>;
  cameras?: Array<{ name?: string; type?: string; [key: string]: unknown }>;
  buffers?: Array<{ name?: string; uri?: string; byteLength?: number; [key: string]: unknown }>;
  bufferViews?: Array<{ name?: string; buffer?: number; byteOffset?: number; byteLength?: number; [key: string]: unknown }>;
  accessors?: Array<{ name?: string; bufferView?: number; componentType?: number; count?: number; type?: string; [key: string]: unknown }>;
  extensionsUsed?: string[];
  extensionsRequired?: string[];
  [key: string]: unknown;
}
