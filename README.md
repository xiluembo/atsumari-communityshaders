# atsumari-communityshaders

A curated collection of stylized community shader packs, organized as one pack per directory.

Each shader pack is self-contained and currently includes:

- `<PackName>.vert` (vertex shader)
- `<PackName>.frag` (fragment shader)
- `metadata.json` (human-readable pack metadata)

## Project Goals

- Keep shader packs easy to browse and remix.
- Standardize metadata for tooling and catalog integrations.
- Keep top-level shader headers descriptive and consistent.
- Provide localized metadata with English fallback behavior.

## `metadata.json` Contract

Each shader directory must include a prettified `metadata.json` following this structure:

```json
{
  "name": "Pack Name (EN)",
  "description": "Short pack description (EN)",
  "translations": [
    {
      "pt_BR": {
        "name": "Nome do pacote (PT-BR)",
        "description": "Descrição resumida (PT-BR)"
      }
    },
    {
      "es_ES": {
        "name": "Nombre del paquete (ES)",
        "description": "Descripción breve (ES)"
      }
    }
  ],
  "license-spdx": "MIT",
  "author": {
    "name": "Push X!",
    "email": "pushx.br@gmail.com",
    "website": "https://tinyurl.com/pushxlinks"
  }
}
```

### Required Rules

- `name` and `description` at root are always in English.
- `translations` is an array of language-keyed objects.
- Community packs may provide translations in any language(s).
- If a user's Atsumari language is not available in `translations`, Atsumari should use the root English `name` and `description`.
- `license-spdx` must be a valid SPDX license identifier compatible with publication in this repository.
- SPDX reference: https://spdx.org/licenses/
- JSON formatting should remain prettified (2-space indentation).

## Shader Comment Conventions

- Header comments should be descriptive and consistent across packs.
- Header language is English.
- Keep implementation comments concise and focused on non-obvious logic.
- Avoid stale comments after behavioral changes.

## Adding a New Shader Pack

1. Create a new directory with the pack name.
2. Add `<PackName>.vert` and `<PackName>.frag`.
3. Add a prettified `metadata.json` using the required schema.
4. Add descriptive header comments to both shader files.
5. Keep naming and style aligned with existing packs.

## Contributing

If you want to contribute a shader pack to this repository, you can:

- Submit through Google Forms: https://docs.google.com/forms/d/e/1FAIpQLScu85yV-Pz6F_oTNxM37AiPFI3cXKWr9EvXlD3dHs3IVsIG1g/viewform?usp=publish-editor
- Open a Pull Request directly: https://github.com/xiluembo/atsumari-communityshaders/pulls

## Maintenance Checklist

- Directory name matches shader base filenames.
- Both shader stages exist (`.vert` and `.frag`).
- `metadata.json` exists and validates structurally.
- English root metadata + `pt_BR` translation are present.
- SPDX and author fields are complete and correct.

## License

Each pack must declare a valid SPDX license identifier in `metadata.json`.
