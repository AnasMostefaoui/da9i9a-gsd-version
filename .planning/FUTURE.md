# Future Versions: سلة دقيقة

## v2: Smart Theme Architecture

**Discovery Date**: 2026-01-22
**Insight**: Salla doesn't allow code injection like Shopify. Apps cannot modify theme files (.twig) via API.

### The Problem

| Platform | Method | What Apps Can Do |
|----------|--------|------------------|
| Shopify | Asset API | Write .liquid files directly into theme |
| Salla | App Settings API | Push config data that themes read at runtime |

Salla themes must go through Partners Portal + GitHub sync. No ZIP uploads or file modifications via API.

### The Solution: "Chameleon Theme" Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  سلة دقيقة App  │────▶│  App Settings    │◀────│  Smart Theme    │
│                 │     │  API             │     │  (Twilight)     │
│  AI generates:  │     │                  │     │                 │
│  - colors       │     │  POST /apps/     │     │  Reads config   │
│  - fonts        │     │  {id}/settings   │     │  via Twig       │
│  - layout prefs │     │                  │     │  Applies CSS    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Implementation Components

#### 1. Smart Shell Theme (Twilight Engine)
- Build flexible theme with CSS variables
- Variables empty by default: `.btn { background: var(--ai-primary-color); }`
- Published as private theme via Partners Portal
- Merchant installs once, AI configures dynamically

```twig
{# master.twig #}
{% set ai_config = theme.settings.get('ai_design_config') %}
<style>
  :root {
    --ai-primary: {{ ai_config.primary_color | default('#000') }};
    --ai-font: {{ ai_config.font_family | default('Cairo') }};
    --ai-radius: {{ ai_config.border_radius | default('4px') }};
  }
</style>
```

#### 2. AI Design Generator
- Analyze product category/images
- Generate design config JSON:
```json
{
  "primary_color": "#6F4E37",
  "secondary_color": "#D4A574",
  "font_family": "Tajawal",
  "border_radius": "8px",
  "layout": "modern-minimal",
  "hero_style": "full-bleed"
}
```

#### 3. Config Pusher (App Settings API)
```
POST https://api.salla.dev/admin/v2/apps/{app_id}/settings
{
  "ai_design_config": { ... }
}
```

### v2 Phases

- **Phase 7: Smart Theme Foundation**
  - Build Twilight theme with CSS variable system
  - Implement App Settings API integration
  - Create theme settings schema (twilight.json)

- **Phase 8: AI Design Generation**
  - Product category → design style mapping
  - Color palette generation from product images
  - Font pairing recommendations
  - Layout selection based on product type

- **Phase 9: Theme Marketplace**
  - Multiple "Smart Theme" variants (minimal, bold, luxury, etc.)
  - Merchant can switch base theme, AI adapts config
  - Theme preview in app before activation

### Resources

- [Twilight Theme Development](https://docs.salla.dev/421878m0)
- [Theme Settings (twilight.json)](https://docs.salla.dev/421879m0)
- [Single Product Page](https://docs.salla.dev/422561m0)
- App Settings API: `POST /admin/v2/apps/{app_id}/settings`

### Why This Matters

HelloAtlas on Shopify can generate unique theme code per store. For Salla, we achieve similar results through:
- **One flexible theme** + **Dynamic configuration** = **Infinite variations**

This is actually cleaner architecture (separation of concerns) but requires:
1. Upfront theme development investment
2. Merchant to install our theme (onboarding friction)
3. Careful twilight.json schema design

---

*Added to future roadmap: 2026-01-22*
