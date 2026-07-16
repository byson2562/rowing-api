import { ImageResponse } from "next/og";

import { siteUrl } from "../../lib/site-url";

export const runtime = "edge";

function truncate(value: string, maxChars: number): string {
  const chars = Array.from(value);
  if (chars.length <= maxChars) return value;
  return `${chars.slice(0, maxChars).join("")}…`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawTitle = (searchParams.get("title") ?? "").trim();
  const rawSubtitle = (searchParams.get("subtitle") ?? "").trim();
  const title = truncate(rawTitle, 40);
  const subtitle = truncate(rawSubtitle, 50);

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "radial-gradient(circle at 18% 22%, #1f2a44 0%, #0b1020 55%, #070b16 100%)",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          padding: "64px",
          width: "100%"
        }}
      >
        {title ? (
          <div
            style={{
              alignItems: "center",
              display: "flex",
              flexDirection: "column",
              gap: "32px",
              textAlign: "center"
            }}
          >
            <div style={{ alignItems: "center", display: "flex", gap: "18px" }}>
              <img
                src={`${siteUrl}/og.svg`}
                alt="RowingAPI"
                width={64}
                height={64}
                style={{ borderRadius: "16px" }}
              />
              <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "0.02em" }}>RowingAPI</div>
            </div>
            <div
              style={{
                fontSize: Array.from(title).length > 18 ? 56 : 72,
                fontWeight: 800,
                letterSpacing: "0.02em",
                lineHeight: 1.25,
                maxWidth: "1040px"
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div style={{ color: "#b9c6e2", fontSize: 34, fontWeight: 600 }}>{subtitle}</div>
            ) : null}
          </div>
        ) : (
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: "28px"
            }}
          >
            <img
              src={`${siteUrl}/og.svg`}
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
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
