# Project Brief: chrono-slideshow-card

## Context

This is a new custom Lovelace card for Home Assistant, part of an existing family of custom cards (`chrono-compass-card`, `chrono-markdown-card`, `chrono-picture-card`, `chrono-gauge-card`, `chrono-panel-card`), built and maintained by the user with Claude's help. These cards share a common build/release pipeline, versioning convention, and HACS distribution setup. The DEVELOPMENT_RULES document governs how this collaboration works and should be treated as the operating rules for the whole project — read it first and follow it exactly.

## Hardware / use case background

The user has an Android tablet running the Home Assistant Companion app, mounted as a wall display. The intended behavior:

- By default, the tablet shows a photo slideshow (idle state).
- When motion is detected (e.g. in the driveway), the display switches to a live camera feed.
- After a period of inactivity (e.g. 3 minutes of no motion), it switches back to the slideshow.

The camera feed switching and the picture-entity full-panel-stretch display issue have already been solved in a separate prior session (card-mod targeting shadow DOM boundaries on `hui-image` / `ha-camera-stream`). That part is done and working. This new project is purely about building a better slideshow component.

## Why a new card is needed

The currently installed slideshow solution (a third-party HACS slideshow card) has two problems:
1. It implements the slideshow by acting as a fake camera entity, which is the wrong abstraction — images aren't real photo elements, just a video-style stream.
2. Because of that camera-entity approach, it's slow to respond (lag when switching/loading images).

## Photo source

Photos are stored locally under HA's `/local/` path, e.g.:
```
/local/slideshow/woonkamer
```
(this is an example folder — the card should support configuring different folders, likely one per room/tablet)

## Desired features for chrono-slideshow-card

1. **Real photo elements.** Each slide should be displayed as an actual `<img>` element pointing at the photo URL — not routed through a fake camera entity or video stream. This should fix both the lag and the "not really photos" issues.

2. **Swipe navigation.** Touch/swipe left and right should let the user manually skip to the next or previous photo, overriding/interacting with the autoplay timer (exact interaction behavior — reset timer vs. pause vs. just nudge index — still to be decided).

3. **Configurable overlays — multiple, dynamic, template-capable.** This is a core feature, not an afterthought:
   - Overlays are stored as an **array** in the card config.
   - Each overlay can be **added, edited, or removed** independently (dynamic, not fixed at one or two slots).
   - Overlays must support **templates** (e.g. Jinja/HA template strings), so an overlay can render something like a live clock, or other templated text/data, on top of the current slide.
   - Likely needs a `type` (e.g. clock, text/template, possibly others later) and a `position` (corner/anchor placement) per overlay entry, though exact schema is open for discussion.

## Starting point for this session

The user will share the source code of **chrono-picture-card** first, since it shares meaningful overlap with what chrono-slideshow-card needs (likely image display patterns and/or overlay/templating logic). The intent is to use it as a structural reference and possibly extend/adapt shared logic, not necessarily to copy it wholesale.

## Process reminder

Per the DEVELOPMENT_RULES document: no code is written without explicit permission, changes use search & replace only, full files are presented via `present_files`, and the user leads on implementation decisions while Claude can spar once on technical points before standing down.
