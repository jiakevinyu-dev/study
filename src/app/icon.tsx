import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0c",
          color: "#e7ab4c",
          fontSize: 30,
          fontWeight: 600,
          fontFamily: "Georgia, serif",
          borderRadius: 14,
          letterSpacing: -1,
        }}
      >
        JY
      </div>
    ),
    { ...size }
  );
}
