import type { FileKind } from './fileIntake';
import type { GltfRoot } from './gltfTypes';

export interface ParsedGltf {
  gltf: GltfRoot;
  jsonText: string;
}

const GLB_MAGIC = 0x46546c67;
const GLB_VERSION = 2;
const JSON_CHUNK_TYPE = 0x4e4f534a;

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }

      reject(new Error('Failed to read file bytes.'));
    });
    reader.addEventListener('error', () => reject(reader.error ?? new Error('Failed to read file.')));
    reader.readAsArrayBuffer(file);
  });
}

function parseJson(text: string): GltfRoot {
  const parsed = JSON.parse(text) as unknown;

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('glTF JSON root must be an object.');
  }

  return parsed as GltfRoot;
}

async function parseTextGltf(file: File): Promise<ParsedGltf> {
  const jsonText = new TextDecoder().decode(await readFileAsArrayBuffer(file));

  return {
    gltf: parseJson(jsonText),
    jsonText,
  };
}

async function parseGlb(file: File): Promise<ParsedGltf> {
  const buffer = await readFileAsArrayBuffer(file);
  const view = new DataView(buffer);

  if (buffer.byteLength < 20 || view.getUint32(0, true) !== GLB_MAGIC || view.getUint32(4, true) !== GLB_VERSION) {
    throw new Error('Invalid GLB header.');
  }

  const declaredLength = view.getUint32(8, true);

  if (declaredLength !== buffer.byteLength) {
    throw new Error('Invalid GLB length.');
  }

  const chunkLength = view.getUint32(12, true);
  const chunkType = view.getUint32(16, true);

  if (chunkType !== JSON_CHUNK_TYPE) {
    throw new Error('First GLB chunk is not JSON.');
  }

  if (chunkLength === 0 || chunkLength % 4 !== 0 || 20 + chunkLength > declaredLength) {
    throw new Error('Invalid GLB JSON chunk length.');
  }

  const jsonBytes = new Uint8Array(buffer, 20, chunkLength);
  const jsonText = new TextDecoder().decode(jsonBytes).trim();

  return {
    gltf: parseJson(jsonText),
    jsonText,
  };
}

export async function parseGltfFile(file: File, kind: Exclude<FileKind, 'unsupported'>): Promise<ParsedGltf> {
  return kind === 'glb' ? parseGlb(file) : parseTextGltf(file);
}
