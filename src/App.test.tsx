import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
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
  });
});
