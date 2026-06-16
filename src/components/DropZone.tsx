import { Upload } from 'lucide-react';
import type { ChangeEvent, DragEvent } from 'react';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
}

export function DropZone({ onFiles }: DropZoneProps) {
  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    onFiles(Array.from(event.target.files ?? []));
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    onFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <label className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
      <Upload aria-hidden="true" />
      <span className="drop-zone-title">Drop .glb or .gltf files</span>
      <span className="drop-zone-subtitle">For .gltf, include referenced .bin and image resources.</span>
      <input
        aria-label="Choose glTF files"
        type="file"
        multiple
        accept=".glb,.gltf,.bin,.png,.jpg,.jpeg,.webp"
        onChange={handleInput}
      />
    </label>
  );
}
