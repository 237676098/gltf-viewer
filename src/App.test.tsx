import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { ReferenceChains } from './components/ReferenceChains';

describe('App', () => {
  it('keeps file and directory import inputs reachable by label', () => {
    render(<App />);

    expect(screen.getByLabelText('Choose glTF files')).toBeInTheDocument();
    expect(screen.getByLabelText('Choose glTF folder')).toBeInTheDocument();
  });

  it('imports a gltf file and shows module coverage', async () => {
    render(<App />);

    const input = screen.getByLabelText('Choose glTF files');
    const file = new File([JSON.stringify({ asset: { version: '2.0', generator: 'test' } })], 'minimal.gltf', {
      type: 'model/gltf+json',
    });

    await userEvent.upload(input, file);

    expect(await screen.findByText('minimal.gltf')).toBeInTheDocument();
    expect(screen.getAllByText('Asset').length).toBeGreaterThan(0);
    expect(screen.getByText('Materials')).toBeInTheDocument();
    expect(screen.getAllByText('Missing').length).toBeGreaterThan(0);
    expect(screen.getByText('glTF version')).toBeInTheDocument();
    expect(screen.getByText('2.0')).toBeInTheDocument();
    expect(screen.getByText('3D Preview')).toBeInTheDocument();
    expect(screen.getByText('The Three.js preview is added in the next task.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Asset/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows material texture slots in scene reference chains', () => {
    render(
      <ReferenceChains
        relationships={{
          sceneChains: [
            {
              scene: 'Scene 0',
              node: 'Node 0',
              mesh: 'Mesh 0',
              primitive: 'Primitive 0',
              material: 'Material 0',
              textureSlot: 'pbrMetallicRoughness.baseColorTexture',
              texture: 'Texture 0',
              image: 'Image 0: textures/baseColor.png',
            },
          ],
          bufferChains: [],
        }}
      />,
    );

    expect(
      screen.getByText(
        'Scene 0 -> Node 0 -> Mesh 0 -> Primitive 0 -> Material 0 -> pbrMetallicRoughness.baseColorTexture -> Texture 0 -> Image 0: textures/baseColor.png',
      ),
    ).toBeInTheDocument();
  });
});
