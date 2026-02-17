import { ImageResponse } from "next/og";

export const runtime = "edge";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #f4f8ff 0%, #e7f0ff 100%)",
          color: "#10203A",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          padding: "56px",
          width: "100%"
        }}
      >
        <img
          src={`${siteUrl}/rowingapi-logo-horizontal.svg`}
          alt="RowingAPI"
          width={820}
          height={205}
          style={{ objectFit: "contain" }}
        />
        <div style={{ fontSize: 34, marginTop: 24, fontWeight: 700, letterSpacing: "0.01em", color: "#2B4B75" }}>
          日本ローイング大会記録の検索・可視化
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
