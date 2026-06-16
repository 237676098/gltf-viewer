import { describe, expect, it } from 'vitest';
import { parseGltfFile } from './gltfParser';

function jsonChunkBytes(json: string): Uint8Array {
  const encoder = new TextEncoder();
  const raw = encoder.encode(json);
  const paddedLength = Math.ceil(raw.length / 4) * 4;
  const padded = new Uint8Array(paddedLength);
  padded.set(raw);
  padded.fill(0x20, raw.length);
  return padded;
}

function createGlb(json: string): File {
  const jsonBytes = jsonChunkBytes(json);
  const totalLength = 12 + 8 + jsonBytes.byteLength;
  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);
  let offset = 0;

  view.setUint32(offset, 0x46546c67, true);
  offset += 4;
  view.setUint32(offset, 2, true);
  offset += 4;
  view.setUint32(offset, totalLength, true);
  offset += 4;
  view.setUint32(offset, jsonBytes.byteLength, true);
  offset += 4;
  view.setUint32(offset, 0x4e4f534a, true);
  offset += 4;
  new Uint8Array(buffer, offset).set(jsonBytes);

  return new File([buffer], 'model.glb');
}

describe('parseGltfFile', () => {
  it('parses a text gltf file', async () => {
    const file = new File([JSON.stringify({ asset: { version: '2.0' } })], 'model.gltf', {
      type: 'model/gltf+json',
    });

    const result = await parseGltfFile(file, 'gltf');

    expect(result.gltf.asset?.version).toBe('2.0');
  });

  it('extracts the JSON chunk from a glb file', async () => {
    const file = createGlb(JSON.stringify({ asset: { version: '2.0' }, scenes: [] }));

    const result = await parseGltfFile(file, 'glb');

    expect(result.gltf.asset?.version).toBe('2.0');
    expect(result.gltf.scenes).toEqual([]);
  });

  it('throws a readable error for invalid glb magic', async () => {
    const file = new File([new ArrayBuffer(16)], 'broken.glb');

    await expect(parseGltfFile(file, 'glb')).rejects.toThrow('Invalid GLB header');
  });
});
