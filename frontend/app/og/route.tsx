import { ImageResponse } from "next/og";

export const runtime = "edge";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "radial-gradient(circle at 18% 22%, #1f2a44 0%, #0b1020 55%, #070b16 100%)",
          color: "#ffffff",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: "64px",
          width: "100%"
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: "28px"
          }}
        >
          <img
            src={`${siteUrl}/rowingapi-logo-mark.svg`}
            alt="RowingAPI"
            width={128}
            height={128}
            style={{ borderRadius: "28px" }}
          />
          <div
            style={{
              fontSize: 98,
              fontWeight: 800,
              letterSpacing: "0.02em",
              lineHeight: 1
            }}
          >
            RowingAPI
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
