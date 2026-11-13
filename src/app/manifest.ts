import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alfurqan Pay",
    short_name: "Alfurqan Pay",
    description: "School accounts for Alfurqan International Academy",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#075E54",
    icons: [
      { src: "/logo.png", sizes: "192x192", type: "image/png" },
      { src: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
