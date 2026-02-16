import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #0b1f52 0%, #1976d2 100%)",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          padding: "48px",
          width: "100%"
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: "0.03em" }}>RowingAPI</div>
        <div style={{ fontSize: 34, marginTop: 18 }}>日本ローイング大会記録の検索・可視化</div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
