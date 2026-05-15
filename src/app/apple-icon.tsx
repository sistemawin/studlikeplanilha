import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 38% 30%, #7AABFF 0%, #4B82F5 45%, #3461D8 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            display: "flex",
            fontSize: 126,
            fontWeight: 900,
            color: "#3A5FC8",
            fontFamily: "Arial",
            lineHeight: 1,
            marginTop: 8,
            marginLeft: 6,
            opacity: 0.5,
          }}
        >
          S
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 126,
            fontWeight: 900,
            color: "white",
            fontFamily: "Arial",
            lineHeight: 1,
          }}
        >
          S
        </div>
      </div>
    ),
    { width: 180, height: 180 },
  );
}
