import { ImageResponse } from "next/og";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #eef2ff 0%, #f8f9ff 42%, #dfe7ff 100%)",
          color: "#141b2d",
          fontFamily: "Arial, sans-serif",
          padding: 72,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: 48,
            background: "rgba(255,255,255,0.88)",
            border: "1px solid rgba(255,255,255,0.92)",
            boxShadow: "0 40px 120px rgba(75,65,231,0.18)",
            padding: 56,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 76,
                height: 76,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 22,
                background: "linear-gradient(135deg, #3525cd 0%, #4f46e5 100%)",
                color: "white",
                fontSize: 30,
                fontWeight: 900,
              }}
            >
              BC
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1.2 }}>{SITE_NAME}</div>
              <div style={{ marginTop: 6, color: "#6b7280", fontSize: 21 }}>Curated job discovery</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ maxWidth: 840, fontSize: 68, fontWeight: 900, lineHeight: 1.02, letterSpacing: -2.4 }}>
              High-signal roles for modern teams.
            </div>
            <div style={{ maxWidth: 780, color: "#5f667b", fontSize: 26, lineHeight: 1.35 }}>
              {SITE_DESCRIPTION}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
