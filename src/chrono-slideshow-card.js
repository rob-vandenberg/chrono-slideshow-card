import { LitElement, html, css } from 'https://unpkg.com/lit@2.0.0/index.js?module';
import { live }                  from 'https://unpkg.com/lit@2.0.0/directives/live.js?module';
import { styleMap }              from 'https://unpkg.com/lit@2.0.0/directives/style-map.js?module';
import { unsafeHTML }            from 'https://unpkg.com/lit@2.0.0/directives/unsafe-html.js?module';
import { repeat }                from 'https://unpkg.com/lit@2.0.0/directives/repeat.js?module';
import jsyaml                   from 'https://cdn.jsdelivr.net/npm/js-yaml@4/+esm';

// ─── Version ──────────────────────────────────────────────────────────────────
const CARD_VERSION = '1.1.40';

// ─── MDI icon paths ───────────────────────────────────────────────────────────
const mdiDragHorizontalVariant = 'M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z';

// ─── Version History ──────────────────────────────────────────────────────────
// v1.1.40: Fix regression from 1.1.39: on the live dashboard (not the editor
//          preview), --scale-factor was permanently stuck/unset, rendering
//          every item and the pause indicator at roughly half size. Cause:
//          render() has three branches (sensor-not-found / no-photos / real
//          content), each producing a distinct <ha-card>; when the active
//          branch changes, Lit discards and recreates the whole subtree,
//          including a new <ha-card>. 1.1.39's firstUpdated() (which runs
//          exactly once, ever) could attach its ResizeObserver to whichever
//          branch happened to render first — if that was an early branch
//          (e.g. files still loading), the observer was left watching a
//          node Lit later discarded, never firing again. The editor preview
//          didn't show this because it typically renders the real-content
//          branch immediately. Confirmed via console: a fresh observer on
//          the live ha-card fired instantly with the correct height while
//          the original one never fired again. Fixed by extracting the
//          attach/observe logic into _attachResizeObserverIfNeeded(),
//          called from this class's existing updated() (which already runs
//          after every render for the transition-animation logic) instead
//          of firstUpdated() — re-attaching only when the ha-card node
//          itself has changed (tracked via _observedCardEl), a no-op on the
//          overwhelming majority of renders where it hasn't. Deliberately
//          NOT a second updated() method: this class already has one, and a
//          same-named duplicate would have silently replaced it rather than
//          merging with it — caught and corrected before shipping, not
//          after.
// v1.1.39: Fix: the editor-preview aspect-ratio was silently ignored because
//          ha-card's own hardcoded height:100% left aspect-ratio with no free
//          dimension to compute from (per CSS spec, aspect-ratio only fills a
//          dimension that is otherwise auto). Fixed by making height itself a
//          variable (--editor-preview-height), set to 'auto' inside the edit
//          dialog and '100%' otherwise, alongside the existing aspect-ratio
//          variable. Separately, --scale-factor was never set in the editor
//          preview either: the ResizeObserver was created in
//          connectedCallback() and observed the host element directly, but
//          super.connectedCallback() only schedules Lit's first render, it
//          does not run it synchronously — so on the dashboard the host's
//          own height happens to match ha-card's (masking the bug), but in
//          the editor dialog the host resolves to a real, distinct zero
//          height while ha-card gets a real height from its own aspect-ratio
//          rule. Fixed by moving the ResizeObserver's creation and .observe()
//          call out of connectedCallback() entirely and into firstUpdated()
//          — a Lit lifecycle method guaranteed to run only after the first
//          render has patched the shadow DOM, observing ha-card directly
//          instead of the host. Both fixes originally found and verified on
//          chrono-tile-card (v1.0.2/v1.0.3/v1.0.6), applied here unchanged.
// v1.1.38: All root-level card config keys now available as template variables
//          alongside photo/exif fields. Snake_case keys are converted to
//          camelCase with a 'card' prefix: e.g. fit_mode -> {{ cardFitMode }},
//          dimmer_max_opacity -> {{ cardDimmerMaxOpacity }}. One computed
//          variable added: {{ cardDimmerOpacity }} (0-100, 1 decimal) shows
//          the current live dimmer opacity. Arrays (zone_modes, zone_alignment,
//          items) are excluded. Photo fields take precedence on any collision.
// v1.1.37: dimmer_aggressiveness moved from YAML-only to UI slider (1-100%,
//          default 50%). Stored as a percentage, converted logarithmically
//          internally via 10^((pct-50)/50) giving range 0.1-10 where 50% = 1
//          (pure human-eye perceptual curve). Below 50% = gentler/flatter,
//          above 50% = more aggressive. Slider shows live percentage value.
// v1.1.36: New ambient dimmer feature: a full-coverage overlay whose opacity
//          is derived from a configurable lux sensor entity, compensating for
//          tablet brightness hardware limits. Opacity follows a Stevens
//          power-law perceptual curve (exponent 0.33 × dimmer_aggressiveness,
//          matching how the human eye perceives brightness) mapping a
//          configurable lux range to a configurable opacity range. All opacity
//          values use the percentage-number convention (0-100). UI fields:
//          dimmer_enabled (toggle), dimmer_entity (HA entity picker),
//          dimmer_lux_min/max, dimmer_min/max_opacity. YAML-only:
//          dimmer_color (default #000000), dimmer_aggressiveness (default 1).
//          Overlay sits above all content including text overlays and the
//          pause indicator (z-index 5). pointer-events: none throughout.
// v1.0.35: New fit_mode 'intelligent' setting zoomCenter — configurable
//          vertical crop anchor (default 33, was a fixed 50/centered) so a
//          subject in the upper portion of a photo (most portraits, pets)
//          stays better framed after zoom-driven cropping; horizontal stays
//          centered always, no horizontal counterpart by design. Also:
//          maxZoom/maxStretch/maxGap are now written in YAML as plain
//          percentage numbers (e.g. 40 = 40%) instead of raw 0-1 fractions,
//          converted to a fraction only at the one call site that consumes
//          them — the user-facing value should never be shaped to suit the
//          implementation. New defaults: maxZoom 40 (was 0.12), maxStretch
//          20 (was 0.08), maxGap unchanged at 0. Fix: the maxZoom/maxStretch/
//          maxGap fallback values were hardcoded literals duplicating
//          DEFAULT_CONFIG instead of referencing it — the two could have
//          silently drifted apart; now there is exactly one source of truth.
// v1.0.34: Fix (treat as a test, not assumed-complete): after several manual
//          swipes (especially with fade), a photo could appear to repeat
//          later, at the next real transition. Debug logging (1.0.33.1)
//          confirmed _currentIndex/_frontSlotId/both slots' photo
//          assignments are correct at every single traced step — this is
//          not a data bug. User pointed out the actual likely cause:
//          before 1.0.32, swipes never promoted a slot that had ever been
//          really animated; now they do, via _promoteBackSlotInstant(). A
//          slot last animated as "exiting" (e.g. faded to opacity 0,
//          fill:'forwards', never cancelled since nothing animated it
//          again) can be promoted straight to front by an instant cut and
//          stay invisible — logically front, but stuck on stale animation
//          state — until the next real animated transition's own existing
//          cleanup (1.0.21) finally cancels it, by which point the data has
//          already moved on, looking exactly like an old photo reappearing.
//          New _clearStaleAnimationState(): the same cancel-and-reset
//          cleanup _runTransitionAnimations() already does for its own
//          elements, now also called from _promoteBackSlotInstant() AND
//          _syncSlotsInstant() — covers forward swipes, transition:'none',
//          backward swipes, and initial load uniformly, rather than only
//          the specific path that exposed the bug. Built from 1.0.33, not
//          the 1.0.33.1 debug build — the temporary console logging does
//          not carry forward into this version.
// v1.0.33: Fix: computeIntelligentFit() could fall back to plain contain
//          even with an ample zoom/stretch budget (e.g. maxZoom=maxStretch=
//          1, a combined budget of 4x against a gap that only needed
//          1.5x) — confirmed against a real user config and real photo/box
//          dimensions before concluding anything, not just synthetic test
//          cases. Cause: rounding intermediate values (balanced,
//          zoomFactor, stretchFactor) to 3 decimal places before
//          recombining them — rounding a value near 1.2 to the nearest
//          0.001 and squaring it back together shifts the result by an
//          amount comparable to that same 0.001 threshold, producing a fake
//          leftover gap of exactly 0.001 that fails a strict maxGap of 0.
//          That's a fundamentally different problem than native floating-
//          point imprecision (which the original 0.1%-rounding design was
//          actually meant to guard against) — native imprecision is ~15
//          orders of magnitude smaller than 0.001 and was never the real
//          risk. Fixed by keeping all arithmetic at full native precision
//          and rounding only at the two actual decision points (the G<=1
//          check, and the final residual-gap-vs-maxGap check) rather than
//          at every intermediate step. Re-verified against all four
//          original synthetic test cases (0.0.30) to confirm nothing that
//          was already correct changed.
// v1.0.32: Fix: with transition:'none' (and forward manual swipes),
//          fit_mode 'intelligent' visibly flashed the fallback size before
//          snapping to its computed size, on every single advance — ruled
//          out the transition-animation path entirely by testing with
//          transition:'none' specifically, which pointed straight at the
//          real cause. _syncSlotsInstant() (used by 'none' and manual nav)
//          never flips _frontSlotId — it always overwrites whichever slot
//          is currently "front" with the new current photo directly,
//          completely bypassing the pre-warmed back slot that had already
//          finished loading (and, for 'intelligent', already computed) over
//          the entire previous display_time. This bug already existed
//          before 1.0.30 — the existing doc comment on _manualNavigate even
//          already claimed "forward swipes still benefit from the
//          pre-warmed back slot," but the code never actually did that —
//          it just wasn't very noticeable until 'intelligent' made the gap
//          between the fallback rendering and the final one large enough to
//          see. New _promoteBackSlotInstant(): flips _frontSlotId to
//          actually use the slot that's been sitting prepared, instead of
//          overwriting a visible one with a fresh, not-yet-loaded photo at
//          the exact moment it's shown. Used for transition:'none' (always
//          forward, always has a pre-warmed slot) and forward manual swipes.
//          Backward swipes keep using _syncSlotsInstant() unchanged — no
//          pre-warmed "prev" slot exists to promote, by design — as does
//          the one-time initial-load call in _loadFiles(), where no
//          pre-warmed slot exists yet at all.
// v1.0.31: Fix regression from 1.0.30: the original next-photo-bleeds-through
//          -the-gap bug (0.0.17) was back. Cause: that original fix relied on
//          the <img> always filling its entire container (width:100%;
//          height:100%), with any letterboxing happening inside that same
//          element's own box, covered by its background-color. fit_mode
//          'intelligent' breaks that assumption whenever its result is
//          equivalent to plain contain (the no-op or fallback case) — it
//          gives the <img> an explicit, smaller pixel size instead, so the
//          gap appears outside the <img>'s own box, in the surrounding
//          .slide-unit, which had no background of its own — fully
//          transparent, exposing the back slot's photo underneath. Fixed by
//          giving .slide-unit itself the same letterbox_color (inline, plus
//          the same theme-aware static-CSS fallback .slide-image already
//          has) — invisible whenever the <img> already fully covers
//          .slide-unit (every other case), only actually matters for the
//          shrink-and-center case that exposed it.
// v1.0.30: New fit_mode: 'intelligent' — a bounded blend of zoom and
//          non-uniform stretch that reduces or eliminates the letterbox gap
//          plain 'contain' leaves, falling back to plain contain when the
//          configured budget can't close the gap acceptably (e.g. a
//          portrait photo in a landscape box). Three new YAML-only config
//          keys (no dedicated UI fields, same convention as
//          letterbox_color): maxZoom (default 0.12), maxStretch (default
//          0.08), maxGap (default 0, the largest tolerable leftover gap
//          fraction before falling back). computeIntelligentFit() is the
//          core algorithm — minimum-distortion reasoning: for a fixed
//          required-growth target G, the sum of zoom+stretch (a proxy for
//          total visual distortion) is minimized when the two are equal
//          (sqrt(G) each), used whenever that fits under maxStretch (the
//          tighter cap); otherwise stretch is capped at its max and zoom
//          picks up exactly the remaining slack, not maxed out
//          unconditionally. All comparisons round to the nearest 0.1% (3
//          decimal places as a fraction) first, avoiding floating-point
//          noise on exact-equality checks like maxGap's default of 0.
//          Verified against hand-calculated expected values for four cases
//          (exact match, balanced-split-achievable, both-caps-insufficient,
//          and extreme-mismatch fallback) before trusting it.
//          The computation runs once, from the image's own @load event
//          (_onSlideImageLoad), not at transition time — per the existing
//          persistent front/back slot architecture, the slot is normally
//          still hidden with the entire display_time window ahead of it
//          when this fires, so by the time it's promoted to front there is
//          no calculation left to do. Result is stored per slot
//          (_slotIntelligentSizeA/B, new reactive state) since role swaps
//          every transition but slot identity doesn't. Implementation note:
//          this can't be done as transform + object-fit:cover on the same
//          element — object-fit's crop calculation uses the element's own
//          layout-box size, computed before any transform is applied, so a
//          transform never feeds into it. Instead, _renderSlideUnit() sets
//          the precomputed renderWidth/renderHeight as explicit pixel
//          dimensions (a real layout property), absolutely centered via
//          translate(-50%,-50%), with the existing overflow:hidden ancestor
//          clipping anything that doesn't fit — no new CSS containment
//          needed, reuses what's already there.
// v0.0.29: New: the "Sensor entity" field is now a combobox populated with
//          actual chrono_folder entities, instead of a free-text field.
//          chronoFolderEntities(hass) identifies them via hass.entities'
//          platform metadata (verified live in console before building this
//          — confirmed hass.entities exists and platform-filtering returns
//          exactly the expected sensor), not by guessing at attribute shape,
//          which would be unreliable. Field relabeled "Chrono-folder sensor"
//          to make the requirement explicit. getStubConfig now receives
//          hass (a real, documented part of the card API — confirmed
//          against HA's own frontend source) and defaults a brand-new
//          card's entity to the first chrono_folder sensor found, or the
//          literal string "Create a folder watcher first in chrono-folder"
//          if none exist yet. Considered and rejected reusing the existing
//          CsSelect combobox unfiltered against the full entity list
//          (10,000+ entities in a real install — unusable without
//          virtualization); scoping to chrono_folder's own entities first
//          sidesteps that entirely. Also: backlog item from 0.0.27 —
//          csToggleField's withSpacer param renamed to addSpacer (verb-based
//          name, agreed on at the time, deferred to bundle with other code
//          changes rather than spend a version on a rename alone).
// v0.0.28: DIAGNOSTIC, not a confirmed fix: .card-row's align-items changed
//          from end to center, to test whether the 0.0.27 height-matching
//          spacer actually equalized .text-field's and .toggle-field's
//          heights. If both are truly equal height now, this change should
//          be visually invisible (equal-height children align identically
//          under any align-items value) — if "Reverse order" moves, that
//          proves the heights are still mismatched and 0.0.27's fix isn't
//          working as intended. Harmless to the other two rows sharing
//          .card-row (Display time/Fit mode, Transition/duration), both
//          pairing two equal-height .text-fields already.
// v0.0.27: Fix: "Reverse order" wasn't aligning with the Sort by dropdown's
//          value row. Root cause: .toggle-field was a single horizontal
//          line (label+switch side by side), structurally shorter than
//          .text-field's label-row-then-control-row shape — no amount of
//          align-items on the shared .card-row could make a single-line
//          block's content land in the same vertical band as a two-line
//          block's second line. Fixed at the structural level, not with a
//          tuned offset: csToggleField() now optionally renders an
//          invisible spacer label above its real label+switch row,
//          guaranteed to match a real label's height because it shares the
//          exact same CSS rule (.text-field label, .toggle-field-spacer —
//          one declaration, not duplicated values that could drift).
//          New optional 5th param withSpacer (default false) — Reverse
//          order passes true (it must align with Sort by); the standalone
//          Show state toggle (alone in its own row, nothing to align
//          against) keeps the default and is visually unaffected.
// v0.0.26: Fix: 5fr (0.0.25) made the row-label column too wide once
//          actually seen rendered — user-tested directly in HA and verified
//          3fr looks right. grid-template-columns: 3fr 4fr 4fr 4fr.
// v0.0.25: Cosmetic-only, more compact Zones configuration panel. Band name
//          (TOP/MIDDLE/BOTTOM) moved onto the same row as the Left/Center/
//          Right column headers, in the row-label column slot, instead of
//          its own separate line above — saves a row of vertical space per
//          band. The divider line moved from a border-bottom on the old
//          separate header element to a border-top on .zone-band itself, so
//          it stays in the same visual position despite the header row
//          merge. grid-template-columns changed from auto 1fr 1fr 1fr to
//          5fr 4fr 4fr 4fr — auto was sizing the row-label column tight
//          enough that "BOTTOM" (uppercase + letter-spacing renders wider
//          than its raw character count) didn't fit comfortably; a fixed
//          proportion guarantees room regardless of font-rendering
//          specifics.
// v0.0.24: Cosmetic-only redesign of the Zones configuration panel (no logic
//          changes — zone_modes/zone_alignment storage, defaults, and
//          backfill from 0.0.23 are untouched). The 9 independent zone-cells
//          (each repeating its own "Top · Left"-style header above two
//          stacked, separately-labeled dropdowns) are replaced with 3 bands
//          (top/middle/bottom), each a 4-column table: a row-label column
//          plus left/center/right, with one column-header row ("Left" /
//          "Center" / "Right") and two field rows ("Transition" /
//          "Alignment") sharing the same grid-template-columns — guarantees
//          every column lines up vertically across all three rows
//          regardless of field content width, rather than relying on manual
//          width-matching. csSelectField() now skips rendering its <label>
//          element when given an empty string, instead of leaving a blank
//          label line — needed since the column/row headers now carry that
//          meaning instead of a per-field label; harmless to every other
//          existing call site, none of which pass an empty label.
// v0.0.23: Two changes. (1) New per-zone setting: zone_alignment, decoupling
//          how multiple items stacked within a zone align relative to each
//          other from which screen position the zone itself occupies (e.g.
//          a zone can stay anchored bottom-left while its items are
//          internally center-aligned relative to one another). Defaults to
//          matching each zone's own column for full backward compatibility.
//          Backfilled by migrateConfig the same way zone_modes already is.
//          .overlay-zone's alignment CSS rules are now keyed by the
//          configured alignment value (3 selectors) instead of by screen
//          position (9 selectors) — a real simplification, not just a
//          rename. "Zone transition behavior" panel renamed "Zones
//          configuration" (matches "Card configuration"/"Items
//          configuration") and gained a second Alignment dropdown per zone
//          alongside the existing mode dropdown. (2) letterbox_color is now
//          YAML-only, no dedicated UI field (removing the single-field row
//          it lived in) — same convention as text_shadow_layers — and
//          defaults to '#000000' instead of '' (which fell back to the
//          theme's own --card-background-color). Deliberate design
//          decision, not scope creep: dedicated UI fields are for settings
//          most people configuring the card will want to touch; rare
//          tweaks belong in YAML, keeping the UI from sprawling as more
//          features accumulate.
// v0.0.22: Fix: mouse-driven swipes didn't work (touch was less affected by
//          sheer geometry, not because it was actually safe). Two
//          independent causes, both fixed: (1) the "stop sign" cursor during
//          a drag confirmed the browser's native HTML5 image drag-and-drop
//          was hijacking the gesture — <img> is draggable by default; added
//          draggable="false" to .slide-image. (2) Without
//          setPointerCapture(), a drag whose cursor strays outside
//          .slideshow-container's bounds (easy with a mouse) stops
//          delivering pointermove/pointerup to it entirely — added
//          el.setPointerCapture(e.pointerId) in _onPointerDown, releasing
//          automatically on pointerup/pointercancel per spec, no extra
//          cleanup needed.
// v0.0.21: Fix: occasionally, after a transition, neither slide-unit painted
//          anything — confirmed via console (getComputedStyle showed the
//          front unit stuck at opacity:0 plus a stale translateY from a
//          completely different transition type, and a magenta
//          letterbox_color test confirmed the native ha-card background was
//          showing through both units, not either one's own background —
//          i.e. leftover effects from earlier cycles, not a broken image
//          source). Root cause not fully pinned down (.cancel() should have
//          cleared old animations but evidently didn't always), so rather
//          than continue chasing that, every transition's keyframes now
//          explicitly pin all of opacity/transform/clipPath/maskImage on
//          every frame — not just the one property that transition actually
//          cares about. Per the Web Animations API's composite order, a
//          newly-started animation explicitly setting a property takes
//          priority over any older still-active one for that property
//          regardless of whether it was cancelled — so every cycle now
//          fully self-clears all visual state on its own, independent of
//          whether the .cancel() calls (kept as a first line of defense)
//          caught everything. Clock's exiting unit now also gets an
//          explicit (no-op shape, all-neutral) animation for the same
//          reason, instead of relying solely on cancellation.
// v0.0.20: Fix regression from 0.0.19: any swipe (horizontal or vertical)
//          slower than HOLD_MS (500ms) was silently suppressed, because the
//          hold timer ran on pure elapsed time with no awareness of
//          movement, fired first, set _holdFired, and the swipe branches in
//          _onPointerUp explicitly skip when hold already fired. Added
//          _onPointerMove, bound alongside the existing pointer handlers,
//          which cancels the hold timer (without marking hold as fired) as
//          soon as movement crosses SWIPE_THRESHOLD — a swipe of any speed
//          now resolves correctly on release; only a genuinely stationary
//          press still becomes a hold.
// v0.0.19: New card-body gesture system, replacing touch-only swipe detection
//          with unified Pointer Events (mouse, touch, pen — avoids double-
//          firing on touch devices that also synthesize mouse events).
//          - Tap: hardcoded pause/resume toggle (_togglePause), NOT part of
//            the generic action system — tap_action is deliberately no
//            longer read at the card level (still works for per-item
//            tap_action, unrelated, unchanged). Shows/hides a pause
//            indicator (circle, 2px border, mdi:pause icon, centered
//            horizontally, 3/4 down vertically) sized via --scale-factor
//            like everything else.
//          - Hold, double-tap, swipe-up, swipe-down: fully generic and user-
//            configurable via hold_action/double_tap_action/
//            swipe_up_action/swipe_down_action, dispatched through the
//            existing handleAction() (extended with swipe_up/swipe_down
//            branches) — no card-specific behavior, same as before.
//          - Horizontal swipe (left/right) still does next/prev navigation,
//            unchanged.
//          - .slideshow-container's touch-action changed from pan-y to none
//            — vertical gestures are now captured for swipe_up/down instead
//            of being passed through to page scroll (explicitly accepted
//            trade-off).
//          - _startTimer() now no-ops while paused, so _restartTimer() calls
//            from manual navigation don't inadvertently resume autoplay.
// v0.0.18: New transition option: Random — picks one real transition (from
//          fade/slide-left/right/up/down/curtain/clock, deliberately
//          excluding none and random itself) once per advance via the new
//          pickRandomTransition(). Stored in _resolvedTransitionName so
//          _runTransitionAnimations() uses the exact same pick rather than
//          independently re-rolling and risking a mismatched animation.
//          Dropdown reordered: None first, Random last, real transitions in
//          between (previously None was last). Also removed a stale leftover
//          doc comment on _advance() describing the pre-0.0.16 model.
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

// Internal alignment of items stacked within a zone, independent from which
// screen position (column) the zone itself occupies. Defaults to matching
// the zone's own column — left zones default to left, etc. — so any config
// not using this override behaves exactly as before. Letting alignment be
// overridden per-zone (rather than per-item) matches the underlying CSS
// mechanism: align-items is a property of the flex container (the zone),
// not of an individual child — one zone, one internal alignment, shared by
// everything stacked inside it.
const DEFAULT_ZONE_ALIGNMENT = {
  'top-left':      'left',
  'top-center':    'center',
  'top-right':     'right',
  'middle-left':   'left',
  'middle-center': 'center',
  'middle-right':  'right',
  'bottom-left':   'left',
  'bottom-center': 'center',
  'bottom-right':  'right',
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

// Gesture recognition on the card body (distinct from per-item tap_action,
// which still goes through plain @click). HOLD_MS matches HA's own
// long-press convention; DOUBLE_TAP_MS is the window a second tap must land
// within to count as a double-tap instead of two separate single taps.
const HOLD_MS         = 500;
const DOUBLE_TAP_MS   = 250;
const SWIPE_THRESHOLD = 40; // px

const DEFAULT_CONFIG = {
  entity:                'sensor.',
  sort_by:               'filename',
  sort_reverse:          false,
  display_time:          8,
  transition:             'fade',
  transition_duration:    0.6,
  fit_mode:               'contain',
  letterbox_color:        '#000000', // YAML-only now, no dedicated UI field — edit manually to change
  // The four below are also YAML-only, no dedicated UI fields, only used
  // when fit_mode is 'intelligent'. maxZoom/maxStretch/maxGap/zoomCenter are
  // all written in YAML as plain percentage numbers (40 = 40%), never as
  // raw 0-1 fractions — converted to a fraction only at the point each is
  // actually consumed, never stored or compared as a fraction here. maxGap
  // is the largest acceptable leftover letterbox percentage after using the
  // full zoom+stretch budget (0 = none tolerated, fall back to plain
  // 'contain' rather than leave any visible bar). zoomCenter is the
  // vertical anchor point used when redistributing the crop a zoom creates
  // — 50 = centered (old behavior), lower values keep more of the photo's
  // top in frame at the cost of its bottom (e.g. 33 favors a subject in the
  // upper third, as portraits and pet photos usually have). Horizontal
  // stays centered always; this is a vertical-only bias.
  maxZoom:                40,
  maxStretch:             20,
  maxGap:                 0,
  zoomCenter:             33,
  // Dimmer: a full-coverage overlay whose opacity is derived from an ambient
  // lux sensor, compensating for tablet brightness limits. dimmer_color is
  // YAML-only. All opacity values are plain percentage numbers (0–100).
  // dimmer_aggressiveness is stored as 1–100 (UI slider percentage), converted
  // internally via 10^((pct-50)/50) giving a 0.1–10 range where 50 = 1
  // (pure human-eye perceptual curve, cube-root baseline).
  dimmer_enabled:         false,
  dimmer_entity:          '',
  dimmer_lux_min:         0,
  dimmer_lux_max:         40,
  dimmer_min_opacity:     0,
  dimmer_max_opacity:     80,
  dimmer_color:           '#000000',
  dimmer_aggressiveness:  50,
  zone_modes:             { ...DEFAULT_ZONE_MODES },
  zone_alignment:         { ...DEFAULT_ZONE_ALIGNMENT },
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
  'transition', 'transition_duration', 'fit_mode', 'zone_modes', 'zone_alignment',
  'items',
  // tap is hardcoded to pause/resume now, not part of the generic action
  // system — tap_action is deliberately not in this list, it's never read.
  'hold_action', 'double_tap_action', 'swipe_up_action', 'swipe_down_action',
  // letterbox_color is deliberately not in this list — YAML-only, no
  // dedicated UI field, same convention as text_shadow_layers.
  // maxZoom/maxStretch/maxGap/zoomCenter are the same — YAML-only, no UI field.
  // dimmer_color is YAML-only; all other dimmer settings have UI fields.
  'dimmer_enabled', 'dimmer_entity', 'dimmer_lux_min', 'dimmer_lux_max',
  'dimmer_min_opacity', 'dimmer_max_opacity', 'dimmer_aggressiveness',
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
  { label: 'None',        value: 'none'        },
  { label: 'Fade',        value: 'fade'        },
  { label: 'Slide left',  value: 'slide-left'  },
  { label: 'Slide right', value: 'slide-right' },
  { label: 'Slide up',    value: 'slide-up'    },
  { label: 'Slide down',  value: 'slide-down'  },
  { label: 'Curtain',     value: 'curtain'     },
  { label: 'Clock',       value: 'clock'       },
  { label: 'Random',      value: 'random'      },
];

// Real transitions 'random' picks from — deliberately excludes 'none' and
// 'random' itself, since picking "Random" is specifically asking for an
// actual transition every time, not occasionally getting none.
const RANDOM_TRANSITION_POOL = ['fade', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'curtain', 'clock'];

function pickRandomTransition() {
  return RANDOM_TRANSITION_POOL[Math.floor(Math.random() * RANDOM_TRANSITION_POOL.length)];
}

const FIT_MODE_OPTIONS = [
  { label: 'Cover',       value: 'cover'       },
  { label: 'Contain',     value: 'contain'     },
  { label: 'Fill',        value: 'fill'        },
  { label: 'Intelligent', value: 'intelligent' },
];

const ZONE_MODE_OPTIONS = [
  { label: 'Static',  value: 'static'  },
  { label: 'Dynamic', value: 'dynamic' },
];

const ZONE_ALIGNMENT_OPTIONS = [
  { label: 'Left',   value: 'left'   },
  { label: 'Center', value: 'center' },
  { label: 'Right',  value: 'right'  },
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

// ─── chronoFolderEntities ───────────────────────────────────────────────────────
// Entities actually created by the chrono_folder integration, identified via
// hass.entities' platform metadata (not by guessing at attribute shape).
// Used both by the editor's sensor-entity combobox and by getStubConfig for a
// new card's default. Returns { value, label } pairs — value is the raw
// entity_id (what gets saved), label is the friendly name when available.
function chronoFolderEntities(hass) {
  return Object.entries(hass?.entities ?? {})
    .filter(([, entry]) => entry.platform === 'chrono_folder')
    .map(([id]) => ({
      value: id,
      label: hass?.states?.[id]?.attributes?.friendly_name ?? id,
    }));
}

// ─── computeIntelligentFit ──────────────────────────────────────────────────────
// fit_mode 'intelligent': a bounded blend of uniform zoom and non-uniform
// stretch to reduce or eliminate the letterbox gap plain 'contain' would
// leave, falling back to plain contain's own sizing when the configured
// budget isn't enough to close the gap acceptably — a portrait photo in a
// landscape box has no good answer other than contain, and this falls back
// to exactly that rather than forcing a result that looks wrong.
//
// maxZoom/maxStretch/maxGap are this function's own parameters and stay
// fractions here (0.12 = 12%), unchanged by the YAML-facing convention —
// in YAML these are written as plain percentage numbers (e.g. 40 = 40%)
// and converted to a fraction once, only at the call site in
// _onSlideImageLoad(), never inside this function.
//
// Minimum-distortion reasoning: closing the full gap requires
// zoomFactor × stretchFactor = G, where G (≥1) is the photo/box aspect-ratio
// mismatch. For a fixed product, the sum (a proxy for total distortion) is
// minimized when the two factors are equal — zoomFactor = stretchFactor =
// sqrt(G) — so that's used whenever it fits under maxStretch (the tighter of
// the two caps). When it doesn't, stretch is capped at its max and zoom
// picks up exactly the remaining slack — the smallest zoom that still helps,
// not "max out zoom too."
//
// All arithmetic stays at full native precision throughout — only the two
// actual decision points (the G<=1 check, and the final residual-gap-vs-
// maxGap check) round to the nearest 0.1% (3 decimal places as a fraction)
// before comparing. Rounding intermediate values (balanced/zoomFactor/
// stretchFactor) before recombining them was tried first and was a real
// bug, not a safety measure: rounding a value near 1.2 to the nearest 0.001
// and then squaring it shifts the result by an amount comparable to that
// same 0.001 threshold, which can fail an otherwise-achievable maxGap of 0
// even with an ample zoom/stretch budget. Native floating-point imprecision
// itself is roughly 15 orders of magnitude smaller than 0.001 and is fully
// absorbed by rounding once, at the very end — it was never the actual risk.
//
// Returns the photo's target rendered size in pixels only — not position.
// The caller positions it absolutely using the configurable zoomCenter
// vertical anchor (50 = centered; see DEFAULT_CONFIG), and relies on the
// existing overflow:hidden ancestor to clip anything that doesn't fit,
// exactly like a zoomed plain 'cover' would.
function computeIntelligentFit(naturalWidth, naturalHeight, boxWidth, boxHeight, maxZoom, maxStretch, maxGap) {
  const round3 = v => Math.round(v * 1000) / 1000;
  const fallbackToContain = () => {
    const s = Math.min(boxWidth / naturalWidth, boxHeight / naturalHeight);
    return { renderWidth: naturalWidth * s, renderHeight: naturalHeight * s };
  };

  if (!naturalWidth || !naturalHeight || !boxWidth || !boxHeight) return fallbackToContain();

  const Rp = naturalWidth / naturalHeight;
  const Rb = boxWidth / boxHeight;
  // Full native precision from here on — only round() at the two actual
  // decision points below (the <=1 check and the final residual-gap check).
  // Rounding intermediate values like balanced/zoomFactor/stretchFactor
  // before recombining them creates real error sized to collide with the
  // 0.001 threshold itself (rounding then squaring a value near 1.2 can
  // shift the result by ~0.001) — a fundamentally different, much larger
  // problem than native floating-point imprecision, which is ~15 orders of
  // magnitude smaller than 0.001 and gets fully absorbed by rounding only
  // once, at the end.
  const G = Math.max(Rb / Rp, Rp / Rb);
  if (round3(G) <= 1) return fallbackToContain(); // ratios already match, nothing to do

  const zoomCap    = 1 + (maxZoom ?? 0);
  const stretchCap = 1 + (maxStretch ?? 0);
  const gapTolerance = maxGap ?? 0;

  let zoomFactor, stretchFactor;
  const balanced = Math.sqrt(G);
  if (balanced <= stretchCap) {
    // True minimum-distortion split fits under both caps — use it.
    zoomFactor    = balanced;
    stretchFactor = balanced;
  } else {
    // Stretch is the tighter, binding cap — max it out, let zoom pick up
    // exactly the remaining slack.
    stretchFactor = stretchCap;
    zoomFactor    = Math.min(G / stretchFactor, zoomCap);
  }

  const achieved            = zoomFactor * stretchFactor;
  const residualGapFraction = round3(Math.max(0, 1 - achieved / G));
  if (residualGapFraction > gapTolerance) return fallbackToContain();

  const baseScale = Math.min(boxWidth / naturalWidth, boxHeight / naturalHeight);
  let renderWidth  = naturalWidth  * baseScale * zoomFactor;
  let renderHeight = naturalHeight * baseScale * zoomFactor;
  if (Rp < Rb) {
    renderWidth *= stretchFactor;  // width was the short axis under contain
  } else if (Rp > Rb) {
    renderHeight *= stretchFactor; // height was the short axis under contain
  }
  return { renderWidth, renderHeight };
}

// ─── migrateConfig ────────────────────────────────────────────────────────────
// Backfill a stable _id on any item missing one, and backfill zone_modes /
// zone_alignment with any zone keys missing from an older config.
// Returns the (possibly new) config and whether anything changed.
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

  const zoneAlignment = config.zone_alignment ?? {};
  const missingAlignmentKey = Object.keys(DEFAULT_ZONE_ALIGNMENT).some(k => !(k in zoneAlignment));
  if (missingAlignmentKey) {
    config   = { ...config, zone_alignment: { ...DEFAULT_ZONE_ALIGNMENT, ...zoneAlignment } };
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
  } else if (action === 'swipe_up' && config.swipe_up_action) {
    actionConfig = config.swipe_up_action;
  } else if (action === 'swipe_down' && config.swipe_down_action) {
    actionConfig = config.swipe_down_action;
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

function csToggleField(label, checked, onChange, extraClass = '', addSpacer = false) {
  return html`
    <div class="toggle-field ${extraClass}">
      ${addSpacer ? html`<label class="toggle-field-spacer" aria-hidden="true">&nbsp;</label>` : ''}
      <div class="toggle-field-row">
        <label>${unsafeHTML(label)}</label>
        <ha-switch .checked=${checked} @change=${onChange}></ha-switch>
      </div>
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
      ${label ? html`<label>${unsafeHTML(label)}</label>` : ''}
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

  // ── Zone internal alignment (left/center/right) changed ──────────────────
  _zoneAlignmentChanged(zoneKey, e) {
    if (!this._config) return;
    this._clearUndo();
    const value          = e.target.value ?? e.detail?.value;
    const zone_alignment = { ...(this._config.zone_alignment ?? DEFAULT_ZONE_ALIGNMENT), [zoneKey]: value };
    this._config          = { ...this._config, zone_alignment };
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
  _zoneAlignmentOptions = ZONE_ALIGNMENT_OPTIONS;

  // ─── Zone configuration panel (transition mode + internal alignment) ───────
  _renderZoneModesPanel() {
    const zoneModes     = this._config?.zone_modes     ?? DEFAULT_ZONE_MODES;
    const zoneAlignment = this._config?.zone_alignment ?? DEFAULT_ZONE_ALIGNMENT;
    const bands = ['top', 'middle', 'bottom'];
    return html`
      <ha-expansion-panel header="Zones configuration" outlined .expanded=${false}>
        <p class="zone-modes-hint">
          Static zones stay fixed on screen. Dynamic zones transition together
          with the photo. Alignment controls how multiple items stacked in the
          same zone align relative to each other — independent from which
          screen position the zone itself occupies. All overlay items placed
          in a zone share that zone's settings.
        </p>
        ${bands.map(band => {
          const cols = _GROUP_DEFS.filter(g => g.vertical === band); // left, center, right in order
          return html`
            <div class="zone-band">
              <div class="zone-band-grid">
                <div class="zone-band-name">${band}</div>
                ${cols.map(g => html`<div class="zone-band-colheader">${g.horizontal[0].toUpperCase()}${g.horizontal.slice(1)}</div>`)}

                <div class="zone-band-rowlabel">Transition</div>
                ${cols.map(g => {
                  const zoneKey = `${g.vertical}-${g.horizontal}`;
                  return csSelectField('', zoneModes[zoneKey] ?? 'static', this._zoneModeOptions, e => this._zoneModeChanged(zoneKey, e));
                })}

                <div class="zone-band-rowlabel">Alignment</div>
                ${cols.map(g => {
                  const zoneKey = `${g.vertical}-${g.horizontal}`;
                  return csSelectField('', zoneAlignment[zoneKey] ?? g.horizontal, this._zoneAlignmentOptions, e => this._zoneAlignmentChanged(zoneKey, e));
                })}
              </div>
            </div>
          `;
        })}
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
      align-items: center;
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

    .slider-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .slider-label {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .slider-field input[type="range"] {
      width: 100%;
      accent-color: var(--primary-color);
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

    .zone-band {
      border-top: 1px solid var(--divider-color, #444);
      padding-top: 10px;
      margin-bottom: 20px;
    }
    .zone-band:last-child {
      margin-bottom: 8px;
    }

    .zone-band-name {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--secondary-text-color);
    }

    /* Row-label column (3fr) carries the band name on the header row and
       "Transition"/"Alignment" on the field rows below; the three zone
       columns (4fr each) are equal width. Shared grid-template-columns
       across all three rows, so every column lines up vertically regardless
       of field content. Fixed proportion rather than equal/auto sizing
       because auto was sizing the row-label column too tight for "BOTTOM"
       (uppercase + letter-spacing renders wider than its raw character
       count). 5fr was tried first and visually confirmed too wide; 3fr is
       the value actually verified to look right. */
    .zone-band-grid {
      display: grid;
      grid-template-columns: 3fr 4fr 4fr 4fr;
      column-gap: 8px;
      row-gap: 6px;
      align-items: center;
    }

    .zone-band-rowlabel {
      font-size: 12px;
      color: var(--secondary-text-color);
      white-space: nowrap;
    }

    .zone-band-colheader {
      font-size: 12px;
      color: var(--secondary-text-color);
      text-align: center;
    }

    /* ── Text fields ───────────────────────────────────────────────────────── */

    .text-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .text-field label,
    .toggle-field-spacer {
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
      flex-direction: column;
      gap: 4px; /* must match .text-field's gap — this is what makes the
                   control row below start at the same Y as a paired
                   .text-field's control row */
    }

    .toggle-field-spacer {
      visibility: hidden;
    }

    .toggle-field-row {
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
          ${csSelectField('Chrono-folder sensor', c.entity ?? '', chronoFolderEntities(this.hass), e => this._valueChanged('entity', e))}
        </div>

        <!-- Sort by + reverse -->
        <div class="card-row">
          ${csSelectField('Sort by', c.sort_by ?? 'filename', this._sortByOptions, e => this._valueChanged('sort_by', e))}
          ${csToggleField('Reverse order', c.sort_reverse ?? false, e => this._toggleChanged('sort_reverse', e), '', true)}
        </div>

        <!-- Display time + fit mode -->
        <div class="card-row">
          ${csTextField('Display time (seconds)', c.display_time ?? 8, e => this._numericValueChanged('display_time', e), { type: 'number', step: '1', min: '1' })}
          ${csSelectField('Fit mode', c.fit_mode ?? 'contain', this._fitModeOptions, e => this._valueChanged('fit_mode', e))}
        </div>

        <!-- Transition + transition duration -->
        <div class="card-row">
          ${csSelectField('Transition', c.transition ?? 'fade', this._transitionOptions, e => this._valueChanged('transition', e))}
          ${csTextField('Transition duration (s)', c.transition_duration ?? 0.6, e => this._numericValueChanged('transition_duration', e), { type: 'number', step: '0.1', min: '0' })}
        </div>

        <!-- Dimmer -->
        <div class="card-row">
          ${csToggleField('Ambient dimmer', c.dimmer_enabled ?? false, e => this._toggleChanged('dimmer_enabled', e), '', true)}
        </div>
        ${c.dimmer_enabled ? html`
        <div class="card-row-1">
          <ha-entity-picker
            label="Ambient lux sensor"
            .hass=${this.hass}
            .value=${c.dimmer_entity ?? ''}
            allow-custom-entity
            @value-changed=${e => this._valueChanged('dimmer_entity', e)}
          ></ha-entity-picker>
        </div>
        <div class="card-row">
          ${csTextField('Lux min', c.dimmer_lux_min ?? 0, e => this._numericValueChanged('dimmer_lux_min', e), { type: 'number', step: '1', min: '0' })}
          ${csTextField('Lux max', c.dimmer_lux_max ?? 40, e => this._numericValueChanged('dimmer_lux_max', e), { type: 'number', step: '1', min: '0' })}
        </div>
        <div class="card-row">
          ${csTextField('Max opacity (%)', c.dimmer_max_opacity ?? 80, e => this._numericValueChanged('dimmer_max_opacity', e), { type: 'number', step: '1', min: '0', max: '100' })}
          ${csTextField('Min opacity (%)', c.dimmer_min_opacity ?? 0, e => this._numericValueChanged('dimmer_min_opacity', e), { type: 'number', step: '1', min: '0', max: '100' })}
        </div>
        <div class="card-row-1">
          <div class="slider-field">
            <label class="slider-label">Aggressiveness: ${c.dimmer_aggressiveness ?? DEFAULT_CONFIG.dimmer_aggressiveness}%</label>
            <input type="range" min="1" max="100" step="1"
              .value=${String(c.dimmer_aggressiveness ?? DEFAULT_CONFIG.dimmer_aggressiveness)}
              @change=${e => this._numericValueChanged('dimmer_aggressiveness', e)}
            />
          </div>
        </div>
        ` : ''}

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
    _paused:        { state: true },
    _frontSlotId:   { state: true },
    _slotPhotoA:    { state: true },
    _slotPhotoB:    { state: true },
    _slotIntelligentSizeA: { state: true },
    _slotIntelligentSizeB: { state: true },
  };

  static getCardSize() {
    return 5;
  }

  static getConfigElement() {
    return document.createElement('chrono-slideshow-card-editor');
  }

  static getStubConfig(hass) {
    const found = chronoFolderEntities(hass);
    return {
      ...DEFAULT_CONFIG,
      entity: found[0]?.value ?? 'Create a folder watcher first in chrono-folder',
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
    this._paused           = false;
    this._holdTimer        = null;
    this._holdFired        = false;
    this._lastTapTime      = 0;
    this._pendingTapTimer  = null;
    this._itemSubs         = new Map(); // key → { substituted, unsub }
    this._subscribed       = false;
    this._timer            = null;
    this._touchStartX      = null;
    this._touchStartY      = null;
    this._preloadedImages  = new Map(); // fileURL/filePath → Image object, cache for prev/current/next
    this._frontSlotId         = 'A';   // which persistent slot ('A' or 'B') is currently visible/front
    this._slotPhotoA          = null;  // photo currently bound to persistent slot A
    this._slotPhotoB          = null;  // photo currently bound to persistent slot B
    this._slotIntelligentSizeA = null; // precomputed {renderWidth, renderHeight} for fit_mode 'intelligent', slot A
    this._slotIntelligentSizeB = null; // same, slot B
    this._transitionTimeoutId   = null;
    this._animationStartedFor   = null;
    this._resolvedTransitionName = 'fade'; // settles a 'random' pick once per advance, shared with _runTransitionAnimations
    this._transitionId          = 0;
    this._resizeObserver      = null;
    this._observedCardEl      = null; // which ha-card node the observer currently watches — render() has three branches, each producing a distinct <ha-card>; Lit discards/recreates it when the branch changes, so the observer must re-attach whenever this differs from the current one
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
    this.style.setProperty(
      '--editor-preview-height',
      isInsideEditDialog(this) ? 'auto' : '100%'
    );
  }

  // Lit calls firstUpdated() exactly once, ever — insufficient here: render()
  // has three separate branches (sensor-not-found / no-photos / real content),
  // each a distinct template producing its own <ha-card> element. When the
  // active branch changes (e.g. files finish loading after an initial
  // no-photos render), Lit cannot reconcile the differently-shaped template
  // against the old DOM and discards/recreates the whole subtree, including
  // a brand-new <ha-card>. An observer attached once in firstUpdated() would
  // silently keep watching that now-detached node forever, leaving
  // --scale-factor stuck from whatever branch happened to render first —
  // confirmed via console: a fresh observer on the live ha-card fired
  // immediately with the correct height while the original one never fired
  // again. Called from the class's existing updated() (below), which already
  // runs after every render for the transition-animation logic — this class
  // has only one updated(), a second same-named method would silently
  // replace it, not merge with it, so this lives as its own helper instead of
  // a duplicate updated(). Comparing against _observedCardEl keeps this a
  // no-op on the (overwhelmingly common) renders where the branch didn't
  // change. connectedCallback() cannot be used for the first attachment
  // either: super.connectedCallback() only schedules the first render, it
  // does not run it synchronously, so ha-card is provably absent from the
  // shadow DOM at any point still inside connectedCallback(). Observing the
  // host element instead (the original, pre-v1.1.39 approach) is not
  // equivalent: on the dashboard the host's own height happens to match
  // ha-card's, masking the bug, but in the editor dialog the host resolves
  // to a real, distinct zero height while ha-card still gets a real height
  // from its own aspect-ratio rule — two different elements with two
  // different sizes, and the wrong one was being watched.
  _attachResizeObserverIfNeeded() {
    const cardEl = this.shadowRoot?.querySelector('ha-card');
    if (!cardEl || cardEl === this._observedCardEl) return;
    this._resizeObserver?.disconnect();
    this._observedCardEl = cardEl;
    this._resizeObserver = new ResizeObserver(entries => {
      const height = entries[0]?.contentRect?.height;
      if (!height) return;
      this.style.setProperty('--scale-factor', height / REFERENCE_HEIGHT_PX);
    });
    this._resizeObserver.observe(cardEl);
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

  // ── Cancels any lingering WAAPI animations on both persistent slide-units,
  //    and resets the clock transition's directly-set mask — the same
  //    cleanup _runTransitionAnimations() already does for its own elements
  //    at the start of every real animated transition. Needed here too: a
  //    slot last animated as "exiting" (e.g. faded to opacity 0,
  //    fill:'forwards', never cancelled because nothing animated it again
  //    since) can be promoted straight to "front" by an instant cut and
  //    stay invisible, stuck on that stale state, even though it's now
  //    logically front — exactly what an instant cut (no animation at all)
  //    must not allow to happen.
  _clearStaleAnimationState() {
    const stack = this.shadowRoot?.querySelector('.slide-stack');
    if (!stack) return;
    stack.querySelectorAll('.slide-unit').forEach(unit => {
      unit.getAnimations().forEach(a => a.cancel());
      unit.style.maskImage = unit.style.webkitMaskImage = '';
    });
  }

  // ── Make the front slot show the current photo and the back slot show the
  //    next photo, with no animation, by directly overwriting whichever slot
  //    is currently "front" — used only for initial load (no pre-warmed slot
  //    exists yet to promote) and as the cold-cut fallback for *backward*
  //    manual navigation (no pre-warmed slot exists for "prev" either, by
  //    design — only current+next are ever kept warm). Leaves _frontSlotId
  //    untouched. For any case where a pre-warmed slot genuinely exists to
  //    use, see _promoteBackSlotInstant() instead.
  _syncSlotsInstant() {
    this._clearStaleAnimationState();
    if (this._frontSlotId === 'A') {
      this._slotPhotoA = this._currentPhoto;
      this._slotPhotoB = this._nextPhoto;
    } else {
      this._slotPhotoB = this._currentPhoto;
      this._slotPhotoA = this._nextPhoto;
    }
  }

  // ── Promote the already pre-warmed back slot to front, instantly, no
  //    animation — used for transition:'none' and *forward* manual swipes,
  //    both of which have a real pre-warmed slot to use. Unlike
  //    _syncSlotsInstant(), this actually flips _frontSlotId to use the slot
  //    that's been sitting loaded (and, for fit_mode 'intelligent', already
  //    computed) for the entire previous display_time, instead of
  //    overwriting whichever slot is currently visible with a brand new,
  //    not-yet-loaded photo at the exact moment it needs to be shown.
  _promoteBackSlotInstant() {
    this._clearStaleAnimationState();
    this._frontSlotId = this._frontSlotId === 'A' ? 'B' : 'A';
    if (this._frontSlotId === 'A') {
      this._slotPhotoB = this._nextPhoto;
    } else {
      this._slotPhotoA = this._nextPhoto;
    }
  }

  // ── Timer: advance to next photo every display_time seconds ─────────────
  _startTimer() {
    if (this._timer || this._paused) return;
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

  // ── Advance to the next photo, autonomously (timer-driven only). Always
  //    forward. If a real transition is configured, swaps which persistent
  //    slot is "front" — both slide-units already exist and are already
  //    painted, so nothing is created fresh at the moment the animation
  //    starts. If transition is 'none', just syncs both slots with no
  //    animation. 'random' resolves to one real transition per advance,
  //    stored in _resolvedTransitionName so _runTransitionAnimations() uses
  //    that exact pick instead of re-rolling independently. ───────────────
  _advance() {
    if (this._files.length === 0 || this._transitioning) return;
    const n = this._files.length;
    const configured      = this._config?.transition ?? 'fade';
    const transitionName  = configured === 'random' ? pickRandomTransition() : configured;
    this._resolvedTransitionName = transitionName;

    this._currentIndex   = (this._currentIndex + 1) % n;
    this._loadError       = null;
    this._setupSubscriptions();
    this._preloadNeighbors();
    this._restartTimer();

    if (transitionName === 'none') {
      this._promoteBackSlotInstant();
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
  //    transitions are only for autonomous playback. Forward swipes
  //    genuinely promote the pre-warmed back slot; backward swipes are a
  //    cold cut since only current+next are kept in memory, never prev. ──
  _manualNavigate(direction) {
    if (this._files.length === 0 || this._transitioning) return;
    const n = this._files.length;

    this._currentIndex = ((this._currentIndex + direction) % n + n) % n;
    this._loadError      = null;
    this._setupSubscriptions();
    this._preloadNeighbors();
    this._restartTimer();
    if (direction > 0) {
      this._promoteBackSlotInstant();
    } else {
      this._syncSlotsInstant();
    }
    this.requestUpdate();
  }

  // ── Swipe handling (touch) ────────────────────────────────────────────────
  // ── Tap anywhere on the card body toggles pause/resume. Hardcoded, not
  //    part of the generic user-configurable action system — see the
  //    pointer handlers below for why tap was carved out specifically. ────
  _togglePause() {
    this._paused = !this._paused;
    if (this._paused) {
      this._stopTimer();
    } else {
      this._restartTimer();
    }
  }

  // ── Unified gesture recognition via Pointer Events (mouse, touch, and pen
  //    all fire the same events — avoids the double-firing risk of binding
  //    separate touch and mouse handlers, and is what makes tap/hold/double-
  //    tap support desktop dashboards, not just touchscreens). ────────────
  _onPointerDown(e) {
    if (this._transitioning) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    this._touchStartX = e.clientX;
    this._touchStartY = e.clientY;
    this._holdFired = false;
    if (this._holdTimer) clearTimeout(this._holdTimer);
    this._holdTimer = setTimeout(() => {
      this._holdFired = true;
      this._handleAction(this._config, 'hold');
    }, HOLD_MS);
  }

  _onPointerUp(e) {
    if (this._touchStartX === null) return;
    const dx = e.clientX - this._touchStartX;
    const dy = e.clientY - this._touchStartY;
    this._touchStartX = null;
    this._touchStartY = null;
    if (this._holdTimer) { clearTimeout(this._holdTimer); this._holdTimer = null; }

    const horizontalSwipe = Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) >= Math.abs(dy);
    const verticalSwipe   = Math.abs(dy) >= SWIPE_THRESHOLD && Math.abs(dy) >  Math.abs(dx);

    if (horizontalSwipe) {
      if (!this._holdFired) this._manualNavigate(dx < 0 ? 1 : -1); // swipe left → next, right → previous
      return;
    }
    if (verticalSwipe) {
      if (!this._holdFired) this._handleAction(this._config, dy < 0 ? 'swipe_up' : 'swipe_down');
      return;
    }
    if (this._holdFired) return; // hold already handled this press/release

    // Neither swipe nor hold — single tap, or the second tap of a double-tap.
    const now = Date.now();
    if (now - this._lastTapTime < DOUBLE_TAP_MS) {
      this._lastTapTime = 0;
      if (this._pendingTapTimer) { clearTimeout(this._pendingTapTimer); this._pendingTapTimer = null; }
      this._handleAction(this._config, 'double_tap');
      return;
    }
    this._lastTapTime = now;
    if (this._pendingTapTimer) clearTimeout(this._pendingTapTimer);
    this._pendingTapTimer = setTimeout(() => {
      this._pendingTapTimer = null;
      this._togglePause(); // tap is hardcoded to pause/resume, not user-configurable
    }, DOUBLE_TAP_MS);
  }

  _onPointerCancel() {
    this._touchStartX = null;
    this._touchStartY = null;
    if (this._holdTimer) { clearTimeout(this._holdTimer); this._holdTimer = null; }
  }

  // Cancels the hold timer once movement clearly indicates a swipe is
  // underway, rather than letting hold fire on pure elapsed time regardless
  // of movement — a swipe slower than HOLD_MS would otherwise get suppressed
  // by hold firing first. Does not set _holdFired — the gesture stays
  // eligible to resolve as a swipe on release.
  _onPointerMove(e) {
    if (this._touchStartX === null || !this._holdTimer) return;
    const dx = e.clientX - this._touchStartX;
    const dy = e.clientY - this._touchStartY;
    if (Math.abs(dx) >= SWIPE_THRESHOLD || Math.abs(dy) >= SWIPE_THRESHOLD) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
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
    const c     = this._config ?? {};
    const seenKeys = new Set();

    // Build card-level template variables — all root-level scalar config
    // keys, snake_case converted to camelCase with a 'card' prefix, so they
    // are usable alongside photo fields in any template item without risk of
    // collision. cardDimmerOpacity is a computed value (0–100, 1 decimal),
    // not a raw config key.
    const _toCamel = s => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    const cardData = {};
    const skipKeys = new Set(['zone_modes', 'zone_alignment', 'items']);
    for (const key of Object.keys(DEFAULT_CONFIG)) {
      if (skipKeys.has(key)) continue;
      const camelKey = 'card' + _toCamel(key).replace(/^./, ch => ch.toUpperCase());
      cardData[camelKey] = c[key] ?? DEFAULT_CONFIG[key];
    }
    cardData['cardDimmerOpacity'] = Math.round(this._computeDimmerOpacity() * 1000) / 10;

    // Merge: photo fields take precedence over card fields on any collision
    // (none expected in practice — all card fields are prefixed with 'card').
    const templateData = { ...cardData, ...photo };

    items.forEach((item, index) => {
      if (!('template' in item)) return;
      const key = `item-${index}`;
      seenKeys.add(key);
      const { text: substituted, fullyLiteral } = substitutePhotoVariables(item.template ?? '', templateData);
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
    const zoneKey   = `${vertical}-${horizontal}`;
    const alignment = this._config?.zone_alignment?.[zoneKey] ?? DEFAULT_ZONE_ALIGNMENT[zoneKey] ?? horizontal;
    return html`
      <div class="overlay-zone overlay-zone-align-${alignment}">
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

  // ── fit_mode 'intelligent': precompute the bounded zoom+stretch sizing the
  //    moment the image finishes loading, not at transition time. Per the
  //    persistent front/back slot architecture, this slot is normally still
  //    hidden ("back") with the entire display_time window ahead of it when
  //    this fires — by the time it's actually promoted to "front", the
  //    computation (and the resulting style) is already long settled, no
  //    work left to do at the moment that matters.
  _onSlideImageLoad(e, fitMode, slotId) {
    if (fitMode !== 'intelligent') return;
    const img = e.target;
    const rect = this.getBoundingClientRect();
    if (!rect.width || !rect.height || !img.naturalWidth || !img.naturalHeight) return;
    const cfg = this._config ?? {};
    const result = computeIntelligentFit(
      img.naturalWidth, img.naturalHeight,
      rect.width, rect.height,
      (cfg.maxZoom    ?? DEFAULT_CONFIG.maxZoom)    / 100,
      (cfg.maxStretch ?? DEFAULT_CONFIG.maxStretch) / 100,
      (cfg.maxGap     ?? DEFAULT_CONFIG.maxGap)     / 100
    );
    if (slotId === 'A') this._slotIntelligentSizeA = result;
    else                 this._slotIntelligentSizeB = result;
  }

  // ── Render one of the two persistent slide units: image + dynamic-zone
  //    overlays, the part that participates in the photo transition. `role`
  //    is always 'front' (visible, top) or 'back' (hidden behind, pre-warmed
  //    with the next photo) — both units always exist in the DOM, never
  //    created/destroyed per transition, so nothing is ever animating a
  //    freshly-inserted, unpainted element. The actual animation is driven by
  //    _runTransitionAnimations() via the Web Animations API — see updated().
  //    `slotId` ('A'/'B') identifies which persistent slot this is, so the
  //    fit_mode 'intelligent' precomputed size (and the @load handler that
  //    computes it) are tracked per slot, not per role — role swaps every
  //    transition, the slot's own identity and photo do not.
  _renderSlideUnit(photo, indexOf, fitMode, role, slotId) {
    if (!photo) return html``;
    const letterboxColor = this._config?.letterbox_color || undefined;
    const intelligentSize = slotId === 'A' ? this._slotIntelligentSizeA : this._slotIntelligentSizeB;
    // zoomCenter: vertical-only crop anchor (50 = centered, the old fixed
    // behavior). Horizontal is intentionally always '50%' below — there is
    // no horizontal counterpart, by design (see DEFAULT_CONFIG comment).
    const zoomCenterPct = this._config?.zoomCenter ?? DEFAULT_CONFIG.zoomCenter;
    const imgStyles = (fitMode === 'intelligent' && intelligentSize)
      ? {
          position: 'absolute',
          top: `${zoomCenterPct}%`,
          left: '50%',
          width: `${intelligentSize.renderWidth}px`,
          height: `${intelligentSize.renderHeight}px`,
          transform: `translate(-50%, -${zoomCenterPct}%)`,
          'background-color': letterboxColor,
        }
      // Plain 'contain' until the precomputed size exists (e.g. the instant
      // before @load has fired) — given the precompute-on-load timing, this
      // should rarely if ever be the visible state in practice.
      : { 'object-fit': fitMode === 'intelligent' ? 'contain' : fitMode, 'background-color': letterboxColor };
    return html`
      <div class="slide-unit" data-role="${role ?? ''}" style=${styleMap({ 'background-color': letterboxColor })}>
        <img
          class="slide-image"
          src="${photo.fileURL}"
          style=${styleMap(imgStyles)}
          draggable="false"
          @load=${(e) => this._onSlideImageLoad(e, fitMode, slotId)}
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
    // so a previous cycle's finished, fill:'forwards' animation could still
    // be lingering on them. Cancel as a first line of defense — but a plain
    // .cancel() relies on correctly finding every old animation, and isn't
    // fully trusted as the only safeguard (see the keyframe design below).
    exitingEl.getAnimations().forEach(a => a.cancel());
    enteringEl.getAnimations().forEach(a => a.cancel());

    const transitionName = this._resolvedTransitionName ?? 'fade';
    const durationMs       = Math.max(0, (this._config?.transition_duration ?? 0.6)) * 1000;
    const easing           = 'ease';

    // Every keyframe below explicitly states all of opacity/transform/
    // clipPath/maskImage — not just the one property a given transition
    // actually cares about. This is the real fix, independent of whatever
    // the exact reason .cancel() above might occasionally miss something:
    // per the Web Animations API's composite order, a newly-started
    // animation that explicitly sets a property takes priority over any
    // older, still-active one for that same property, cancelled or not. So
    // every transition now fully self-clears all visual state every single
    // cycle, instead of only touching its own property and trusting
    // whatever else was already cleared.
    const NEUTRAL = { opacity: 1, transform: 'translate(0,0)', clipPath: 'inset(0 0 0 0)', maskImage: 'none', webkitMaskImage: 'none' };

    if (transitionName === 'fade') {
      exitingEl.animate(  [{ ...NEUTRAL, opacity: 1 }, { ...NEUTRAL, opacity: 0 }], { duration: durationMs, easing, fill: 'forwards' });
      enteringEl.animate( [{ ...NEUTRAL, opacity: 0 }, { ...NEUTRAL, opacity: 1 }], { duration: durationMs, easing, fill: 'forwards' });
    } else if (transitionName.startsWith('slide-')) {
      const exitTo   = TRANSITION_EXIT_TRANSFORM[transitionName]       ?? 'translateX(-100%)';
      const enterFrom = TRANSITION_ENTER_FROM_TRANSFORM[transitionName] ?? 'translateX(100%)';
      exitingEl.animate(  [{ ...NEUTRAL, transform: 'translate(0,0)' }, { ...NEUTRAL, transform: exitTo }],   { duration: durationMs, easing, fill: 'forwards' });
      enteringEl.animate( [{ ...NEUTRAL, transform: enterFrom },        { ...NEUTRAL, transform: 'translate(0,0)' }], { duration: durationMs, easing, fill: 'forwards' });
    } else if (transitionName === 'curtain') {
      exitingEl.animate(  [{ ...NEUTRAL, clipPath: 'inset(0 0 0 0)' },   { ...NEUTRAL, clipPath: 'inset(0 0 0 100%)' }], { duration: durationMs, easing, fill: 'forwards' });
      enteringEl.animate( [{ ...NEUTRAL, clipPath: 'inset(0 100% 0 0)' }, { ...NEUTRAL, clipPath: 'inset(0 0 0 0)' }],     { duration: durationMs, easing, fill: 'forwards' });
    } else if (transitionName === 'clock') {
      // Radial wipe via a conic-gradient mask sweeping 0→360deg. Entering unit
      // sweeps the reveal in; exiting unit gets an explicit no-op animation
      // (every frame identical, all neutral) purely so it also claims
      // compositing priority for opacity/transform/clipPath/mask for the
      // full duration — consistent with every other transition, rather than
      // being the one branch that relies solely on .cancel() above.
      exitingEl.animate( [{ ...NEUTRAL }, { ...NEUTRAL }], { duration: durationMs, fill: 'forwards' });
      const steps = 60;
      const frames = Array.from({ length: steps + 1 }, (_, i) => {
        const deg = (360 * i) / steps;
        const grad = `conic-gradient(from 0deg, #000 ${deg}deg, transparent ${deg}deg)`;
        return { ...NEUTRAL, maskImage: grad, webkitMaskImage: grad };
      });
      enteringEl.animate(frames, { duration: durationMs, easing: 'linear', fill: 'forwards' });
    }
    // 'none' is handled in _advance() via _promoteBackSlotInstant() and never reaches here.
  }

  updated(changedProps) {
    super.updated(changedProps);
    this._attachResizeObserverIfNeeded();
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
      height: var(--editor-preview-height, 100%);
      min-height: 200px;
      aspect-ratio: var(--editor-preview-aspect-ratio, auto);
      overflow: hidden;
      box-sizing: border-box;
    }
    .slideshow-container {
      position: absolute;
      inset: 0;
      overflow: hidden;
      touch-action: none;
    }

    /* ── Pause indicator: shown on tap-to-pause, hidden on tap-to-resume ──── */
    .pause-indicator {
      position: absolute;
      left: 50%;
      top: 75%;
      transform: translate(-50%, -50%);
      width: calc(64px * var(--scale-factor, 1));
      height: calc(64px * var(--scale-factor, 1));
      border-radius: 50%;
      border: calc(2px * var(--scale-factor, 1)) solid white;
      background: rgba(0, 0, 0, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 4;
      pointer-events: none;
    }
    .pause-indicator ha-icon {
      --mdc-icon-size: calc(36px * var(--scale-factor, 1));
      color: white;
    }

    /* ── Dimmer overlay: sits above photo, overlays, and pause indicator ─────── */
    .dimmer-overlay {
      position: absolute;
      inset: 0;
      z-index: 5;
      pointer-events: none;
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
      background-color: var(--card-background-color, #1c1c1c);
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
    /* Keyed by the zone's configured alignment (zone_alignment), not its
       screen position — the two are independent since 0.0.23. */
    .overlay-zone-align-left   { align-items: flex-start; text-align: left;   }
    .overlay-zone-align-center { align-items: center;     text-align: center; }
    .overlay-zone-align-right  { align-items: flex-end;   text-align: right;  }

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

  // ── Dimmer ────────────────────────────────────────────────────────────────
  // Returns the overlay opacity as a 0–1 fraction. Uses a Stevens power-law
  // curve (exponent 0.33 = human brightness perception baseline, cube-root)
  // scaled by dimmer_aggressiveness. The curve maps lux onto the configured
  // min–max opacity range, with lux clamped to [lux_min, lux_max]:
  //   t = (lux - lux_min) / (lux_max - lux_min)   — normalized 0–1
  //   opacity = max + (min - max) × t^(0.33 × aggressiveness)
  // At t=0 (dark) opacity = max; at t=1 (bright) opacity = min.
  // The perceptual curve means most of the opacity change happens at the low
  // end of the lux range, matching how the human eye actually perceives dim
  // environments as much darker than a linear scale would suggest.
  _computeDimmerOpacity() {
    const c = this._config;
    const entity = c.dimmer_entity ?? '';
    if (!entity) return 0;
    const stateObj = this._hass?.states?.[entity];
    const lux = stateObj ? parseFloat(stateObj.state) : 0;
    if (isNaN(lux)) return 0;

    const luxMin  = c.dimmer_lux_min  ?? DEFAULT_CONFIG.dimmer_lux_min;
    const luxMax  = c.dimmer_lux_max  ?? DEFAULT_CONFIG.dimmer_lux_max;
    const opMin   = (c.dimmer_min_opacity ?? DEFAULT_CONFIG.dimmer_min_opacity) / 100;
    const opMax   = (c.dimmer_max_opacity ?? DEFAULT_CONFIG.dimmer_max_opacity) / 100;
    // dimmer_aggressiveness is stored as 1–100 (UI slider percentage).
    // Convert logarithmically: 10^((pct-50)/50) → range 0.1–10, 50 = 1.
    const aggrPct = c.dimmer_aggressiveness ?? DEFAULT_CONFIG.dimmer_aggressiveness;
    const aggr    = Math.pow(10, (aggrPct - 50) / 50);

    if (luxMax <= luxMin) return opMax; // degenerate config — always max opacity
    const t = Math.max(0, Math.min(1, (lux - luxMin) / (luxMax - luxMin)));
    return opMax + (opMin - opMax) * Math.pow(t, 0.33 * aggr);
  }

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
          @pointerdown=${(e) => this._onPointerDown(e)}
          @pointermove=${(e) => this._onPointerMove(e)}
          @pointerup=${(e) => this._onPointerUp(e)}
          @pointercancel=${() => this._onPointerCancel()}
        >
          ${this._renderZoneGrid('static', itemIndex)}

          <div class="slide-stack">
            ${this._renderSlideUnit(this._slotPhotoA, itemIndex, fitMode, this._frontSlotId === 'A' ? 'front' : 'back', 'A')}
            ${this._renderSlideUnit(this._slotPhotoB, itemIndex, fitMode, this._frontSlotId === 'B' ? 'front' : 'back', 'B')}
          </div>

          ${this._paused ? html`
            <div class="pause-indicator">
              <ha-icon icon="mdi:pause"></ha-icon>
            </div>
          ` : ''}

          ${this._loadError ? html`
            <div class="message-overlay">
              <div>
                <ha-icon class="message-icon" icon="mdi:image-broken-variant"></ha-icon>
                <div>Failed to load: ${this._loadError}</div>
              </div>
            </div>
          ` : ''}

          ${(this._config.dimmer_enabled && this._config.dimmer_entity) ? html`
            <div class="dimmer-overlay" style="
              background-color: ${this._config.dimmer_color ?? DEFAULT_CONFIG.dimmer_color};
              opacity: ${this._computeDimmerOpacity()};
            "></div>
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
