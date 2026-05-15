import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Studlike",
    short_name: "Studlike",
    description: "Plano de estudos com edital, revisões, metas e simulados.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f7f8",
    theme_color: "#050505",
    icons: [
      {
        src: "/studlike-logo.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
  };
}
