export type FileKind = 'gltf' | 'glb' | 'unsupported';

export interface ClassifiedFiles {
  kind: FileKind;
  primary?: File;
  resources: File[];
  errors: string[];
}

function extensionOf(file: File): string {
  const dotIndex = file.name.lastIndexOf('.');
  return dotIndex >= 0 ? file.name.slice(dotIndex + 1).toLowerCase() : '';
}

export function classifyFiles(files: File[]): ClassifiedFiles {
  const glb = files.find((file) => extensionOf(file) === 'glb');
  const gltf = files.find((file) => extensionOf(file) === 'gltf');
  const primary = glb ?? gltf;

  if (!primary) {
    return {
      kind: 'unsupported',
      resources: files,
      errors: ['Drop a .glb or .gltf file. For .gltf, include referenced .bin and image files.'],
    };
  }

  return {
    kind: extensionOf(primary) as 'gltf' | 'glb',
    primary,
    resources: files.filter((file) => file !== primary),
    errors: [],
  };
}

export function createResourceMap(files: File[]): Map<string, File> {
  const map = new Map<string, File>();

  for (const file of files) {
    const path = file.webkitRelativePath || file.name;
    const normalized = path.replaceAll('\\', '/');
    const basename = normalized.split('/').at(-1);

    map.set(normalized, file);

    if (basename) {
      map.set(basename, file);
    }
  }

  return map;
}
