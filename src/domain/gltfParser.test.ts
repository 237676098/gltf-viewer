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
  const totalLength = 20 + jsonBytes.byteLength;
  const buffer = createGlbBuffer({
    declaredLength: totalLength,
    chunkLength: jsonBytes.byteLength,
    jsonBytes,
  });

  return new File([buffer], 'model.glb');
}

function createGlbBuffer({
  actualLength,
  declaredLength,
  chunkLength,
  jsonBytes = new Uint8Array(),
}: {
  actualLength?: number;
  declaredLength: number;
  chunkLength: number;
  jsonBytes?: Uint8Array;
}): ArrayBuffer {
  const totalLength = actualLength ?? Math.max(20 + jsonBytes.byteLength, 20);
  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);
  let offset = 0;

  view.setUint32(offset, 0x46546c67, true);
  offset += 4;
  view.setUint32(offset, 2, true);
  offset += 4;
  view.setUint32(offset, declaredLength, true);
  offset += 4;
  view.setUint32(offset, chunkLength, true);
  offset += 4;
  view.setUint32(offset, 0x4e4f534a, true);
  offset += 4;

  new Uint8Array(buffer, offset, Math.min(jsonBytes.byteLength, totalLength - offset)).set(
    jsonBytes.slice(0, totalLength - offset),
  );

  return buffer;
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

  it('throws a readable error when declared glb length is shorter than the actual file', async () => {
    const jsonBytes = jsonChunkBytes(JSON.stringify({ asset: { version: '2.0' } }));
    const file = new File(
      [
        createGlbBuffer({
          actualLength: 24 + jsonBytes.byteLength,
          declaredLength: 20 + jsonBytes.byteLength,
          chunkLength: jsonBytes.byteLength,
          jsonBytes,
        }),
      ],
      'trailing.glb',
    );

    await expect(parseGltfFile(file, 'glb')).rejects.toThrow('Invalid GLB length');
  });

  it('throws a readable error when declared glb length is longer than the actual file', async () => {
    const jsonBytes = jsonChunkBytes(JSON.stringify({ asset: { version: '2.0' } }));
    const file = new File(
      [
        createGlbBuffer({
          declaredLength: 24 + jsonBytes.byteLength,
          chunkLength: jsonBytes.byteLength,
          jsonBytes,
        }),
      ],
      'truncated.glb',
    );

    await expect(parseGltfFile(file, 'glb')).rejects.toThrow('Invalid GLB length');
  });

  it('throws a readable error when the JSON chunk length exceeds the declared glb length', async () => {
    const jsonBytes = jsonChunkBytes(JSON.stringify({ asset: { version: '2.0' } }));
    const file = new File(
      [
        createGlbBuffer({
          declaredLength: 20 + jsonBytes.byteLength,
          chunkLength: jsonBytes.byteLength + 4,
          jsonBytes,
        }),
      ],
      'oversized-chunk.glb',
    );

    await expect(parseGltfFile(file, 'glb')).rejects.toThrow('Invalid GLB JSON chunk length');
  });

  it('throws a readable error for an unaligned JSON chunk length', async () => {
    const file = new File(
      [
        createGlbBuffer({
          declaredLength: 23,
          chunkLength: 3,
          jsonBytes: new TextEncoder().encode('{} '),
        }),
      ],
      'unaligned-chunk.glb',
    );

    await expect(parseGltfFile(file, 'glb')).rejects.toThrow('Invalid GLB JSON chunk length');
  });

  it('throws a readable error for a zero JSON chunk length', async () => {
    const file = new File(
      [
        createGlbBuffer({
          declaredLength: 20,
          chunkLength: 0,
        }),
      ],
      'empty-chunk.glb',
    );

    await expect(parseGltfFile(file, 'glb')).rejects.toThrow('Invalid GLB JSON chunk length');
  });
});
