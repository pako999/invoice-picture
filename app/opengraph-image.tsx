import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SlikajRačun — Pošlji račun z enim klikom";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #f8fafc 0%, #dbeafe 50%, #e0e7ff 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              color: "#fff",
            }}
          >
            🧾
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            SlikajRačun
          </div>
        </div>

        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "#0f172a",
            marginBottom: 28,
            display: "flex",
          }}
        >
          Pošlji račun z enim klikom
        </div>

        <div
          style={{
            fontSize: 32,
            color: "#475569",
            lineHeight: 1.4,
            maxWidth: 1000,
            display: "flex",
          }}
        >
          Fotografiraj račun in ga avtomatsko pošlji na email računovodskega programa.
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 40,
            flexWrap: "wrap",
          }}
        >
          {["Minimax", "Birokrat", "Pantheon", "SAOP", "E-računi", "Metakocka"].map((p) => (
            <div
              key={p}
              style={{
                padding: "10px 20px",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 999,
                fontSize: 22,
                color: "#475569",
                fontWeight: 500,
              }}
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
