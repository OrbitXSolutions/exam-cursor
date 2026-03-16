import { ImageResponse } from "next/og"

export const size = {
  width: 180,
  height: 180,
}
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 96,
          background: "linear-gradient(135deg, #10b981, #0d9488)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 37,
          color: "white",
          fontWeight: 800,
          letterSpacing: -2,
        }}
      >
        SE
      </div>
    ),
    {
      ...size,
    }
  )
}
