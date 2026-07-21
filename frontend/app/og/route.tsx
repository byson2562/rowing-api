import { ImageResponse } from "next/og";

export const runtime = "edge";

// 交差オールのブランドマーク(public/og.svgと同一)。satoriは外部SVG URLを解決できないためdata URIで埋め込む
const markDataUri =
  "data:image/svg+xml;base64," +
  "PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxkZWZzPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJyLWJnIiB4MT0iNjQiIHkxPSI2NCIgeDI9IjQ0OCIgeTI9IjQ0OCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMwQjJBNTciLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMEY1RUM3Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KCiAgPHJlY3QgeD0iNTIiIHk9IjUyIiB3aWR0aD0iNDA4IiBoZWlnaHQ9IjQwOCIgcng9Ijk2IiBmaWxsPSJ1cmwoI3ItYmcpIi8+CgogIDwhLS0g5Lqk5beu44Kq44O844Or44CC44OW44Os44O844OJ44Gv44OP44OB44Kn44OD44OI5Z6LKOS4iui+uuOBr+ebtOe3muOAgeS4i+WBtOOBruagueWFg+OBruOBv+OBiOOBkOOCjCnjgaflt6blj7Pjg5/jg6njg7zphY3nva4gLS0+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTk2IDE5NCkgc2NhbGUoLTEgMSkgcm90YXRlKC01MikiPgogICAgPGxpbmUgeDE9Ii0yNjgiIHkxPSIwIiB4Mj0iMiIgeTI9IjAiIHN0cm9rZT0iIzhGQzNGRiIgc3Ryb2tlLXdpZHRoPSIzMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgICA8cGF0aCBkPSJNNCAtMTggTDEyNCAtMzYgTDEyNCA2MiBMMzggNDkgUTI4IDIwIDQgMTYgWiIgZmlsbD0iIzhGQzNGRiIgc3Ryb2tlPSIjOEZDM0ZGIiBzdHJva2Utd2lkdGg9IjEyIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CiAgPC9nPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDMxNiAxOTQpIHJvdGF0ZSgtNTIpIj4KICAgIDxsaW5lIHgxPSItMjY4IiB5MT0iMCIgeDI9IjIiIHkyPSIwIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMzAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogICAgPHBhdGggZD0iTTQgLTE4IEwxMjQgLTM2IEwxMjQgNjIgTDM4IDQ5IFEyOCAyMCA0IDE2IFoiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIxMiIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgogIDwvZz4KPC9zdmc+Cg==";

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
