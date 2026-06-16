import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { GltfRoot } from '../domain/gltfTypes';

interface PreviewPaneProps {
  file: File;
  kind: 'gltf' | 'glb';
  resources: Map<string, File>;
  gltf: GltfRoot;
  onWarning: (message: string) => void;
}

const BACKGROUND_COLOR = 0xf7f9fc;
const EMPTY_BOX = new THREE.Box3();
const MATERIAL_TEXTURE_KEYS = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'emissiveMap',
  'aoMap',
  'alphaMap',
  'bumpMap',
  'displacementMap',
  'lightMap',
  'envMap',
] as const;

function normalizeResourceKey(uri: string): string {
  const decoded = decodeURIComponent(uri).replaceAll('\\', '/');
  return decoded.replace(/^\.?\//, '');
}

function basename(uri: string): string {
  const normalized = normalizeResourceKey(uri);
  return normalized.slice(normalized.lastIndexOf('/') + 1);
}

function dirname(uri: string): string {
  const normalized = normalizeResourceKey(uri);
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash === -1 ? '' : normalized.slice(0, lastSlash);
}

function resolveResourceUrl(uri: string, primaryDirectory: string, urlsByAlias: Map<string, string>): string {
  const normalized = normalizeResourceKey(uri);
  const decoded = decodeURIComponent(uri).replaceAll('\\', '/');
  const candidates = [
    primaryDirectory ? normalizeResourceKey(`${primaryDirectory}/${uri}`) : '',
    normalized,
    normalizeResourceKey(decoded),
    basename(normalized),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const url = urlsByAlias.get(candidate);
    if (url) {
      return url;
    }
  }

  return uri;
}

function disposeMaterial(material: THREE.Material): void {
  const materialWithTextures = material as THREE.Material & Partial<Record<(typeof MATERIAL_TEXTURE_KEYS)[number], THREE.Texture>>;

  for (const key of MATERIAL_TEXTURE_KEYS) {
    materialWithTextures[key]?.dispose();
  }

  material.dispose();
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    const geometry = mesh.geometry as THREE.BufferGeometry | undefined;
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;

    geometry?.dispose();
    if (Array.isArray(material)) {
      material.forEach(disposeMaterial);
      return;
    }

    if (material) {
      disposeMaterial(material);
    }
  });
}

function fitCameraToObject(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  object: THREE.Object3D,
): { position: THREE.Vector3; target: THREE.Vector3; near: number; far: number } {
  const box = new THREE.Box3().setFromObject(object);

  if (box.equals(EMPTY_BOX) || box.isEmpty()) {
    camera.position.set(3, 2, 4);
    camera.near = 0.01;
    camera.far = 1000;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.update();
    return {
      position: camera.position.clone(),
      target: controls.target.clone(),
      near: camera.near,
      far: camera.far,
    };
  }

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z);
  const distance = maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  const direction = new THREE.Vector3(1.5, 1.1, 1.5).normalize();

  camera.position.copy(center).add(direction.multiplyScalar(distance * 1.6));
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = Math.max(distance * 100, 1000);
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();

  return {
    position: camera.position.clone(),
    target: controls.target.clone(),
    near: camera.near,
    far: camera.far,
  };
}

export function PreviewPane({ file, kind, resources, gltf, onWarning }: PreviewPaneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rootRef = useRef<THREE.Object3D | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clipsRef = useRef<THREE.AnimationClip[]>([]);
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);
  const gltfRef = useRef<GLTF | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const boxRef = useRef<THREE.BoxHelper | null>(null);
  const frameRef = useRef<number | null>(null);
  const resetViewRef = useRef<(() => void) | null>(null);
  const showGridRef = useRef(true);
  const showBackgroundRef = useRef(true);
  const showBoundsRef = useRef(false);
  const isPlayingRef = useRef(false);
  const selectedAnimationIndexRef = useRef(0);

  const [showGrid, setShowGrid] = useState(true);
  const [showBackground, setShowBackground] = useState(true);
  const [showBounds, setShowBounds] = useState(false);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(gltf.scene ?? 0);
  const [animationNames, setAnimationNames] = useState<string[]>(gltf.animations?.map((animation, index) => animation.name ?? `Animation ${index + 1}`) ?? []);
  const [selectedAnimationIndex, setSelectedAnimationIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const scenes = useMemo(() => gltf.scenes ?? [], [gltf.scenes]);
  const hasMultipleScenes = scenes.length > 1;
  const hasAnimations = animationNames.length > 0;

  const startSelectedAnimation = useCallback(() => {
    activeActionRef.current?.stop();
    activeActionRef.current = null;

    const mixer = mixerRef.current;
    const clip = clipsRef.current[selectedAnimationIndexRef.current];
    const root = rootRef.current;

    if (!mixer || !clip || !root || !isPlayingRef.current) {
      return;
    }

    const action = mixer.clipAction(clip, root);
    action.reset().play();
    activeActionRef.current = action;
  }, []);

  useEffect(() => {
    setSelectedSceneIndex(gltf.scene ?? 0);
    setAnimationNames(gltf.animations?.map((animation, index) => animation.name ?? `Animation ${index + 1}`) ?? []);
    setSelectedAnimationIndex(0);
    setIsPlaying(false);
  }, [gltf]);

  useEffect(() => {
    showBackgroundRef.current = showBackground;
    sceneRef.current && (sceneRef.current.background = showBackground ? new THREE.Color(BACKGROUND_COLOR) : null);
  }, [showBackground]);

  useEffect(() => {
    showGridRef.current = showGrid;
    if (gridRef.current) {
      gridRef.current.visible = showGrid;
    }
  }, [showGrid]);

  useEffect(() => {
    showBoundsRef.current = showBounds;
    if (boxRef.current) {
      boxRef.current.visible = showBounds;
    }
  }, [showBounds]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    selectedAnimationIndexRef.current = selectedAnimationIndex;
    startSelectedAnimation();
  }, [isPlaying, selectedAnimationIndex, startSelectedAnimation]);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    if (typeof WebGLRenderingContext === 'undefined') {
      setStatus('3D preview is unavailable in this environment.');
      return;
    }

    let isDisposed = false;
    const objectUrls = new Set<string>();
    const urlsByFile = new Map<File, string>();
    const urlsByAlias = new Map<string, string>();
    const clock = new THREE.Clock();

    function objectUrlFor(resource: File): string {
      const existing = urlsByFile.get(resource);
      if (existing) {
        return existing;
      }

      const url = URL.createObjectURL(resource);
      urlsByFile.set(resource, url);
      objectUrls.add(url);
      return url;
    }

    const primaryUrl = objectUrlFor(file);
    const primaryPath = 'webkitRelativePath' in file && typeof file.webkitRelativePath === 'string' && file.webkitRelativePath
      ? file.webkitRelativePath
      : file.name;
    const primaryDirectory = dirname(primaryPath);
    for (const [alias, resource] of resources) {
      const url = objectUrlFor(resource);
      urlsByAlias.set(normalizeResourceKey(alias), url);
      urlsByAlias.set(basename(alias), url);
    }

    const scene = new THREE.Scene();
    scene.background = showBackgroundRef.current ? new THREE.Color(BACKGROUND_COLOR) : null;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x5c677d, 1.8));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const grid = new THREE.GridHelper(10, 10, 0x94a3b8, 0xd2dae5);
    grid.visible = showGridRef.current;
    scene.add(grid);

    const width = Math.max(mount.clientWidth, 1);
    const height = Math.max(mount.clientHeight, 1);
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
    camera.position.set(3, 2, 4);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setStatus('3D preview is unavailable in this environment.');
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    controlsRef.current = controls;
    gridRef.current = grid;

    const loader = new GLTFLoader();
    loader.manager.setURLModifier((uri) => {
      return resolveResourceUrl(uri, primaryDirectory, urlsByAlias);
    });

    const mountElement = mount;

    function resize() {
      const nextWidth = Math.max(mountElement.clientWidth, 1);
      const nextHeight = Math.max(mountElement.clientHeight, 1);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    }

    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    resizeObserver?.observe(mountElement);
    window.addEventListener('resize', resize);

    function animate() {
      if (isDisposed) {
        return;
      }

      const delta = clock.getDelta();
      mixerRef.current?.update(delta);
      boxRef.current?.update();
      controls.update();
      renderer.render(scene, camera);
      frameRef.current = window.requestAnimationFrame(animate);
    }

    loader.load(
      primaryUrl,
      (loaded: GLTF) => {
        if (isDisposed) {
          return;
        }

        const root = loaded.scenes[selectedSceneIndex] ?? loaded.scene;
        scene.add(root);
        rootRef.current = root;
        gltfRef.current = loaded;

        const box = new THREE.BoxHelper(root, 0x2563eb);
        box.visible = showBoundsRef.current;
        scene.add(box);
        boxRef.current = box;

        const view = fitCameraToObject(camera, controls, root);
        resetViewRef.current = () => {
          camera.position.copy(view.position);
          camera.near = view.near;
          camera.far = view.far;
          camera.updateProjectionMatrix();
          controls.target.copy(view.target);
          controls.update();
        };

        clipsRef.current = loaded.animations;
        setAnimationNames(loaded.animations.map((clip, index) => clip.name || `Animation ${index + 1}`));
        mixerRef.current = loaded.animations.length > 0 ? new THREE.AnimationMixer(root) : null;
        startSelectedAnimation();
        setStatus(null);
      },
      undefined,
      (error) => {
        if (isDisposed) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unable to load the 3D preview.';
        setStatus('Unable to load the 3D preview.');
        onWarning(`3D preview: ${message}`);
      },
    );

    animate();

    return () => {
      isDisposed = true;
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      window.removeEventListener('resize', resize);
      resizeObserver?.disconnect();
      activeActionRef.current?.stop();
      activeActionRef.current = null;
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
      clipsRef.current = [];
      resetViewRef.current = null;
      controls.dispose();

      if (rootRef.current) {
        scene.remove(rootRef.current);
        rootRef.current = null;
      }

      gltfRef.current?.scenes.forEach(disposeObject);
      gltfRef.current = null;

      if (boxRef.current) {
        scene.remove(boxRef.current);
        boxRef.current.geometry.dispose();
        boxRef.current.material.dispose();
        boxRef.current = null;
      }

      grid.geometry.dispose();
      grid.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      gridRef.current = null;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [file, kind, resources, selectedSceneIndex, onWarning]);

  return (
    <section className="preview-pane" aria-label="3D preview panel">
      <div className="preview-toolbar">
        <div>
          <h2>3D Preview</h2>
          <p>{kind.toUpperCase()} scene preview</p>
        </div>
        <div className="preview-controls" aria-label="Preview controls">
          <button type="button" onClick={() => resetViewRef.current?.()}>
            Reset view
          </button>
          <label>
            <input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} />
            Grid
          </label>
          <label>
            <input type="checkbox" checked={showBackground} onChange={(event) => setShowBackground(event.target.checked)} />
            Background
          </label>
          <label>
            <input type="checkbox" checked={showBounds} onChange={(event) => setShowBounds(event.target.checked)} />
            Bounds
          </label>
        </div>
      </div>

      {(hasMultipleScenes || hasAnimations) && (
        <div className="preview-options">
          {hasMultipleScenes && (
            <label>
              Scene
              <select value={selectedSceneIndex} onChange={(event) => setSelectedSceneIndex(Number(event.target.value))}>
                {scenes.map((scene, index) => (
                  <option key={index} value={index}>
                    {scene.name ?? `Scene ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>
          )}

          {hasAnimations && (
            <div className="animation-controls">
              <label>
                Animation
                <select value={selectedAnimationIndex} onChange={(event) => setSelectedAnimationIndex(Number(event.target.value))}>
                  {animationNames.map((name, index) => (
                    <option key={`${name}-${index}`} value={index}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => setIsPlaying((current) => !current)}>
                {isPlaying ? 'Pause' : 'Play'}
              </button>
            </div>
          )}
        </div>
      )}

      <div ref={mountRef} className="preview-canvas" aria-label="Rendered 3D model">
        {status ? <p>{status}</p> : null}
      </div>
    </section>
  );
}
