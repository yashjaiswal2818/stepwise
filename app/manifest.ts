import type { MetadataRoute } from "next";

/**
 * Minimal PWA manifest. Both icons are real, correctly-sized assets served from
 * public/: the scalable mark (stepwise.svg, "any") and the 2048px master raster
 * (stepwise.png), which is also the Organization logo. No invented sizes.
 *
 * theme/background are the dark-theme --bg (#0b0f14) — the app's default theme.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stepwise",
    short_name: "Stepwise",
    description:
      "Interactive, step-by-step visualizations of data structures and algorithms, with an AI tutor.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f14",
    theme_color: "#0b0f14",
    icons: [
      { src: "/stepwise.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/stepwise.png", sizes: "2048x2048", type: "image/png" },
    ],
  };
}
