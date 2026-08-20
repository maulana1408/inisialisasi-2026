"use client";

import { useEffect } from "react";

export default function DynamicFavicon() {
  useEffect(() => {
    // Fungsi untuk mendeteksi mode tema perangkat/browser
    const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateFavicon = (e: MediaQueryListEvent | MediaQueryList) => {
      const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement("link");
      link.type = "image/x-icon";
      link.rel = "shortcut icon";
      
      // Jika dark mode aktif, pakai favicon terang (putih), jika tidak pakai favicon gelap (biru)
      link.href = e.matches ? "/favicon-light.ico" : "/favicon-dark.ico";
      
      document.getElementsByTagName("head")[0].appendChild(link);
    };

    // Jalankan saat pertama kali dimuat
    updateFavicon(darkModeMediaQuery);

    // Pantau jika user mengubah tema browser secara real-time
    darkModeMediaQuery.addEventListener("change", updateFavicon);

    return () => {
      darkModeMediaQuery.removeEventListener("change", updateFavicon);
    };
  }, []);

  return null;
}