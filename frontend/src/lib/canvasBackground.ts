import * as THREE from "three";

/**
 * Matches `--off-white` in `globals.css`. Used when CSS variables are unavailable (SSR).
 * Keep in sync with :root { --off-white: ... }
 */
export const OFF_WHITE_FALLBACK = "#fafaf9";

/**
 * Apply the same background as the page (`--off-white`) to the WebGL clear color,
 * with opaque clearing and sRGB output so CSS and canvas match across browsers/OS.
 */
export function applyPageBackgroundToRenderer(gl: THREE.WebGLRenderer): void {
  gl.setClearAlpha(1);
  gl.outputColorSpace = THREE.SRGBColorSpace;

  let hex = OFF_WHITE_FALLBACK;
  if (typeof document !== "undefined") {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--off-white")
      .trim();
    if (raw) {
      hex = raw.startsWith("#") ? raw : `#${raw}`;
    }
  }

  const color = new THREE.Color();
  color.setStyle(hex);
  gl.setClearColor(color, 1);
}
