import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Atomic Atelier — Interactive Chemistry",
    short_name: "Atomic Atelier",
    description: "Explore all 118 elements, periodic trends, quizzes, and guided chemical reactions.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f1e8",
    theme_color: "#17393a",
    orientation: "any",
    categories: ["education", "science"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
