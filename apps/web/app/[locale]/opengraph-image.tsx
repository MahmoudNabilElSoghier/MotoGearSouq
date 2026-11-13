import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

type Props = { params: Promise<{ locale: string }> };

export default async function Image({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "opengraph" });

  const arabicFont = await fetch(
    new URL("https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hOA-W1Q.ttf")
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0A0A0A",
          color: "#FFFFFF",
          padding: "80px",
          position: "relative",
          fontFamily: "Cairo, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Radial gradient overlay top-right */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle at top right, rgba(230,57,70,0.2), transparent 70%)",
          }}
        />

        {/* Diagonal accent stripe bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: "-40px",
            right: "-40px",
            width: "200px",
            height: "8px",
            backgroundColor: "#E63946",
            transform: "rotate(-12deg)",
          }}
        />

        {/* Top Header Label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            letterSpacing: "4px",
            color: "#E63946",
            fontSize: "24px",
            fontWeight: 700,
          }}
        >
          MotoGearSouq
        </div>

        {/* Center Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 1.1,
            }}
          >
            {t("headline")}
          </div>
          <div
            style={{
              fontSize: "28px",
              color: "#9CA3AF",
              fontWeight: 500,
            }}
          >
            {t("subtitle")}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "20px",
            color: "#6B7280",
          }}
        >
          <div>{t("footer")}</div>
          <div style={{ color: "#E63946", fontWeight: 600 }}>motogearsouq.com</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Cairo",
          data: arabicFont,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
