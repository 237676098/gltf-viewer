# glTF Viewer Design

Date: 2026-06-16

## Goal

Build a local-file glTF learning and inspection workbench. The first version should help users quickly preview a glTF/GLB asset and understand which glTF specification modules are present or absent.

The product balances two use cases:

- Preview: confirm that the asset loads and renders in 3D.
- Learning: inspect the glTF data model and understand how top-level modules relate to rendered output.

## Non-Goals

The first version will not include:

- Editing or exporting glTF files.
- Material parameter editing.
- Screenshots or rendering pipelines.
- Online URL loading.
- Asset optimization or compression tools.
- Full validation against every glTF schema rule.

## Input Model

The app accepts local files only.

- `.glb`: loaded as a single binary glTF file.
- `.gltf`: loaded with optional companion files such as `.bin` buffers and image textures.

For `.gltf`, users can drag multiple files at once. Resource resolution is based on URI/file-name matching within the dropped file set.

## Page Layout

The app uses a two-column workbench layout after import.

### Top Import Area

Before import, the first screen is a file drop zone with a file picker fallback.

After import, the top area shows:

- File name.
- File type: `gltf` or `glb`.
- File size.
- glTF version.
- `asset.generator`, when present.
- `asset.copyright`, when present.

### Left Data View

The left side starts with a format coverage checklist. The checklist is based on glTF top-level modules:

- `asset`
- `scenes`
- `scene`
- `nodes`
- `meshes`
- `materials`
- `textures`
- `images`
- `samplers`
- `animations`
- `skins`
- `cameras`
- `buffers`
- `bufferViews`
- `accessors`
- `extensionsUsed`
- `extensionsRequired`

Each checklist item displays:

- Status: present, missing, or required-but-problematic.
- Count, when the module is an array.
- A concise explanation of what the module does.
- A note on whether absence is normal or suspicious.

Selecting a checklist item opens a detail panel for that module. The detail panel includes:

- A list of items in the module.
- A compact JSON summary.
- Human-readable field explanations for important fields.
- References to related modules where applicable.

### Right Preview View

The right side renders the model with Three.js.

The first version includes:

- Orbit camera controls.
- Reset view.
- Grid toggle.
- Background toggle.
- Bounding box toggle.
- Scene selector when multiple scenes exist.
- Basic animation list and play/pause controls when animations exist.

## Data Flow

1. User drops or selects local files.
2. The app identifies the primary `.gltf` or `.glb` file.
3. The app parses the glTF JSON.
4. The app builds a module coverage report from the parsed JSON.
5. The app passes the file set to the Three.js loader for preview.
6. The data view and preview view subscribe to shared model state.

## Module Coverage Rules

The app reports missing data by specification module, not by visual quality.

Examples:

- `materials` missing means no material definitions exist. This is valid glTF; the renderer can use default material behavior.
- `animations` missing means the asset is static.
- `skins` missing means the asset has no skeletal skinning data.
- `cameras` missing means the asset does not define author-provided cameras.
- `extensionsUsed` missing means the asset does not declare glTF extensions.

`asset` is expected to exist. If it is absent or malformed, the module is marked required-but-problematic.

If `extensionsRequired` includes extensions unsupported by the runtime loader, the app marks them as required-but-problematic and keeps the data report visible even if preview is incomplete.

## Preview And Data Linking

The first version should support practical linking between data and rendered output:

- Selecting `meshes` shows mesh and primitive counts and can highlight the corresponding rendered objects.
- Selecting `materials` shows material summaries and can identify objects using the selected material.
- Selecting `textures` or `images` shows URI information and image dimensions when available.
- Selecting `accessors`, `bufferViews`, or `buffers` emphasizes data structure and reference chains rather than visual highlighting.
- Selecting a missing module shows its purpose and whether missing data is valid for common assets.

The reference chain view should help users understand common glTF relationships:

`scene -> node -> mesh -> primitive -> material -> texture -> image`

and:

`mesh primitive -> accessor -> bufferView -> buffer`

## Error Handling

The app handles common failures without losing useful information.

- Unsupported file type: show an unsupported format message.
- Missing `.bin` or image resources for `.gltf`: keep the JSON report available and show a preview warning.
- Invalid JSON: show the parse error and do not attempt preview.
- Three.js load failure: keep the data report and show the preview failure reason.
- Required unsupported extension: mark the extension in the coverage report and warn that preview may be incomplete.

## Architecture

Use small modules with clear boundaries:

- File intake: identifies primary files and creates resource lookup maps.
- glTF parser: extracts JSON from `.gltf` or `.glb`.
- coverage analyzer: converts parsed glTF JSON into module status rows.
- relationship analyzer: computes references between modules.
- preview adapter: owns Three.js loader, scene setup, controls, and highlighting.
- UI state: coordinates selected module, selected item, active scene, and animation playback.

The coverage analyzer should be testable without Three.js or browser rendering.

## Testing Strategy

Focus tests on the parts most likely to regress:

- Coverage analyzer with minimal, static, textured, animated, and malformed sample JSON.
- File intake logic for `.glb`, single `.gltf`, and `.gltf` plus companion resources.
- Relationship analyzer for scene/node/mesh/material/accessor chains.

Manual verification should cover:

- Loading a valid `.glb`.
- Loading a `.gltf` with external `.bin` and textures.
- Loading a `.gltf` while omitting a referenced resource.
- Loading a file with no animations/materials/cameras to confirm missing modules are explained as valid when appropriate.

## First-Version Success Criteria

The first version is successful when a user can:

- Drag in a local `.glb` or `.gltf` file set.
- See the model rendered in 3D when resources are available.
- See a module-by-module list of present and missing glTF data.
- Click a module and understand its role in the glTF format.
- Inspect common references from scene data down to buffers.
- Keep learning from the data report even when preview fails.
