import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './App';

test('renders the initial viewer empty state', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: 'glTF Viewer' })).toBeInTheDocument();
  expect(screen.getByText(/Drop a \.glb or \.gltf file set/)).toBeInTheDocument();
});
