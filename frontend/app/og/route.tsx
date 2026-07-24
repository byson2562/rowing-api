import { ImageResponse } from "next/og";

export const runtime = "edge";

// 交差オールのブランドマーク(public/favicon.svgと同一・ソリッド配色)。satoriは外部SVG URLを解決できないためdata URIで埋め込む
const markDataUri =
  "data:image/svg+xml;base64," +
  "PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxyZWN0IHg9IjUyIiB5PSI1MiIgd2lkdGg9IjQwOCIgaGVpZ2h0PSI0MDgiIHJ4PSI5NiIgZmlsbD0iIzFENkVFMCIvPgoKICA8IS0tIOS6pOW3ruOCquODvOODq+OAguODluODrOODvOODieOBr+ODj+ODgeOCp+ODg+ODiOWeiyjkuIrovrrjga/nm7Tnt5rjgIHkuIvlgbTjga7moLnlhYPjga7jgb/jgYjjgZDjgowp44Gn5bem5Y+z44Of44Op44O86YWN572uIC0tPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDE5NiAxOTQpIHNjYWxlKC0xIDEpIHJvdGF0ZSgtNTIpIj4KICAgIDxsaW5lIHgxPSItMjY4IiB5MT0iMCIgeDI9IjIiIHkyPSIwIiBzdHJva2U9IiNCQ0Q5RkYiIHN0cm9rZS13aWR0aD0iMzAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogICAgPHBhdGggZD0iTTQgLTE4IEwxMjQgLTM2IEwxMjQgNjIgTDM4IDQ5IFEyOCAyMCA0IDE2IFoiIGZpbGw9IiNCQ0Q5RkYiIHN0cm9rZT0iI0JDRDlGRiIgc3Ryb2tlLXdpZHRoPSIxMiIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgogIDwvZz4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzMTYgMTk0KSByb3RhdGUoLTUyKSI+CiAgICA8bGluZSB4MT0iLTI2OCIgeTE9IjAiIHgyPSIyIiB5Mj0iMCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjMwIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICAgIDxwYXRoIGQ9Ik00IC0xOCBMMTI0IC0zNiBMMTI0IDYyIEwzOCA0OSBRMjggMjAgNCAxNiBaIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMTIiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KICA8L2c+Cjwvc3ZnPgo=";

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
                src={markDataUri}
                alt="レガッタナビ"
                width={64}
                height={64}
                style={{ borderRadius: "16px" }}
              />
              <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "0.02em" }}>レガッタナビ</div>
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
              src={markDataUri}
              alt="レガッタナビ"
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
              レガッタナビ
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
