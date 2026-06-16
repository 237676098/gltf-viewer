import type { GltfRoot } from './gltfTypes';

function safeDecodeUri(uri: string): string {
  try {
    return decodeURIComponent(uri);
  } catch {
    return uri;
  }
}

function normalizeResourceKey(uri: string): string {
  return uri.replaceAll('\\', '/').replace(/^\.?\//, '');
}

function basename(uri: string): string {
  const normalized = normalizeResourceKey(uri);
  return normalized.slice(normalized.lastIndexOf('/') + 1);
}

function dirname(path: string): string {
  const normalized = normalizeResourceKey(path);
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash === -1 ? '' : normalized.slice(0, lastSlash);
}

function primaryPathOf(primaryFile?: File): string {
  if (!primaryFile) {
    return '';
  }

  return primaryFile.webkitRelativePath || primaryFile.name;
}

function addCandidate(candidates: Set<string>, uri: string): void {
  const normalized = normalizeResourceKey(uri);

  if (normalized) {
    candidates.add(normalized);
  }
}

function candidateKeys(uri: string, primaryFile?: File): string[] {
  const decoded = safeDecodeUri(uri);
  const primaryDirectory = dirname(primaryPathOf(primaryFile));
  const candidates = new Set<string>();

  if (primaryDirectory) {
    addCandidate(candidates, `${primaryDirectory}/${uri}`);
    addCandidate(candidates, `${primaryDirectory}/${decoded}`);
  }

  addCandidate(candidates, uri);
  addCandidate(candidates, decoded);
  addCandidate(candidates, basename(uri));
  addCandidate(candidates, basename(decoded));

  return [...candidates];
}

function isDataUri(uri: string): boolean {
  return uri.trim().toLowerCase().startsWith('data:');
}

function referencedUris(gltf: GltfRoot): string[] {
  const uris: string[] = [];

  for (const buffer of gltf.buffers ?? []) {
    if (buffer.uri && !isDataUri(buffer.uri)) {
      uris.push(buffer.uri);
    }
  }

  for (const image of gltf.images ?? []) {
    if (image.uri && !isDataUri(image.uri)) {
      uris.push(image.uri);
    }
  }

  return uris;
}

export function findMissingResources(gltf: GltfRoot, resources: Map<string, File>, primaryFile?: File): string[] {
  const resourceKeys = new Set([...resources.keys()].map(normalizeResourceKey));
  const messages: string[] = [];
  const seenUris = new Set<string>();

  for (const uri of referencedUris(gltf)) {
    if (seenUris.has(uri)) {
      continue;
    }

    seenUris.add(uri);

    if (!candidateKeys(uri, primaryFile).some((candidate) => resourceKeys.has(candidate))) {
      messages.push(`Missing referenced resource: ${uri}`);
    }
  }

  return messages;
}
