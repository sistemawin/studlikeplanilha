import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 38% 30%, #7AABFF 0%, #4B82F5 45%, #3461D8 100%)",
        }}
      >
        {/* depth layer */}
        <div
          style={{
            position: "absolute",
            display: "flex",
            fontSize: 360,
            fontWeight: 900,
            color: "#3A5FC8",
            fontFamily: "Arial",
            lineHeight: 1,
            marginTop: 24,
            marginLeft: 16,
            opacity: 0.5,
          }}
        >
          S
        </div>
        {/* white S */}
        <div
          style={{
            display: "flex",
            fontSize: 360,
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
    { width: 512, height: 512 },
  );
}
