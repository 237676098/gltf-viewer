import { Upload } from 'lucide-react';
import type { ChangeEvent, DragEvent } from 'react';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
}

export function DropZone({ onFiles }: DropZoneProps) {
  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    onFiles(Array.from(event.target.files ?? []));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    onFiles(Array.from(event.dataTransfer.files));
  }

  const directoryInputProps = {
    'aria-label': 'Choose glTF folder',
    type: 'file',
    multiple: true,
    webkitdirectory: '',
    directory: '',
    onChange: handleInput,
  };

  return (
    <div className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
      <label className="drop-zone-main">
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
      <label className="directory-picker">
        <span>Choose a folder</span>
        <input {...directoryInputProps} />
      </label>
    </div>
  );
}
