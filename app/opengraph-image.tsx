import { ImageResponse } from "next/og";
import { SITE_URL } from "@/lib/site";

/**
 * Brand chrome, not a product screenshot. Per PRODUCT.md we "be the product,
 * don't depict it" — so this card is a clean typographic wordmark, never a faked
 * visualization. Colors are the dark-theme tokens from DESIGN.md, inlined as hex
 * because Satori can't read CSS custom properties: --bg #0b0f14, the text ramp
 * (faint/muted/ink) #8c9198 / #acb1b9 / #f0f2f4, hairline --line #2e333b.
 *
 * No custom font is fetched: next/og bundles Geist as its default, so the build
 * never depends on a network font — a robust default beats a flaky custom one.
 */

export const alt = "Stepwise — Learn DSA, one step at a time";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#f0f2f4";
const MUTED = "#acb1b9";
const FAINT = "#8c9198";

export default function OpengraphImage() {
  // The three ascending bars of the Stepwise mark: shared baseline, heights 1:1.5:2,
  // ink stepping up with size so the ramp reads twice.
  const bars = [
    { h: 52, fill: FAINT },
    { h: 78, fill: MUTED },
    { h: 104, fill: INK },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#0b0f14",
          padding: "80px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
          {bars.map((b, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                width: 36,
                height: b.h,
                backgroundColor: b.fill,
                borderRadius: 7,
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 112, color: INK, letterSpacing: -3 }}>
            Stepwise
          </div>
          <div style={{ display: "flex", fontSize: 44, color: MUTED, marginTop: 20 }}>
            Learn DSA, one step at a time.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, color: FAINT }}>
          <div style={{ display: "flex", width: 220, height: 1, backgroundColor: "#2e333b" }} />
          <div style={{ display: "flex" }}>
            Interactive, step-by-step visualizations · {SITE_URL.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
