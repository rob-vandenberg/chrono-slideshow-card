import { LitElement, html, css } from 'https://unpkg.com/lit@2.0.0/index.js?module';
import { live }                  from 'https://unpkg.com/lit@2.0.0/directives/live.js?module';
import { styleMap }              from 'https://unpkg.com/lit@2.0.0/directives/style-map.js?module';
import { unsafeHTML }            from 'https://unpkg.com/lit@2.0.0/directives/unsafe-html.js?module';
import { repeat }                from 'https://unpkg.com/lit@2.0.0/directives/repeat.js?module';
import jsyaml                   from 'https://cdn.jsdelivr.net/npm/js-yaml@4/+esm';

// ─── Version ──────────────────────────────────────────────────────────────────
const CARD_VERSION = '0.0.17';

// ─── MDI icon paths ───────────────────────────────────────────────────────────
const mdiDragHorizontalVariant = 'M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z';

// ─── Version History ──────────────────────────────────────────────────────────
// v0.0.17: Fix regression from 0.0.16: with fit_mode 'contain', a photo
//          smaller than its box leaves transparent letterbox margins — the
//          <img> itself paints nothing there. Harmless in the old model
//          (nothing existed behind it), but the new persistent back slot
//          means a different photo could now show through those gaps. Added
//          a configurable letterbox_color (DEFAULT_CONFIG, UI_CARD_KEYS, new
//          editor field next to Fit mode) applied as background-color on
//          .slide-image, falling back to var(--card-background-color,
//          #1c1c1c) when unset — same pattern already used for
//          message-overlay, so it matches the dashboard theme by default
//          while staying user-configurable.
// v0.0.16: Restructured photo transitions to fix a startup hiccup at the
//          beginning of every autonomous transition. Root cause: the
//          "entering" slide-unit was created fresh, in the same render tick
//          .animate() was called on it — a brand-new DOM node's first paint
//          and compositor-layer promotion landing in the same frame as
//          animation start. Fix: two persistent slide-units ("front"/"back")
//          now always exist in the DOM — front is visible, back is hidden
//          behind it, pre-loaded with the next photo from the moment the
//          current photo starts displaying (the full display_time to warm
//          up, not just an instant). An autonomous advance swaps which slot
//          is front and animates the two already-painted elements; nothing
//          is created at transition time. Manual swipe navigation never
//          animates at all now (per explicit design decision: transitions
//          are autonomous-playback-only) — it's an instant cut via the new
//          _syncSlotsInstant(), and only ever has current+next in memory,
//          never prev (matches the existing preload philosophy).
//          _outgoingPhoto/_transitionDirection removed (obsolete with this
//          model); _advance() now takes no parameter (always forward,
//          autonomous-only); new _manualNavigate(direction) handles swipes.
//          Since both slide-units now persist forever instead of being
//          destroyed each cycle, _runTransitionAnimations() now explicitly
//          cancels any previous finished animation and clears the clock
//          transition's directly-set maskImage before starting a new one —
//          necessary now that elements are reused, harmless before. Added
//          will-change: transform, opacity, clip-path to .slide-unit as a
//          complementary, independent mitigation.
// v0.0.15: New field: text_shadow_layers (default 2), YAML-only, no dedicated
//          UI field — deliberately not added to NUMERIC_ITEM_KEYS since that
//          set is only consulted by the dedicated-UI-field change handler;
//          with no UI field it would never be read. text-shadow is now built
//          by repeating the same offset/blur/color value N times
//          (comma-separated), since stacking identical alpha layers compounds
//          visual darkness without changing the blur radius or shape — two
//          0.5-alpha layers render roughly as dark as ~0.75 alpha, not 1.0,
//          while looking the same shape as a single layer. Guarded with
//          Math.max(1, ...) so an invalid/zero value falls back to 1 layer
//          instead of producing a degenerate empty text-shadow value.
// v0.0.14: New feature: per-item text shadow + stroke, for readability against
//          backgrounds close to the text's own color. Five new item fields:
//          text_shadow_color, text_shadow_blur, text_shadow_offset_x,
//          text_shadow_offset_y, text_shadow_stroke_width — added to
//          DEFAULT_ITEM, NUMERIC_ITEM_KEYS, UI_ITEM_KEYS. New editor row
//          (.item-text-shadow, same 5-column grid as the other two item
//          rows) with a color picker + 4 number fields. _itemStyleMap() emits
//          text-shadow (offset-x offset-y blur color) and
//          -webkit-text-stroke-width/-color, all numeric parts scaled via the
//          existing pxScaled() helper consistent with every other size value.
//          Both gated on text_shadow_color being set — no color means neither
//          renders. Color picker's free-text field (paired with the native
//          swatch in csColorPicker, confirmed by re-reading its actual
//          implementation) already accepts 8-digit hex with alpha, passed
//          through unprocessed — no separate opacity field needed.
// v0.0.13: Fix regression from 0.0.12: applying aspect-ratio unconditionally
//          to ha-card affected the real dashboard too (confirmed: HA's
//          flex/grid-based dashboard layouts don't make ha-card's height as
//          fully "definite" as plain block-context CSS rules assume, a known
//          MDN-documented caveat for aspect-ratio in flex/grid contexts).
//          Tried gating on the HA-provided `preview` property instead, but
//          console verification showed it reflects "dashboard is in edit
//          mode" broadly, not "this is the dialog preview" specifically
//          (both the dashboard and dialog instances reported preview=true
//          simultaneously) — so that signal was also wrong. Replaced both
//          with isInsideEditDialog(), a ground-truth DOM-ancestry check for
//          the literal <ha-dialog> element, walking up through shadow-DOM
//          boundaries via getRootNode().host. connectedCallback() now sets
//          --editor-preview-aspect-ratio to EDITOR_PREVIEW_ASPECT_RATIO only
//          when that check is true, else 'auto' (no effect). ha-card's static
//          CSS reads that custom property instead of the constant directly;
//          unsafeCSS import removed as it's no longer needed.
// v0.0.12: Editor preview now uses a 16/10 aspect ratio (most photos are
//          roughly that shape) instead of an arbitrary min-height:200px floor.
//          Added EDITOR_PREVIEW_ASPECT_RATIO constant (CSS <ratio> syntax) and
//          applied it to ha-card via aspect-ratio, interpolated with
//          unsafeCSS() since static styles only accept CSSResult values
//          through normal interpolation. Verified via MDN that aspect-ratio
//          only takes effect when at least one dimension is auto — has no
//          effect on the real dashboard, where the surrounding container
//          already gives ha-card a definite height; only fills the gap in the
//          editor preview, where height has no definite value to resolve
//          against. min-height:200px kept as a floor for very narrow widths.
// v0.0.11: Simplification, no output change. 0.0.10 had two separate scaling
//          mechanisms: JS-side multiplication in _itemStyleMap() and CSS
//          calc(var(--scale-factor)) in the static stylesheet, requiring
//          --scale-factor to be threaded through three separate <ha-card>
//          template strings as a reactive Lit state property. Unified onto
//          one mechanism: the ResizeObserver callback now calls
//          this.style.setProperty('--scale-factor', ...) directly on the host
//          element, which inherits through the shadow boundary to everything
//          inside without needing to be set on <ha-card> explicitly.
//          _itemStyleMap() now emits calc(Nunit * var(--scale-factor, 1))
//          strings instead of doing the multiplication in JS. _scaleFactor is
//          no longer a reactive property or instance field — resizing no
//          longer triggers a Lit re-render at all, the browser's CSS engine
//          handles it. Same visual output as 0.0.10, fewer moving parts.
// v0.0.10: Fix: _scaleFactor was only applied to font-size, leaving padding,
//          border-radius, zone gap, entity-icon size, entity-label sizing, and
//          message-overlay sizing as fixed px regardless of card size. Verified
//          via console measurement that font-size itself scaled with an exact
//          matching ratio between dashboard and editor-preview contexts, so the
//          remaining visible mismatch was isolated to these untouched
//          properties. _itemStyleMap() now multiplies padding_top/bottom/left/
//          right and border_radius by _scaleFactor, same as font_size. All
//          three <ha-card> render blocks now set an inline
//          --scale-factor custom property from _scaleFactor; static CSS for
//          .overlay-zone, .overlay-entity-item, .entity-state-label,
//          .overlay-entity-missing, .message-overlay, and .message-overlay
//          .message-icon now reference calc(Npx * var(--scale-factor, 1))
//          instead of fixed px, so every overlay-related size now scales
//          proportionally with the card's own rendered height.
// v0.0.9: Fix: overlay font-size scaled with a ResizeObserver-derived factor
//          instead of plain em. Observer watches the host element's own
//          rendered height and computes scaleFactor = height / 400 (400 =
//          the fixed height HA's editor preview uses when no real dashboard
//          parent constrains it). _itemStyleMap() multiplies font_size by
//          this factor before generating the em value. Result: font size is
//          now proportional to the card's own actual rendered size in any
//          context (editor preview or dashboard), instead of being anchored
//          to the document root font-size regardless of card size. Does NOT
//          use container queries — no container-type/contain anywhere,
//          avoiding the size-containment/content-based-flex-sizing conflict
//          that broke 0.0.5-0.0.7. Known consequence: existing font_size
//          values will render at a different absolute pixel size on real
//          dashboards than before, unless the dashboard card height happens
//          to be exactly 400px — re-tuning may be needed; this is an
//          intended effect of fixing the height-dependency, not a bug.
// v0.0.8: Full revert of the container-query experiment (0.0.5-0.0.7). Back to
//          plain em font-size, min-height:200px, no container-type. Restores
//          known-working 0.0.4 rendering. Editor-preview font-size mismatch
//          is back (cosmetic only) — to be solved properly in a fresh session.
// v0.0.7: Fix: confirmed via live DOM inspection that overlay-zone collapsed
//          to 0x0 under size containment, despite its child span having a
//          real computed size — size containment disables content-based flex
//          sizing for descendants. container-type:size restored on ha-card
//          (correct cqmin scope); overlay-cell given explicit width/height:
//          100% so it no longer depends on content-based sizing.
// v0.0.6: Fix: overlay items vanished entirely in 0.0.5. container-type:size
//          on ha-card likely collapsed flex-sized overlay-zone/overlay-cell
//          children with no explicit width/height. Moved container-type:size
//          to .slideshow-container instead (absolute+inset:0, always a
//          definite size from ha-card), keeping cqmin scoped there.
// v0.0.5: Fix: overlay font sizes used em, scaling against the document root
//          font-size instead of the card's own rendered size — looked correct
//          on a full-size dashboard but oversized in the small editor preview.
//          Switched to cqmin (container query units) via container-type:size
//          on ha-card, so font size scales with the card's own box in any
//          context. min-height raised 200px -> 400px (at 400px, 1cqmin ~= 1em
//          at the default 16px root, so existing font_size values keep
//          roughly their current visual size).
// v0.0.4: Fix: .slideshow-container still collapsed to 0 height in some
//          contexts (editor preview) despite the v0.0.3 :host fix. Changed
//          from width/height:100% to position:absolute+inset:0, anchoring
//          directly to ha-card's padding box instead of a percentage chain.
// v0.0.3: Fix: card rendered nothing (solid black) because :host had no
//          defined height, so ha-card's height:100% (and everything inside it)
//          collapsed to 0 despite ha-card's own min-height floor showing a
//          nonzero box. :host now explicitly takes height:100% of its own
//          container so the height chain has something real to resolve against.
// v0.0.2: No functional changes. Version bump only, to test whether a normal
//          (non-initial) push triggers the GitHub Actions Build workflow.
// v0.0.1: Initial release — slideshow of images from a chrono_folder sensor's
//          files[] list, configurable sort + reverse, fixed display-time timer,
//          swipe left/right navigation (resets timer), CSS-only transitions
//          (fade/slide ×4/curtain/clock/none), object-fit image sizing, 3-deep
//          preload (previous/current/next), 9-zone overlay grid (TL/TC/TR/
//          ML/MC/MR/BL/BC/BR) with per-zone static/dynamic transition
//          participation, entity + template overlay items mirroring
//          chrono-picture-card's editor architecture (cs-prefixed custom
//          controls to avoid collision with chrono-picture-card's cp-prefixed
//          ones), client-side photo-variable substitution for {{ }} templates
//          referencing the current photo's own fields (e.g. exifFocalLength)
//          ahead of HA's render_template, empty-list and per-slide image-load
//          error states.

// ─── Console log ──────────────────────────────────────────────────────────────
console.info(
  `%c CHRONO-%cSLIDESHOW%c-CARD %c v${CARD_VERSION} `,
  'background-color: #101010; color: #FFFFFF; font-weight: bold; padding: 2px 0 2px 4px; border-radius: 3px 0 0 3px;',
  'background-color: #101010; color: #4676d3; font-weight: bold; padding: 2px 0;',
  'background-color: #101010; color: #FFFFFF; font-weight: bold; padding: 2px 4px 2px 0;',
  'background-color: #1E1E1E; color: #FFFFFF; font-weight: bold; padding: 2px 4px; border-radius: 0 3px 3px 0;'
);

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_ITEM = {
  _id:              '',
  show:             true,
  horizontal:       'center',
  vertical:         'middle',
  icon:             '',
  show_state:       false,
  font_color:       '',
  font_size:        1.2,
  font_weight:      600,
  line_height:      1.2,
  border_radius:    50,
  background_color: '',
  padding_top:      10,
  padding_bottom:   10,
  padding_left:     10,
  padding_right:    10,
  text_shadow_color:        '',
  text_shadow_blur:         0,
  text_shadow_offset_x:     0,
  text_shadow_offset_y:     0,
  text_shadow_stroke_width: 0,
  text_shadow_layers:       2, // YAML-only, no dedicated UI field — edit manually to change
};

const DEFAULT_ENTITY_ITEM   = { ...DEFAULT_ITEM, entity:   '' };
const DEFAULT_TEMPLATE_ITEM = { ...DEFAULT_ITEM, template: '' };

// Per-zone transition participation. 'static' zones sit outside the photo
// transition (never move); 'dynamic' zones are nested inside it and animate
// together with the photo. Keyed by "<vertical>-<horizontal>".
const DEFAULT_ZONE_MODES = {
  'top-left':     'static',
  'top-center':   'static',
  'top-right':    'static',
  'middle-left':  'dynamic',
  'middle-center':'dynamic',
  'middle-right': 'dynamic',
  'bottom-left':  'static',
  'bottom-center':'static',
  'bottom-right': 'dynamic',
};

// Reference card height (px) at which a font_size value renders at its
// literal em size (scale factor 1). This is the fixed height the HA card
// editor uses when no real dashboard parent constrains the preview. Any
// other rendered height (dashboard or otherwise) scales proportionally from
// this baseline via ResizeObserver — see _scaleFactor.
const REFERENCE_HEIGHT_PX = 400;

// Aspect ratio (CSS <ratio> syntax, e.g. '16 / 10') applied to ha-card, but
// ONLY when the card is rendered inside the HA edit-card dialog's preview
// (see isInsideEditDialog below) — never on the real dashboard. Earlier
// attempts gated this on CSS auto-sizing behavior, then on a `preview`
// property; both were unreliable (the property turned out to mean "dashboard
// is in edit mode" broadly, not "this is the dialog preview" specifically).
// Checking the actual DOM ancestry for the dialog element itself is the only
// ground-truth signal. Change this value to change the preview's proportions.
const EDITOR_PREVIEW_ASPECT_RATIO = '16 / 10';

// Walks up through the DOM — crossing shadow-DOM boundaries via
// getRootNode().host when parentElement runs out — checking whether el is
// nested inside the actual <ha-dialog> element HA uses for the per-card edit
// dialog. This is a ground-truth DOM check, not an inference from CSS sizing
// behavior or from HA-provided properties of uncertain scope.
function isInsideEditDialog(el) {
  let node = el;
  while (node) {
    if (node.tagName === 'HA-DIALOG') return true;
    node = node.parentElement || node.getRootNode()?.host;
  }
  return false;
}

const DEFAULT_CONFIG = {
  entity:                'sensor.',
  sort_by:               'filename',
  sort_reverse:          false,
  display_time:          8,
  transition:             'fade',
  transition_duration:    0.6,
  fit_mode:               'contain',
  letterbox_color:        '',
  zone_modes:             { ...DEFAULT_ZONE_MODES },
  items:                  [],
};

const NUMERIC_ITEM_KEYS = new Set([
  'font_size', 'font_weight', 'line_height', 'border_radius',
  'padding_top', 'padding_bottom', 'padding_left', 'padding_right',
  'text_shadow_blur', 'text_shadow_offset_x', 'text_shadow_offset_y',
  'text_shadow_stroke_width',
]);

// Keys managed by dedicated UI fields. All other keys go into the YAML textarea.
const UI_ITEM_KEYS = new Set([
  '_id', 'show',
  'entity', 'template',
  'horizontal', 'vertical',
  'icon', 'show_state',
  'font_color', 'font_size', 'font_weight', 'line_height', 'border_radius',
  'background_color',
  'padding_top', 'padding_bottom', 'padding_left', 'padding_right',
  'text_shadow_color', 'text_shadow_blur', 'text_shadow_offset_x',
  'text_shadow_offset_y', 'text_shadow_stroke_width',
]);

const UI_CARD_KEYS = new Set([
  'type', 'entity', 'sort_by', 'sort_reverse', 'display_time',
  'transition', 'transition_duration', 'fit_mode', 'letterbox_color', 'zone_modes',
  'items',
]);

const VERTICAL_OPTIONS = [
  { label: 'Top',    value: 'top'    },
  { label: 'Middle', value: 'middle' },
  { label: 'Bottom', value: 'bottom' },
];

const HORIZONTAL_OPTIONS = [
  { label: 'Left',   value: 'left'   },
  { label: 'Center', value: 'center' },
  { label: 'Right',  value: 'right'  },
];

const SORT_BY_OPTIONS = [
  { label: 'Filename',         value: 'filename'     },
  { label: 'File date/time',   value: 'filedatetime' },
  { label: 'Capture date/time',value: 'exifdatetime'  },
  { label: 'Random',           value: 'random'       },
];

const TRANSITION_OPTIONS = [
  { label: 'Fade',        value: 'fade'        },
  { label: 'Slide left',  value: 'slide-left'  },
  { label: 'Slide right', value: 'slide-right' },
  { label: 'Slide up',    value: 'slide-up'    },
  { label: 'Slide down',  value: 'slide-down'  },
  { label: 'Curtain',     value: 'curtain'     },
  { label: 'Clock',       value: 'clock'       },
  { label: 'None',        value: 'none'        },
];

const FIT_MODE_OPTIONS = [
  { label: 'Cover',   value: 'cover'   },
  { label: 'Contain', value: 'contain' },
  { label: 'Fill',    value: 'fill'    },
];

const ZONE_MODE_OPTIONS = [
  { label: 'Static',  value: 'static'  },
  { label: 'Dynamic', value: 'dynamic' },
];

const SHOW_ITEM_POSITION_BADGES = false;

const VERTICAL_BADGE_COLORS = {
  top:    '#ac00ac',
  middle: '#c77c00',
  bottom: '#0600ff',
};

const HORIZONTAL_BADGE_COLORS = {
  left:   '#bb9e00',
  center: '#10a800',
  right:  '#00a896',
};

const GROUP_DIVIDER_COLOR = '#009ac7';

// ─── sortItems (overlay items, by zone) ────────────────────────────────────────
const _GROUP_DEFS = [
  { vertical: 'top',    horizontal: 'left',   label: 'Top · Left'      },
  { vertical: 'top',    horizontal: 'center', label: 'Top · Center'    },
  { vertical: 'top',    horizontal: 'right',  label: 'Top · Right'     },
  { vertical: 'middle', horizontal: 'left',   label: 'Middle · Left'   },
  { vertical: 'middle', horizontal: 'center', label: 'Middle · Center' },
  { vertical: 'middle', horizontal: 'right',  label: 'Middle · Right'  },
  { vertical: 'bottom', horizontal: 'left',   label: 'Bottom · Left'   },
  { vertical: 'bottom', horizontal: 'center', label: 'Bottom · Center' },
  { vertical: 'bottom', horizontal: 'right',  label: 'Bottom · Right'  },
];

const _GROUP_ORDER = _GROUP_DEFS.map(g => `${g.vertical}-${g.horizontal}`);

function sortItems(items) {
  const key = item => `${item.vertical ?? 'middle'}-${item.horizontal ?? 'center'}`;
  return [...items].sort((a, b) => _GROUP_ORDER.indexOf(key(a)) - _GROUP_ORDER.indexOf(key(b)));
}

// ─── generateId ───────────────────────────────────────────────────────────────
function generateId(existingItems = []) {
  const existing = new Set(existingItems.map(i => i._id));
  let id;
  do { id = Math.random().toString(16).slice(2, 10); } while (existing.has(id));
  return id;
}

// ─── migrateConfig ────────────────────────────────────────────────────────────
// Backfill a stable _id on any item missing one, and backfill zone_modes with
// any zone keys missing from an older config. Returns the (possibly new)
// config and whether anything changed.
function migrateConfig(config) {
  let migrated = false;

  if (config.items?.some(i => !i._id)) {
    const withIds = [];
    for (const i of config.items) withIds.push(i._id ? i : { ...i, _id: generateId(config.items.concat(withIds)) });
    config   = { ...config, items: withIds };
    migrated = true;
  }

  const zoneModes = config.zone_modes ?? {};
  const missingZoneKey = Object.keys(DEFAULT_ZONE_MODES).some(k => !(k in zoneModes));
  if (missingZoneKey) {
    config   = { ...config, zone_modes: { ...DEFAULT_ZONE_MODES, ...zoneModes } };
    migrated = true;
  }

  return { config, migrated };
}

// ─── YAML helpers ─────────────────────────────────────────────────────────────
function serializeExtrasToYaml(obj, uiKeys) {
  const extras = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!uiKeys.has(k)) extras[k] = v;
  }
  if (!Object.keys(extras).length) return '';
  try {
    return jsyaml.dump(extras, { indent: 2 }).trimEnd();
  } catch (e) {
    return '';
  }
}

function parseYamlExtras(text) {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return {};
  try {
    const parsed = jsyaml.load(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    return null;
  } catch (e) {
    return null;
  }
}

// ─── Home Assistant action compatibility ────────────────────────────────────────
// An externally-loaded card cannot import HA's internal handleAction/fireEvent.
// These are faithful copies of Home Assistant's own implementations so the card
// forwards actions to HA exactly as a built-in card does — including
// fire-dom-event, which HA dispatches as the "ll-custom" event that browser_mod
// and other add-ons listen for. The card adds no allowlist of its own: any action
// HA understands works, and fire-dom-event is HA's extension point for actions
// provided by third-party add-ons.

function fireEvent(node, type, detail = {}, options = {}) {
  const event = new Event(type, {
    bubbles:    options.bubbles    ?? true,
    cancelable: Boolean(options.cancelable),
    composed:   options.composed   ?? true,
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
}

function navigate(path, options = {}) {
  if (options.replace) {
    history.replaceState(null, '', path);
  } else {
    history.pushState(null, '', path);
  }
  fireEvent(window, 'location-changed', { replace: options.replace ?? false });
}

function toggleEntity(hass, entityId) {
  if (!entityId) return;
  hass.callService('homeassistant', 'toggle', { entity_id: entityId });
}

// Faithful copy of HA's handleAction. Selects the action config for the given
// interaction (tap/hold/double_tap), defaults to more-info, and routes it.
// Unknown actions do nothing — matching HA, not filtering. assist and action
// confirmation are intentionally not handled: both need internal HA dialogs that
// an externally-loaded card cannot open.
function handleAction(node, hass, config, action) {
  let actionConfig;
  if (action === 'double_tap' && config.double_tap_action) {
    actionConfig = config.double_tap_action;
  } else if (action === 'hold' && config.hold_action) {
    actionConfig = config.hold_action;
  } else if (action === 'tap' && config.tap_action) {
    actionConfig = config.tap_action;
  }
  if (!actionConfig) actionConfig = { action: 'none' };

  switch (actionConfig.action) {
    case 'none':
      break;
    case 'more-info':
      fireEvent(node, 'hass-more-info', { entityId: actionConfig.entity ?? config.entity });
      break;
    case 'navigate':
      if (actionConfig.navigation_path) {
        navigate(actionConfig.navigation_path, { replace: actionConfig.navigation_replace });
      }
      break;
    case 'url':
      if (actionConfig.url_path) window.open(actionConfig.url_path, '_blank');
      break;
    case 'toggle':
      toggleEntity(hass, config.entity);
      break;
    case 'perform-action':
    case 'call-service': {
      const serviceName = actionConfig.perform_action ?? actionConfig.service;
      if (!serviceName) break;
      const [domain, service] = serviceName.split('.', 2);
      if (!domain || !service) break;
      hass.callService(domain, service, actionConfig.data ?? actionConfig.service_data, actionConfig.target);
      break;
    }
    case 'fire-dom-event':
      fireEvent(node, 'll-custom', actionConfig);
      break;
    default:
      // Unknown action: do nothing, exactly as HA does.
      break;
  }
}

// ─── csParseNumber ────────────────────────────────────────────────────────────
function csParseNumber(raw) {
  const v = String(raw).replace(',', '.');
  if (v === '-' || v === '-0' || v.endsWith('.')) return null;
  if (v === '')                                    return '';
  const n = parseFloat(v);
  if (isNaN(n)) return null;
  // Defer commit while the typed text has not yet reached its canonical
  // numeric form (e.g. "1.0", "1.05" mid-typing), so the live() binding does
  // not overwrite in-progress decimal entry.
  if (String(n) !== v) return null;
  return n;
}

// ─── substitutePhotoVariables ──────────────────────────────────────────────────
// Resolve any {{ }} expression's bare identifier tokens against the current
// photo's own data BEFORE handing the template to HA's render_template. Any
// token that is an exact, word-boundary-matched key in photoData is replaced
// with a Jinja2 literal (quoted string, or bare number/boolean for values that
// look numeric/boolean) — filters, operators, and any other identifier in the
// expression (e.g. a states() call) are left completely untouched for HA's own
// Jinja2 engine to evaluate normally. If, after substitution, no {{ are left,
// the caller's existing fast path (used verbatim, unmodified, from
// chrono-picture-card) skips the websocket entirely.
const _TEMPLATE_EXPR_RE = /\{\{(.*?)\}\}/gs;
const _IDENTIFIER_RE    = /[A-Za-z_][A-Za-z0-9_]*/g;

function _jinjaLiteral(value) {
  if (value === null || value === undefined) return "''";
  const s = String(value);
  if (s === '')                       return "''";
  if (/^-?\d+(\.\d+)?$/.test(s))      return s;                 // bare int/float
  if (s === 'true' || s === 'false')  return s;                 // bare boolean
  // Quote as a Jinja2 string literal; escape embedded single quotes.
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function substitutePhotoVariables(template, photoData) {
  const tmpl = String(template ?? '');
  if (!tmpl.includes('{{') || !photoData) {
    return { text: tmpl, fullyLiteral: !tmpl.includes('{{') };
  }

  let fullyLiteral = true;

  // First pass: determine, per block, whether it is a pure bare-identifier
  // photo-field reference (no filters/operators/other text inside the braces).
  // If every block in the template qualifies, the second pass below renders
  // plain text directly (raw value, no quoting) instead of Jinja2 syntax.
  const blocks = [];
  tmpl.replace(_TEMPLATE_EXPR_RE, (whole, inner) => {
    const trimmed = inner.trim();
    const isBareIdentifier = /^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed);
    const isPhotoField     = isBareIdentifier && Object.prototype.hasOwnProperty.call(photoData, trimmed);
    if (!isPhotoField) fullyLiteral = false;
    blocks.push({ inner, isPhotoField, field: isPhotoField ? trimmed : null });
    return whole;
  });

  let blockIndex = 0;
  if (fullyLiteral) {
    // Every block is a bare photo-field reference — render plain text, no
    // Jinja2 involvement, no surrounding braces or quoting.
    const text = tmpl.replace(_TEMPLATE_EXPR_RE, () => {
      const { field } = blocks[blockIndex++];
      const value = photoData[field];
      return value === null || value === undefined ? '' : String(value);
    });
    return { text, fullyLiteral: true };
  }

  // Mixed or non-photo template: substitute only the bare photo-field blocks
  // with Jinja2 literals, leave everything else (filters, states() calls,
  // expressions) untouched for HA's render_template to evaluate.
  const text = tmpl.replace(_TEMPLATE_EXPR_RE, (whole, inner) => {
    const replaced = inner.replace(_IDENTIFIER_RE, (token) => {
      if (Object.prototype.hasOwnProperty.call(photoData, token)) {
        return _jinjaLiteral(photoData[token]);
      }
      return token; // not a photo field — leave for HA (states(), filters, etc.)
    });
    return `{{${replaced}}}`;
  });

  return { text, fullyLiteral: false };
}

// ─── Editor helper functions ──────────────────────────────────────────────────

function csTextField(label, value, onChange, opts = {}) {
  return html`
    <div class="text-field">
      <label>${unsafeHTML(label)}</label>
      <chrono-cs-textfield
        .value=${String(value ?? '')}
        type=${opts.type ?? 'text'}
        step=${opts.step ?? ''}
        min=${opts.min ?? ''}
        max=${opts.max ?? ''}
        @input=${onChange}
      ></chrono-cs-textfield>
    </div>
  `;
}

function csToggleField(label, checked, onChange, extraClass = '') {
  return html`
    <div class="toggle-field ${extraClass}">
      <label>${unsafeHTML(label)}</label>
      <ha-switch .checked=${checked} @change=${onChange}></ha-switch>
    </div>
  `;
}

function toSwatchHex(value) {
  const v = String(value ?? '').trim();
  if (/^#[0-9a-fA-F]{3}$/.test(v) || /^#[0-9a-fA-F]{6}$/.test(v)) return v;
  if (/^#[0-9a-fA-F]{8}$/.test(v)) return v.slice(0, 7); // drop alpha; color input has none
  return '#000000';                                       // named/rgb()/empty → neutral
}

function csColorPicker(label, value, onChange) {
  const swatchValue = toSwatchHex(value);
  return html`
    <div class="text-field">
      <label>${unsafeHTML(label)}</label>
      <div class="color-picker-row">
        <input type="color" .value=${swatchValue} @input=${onChange}>
        <chrono-cs-textfield
          .value=${String(value ?? '')}
          @input=${onChange}
        ></chrono-cs-textfield>
      </div>
    </div>
  `;
}

function csSelectField(label, value, options, onChange) {
  return html`
    <div class="text-field">
      <label>${unsafeHTML(label)}</label>
      <chrono-cs-select
        .value=${value ?? ''}
        .options=${options}
        @change=${onChange}
      ></chrono-cs-select>
    </div>
  `;
}

// ─── csButtonPicker ───────────────────────────────────────────────────────────
function csButtonPicker(label, value, options, onChange, align = '', extraClass = '') {
  return html`
    <div class="button-picker-field ${extraClass}" style=${align === 'end' ? 'justify-self:end' : ''}>
      <label>${unsafeHTML(label)}</label>
      <chrono-cs-button-toggle-group
        .value=${value}
        .options=${options}
        @change=${onChange}
      ></chrono-cs-button-toggle-group>
    </div>
  `;
}

// ─── CsTextfield component ────────────────────────────────────────────────────
class CsTextfield extends LitElement {
  static properties = {
    value:       { type: String },
    type:        { type: String },
    step:        { type: String },
    min:         { type: String },
    max:         { type: String },
    placeholder: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
    input {
      display: block;
      width: 100%;
      box-sizing: border-box;
      height: 56px;
      padding: 0 12px;
      background: var(--input-fill-color, rgba(0,0,0,0.06));
      border: none;
      border-bottom: 1px solid var(--secondary-text-color, #888);
      border-radius: 4px 4px 0 0;
      color: var(--primary-text-color);
      font-size: 16px;
      font-family: inherit;
      outline: none;
      transition: border-bottom-color 0.2s;
    }
    input:focus {
      border-bottom: 2px solid var(--primary-color);
    }
  `;

  focus() {
    this.shadowRoot?.querySelector('input')?.focus();
  }

  render() {
    return html`
      <input
        .value=${live(this.value ?? '')}
        type=${this.type ?? 'text'}
        step=${this.step ?? ''}
        min=${this.min ?? ''}
        max=${this.max ?? ''}
        placeholder=${this.placeholder ?? ''}
        @input=${e => {
          this.value = e.target.value;
          this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        }}
      >
    `;
  }
}
customElements.define('chrono-cs-textfield', CsTextfield);

// ─── CsTextarea component ─────────────────────────────────────────────────────
class CsTextarea extends LitElement {
  static properties = {
    value:       { type: String },
    placeholder: { type: String },
    error:       { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
    textarea {
      display: block;
      width: 100%;
      box-sizing: border-box;
      min-height: calc(3 * 1.5em + 24px);
      max-height: calc(20 * 1.5em + 24px);
      padding: 12px;
      background: var(--input-fill-color, rgba(0,0,0,0.06));
      border: none;
      border-bottom: 1px solid var(--secondary-text-color, #888);
      border-radius: 4px 4px 0 0;
      color: var(--primary-text-color);
      font-size: 13px;
      font-family: monospace;
      outline: none;
      overflow-y: auto;
      resize: vertical;
      white-space: pre-wrap;
      word-wrap: break-word;
      transition: border-bottom-color 0.2s;
    }
    textarea:focus {
      border-bottom: 2px solid var(--primary-color);
    }
    textarea.error {
      border-bottom: 2px solid var(--error-color, #f44336);
    }
  `;

  focus() {
    this.shadowRoot?.querySelector('textarea')?.focus();
  }

  render() {
    return html`
      <textarea
        class="${this.error ? 'error' : ''}"
        .value=${live(this.value ?? '')}
        placeholder=${this.placeholder ?? ''}
        @input=${e => {
          this.value = e.target.value;
          this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        }}
      ></textarea>
    `;
  }
}
customElements.define('chrono-cs-textarea', CsTextarea);

// ─── CsButtonToggleGroup component ───────────────────────────────────────────
class CsButtonToggleGroup extends LitElement {
  static properties = {
    value:   { type: String },
    options: { type: Array  },
  };

  static styles = css`
    :host {
      display: inline-flex;
    }
    button {
      min-width: 70px;
      height: 32px;
      margin-top: 6px;
      margin-bottom: 6px;
      padding: 0 12px;
      border: none;
      border-left: 1px solid var(--ha-color-border-neutral-quiet, #444);
      cursor: pointer;
      font-size: 14px;
      font-family: inherit;
      color: var(--primary-text-color);
      background: var(--ha-color-fill-primary-normal-resting, #002e3e);
      transition: background 0.15s;
    }
    button:first-child {
      border-left: none;
      border-radius: 9999px 0 0 9999px;
    }
    button:last-child {
      border-radius: 0 9999px 9999px 0;
    }
    button.only {
      border-radius: 9999px;
    }
    button.active {
      background: var(--ha-color-fill-primary-loud-resting, #009ac7);
    }
    button:not(.active):hover {
      background: var(--ha-color-fill-primary-quiet-hover, #004156);
    }
  `;

  render() {
    const opts = this.options ?? [];
    return html`${opts.map((opt, i) => {
      const isOnly   = opts.length === 1;
      const isFirst  = i === 0;
      const isLast   = i === opts.length - 1;
      const isActive = opt.value === this.value;
      const cls      = [
        isActive ? 'active' : '',
        isOnly ? 'only' : (isFirst ? 'first' : (isLast ? 'last' : '')),
      ].filter(Boolean).join(' ');
      return html`
        <button class="${cls}" @click=${() => this._select(opt.value)}>${opt.label}</button>
      `;
    })}`;
  }

  _select(value) {
    this.value = value;
    this.dispatchEvent(new CustomEvent('change', { detail: { value }, bubbles: true, composed: true }));
  }

  focus() {
    this.shadowRoot?.querySelector('button')?.focus();
  }
}
customElements.define('chrono-cs-button-toggle-group', CsButtonToggleGroup);

// ─── CsSelect component ───────────────────────────────────────────────────────
class CsSelect extends LitElement {
  static properties = {
    value:   { type: String },
    options: { type: Array  },
    _open:   { state: true  },
    _cursor: { state: true  },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
      min-width: 0;
      position: relative;
    }
    .combobox {
      display: flex;
      align-items: center;
      width: 100%;
      box-sizing: border-box;
      height: 56px;
      background: var(--input-fill-color, rgba(0,0,0,0.06));
      border: none;
      border-bottom: 1px solid var(--secondary-text-color, #888);
      border-radius: 4px 4px 0 0;
      transition: border-bottom-color 0.2s;
    }
    .combobox:focus-within,
    .combobox-open {
      border-bottom: 2px solid var(--primary-color);
    }
    .combobox-input {
      flex: 1;
      height: 100%;
      padding: 0 8px 0 12px;
      background: transparent;
      border: none;
      color: var(--primary-text-color);
      font-size: 16px;
      font-family: inherit;
      outline: none;
      min-width: 0;
      box-sizing: border-box;
    }
    .combobox-chevron {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 100%;
      cursor: pointer;
      color: var(--secondary-text-color);
      font-size: 12px;
      flex-shrink: 0;
      user-select: none;
    }
    .combobox-chevron:hover {
      color: var(--primary-text-color);
    }
    .combobox-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 9999;
      background: var(--card-background-color, #1c1c1c);
      border: 1px solid var(--divider-color, #444);
      border-radius: 0 0 4px 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      max-height: 240px;
      overflow-y: auto;
      margin-top: 1px;
    }
    .combobox-option {
      padding: 10px 12px;
      font-size: 14px;
      font-family: inherit;
      color: var(--primary-text-color);
      cursor: pointer;
      transition: background 0.1s;
    }
    .combobox-option:hover {
      background: var(--secondary-background-color, rgba(255,255,255,0.08));
    }
    .combobox-option-selected {
      color: var(--primary-color);
    }
    .combobox-option-cursor {
      background: var(--secondary-background-color, rgba(255,255,255,0.08));
    }
  `;

  constructor() {
    super();
    this.value            = '';
    this.options          = [];
    this._open            = false;
    this._cursor          = -1;
    this._onOutsideClick  = this._onOutsideClick.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._onOutsideClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onOutsideClick);
  }

  _onOutsideClick(e) {
    if (!this.shadowRoot.contains(e.composedPath()[0]) && e.composedPath()[0] !== this) {
      this._open   = false;
      this._cursor = -1;
    }
  }

  _select(value) {
    this.value   = value;
    this._open   = false;
    this._cursor = -1;
    this.dispatchEvent(new CustomEvent('change', {
      detail:   { value },
      bubbles:  true,
      composed: true,
    }));
  }

  _handleKeyDown(e) {
    const opts = this.options ?? [];
    if (!this._open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        this._open   = true;
        this._cursor = 0;
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      this._cursor = Math.min(this._cursor + 1, opts.length - 1);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      this._cursor = Math.max(this._cursor - 1, 0);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (this._cursor >= 0 && this._cursor < opts.length) this._select(opts[this._cursor].value);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      this._open   = false;
      this._cursor = -1;
      e.preventDefault();
    }
  }

  render() {
    const opts = this.options ?? [];
    return html`
      <div class="combobox ${this._open ? 'combobox-open' : ''}">
        <input
          class="combobox-input"
          .value=${live(this.value ?? '')}
          @input=${e => {
            this.dispatchEvent(new CustomEvent('change', {
              detail:   { value: e.target.value },
              bubbles:  true,
              composed: true,
            }));
          }}
          @blur=${() => { this._open = false; this._cursor = -1; }}
          @keydown=${this._handleKeyDown}
        >
        <div
          class="combobox-chevron"
          @click=${() => {
            this._open = !this._open;
            this._cursor = -1;
            this.shadowRoot.querySelector('.combobox-input').focus();
          }}
          aria-hidden="true"
        >${this._open ? '▴' : '▾'}</div>
      </div>
      ${this._open ? html`
        <div class="combobox-dropdown">
          ${opts.map((opt, i) => html`
            <div
              class="combobox-option
                     ${opt.value === this.value ? 'combobox-option-selected' : ''}
                     ${i === this._cursor       ? 'combobox-option-cursor'   : ''}"
              @mousedown=${(e) => { e.preventDefault(); this._select(opt.value); }}
            >${opt.label}</div>
          `)}
        </div>
      ` : ''}
    `;
  }

  focus() {
    this.shadowRoot?.querySelector('.combobox-input')?.focus();
  }
}
customElements.define('chrono-cs-select', CsSelect);

// ─── Editor ───────────────────────────────────────────────────────────────────
class ChronoSlideshowCardEditor extends LitElement {
  static properties = {
    hass:            { attribute: false },
    _config:         { state: true },
    _expandedItemId: { state: true },
    _removedItem:    { state: true },
  };

  setConfig(config) {
    const { config: migratedConfig, migrated } = migrateConfig(config);
    this._config = migratedConfig;
    if (migrated) this._fireConfig();
  }

  // ── Fire config-changed ───────────────────────────────────────────────────
  _fireConfig() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail:   { config: this._config },
      bubbles:  true,
      composed: true,
    }));
  }

  // ── Card-level value changed ──────────────────────────────────────────────
  _valueChanged(key, e) {
    if (!this._config) return;
    this._clearUndo();
    const value  = e.target.value ?? e.detail?.value;
    this._config = { ...this._config, [key]: value };
    this._fireConfig();
  }

  // ── Card-level numeric value changed ──────────────────────────────────────
  _numericValueChanged(key, e) {
    if (!this._config) return;
    this._clearUndo();
    const raw    = e.target.value ?? e.detail?.value;
    const parsed = csParseNumber(raw);
    if (parsed === null) return;
    this._config = { ...this._config, [key]: parsed };
    this._fireConfig();
  }

  // ── Card-level toggle changed ─────────────────────────────────────────────
  _toggleChanged(key, e) {
    if (!this._config) return;
    this._clearUndo();
    const value  = e.target.checked;
    this._config = { ...this._config, [key]: value };
    this._fireConfig();
  }

  // ── Zone mode (static/dynamic) changed ────────────────────────────────────
  _zoneModeChanged(zoneKey, e) {
    if (!this._config) return;
    this._clearUndo();
    const value      = e.target.value ?? e.detail?.value;
    const zone_modes = { ...(this._config.zone_modes ?? DEFAULT_ZONE_MODES), [zoneKey]: value };
    this._config      = { ...this._config, zone_modes };
    this._fireConfig();
  }

  // ── Item-level UI field changed ───────────────────────────────────────────
  _itemChanged(index, key, e) {
    if (!this._config) return;
    this._clearUndo();
    const raw = e.target.value ?? e.detail?.value;
    let value;
    if (NUMERIC_ITEM_KEYS.has(key)) {
      const parsed = csParseNumber(raw);
      if (parsed === null) return;
      value = parsed;
    } else {
      value = raw;
    }
    let items    = [...(this._config.items ?? [])];
    items[index] = { ...items[index], [key]: value };
    if (key === 'horizontal' || key === 'vertical') items = sortItems(items);
    this._config = { ...this._config, items };
    this._fireConfig();
  }

  // ── Item-level YAML textarea changed ─────────────────────────────────────
  _itemYamlChanged(index, e) {
    if (!this._config) return;
    this._clearUndo();
    const text   = e.target.value ?? e.detail?.value ?? '';
    const parsed = parseYamlExtras(text);
    if (parsed === null) return; // invalid YAML — don't save
    const items  = [...(this._config.items ?? [])];
    const item   = items[index];
    // Keep only UI-controlled keys from the existing item, then merge extras
    const clean  = {};
    for (const [k, v] of Object.entries(item)) {
      if (UI_ITEM_KEYS.has(k)) clean[k] = v;
    }
    items[index]     = { ...clean, ...parsed };
    this._config     = { ...this._config, items };
    this._fireConfig();
  }

  _itemToggled(index, key, e) {
    if (!this._config) return;
    this._clearUndo();
    const value      = e.target.checked;
    const items      = [...(this._config.items ?? [])];
    items[index]     = { ...items[index], [key]: value };
    this._config     = { ...this._config, items };
    this._fireConfig();
  }

  // ── Add / remove / reorder items ──────────────────────────────────────────
  _addItem(type) {
    const existing = this._config.items ?? [];
    let defaultValue = '';
    if (type === 'entity') {
      const states = this.hass?.states ?? {};
      const light  = Object.keys(states).find(id => id.startsWith('light.'));
      defaultValue = light ?? Object.keys(states)[0] ?? '';
    } else {
      defaultValue = "{{ now().strftime('%H:%M') }}";
    }
    const base = type === 'entity'
      ? { ...DEFAULT_ENTITY_ITEM,   _id: generateId(existing), entity:   defaultValue }
      : { ...DEFAULT_TEMPLATE_ITEM, _id: generateId(existing), template: defaultValue };
    const items  = sortItems([...existing, base]);
    this._expandedItemId = base._id;
    this._removedItem    = null;
    this._config = { ...this._config, items };
    this._fireConfig();

    // Focus the new item's field only once its panel has rendered its content.
    // ha-expansion-panel renders the slotted content when `expanded` is set
    // (via its own update cycle), so await the panel's updateComplete — not the
    // editor's — before the field exists in the DOM. Value comes from the data
    // binding; it is not set here.
    this.updateComplete.then(async () => {
      const panel = this.shadowRoot?.querySelector(`[data-item-id="${base._id}"]`);
      if (!panel) return;
      await panel.updateComplete;
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      panel.querySelector('chrono-cs-textfield')?.focus();
    });
  }

  _removeItem(index) {
    const items = [...(this._config.items ?? [])];
    this._removedItem = { item: items[index], index };
    this._config = { ...this._config, items: items.filter((_, i) => i !== index) };
    this._fireConfig();
  }

  _undoRemove() {
    if (!this._removedItem) return;
    const { item, index } = this._removedItem;
    const items = [...(this._config.items ?? [])];
    items.splice(index, 0, item);
    this._removedItem = null;
    this._config = { ...this._config, items };
    this._fireConfig();
  }

  _clearUndo() {
    if (this._removedItem) this._removedItem = null;
  }

  // Build the editor's visible list: every group's divider followed by that
  // group's items in array order. All 9 dividers always present. Each item row
  // carries its index within _config.items (the edit handlers address it).
  // If an item was just removed, an undo row appears at its original position.
  _buildRows(items) {
    const rows = [];
    let itemCount = 0;
    for (const g of _GROUP_DEFS) {
      rows.push({ type: 'divider', group: g, key: `divider-${g.vertical}-${g.horizontal}` });
      items.forEach((item, itemIndex) => {
        if ((item.vertical ?? 'middle') === g.vertical && (item.horizontal ?? 'center') === g.horizontal) {
          // Insert undo row at its original index position
          if (this._removedItem && itemCount === this._removedItem.index) {
            rows.push({ type: 'undo', key: 'undo-remove' });
          }
          rows.push({ type: 'item', item, itemIndex, key: item._id });
          itemCount++;
        }
      });
    }
    // If undo row belongs at the end (was last item)
    if (this._removedItem && itemCount === this._removedItem.index) {
      rows.push({ type: 'undo', key: 'undo-remove' });
    }
    return rows;
  }

  _itemMoved(e) {
    e.stopPropagation();
    this._clearUndo();
    const { oldIndex, newIndex } = e.detail;
    const items = [...(this._config.items ?? [])];
    const rows  = this._buildRows(items);
    if (!rows[oldIndex] || rows[oldIndex].type !== 'item') return; // dividers don't move

    rows.splice(newIndex, 0, rows.splice(oldIndex, 1)[0]);

    // Each item takes the group of the nearest divider above it. An item that
    // ends up above the first divider falls into the first group (top-left).
    let group = _GROUP_DEFS[0];
    const newItems = [];
    for (const row of rows) {
      if (row.type === 'divider') { group = row.group; continue; }
      newItems.push({ ...row.item, vertical: group.vertical, horizontal: group.horizontal });
    }
    this._config = { ...this._config, items: newItems };
    this._fireConfig();
  }

  // ── Option arrays ─────────────────────────────────────────────────────────
  _verticalOptions   = VERTICAL_OPTIONS;
  _horizontalOptions = HORIZONTAL_OPTIONS;
  _sortByOptions      = SORT_BY_OPTIONS;
  _transitionOptions  = TRANSITION_OPTIONS;
  _fitModeOptions     = FIT_MODE_OPTIONS;
  _zoneModeOptions    = ZONE_MODE_OPTIONS;

  // ─── Zone modes panel ───────────────────────────────────────────────────────
  _renderZoneModesPanel() {
    const zoneModes = this._config?.zone_modes ?? DEFAULT_ZONE_MODES;
    return html`
      <ha-expansion-panel header="Zone transition behavior" outlined .expanded=${false}>
        <p class="zone-modes-hint">
          Static zones stay fixed on screen. Dynamic zones transition together
          with the photo. All overlay items placed in a zone share that zone's
          setting.
        </p>
        <div class="zone-modes-grid">
          ${_GROUP_DEFS.map(g => {
            const zoneKey = `${g.vertical}-${g.horizontal}`;
            return html`
              <div class="zone-mode-cell">
                ${csSelectField(g.label, zoneModes[zoneKey] ?? 'static', this._zoneModeOptions, e => this._zoneModeChanged(zoneKey, e))}
              </div>
            `;
          })}
        </div>
      </ha-expansion-panel>
    `;
  }

  // ─── Items panel ───────────────────────────────────────────────────────────
  _renderItemsPanel() {
    const items = this._config?.items ?? [];
    const rows  = this._buildRows(items);

    return html`
      <ha-expansion-panel header="Items configuration" outlined>

        <ha-sortable handle-selector=".handle" @item-moved=${(e) => this._itemMoved(e)}>
          <div class="items-list">
            ${repeat(rows, row => row.key, (row) => {
              if (row.type === 'divider') {
                return html`
                  <div class="group-divider">
                    <span class="group-divider-label" style="color:${GROUP_DIVIDER_COLOR}">${row.group.label}</span>
                    <div class="group-divider-line" style="background:${GROUP_DIVIDER_COLOR}"></div>
                  </div>
                `;
              }

              if (row.type === 'undo') {
                return html`
                  <div class="remove-item-row">
                    <button class="remove-item-btn" @click=${() => this._undoRemove()}>
                      Undo remove
                    </button>
                  </div>
                `;
              }

              const item       = row.item;
              const index      = row.itemIndex;
              const isEntity   = 'entity'   in item;
              const typeLabel  = isEntity ? 'Entity' : 'Template';
              const typeClass  = isEntity ? 'entity' : 'template';
              const headerText = isEntity
                ? (item.entity || `Entity ${index + 1}`)
                : (item.template
                    ? (item.template.length > 30
                        ? item.template.slice(0, 30) + '…'
                        : item.template)
                    : `Template ${index + 1}`);

              const extrasYaml = serializeExtrasToYaml(item, UI_ITEM_KEYS);

              return html`
                <ha-expansion-panel
                  outlined
                  data-item-id="${item._id}"
                  .expanded=${this._expandedItemId === item._id}
                  @expanded-changed=${(e) => {
                    this._expandedItemId = e.detail.value ? item._id : null;
                  }}
                >

                  <div slot="header" class="item-header-slot">
                    <div class="item-header-content${item.show === false ? ' item-hidden' : ''}">
                      ${SHOW_ITEM_POSITION_BADGES ? html`
                        <span class="item-pos-badge" style="background:${VERTICAL_BADGE_COLORS[item.vertical ?? 'middle']}">${{ top: 'T', middle: 'M', bottom: 'B' }[item.vertical ?? 'middle']}</span>
                        <span class="item-pos-badge" style="background:${HORIZONTAL_BADGE_COLORS[item.horizontal ?? 'center']}">${{ left: 'L', center: 'C', right: 'R' }[item.horizontal ?? 'center']}</span>
                      ` : ''}
                      <span class="item-type-badge ${typeClass}">${typeLabel}</span>
                      <span>${headerText}</span>
                    </div>
                    <button
                      class="item-visibility-btn"
                      title="${item.show === false ? 'Show item' : 'Hide item'}"
                      @click=${(e) => { e.stopPropagation(); this._itemToggled(index, 'show', { target: { checked: item.show === false } }); }}
                    >
                      <ha-icon .icon=${item.show === false ? 'mdi:eye-off-outline' : 'mdi:eye-outline'}></ha-icon>
                    </button>
                  </div>

                  <div class="handle" slot="leading-icon">
                    <ha-svg-icon .path=${mdiDragHorizontalVariant}></ha-svg-icon>
                  </div>

                  <!-- Position: vertical (top/middle/bottom) and horizontal (left/center/right) -->
                  <div class="item-position-row">
                    ${csButtonPicker('', item.vertical ?? 'middle', this._verticalOptions, e => this._itemChanged(index, 'vertical', e))}
                    ${csButtonPicker('', item.horizontal ?? 'center', this._horizontalOptions, e => this._itemChanged(index, 'horizontal', e))}
                  </div>

                  <!-- Entity ID or Template string -->
                  <div class="item-content-row">
                    ${isEntity
                      ? csTextField('Entity ID', item.entity ?? '', e => this._itemChanged(index, 'entity', e))
                      : csTextField('Template\n<i>supports Jinja2, e.g. {{ exifModel }} or {{ states("sensor.temp") }}</i>', item.template ?? '', e => this._itemChanged(index, 'template', e))
                    }
                  </div>

                  <!-- Entity-only: icon override -->
                  ${isEntity ? html`
                    <div class="item-content-row">
                      ${csTextField('Icon', item.icon ?? '', e => this._itemChanged(index, 'icon', e))}
                    </div>
                  ` : ''}

                  <!-- Entity-only: show state toggle -->
                  ${isEntity ? html`
                    <div class="item-toggles-row">
                      ${csToggleField('Show state', item.show_state ?? false, e => this._itemToggled(index, 'show_state', e))}
                    </div>
                  ` : ''}

                  <!-- Typography: font color, size, weight, line height, border radius -->
                  <div class="item-typography">
                    ${csColorPicker('Font color', item.font_color ?? '', e => this._itemChanged(index, 'font_color', e))}
                    ${csTextField('Font size (em)', item.font_size   ?? '', e => this._itemChanged(index, 'font_size',   e), { type: 'number', step: '0.1', min: '0' })}
                    ${csTextField('Font weight',    item.font_weight ?? '', e => this._itemChanged(index, 'font_weight', e), { type: 'number', step: '100', min: '100', max: '900' })}
                    ${csTextField('Line height',    item.line_height ?? '', e => this._itemChanged(index, 'line_height', e), { type: 'number', step: '0.1', min: '0' })}
                    ${csTextField('Border\nradius (px)', item.border_radius ?? '', e => this._itemChanged(index, 'border_radius', e), { type: 'number', step: '1', min: '0' })}
                  </div>

                  <!-- Background color and padding -->
                  <div class="item-bg-color-padding">
                    ${csColorPicker('Background color', item.background_color ?? '', e => this._itemChanged(index, 'background_color', e))}
                    ${csTextField('Padding\ntop (px)',    item.padding_top    ?? '', e => this._itemChanged(index, 'padding_top',    e), { type: 'number', step: '1', min: '0' })}
                    ${csTextField('Padding\nbottom (px)', item.padding_bottom ?? '', e => this._itemChanged(index, 'padding_bottom', e), { type: 'number', step: '1', min: '0' })}
                    ${csTextField('Padding\nleft (px)',   item.padding_left   ?? '', e => this._itemChanged(index, 'padding_left',   e), { type: 'number', step: '1', min: '0' })}
                    ${csTextField('Padding\nright (px)',  item.padding_right  ?? '', e => this._itemChanged(index, 'padding_right',  e), { type: 'number', step: '1', min: '0' })}
                  </div>

                  <!-- Text shadow / stroke: color, blur, x/y offset, stroke width -->
                  <div class="item-text-shadow">
                    ${csColorPicker('Shadow color', item.text_shadow_color ?? '', e => this._itemChanged(index, 'text_shadow_color', e))}
                    ${csTextField('Shadow\nblur (px)',     item.text_shadow_blur         ?? '', e => this._itemChanged(index, 'text_shadow_blur',         e), { type: 'number', step: '1', min: '0' })}
                    ${csTextField('Shadow\noffset X (px)', item.text_shadow_offset_x     ?? '', e => this._itemChanged(index, 'text_shadow_offset_x',     e), { type: 'number', step: '1' })}
                    ${csTextField('Shadow\noffset Y (px)', item.text_shadow_offset_y     ?? '', e => this._itemChanged(index, 'text_shadow_offset_y',     e), { type: 'number', step: '1' })}
                    ${csTextField('Stroke\nwidth (px)',    item.text_shadow_stroke_width ?? '', e => this._itemChanged(index, 'text_shadow_stroke_width', e), { type: 'number', step: '1', min: '0' })}
                  </div>

                  <!-- Remove button -->
                  <div class="remove-item-row">
                    <button class="remove-item-btn" @click=${() => this._removeItem(index)}>
                      Remove item
                    </button>
                  </div>

                </ha-expansion-panel>
              `;
            })}
          </div>
        </ha-sortable>

        <div class="add-item-row">
          <button class="add-item-btn" @click=${() => this._addItem('entity')}>+ Add entity</button>
          <button class="add-item-btn" @click=${() => this._addItem('template')}>+ Add template</button>
        </div>

      </ha-expansion-panel>
    `;
  }

  static styles = css`

    ha-expansion-panel {
      margin-top: 8px;
    }

    /* ── Grid rows ─────────────────────────────────────────────────────────── */

    .card-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .card-row-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .card-row-1 {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .item-position-row {
      display: flex;
      flex-direction: row;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
      margin-top: 4px;
    }

    .item-content-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .item-toggles-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 24px;
      margin-bottom: 16px;
    }

    .item-typography {
      display: grid;
      grid-template-columns: 19fr 8fr 8fr 8fr 8fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .item-bg-color-padding {
      display: grid;
      grid-template-columns: 19fr 8fr 8fr 8fr 8fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .item-text-shadow {
      display: grid;
      grid-template-columns: 19fr 8fr 8fr 8fr 8fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    /* ── Zone modes grid ───────────────────────────────────────────────────── */

    .zone-modes-hint {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin: 4px 0 12px;
    }

    .zone-modes-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }

    .zone-mode-cell {
      min-width: 0;
    }

    /* ── Text fields ───────────────────────────────────────────────────────── */

    .text-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .text-field label {
      font-size: 12px;
      font-weight: 600;
      color: var(--secondary-text-color);
      white-space: pre-line;
    }

    /* ── Color picker row ──────────────────────────────────────────────────── */

    .color-picker-row {
      display: flex;
      align-items: stretch;
      gap: 6px;
    }

    .color-picker-row input[type="color"] {
      width: 40px;
      min-width: 40px;
      height: 56px;
      padding: 4px;
      border: none;
      border-bottom: 1px solid var(--secondary-text-color, #888);
      border-radius: 4px 4px 0 0;
      background: var(--input-fill-color, rgba(0,0,0,0.06));
      cursor: pointer;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    .color-picker-row chrono-cs-textfield {
      flex: 1;
    }

    /* ── Toggle fields ─────────────────────────────────────────────────────── */

    .toggle-field {
      display: flex;
      flex-direction: row;
      gap: 12px;
      align-items: center;
    }

    .toggle-field label {
      font-size: 12px;
      font-weight: 600;
      color: var(--secondary-text-color);
    }

    /* ── Add / remove item buttons ─────────────────────────────────────────── */

    .add-item-row {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 12px;
      margin-bottom: 4px;
    }

    .add-item-btn {
      background: none;
      border: none;
      color: var(--primary-color);
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      letter-spacing: 0.0892857em;
      text-transform: uppercase;
      height: 36px;
      padding: 0 8px;
      cursor: pointer;
      border-radius: 4px;
    }

    .add-item-btn:hover {
      background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.08);
    }

    .remove-item-row {
      display: flex;
      justify-content: center;
      margin-top: 8px;
      margin-bottom: 4px;
    }

    .remove-item-btn {
      background: none;
      border: none;
      color: var(--error-color, #f44336);
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      letter-spacing: 0.0892857em;
      text-transform: uppercase;
      height: 36px;
      padding: 0 8px;
      cursor: pointer;
      border-radius: 4px;
    }

    .remove-item-btn:hover {
      background: rgba(244, 67, 54, 0.08);
    }

    /* ── Drag handle ───────────────────────────────────────────────────────── */

    .handle {
      cursor: move;
      cursor: grab;
      padding: 0 4px;
      color: var(--secondary-text-color);
      display: flex;
      align-items: center;
    }

    .handle > * {
      pointer-events: none;
    }

    /* ── Item type badge ───────────────────────────────────────────────────── */

    .item-header-slot {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
    }

    .item-header-content {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
    }

    .item-header-content.item-hidden {
      opacity: 0.45;
    }

    .group-divider {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0 4px;
    }

    .group-divider-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--secondary-text-color);
      white-space: nowrap;
    }

    .group-divider-line {
      flex: 1;
      height: 1px;
      background: var(--divider-color, #444);
      opacity: 0.4;
    }

    .item-visibility-btn {
      background: none;
      border: none;
      padding: 0 4px;
      cursor: pointer;
      color: var(--secondary-text-color);
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .item-visibility-btn:hover {
      color: var(--primary-text-color);
    }

    .item-pos-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 2px 6px;
      border-radius: 4px;
      color: white;
    }

    .item-type-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
    }

    .item-type-badge.entity {
      background: var(--success-color, #4CAF50);
      color: white;
    }

    .item-type-badge.template {
      background: var(--info-color, #2196F3);
      color: white;
    }

  `;

  render() {
    if (!this._config) return html``;

    const c = this._config;

    return html`

      <!-- ── Card configuration ──────────────────────────────────────────────── -->

      <ha-expansion-panel header="Card configuration" outlined .expanded=${false}>

        <!-- chrono_folder sensor entity -->
        <div class="card-row-1">
          ${csTextField('Sensor entity (chrono_folder)', c.entity ?? '', e => this._valueChanged('entity', e))}
        </div>

        <!-- Sort by + reverse -->
        <div class="card-row">
          ${csSelectField('Sort by', c.sort_by ?? 'filename', this._sortByOptions, e => this._valueChanged('sort_by', e))}
          ${csToggleField('Reverse order', c.sort_reverse ?? false, e => this._toggleChanged('sort_reverse', e))}
        </div>

        <!-- Display time + fit mode -->
        <div class="card-row">
          ${csTextField('Display time (seconds)', c.display_time ?? 8, e => this._numericValueChanged('display_time', e), { type: 'number', step: '1', min: '1' })}
          ${csSelectField('Fit mode', c.fit_mode ?? 'contain', this._fitModeOptions, e => this._valueChanged('fit_mode', e))}
        </div>

        <!-- Letterbox color: fills any gap left by 'contain' fit mode, also
             what shows through from the pre-warmed next photo behind it -->
        <div class="card-row">
          ${csColorPicker('Letterbox color', c.letterbox_color ?? '', e => this._valueChanged('letterbox_color', e))}
        </div>

        <!-- Transition + transition duration -->
        <div class="card-row">
          ${csSelectField('Transition', c.transition ?? 'fade', this._transitionOptions, e => this._valueChanged('transition', e))}
          ${csTextField('Transition duration (s)', c.transition_duration ?? 0.6, e => this._numericValueChanged('transition_duration', e), { type: 'number', step: '0.1', min: '0' })}
        </div>

      </ha-expansion-panel>

      <!-- ── Zone modes panel ────────────────────────────────────────────────── -->

      ${this._renderZoneModesPanel()}

      <!-- ── Items panel ─────────────────────────────────────────────────────── -->

      ${this._renderItemsPanel()}

    `;
  }
}
customElements.define('chrono-slideshow-card-editor', ChronoSlideshowCardEditor);

// ─── Sort helpers ─────────────────────────────────────────────────────────────
// Parse a chrono_folder EXIF datetime string ("2018:05:25 16:35:44") into a
// comparable timestamp. Returns NaN if the string is missing or malformed.
function _parseExifDateTime(s) {
  if (!s) return NaN;
  // "YYYY:MM:DD HH:MM:SS" → "YYYY-MM-DDTHH:MM:SS" for Date parsing.
  const m = String(s).match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!m) return NaN;
  const [, y, mo, d, h, mi, se] = m;
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${se}`).getTime();
}

function _parseFileDateTime(file) {
  if (!file.fileDate) return NaN;
  return new Date(`${file.fileDate}T${file.fileTime ?? '00:00:00'}`).getTime();
}

// Returns the best available capture timestamp for a file: EXIF capture date
// if present, otherwise the file's own date/time (mtime) as recorded by
// chrono_folder.
function _bestDateTime(file) {
  const exif = _parseExifDateTime(file.exifDateTimeOriginal ?? file.exifDateTime);
  if (!isNaN(exif)) return exif;
  return _parseFileDateTime(file);
}

function sortFiles(files, sortBy, reverse) {
  let sorted;
  if (sortBy === 'random') {
    sorted = [...files];
    for (let i = sorted.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
    }
    return sorted; // reverse has no meaning for random order
  }
  if (sortBy === 'exifdatetime') {
    sorted = [...files].sort((a, b) => _bestDateTime(a) - _bestDateTime(b));
  } else if (sortBy === 'filedatetime') {
    sorted = [...files].sort((a, b) => _parseFileDateTime(a) - _parseFileDateTime(b));
  } else {
    sorted = [...files].sort((a, b) => (a.fileName ?? '').localeCompare(b.fileName ?? ''));
  }
  return reverse ? sorted.reverse() : sorted;
}

// ─── Transition CSS class helpers ──────────────────────────────────────────────
// Maps a transition name to the {enter, exit} translate/clip-path pair applied
// to the slide unit. 'fade' and 'none' use opacity only (translate stays 0).
const TRANSITION_EXIT_TRANSFORM = {
  'slide-left':  'translateX(-100%)',
  'slide-right': 'translateX(100%)',
  'slide-up':    'translateY(-100%)',
  'slide-down':  'translateY(100%)',
};
const TRANSITION_ENTER_FROM_TRANSFORM = {
  'slide-left':  'translateX(100%)',
  'slide-right': 'translateX(-100%)',
  'slide-up':    'translateY(100%)',
  'slide-down':  'translateY(-100%)',
};

// ─── Card ─────────────────────────────────────────────────────────────────────
class ChronoSlideshowCard extends LitElement {
  static properties = {
    _config:        { attribute: false },
    _files:         { state: true },
    _currentIndex:  { state: true },
    _itemValues:    { state: true },
    _loadError:     { state: true },
    _swipeOffset:   { state: true },
    _transitioning: { state: true },
    _frontSlotId:   { state: true },
    _slotPhotoA:    { state: true },
    _slotPhotoB:    { state: true },
  };

  static getCardSize() {
    return 5;
  }

  static getConfigElement() {
    return document.createElement('chrono-slideshow-card-editor');
  }

  static getStubConfig() {
    return {
      ...DEFAULT_CONFIG,
      items: [{ template: '{{ fileName }}', vertical: 'bottom', horizontal: 'center', font_color: 'white', font_size: 1.1, font_weight: 600 }],
    };
  }

  constructor() {
    super();
    this._config         = null;
    this._hass            = null;
    this._files            = [];
    this._currentIndex     = 0;
    this._itemValues       = {};
    this._loadError        = null;
    this._swipeOffset      = 0;
    this._transitioning    = false;
    this._itemSubs         = new Map(); // key → { substituted, unsub }
    this._subscribed       = false;
    this._timer            = null;
    this._touchStartX      = null;
    this._touchStartY      = null;
    this._preloadedImages  = new Map(); // fileURL/filePath → Image object, cache for prev/current/next
    this._frontSlotId         = 'A';   // which persistent slot ('A' or 'B') is currently visible/front
    this._slotPhotoA          = null;  // photo currently bound to persistent slot A
    this._slotPhotoB          = null;  // photo currently bound to persistent slot B
    this._transitionTimeoutId = null;
    this._animationStartedFor = null;
    this._transitionId        = 0;
    this._resizeObserver      = null;
  }

  set hass(hass) {
    const prev = this._hass;
    this._hass  = hass;
    if (this._config && !this._subscribed) {
      this._loadFiles();
    }
    if (this._hassShouldRender(prev, hass)) this.requestUpdate();
  }

  get hass() {
    return this._hass;
  }

  // ── Decide whether a hass update affects anything this card renders ─────────
  // Entity overlay items need fresh hass on state changes; the sensor entity
  // itself needs watching so the file list refreshes when chrono_folder updates.
  // Template item values arrive via _itemValues (reactive state) for the live
  // HA-state portion and are recomputed locally for the photo-data portion, so
  // they are intentionally not considered here.
  _hassShouldRender(prev, next) {
    if (!prev || !next) return true;
    const c = this._config;
    if (!c) return true;
    if (prev.locale !== next.locale || prev.formatEntityState !== next.formatEntityState) return true;
    const ids = new Set();
    if (c.entity) ids.add(c.entity);
    for (const item of c.items ?? []) if (item.entity) ids.add(item.entity);
    for (const id of ids) if (prev.states?.[id] !== next.states?.[id]) return true;
    return false;
  }

  setConfig(config) {
    ({ config } = migrateConfig(config));
    const prevConfig = this._config;
    this._config = config;

    // A sensor entity or sort change means the working file list must be rebuilt.
    const sourceChanged =
      !prevConfig ||
      prevConfig.entity        !== config.entity ||
      prevConfig.sort_by       !== config.sort_by ||
      prevConfig.sort_reverse  !== config.sort_reverse;

    if (this._hass) {
      if (sourceChanged) {
        this._loadFiles();
      } else {
        // Items may have changed (templates, entities) — resubscribe overlays
        // against the same file list / current index without resetting position.
        this._setupSubscriptions();
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();
    if (this._hass && this._config && !this._subscribed) {
      this._loadFiles();
    }
    this._startTimer();

    this.style.setProperty(
      '--editor-preview-aspect-ratio',
      isInsideEditDialog(this) ? EDITOR_PREVIEW_ASPECT_RATIO : 'auto'
    );

    this._resizeObserver = new ResizeObserver(entries => {
      const height = entries[0]?.contentRect?.height;
      if (!height) return;
      this.style.setProperty('--scale-factor', height / REFERENCE_HEIGHT_PX);
    });
    this._resizeObserver.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._teardownSubscriptions();
    this._stopTimer();
    this._resizeObserver?.disconnect();
  }

  // ── Load files from the chrono_folder sensor, sort, and (re)start ───────────
  _loadFiles() {
    const entityId = this._config?.entity;
    const stateObj = entityId ? this._hass?.states?.[entityId] : null;
    const rawFiles = stateObj?.attributes?.files ?? [];

    this._files        = sortFiles(rawFiles, this._config?.sort_by ?? 'filename', this._config?.sort_reverse ?? false);
    this._currentIndex  = 0;
    this._loadError      = null;
    this._preloadedImages.clear();
    this._frontSlotId    = 'A';
    this._syncSlotsInstant();

    this._setupSubscriptions();
    this._preloadNeighbors();
    this._restartTimer();
  }

  // ── Current / prev / next photo data ─────────────────────────────────────
  _photoAt(offset) {
    const n = this._files.length;
    if (n === 0) return null;
    const idx = ((this._currentIndex + offset) % n + n) % n;
    return this._files[idx];
  }

  get _currentPhoto() { return this._photoAt(0); }
  get _nextPhoto()     { return this._photoAt(1); }
  get _prevPhoto()     { return this._photoAt(-1); }

  // ── Preload prev/current/next images into the browser cache ─────────────
  // Plain Image() prefetch — relies on normal HTTP caching so the actual <img>
  // tags in render() reuse the already-downloaded bytes instantly.
  _preloadNeighbors() {
    for (const photo of [this._prevPhoto, this._currentPhoto, this._nextPhoto]) {
      if (!photo) continue;
      const url = photo.fileURL;
      if (!url || this._preloadedImages.has(url)) continue;
      const img = new Image();
      img.src = url;
      this._preloadedImages.set(url, img);
    }
    // Trim cache to only currently-relevant URLs so it never grows unbounded.
    const keep = new Set([this._prevPhoto?.fileURL, this._currentPhoto?.fileURL, this._nextPhoto?.fileURL].filter(Boolean));
    for (const key of [...this._preloadedImages.keys()]) {
      if (!keep.has(key)) this._preloadedImages.delete(key);
    }
  }

  // ── Make the front slot show the current photo and the back slot show the
  //    next photo, with no animation. Used on initial load, for manual
  //    navigation (which never animates), and for transition:'none'. Leaves
  //    _frontSlotId untouched — only the two slots' photo bindings change.
  _syncSlotsInstant() {
    if (this._frontSlotId === 'A') {
      this._slotPhotoA = this._currentPhoto;
      this._slotPhotoB = this._nextPhoto;
    } else {
      this._slotPhotoB = this._currentPhoto;
      this._slotPhotoA = this._nextPhoto;
    }
  }

  // ── Timer: advance to next photo every display_time seconds ─────────────
  _startTimer() {
    if (this._timer) return;
    const seconds = Math.max(1, this._config?.display_time ?? 8);
    this._timer = setInterval(() => this._advance(), seconds * 1000);
  }

  _stopTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  _restartTimer() {
    this._stopTimer();
    this._startTimer();
  }

  // ── Advance the slideshow by +1 (next) or -1 (previous), looping ────────
  // Captures the outgoing photo and direction so render() can draw both the
  // exiting and entering slide-units for the duration of the CSS transition,
  // then settles back to a single slide-unit once it completes.
  // ── Advance to the next photo, autonomously (timer-driven only). Always
  //    forward. If a real transition is configured, swaps which persistent
  //    slot is "front" — both slide-units already exist and are already
  //    painted, so nothing is created fresh at the moment the animation
  //    starts. If transition is 'none', just syncs both slots with no
  //    animation. ─────────────────────────────────────────────────────────
  _advance() {
    if (this._files.length === 0 || this._transitioning) return;
    const n = this._files.length;
    const transitionName = this._config?.transition ?? 'fade';

    this._currentIndex   = (this._currentIndex + 1) % n;
    this._loadError       = null;
    this._setupSubscriptions();
    this._preloadNeighbors();
    this._restartTimer();

    if (transitionName === 'none') {
      this._syncSlotsInstant();
      this.requestUpdate();
      return;
    }

    // The slot becoming front already holds the right photo — it was
    // preloaded as "next" before the index changed, and that's exactly
    // today's new "current". Nothing to reassign until the transition ends.
    this._frontSlotId   = this._frontSlotId === 'A' ? 'B' : 'A';
    this._transitioning = true;
    this._transitionId  = (this._transitionId ?? 0) + 1;
    this.requestUpdate();

    const durationMs = Math.max(0, (this._config?.transition_duration ?? 0.6)) * 1000;
    if (this._transitionTimeoutId) clearTimeout(this._transitionTimeoutId);
    this._transitionTimeoutId = setTimeout(() => {
      this._transitioning = false;
      // The slot that just became "back" is stale (held the old current
      // photo) — give it the new "next" photo now, so it has the full
      // display_time to warm up before its own turn as front.
      if (this._frontSlotId === 'A') {
        this._slotPhotoB = this._nextPhoto;
      } else {
        this._slotPhotoA = this._nextPhoto;
      }
      this.requestUpdate();
    }, durationMs + 50);
  }

  // ── Manual navigation (swipe). Never animates — instant cut, per design:
  //    transitions are only for autonomous playback. Forward swipes still
  //    benefit from the pre-warmed back slot; backward swipes are a cold cut
  //    since only current+next are kept in memory, never prev. ────────────
  _manualNavigate(direction) {
    if (this._files.length === 0 || this._transitioning) return;
    const n = this._files.length;

    this._currentIndex = ((this._currentIndex + direction) % n + n) % n;
    this._loadError      = null;
    this._setupSubscriptions();
    this._preloadNeighbors();
    this._restartTimer();
    this._syncSlotsInstant();
    this.requestUpdate();
  }

  // ── Swipe handling (touch) ────────────────────────────────────────────────
  _onTouchStart(e) {
    if (this._transitioning) return;
    const t = e.changedTouches[0];
    this._touchStartX = t.clientX;
    this._touchStartY = t.clientY;
  }

  _onTouchEnd(e) {
    if (this._touchStartX === null) return;
    const t  = e.changedTouches[0];
    const dx = t.clientX - this._touchStartX;
    const dy = t.clientY - this._touchStartY;
    this._touchStartX = null;
    this._touchStartY = null;

    const SWIPE_THRESHOLD = 40; // px
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;

    if (dx < 0) {
      this._manualNavigate(1);  // swipe left → next
    } else {
      this._manualNavigate(-1); // swipe right → previous
    }
  }

  // ── Template/entity subscriptions for dynamic overlay items ─────────────
  // For each template item, run substitutePhotoVariables against the current
  // photo's data first. It reports whether every {{ }} block in the template
  // was a bare photo-field reference (fullyLiteral) — if so, the rendered
  // plain-text value is used directly with no websocket involved at all. If
  // any block contains a filter, expression, or a live HA-state reference
  // (e.g. states()), the substituted string (photo-field blocks resolved to
  // Jinja2 literals, everything else untouched) is sent to render_template —
  // exactly chrono-picture-card's subscription mechanism, applied to the
  // post-substitution text.
  //
  // Subscriptions are diffed per item (keyed by `item-<index>`) against the
  // previously-substituted string for that same item, kept in _itemSubs. An
  // item whose substituted text is unchanged — e.g. a clock template with no
  // photo-field reference at all, whose substituted text never changes between
  // photos — keeps its existing open subscription untouched. Only an item
  // whose substituted text actually differs (typically because it references
  // photo data) has its old subscription torn down and a new one opened.
  _setupSubscriptions() {
    if (!this._itemSubs) this._itemSubs = new Map(); // key → { substituted, unsub }

    const photo = this._currentPhoto;
    const items = this._config?.items ?? [];
    const seenKeys = new Set();

    items.forEach((item, index) => {
      if (!('template' in item)) return;
      const key = `item-${index}`;
      seenKeys.add(key);
      const { text: substituted, fullyLiteral } = substitutePhotoVariables(item.template ?? '', photo);
      const existing = this._itemSubs.get(key);

      if (existing && existing.substituted === substituted) return; // unchanged — leave subscription alone

      // Substituted text changed (or no prior subscription) — tear down the
      // old one for this key only, then (re)establish.
      if (existing?.unsub) this._unsubscribeOne(existing.unsub);

      if (fullyLiteral) {
        this._itemValues = { ...this._itemValues, [key]: substituted };
        this._itemSubs.set(key, { substituted, unsub: null });
        return;
      }

      const unsub = this._hass.connection.subscribeMessage(
        (msg) => { this._itemValues = { ...this._itemValues, [key]: msg.result }; },
        { type: 'render_template', template: substituted }
      );
      this._itemSubs.set(key, { substituted, unsub });
    });

    // Remove subscriptions for items that no longer exist (item removed/retyped).
    for (const [key, entry] of [...this._itemSubs.entries()]) {
      if (!seenKeys.has(key)) {
        if (entry.unsub) this._unsubscribeOne(entry.unsub);
        this._itemSubs.delete(key);
        const { [key]: _drop, ...rest } = this._itemValues;
        this._itemValues = rest;
      }
    }

    this._subscribed = true;
  }

  _unsubscribeOne(unsub) {
    Promise.resolve(unsub)
      .then(fn => { if (typeof fn === 'function') fn(); })
      .catch(() => {});
  }

  _teardownSubscriptions() {
    if (this._itemSubs) {
      for (const entry of this._itemSubs.values()) {
        if (entry.unsub) this._unsubscribeOne(entry.unsub);
      }
      this._itemSubs.clear();
    }
    this._subscribed = false;
  }

  // ── Action handling ───────────────────────────────────────────────────────
  _handleAction(config, action = 'tap') {
    if (!this._hass) return;
    handleAction(this, this._hass, config, action);
  }

  // ── Item style map ────────────────────────────────────────────────────────
  _itemStyleMap(item) {
    const pxScaled = v => (v !== '' && v != null) ? `calc(${v}px * var(--scale-factor, 1))` : undefined;
    const emScaled = v => (v !== '' && v != null) ? `calc(${v}em * var(--scale-factor, 1))` : undefined;
    const raw      = v => (v !== '' && v != null) ? `${v}`   : undefined;
    return {
      'color':            item.font_color       || undefined,
      'font-size':        emScaled(item.font_size),
      'font-weight':      raw(item.font_weight),
      'line-height':      raw(item.line_height),
      'border-radius':    pxScaled(item.border_radius),
      'background-color': item.background_color || undefined,
      'padding-top':      pxScaled(item.padding_top),
      'padding-bottom':   pxScaled(item.padding_bottom),
      'padding-left':     pxScaled(item.padding_left),
      'padding-right':    pxScaled(item.padding_right),
      'text-shadow':              item.text_shadow_color
        ? Array(Math.max(1, Number(item.text_shadow_layers ?? 2) || 1))
            .fill(`${pxScaled(item.text_shadow_offset_x ?? 0)} ${pxScaled(item.text_shadow_offset_y ?? 0)} ${pxScaled(item.text_shadow_blur ?? 0)} ${item.text_shadow_color}`)
            .join(', ')
        : undefined,
      '-webkit-text-stroke-width': item.text_shadow_color ? pxScaled(item.text_shadow_stroke_width ?? 0) : undefined,
      '-webkit-text-stroke-color': item.text_shadow_color || undefined,
    };
  }

  // ── Render a single overlay item ──────────────────────────────────────────
  _renderItem(item, index) {
    if (item.show === false) return html``;
    if ('template' in item) {
      const key    = `item-${index}`;
      const value  = this._itemValues[key] ?? '';
      const hasTap = item.tap_action && item.tap_action.action !== 'none';
      return html`
        <span
          class="overlay-template-item${hasTap ? ' clickable' : ''}"
          style=${styleMap(this._itemStyleMap(item))}
          @click=${hasTap ? () => this._handleAction(item) : undefined}
        >${value}</span>
      `;
    }

    if ('entity' in item) {
      const stateObj  = this._hass?.states?.[item.entity];
      if (!stateObj) {
        return html`
          <span class="overlay-entity-missing" title="Entity not found: ${item.entity}">!</span>
        `;
      }
      const itemConfig = { ...item, entity: item.entity };
      const stateLabel = item.show_state
        ? (item.attribute
            ? `${item.prefix ?? ''}${stateObj.attributes?.[item.attribute] ?? ''}${item.suffix ?? ''}`
            : (this._hass?.formatEntityState
                ? this._hass.formatEntityState(stateObj)
                : stateObj.state))
        : '';

      return html`
        <div
          class="overlay-entity-item"
          style=${styleMap(this._itemStyleMap(item))}
          title="${stateObj.attributes.friendly_name ?? item.entity}: ${stateObj.state}"
          @click=${(e) => { e.stopPropagation(); this._handleAction(itemConfig); }}
        >
          <ha-state-icon
            .hass=${this._hass}
            .stateObj=${stateObj}
            .icon=${item.icon || undefined}
          ></ha-state-icon>
          ${item.show_state ? html`<span class="entity-state-label">${stateLabel}</span>` : ''}
        </div>
      `;
    }

    return html``;
  }

  // ── Render a zone's items, filtered by vertical/horizontal AND zone mode ───
  _renderZoneItems(vertical, horizontal, indexOf) {
    const allItems = this._config?.items ?? [];
    const items    = allItems.filter(item =>
      (item.horizontal ?? 'center') === horizontal &&
      (item.vertical   ?? 'middle') === vertical
    );
    if (items.length === 0) return html``;
    return html`
      <div class="overlay-zone overlay-zone-${vertical}-${horizontal}">
        ${items.map(item => this._renderItem(item, indexOf.get(item)))}
      </div>
    `;
  }

  // ── Render the full 9-zone grid for a given set of zone keys (those whose
  //    mode matches the requested mode: 'static' or 'dynamic') ───────────────
  _renderZoneGrid(mode, indexOf) {
    const zoneModes = this._config?.zone_modes ?? DEFAULT_ZONE_MODES;
    const rows = ['top', 'middle', 'bottom'].map(vertical => {
      const cells = ['left', 'center', 'right'].map(horizontal => {
        const zoneKey = `${vertical}-${horizontal}`;
        if ((zoneModes[zoneKey] ?? 'static') !== mode) return html`<div class="overlay-cell"></div>`;
        return html`<div class="overlay-cell">${this._renderZoneItems(vertical, horizontal, indexOf)}</div>`;
      });
      return html`<div class="overlay-row">${cells}</div>`;
    });
    return html`<div class="overlay-grid overlay-grid-${mode}">${rows}</div>`;
  }

  // ── Image load error handler for a slide ──────────────────────────────────
  _onImageError(photo) {
    this._loadError = photo?.fileName ?? 'unknown file';
    this.requestUpdate();
  }

  // ── Render one of the two persistent slide units: image + dynamic-zone
  //    overlays, the part that participates in the photo transition. `role`
  //    is always 'front' (visible, top) or 'back' (hidden behind, pre-warmed
  //    with the next photo) — both units always exist in the DOM, never
  //    created/destroyed per transition, so nothing is ever animating a
  //    freshly-inserted, unpainted element. The actual animation is driven by
  //    _runTransitionAnimations() via the Web Animations API — see updated().
  _renderSlideUnit(photo, indexOf, fitMode, role) {
    if (!photo) return html``;
    const imgStyles = { 'object-fit': fitMode, 'background-color': this._config?.letterbox_color || undefined };
    return html`
      <div class="slide-unit" data-role="${role ?? ''}">
        <img
          class="slide-image"
          src="${photo.fileURL}"
          style=${styleMap(imgStyles)}
          @error=${() => this._onImageError(photo)}
        >
        ${this._renderZoneGrid('dynamic', indexOf)}
      </div>
    `;
  }

  // ── Drive enter/exit animation via the Web Animations API ──────────────────
  // Called from updated() exactly once per transition start (guarded by
  // _animationStartedFor so a re-render mid-transition does not restart it).
  // Using .animate() rather than toggling CSS classes avoids needing a forced
  // reflow between an initial state and a transitioned state — the keyframes
  // are explicit, so there is nothing to race.
  _runTransitionAnimations() {
    if (!this._transitioning) return;
    const stack = this.shadowRoot?.querySelector('.slide-stack');
    if (!stack) return;
    const exitingEl  = stack.querySelector('.slide-unit[data-role="back"]');
    const enteringEl = stack.querySelector('.slide-unit[data-role="front"]');
    if (!exitingEl || !enteringEl) return;
    if (this._animationStartedFor === this._transitionId) return;
    this._animationStartedFor = this._transitionId;

    // Both slide-units persist across every transition now (never recreated),
    // so a previous cycle's finished, fill:'forwards' animation — and, for
    // the clock transition, its directly-set maskImage — could still be
    // lingering on them. Clear both before starting a clean one.
    exitingEl.getAnimations().forEach(a => a.cancel());
    enteringEl.getAnimations().forEach(a => a.cancel());
    exitingEl.style.maskImage = exitingEl.style.webkitMaskImage = '';
    enteringEl.style.maskImage = enteringEl.style.webkitMaskImage = '';

    const transitionName = this._config?.transition ?? 'fade';
    const durationMs       = Math.max(0, (this._config?.transition_duration ?? 0.6)) * 1000;
    const easing           = 'ease';

    if (transitionName === 'fade') {
      exitingEl.animate(  [{ opacity: 1 }, { opacity: 0 }], { duration: durationMs, easing, fill: 'forwards' });
      enteringEl.animate( [{ opacity: 0 }, { opacity: 1 }], { duration: durationMs, easing, fill: 'forwards' });
    } else if (transitionName.startsWith('slide-')) {
      const exitTo   = TRANSITION_EXIT_TRANSFORM[transitionName]       ?? 'translateX(-100%)';
      const enterFrom = TRANSITION_ENTER_FROM_TRANSFORM[transitionName] ?? 'translateX(100%)';
      exitingEl.animate(  [{ transform: 'translate(0,0)' }, { transform: exitTo }],    { duration: durationMs, easing, fill: 'forwards' });
      enteringEl.animate( [{ transform: enterFrom },        { transform: 'translate(0,0)' }], { duration: durationMs, easing, fill: 'forwards' });
    } else if (transitionName === 'curtain') {
      exitingEl.animate(  [{ clipPath: 'inset(0 0 0 0)' },   { clipPath: 'inset(0 0 0 100%)' }], { duration: durationMs, easing, fill: 'forwards' });
      enteringEl.animate( [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],     { duration: durationMs, easing, fill: 'forwards' });
    } else if (transitionName === 'clock') {
      // Radial wipe via a conic-gradient mask sweeping 0→360deg. Entering unit
      // sweeps the reveal in; exiting unit is simply revealed-through (no
      // separate animation needed — it shows wherever the entering unit's
      // mask has not yet covered).
      enteringEl.style.maskImage    = 'conic-gradient(from 0deg, #000 0deg, transparent 0deg)';
      enteringEl.style.webkitMaskImage = enteringEl.style.maskImage;
      const steps = 60;
      const frames = Array.from({ length: steps + 1 }, (_, i) => {
        const deg = (360 * i) / steps;
        const grad = `conic-gradient(from 0deg, #000 ${deg}deg, transparent ${deg}deg)`;
        return { maskImage: grad, webkitMaskImage: grad };
      });
      enteringEl.animate(frames, { duration: durationMs, easing: 'linear', fill: 'forwards' });
    }
    // 'none' is handled in _advance() via _syncSlotsInstant() and never reaches here.
  }

  updated(changedProps) {
    super.updated(changedProps);
    if (this._transitioning) this._runTransitionAnimations();
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
    }
    ha-card {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 200px;
      aspect-ratio: var(--editor-preview-aspect-ratio, auto);
      overflow: hidden;
      box-sizing: border-box;
    }
    .slideshow-container {
      position: absolute;
      inset: 0;
      overflow: hidden;
      touch-action: pan-y;
    }

    /* ── Static overlay layer: outside the transitioning subtree ────────────── */
    .overlay-grid-static {
      position: absolute;
      inset: 0;
      z-index: 2;
      pointer-events: none;
    }

    /* ── Slide stack: holds the two persistent slide units (front + back) ──── */
    .slide-stack {
      position: absolute;
      inset: 0;
      z-index: 1;
      overflow: hidden;
    }
    .slide-unit {
      position: absolute;
      inset: 0;
      will-change: transform, opacity, clip-path;
    }
    .slide-unit[data-role="back"]  { z-index: 1; }
    .slide-unit[data-role="front"] { z-index: 2; }
    .slide-image {
      display: block;
      width: 100%;
      height: 100%;
      background-color: var(--card-background-color, #1c1c1c);
    }

    /* ── Dynamic overlay layer: inside each slide unit, rides with it ───────── */
    .overlay-grid-dynamic {
      position: absolute;
      inset: 0;
      z-index: 2;
      pointer-events: none;
    }

    /* ── 9-zone grid layout shared by static and dynamic layers ─────────────── */
    .overlay-grid {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }
    .overlay-row {
      display: flex;
      flex-direction: row;
      flex: 1;
    }
    .overlay-cell {
      flex: 1;
      display: flex;
      min-width: 0;
      min-height: 0;
    }
    .overlay-row:nth-child(1) .overlay-cell { align-items: flex-start; }
    .overlay-row:nth-child(2) .overlay-cell { align-items: center;    }
    .overlay-row:nth-child(3) .overlay-cell { align-items: flex-end;  }
    .overlay-cell:nth-child(1) { justify-content: flex-start; }
    .overlay-cell:nth-child(2) { justify-content: center;     }
    .overlay-cell:nth-child(3) { justify-content: flex-end;   }

    .overlay-zone {
      display: flex;
      flex-direction: column;
      gap: calc(4px * var(--scale-factor, 1));
      pointer-events: auto;
      padding: calc(8px * var(--scale-factor, 1));
    }
    .overlay-zone-top-left,    .overlay-zone-middle-left,   .overlay-zone-bottom-left   { align-items: flex-start; text-align: left;   }
    .overlay-zone-top-center, .overlay-zone-middle-center, .overlay-zone-bottom-center { align-items: center;     text-align: center; }
    .overlay-zone-top-right,  .overlay-zone-middle-right,  .overlay-zone-bottom-right  { align-items: flex-end;   text-align: right;  }

    .overlay-template-item {
      color: var(--ha-picture-card-text-color, white);
      white-space: pre-wrap;
      line-height: 1.4;
    }
    .overlay-template-item.clickable {
      cursor: pointer;
    }
    .overlay-entity-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      min-width: calc(40px * var(--scale-factor, 1));
    }
    .overlay-entity-item ha-state-icon {
      --mdc-icon-size: calc(24px * var(--scale-factor, 1));
    }
    .entity-state-label {
      display: block;
      font-size: calc(10px * var(--scale-factor, 1));
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--ha-picture-card-text-color, white);
      max-width: calc(96px * var(--scale-factor, 1));
    }
    .overlay-entity-missing {
      color: var(--error-color, #f44336);
      font-weight: bold;
      padding: 0 calc(4px * var(--scale-factor, 1));
    }

    /* ── Transitions ──────────────────────────────────────────────────────────
       Animated via the Web Animations API (element.animate()) in
       _runTransitionAnimations(), not via CSS classes — explicit keyframes
       avoid needing a forced reflow between an initial and transitioned
       state. These rules only establish the base stacking; no transition-
       specific classes are needed here. */

    /* ── Empty / error states ────────────────────────────────────────────────── */
    .message-overlay {
      position: absolute;
      inset: 0;
      z-index: 3;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: calc(24px * var(--scale-factor, 1));
      box-sizing: border-box;
      color: var(--secondary-text-color);
      background: var(--card-background-color, #1c1c1c);
    }
    .message-overlay .message-icon {
      --mdc-icon-size: calc(48px * var(--scale-factor, 1));
      display: block;
      margin: 0 auto calc(12px * var(--scale-factor, 1));
      color: var(--secondary-text-color);
    }
  `;

  render() {
    if (!this._config || !this._hass) return html``;

    const c        = this._config;
    const fitMode  = c.fit_mode ?? 'contain';

    // Build item→index map once; zone rendering uses it instead of rebuilding per zone.
    const itemIndex = new Map((c.items ?? []).map((it, i) => [it, i]));

    const entityId = c.entity;
    const stateObj = entityId ? this._hass?.states?.[entityId] : null;

    if (!stateObj) {
      return html`
        <ha-card>
          <div class="slideshow-container">
            <div class="message-overlay">
              <div>
                <ha-icon class="message-icon" icon="mdi:folder-alert-outline"></ha-icon>
                <div>Sensor not found: ${entityId || '(not configured)'}</div>
              </div>
            </div>
          </div>
        </ha-card>
      `;
    }

    if (this._files.length === 0) {
      return html`
        <ha-card>
          <div class="slideshow-container">
            <div class="message-overlay">
              <div>
                <ha-icon class="message-icon" icon="mdi:image-off-outline"></ha-icon>
                <div>No photos found</div>
              </div>
            </div>
          </div>
        </ha-card>
      `;
    }

    return html`
      <ha-card>
        <div
          class="slideshow-container"
          @touchstart=${(e) => this._onTouchStart(e)}
          @touchend=${(e) => this._onTouchEnd(e)}
        >
          ${this._renderZoneGrid('static', itemIndex)}

          <div class="slide-stack">
            ${this._renderSlideUnit(this._slotPhotoA, itemIndex, fitMode, this._frontSlotId === 'A' ? 'front' : 'back')}
            ${this._renderSlideUnit(this._slotPhotoB, itemIndex, fitMode, this._frontSlotId === 'B' ? 'front' : 'back')}
          </div>

          ${this._loadError ? html`
            <div class="message-overlay">
              <div>
                <ha-icon class="message-icon" icon="mdi:image-broken-variant"></ha-icon>
                <div>Failed to load: ${this._loadError}</div>
              </div>
            </div>
          ` : ''}
        </div>
      </ha-card>
    `;
  }
}
customElements.define('chrono-slideshow-card', ChronoSlideshowCard);

// ─── Card registration ────────────────────────────────────────────────────────
window.customCards = window.customCards || [];
window.customCards.push({
  type:        'chrono-slideshow-card',
  name:        'Chrono Slideshow Card',
  description: 'Slideshow of images from a chrono_folder sensor, with configurable overlays, transitions, and swipe navigation.',
  preview:     true,
});
