"use client";

import { useEffect } from "react";

export default function DynamicFavicon() {
  useEffect(() => {
    // Fungsi untuk mengubah favicon berdasarkan tema browser
    const updateFavicon = (e: MediaQueryListEvent | MediaQueryList) => {
      const isDark = e.matches;
      // Ganti path sesuai nama file icon terang/gelap Anda di folder public/
      const faviconPath = isDark ? "/favicon-light.ico" : "/favicon-dark.ico";

      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = faviconPath;
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    // Set awal saat komponen dimuat
    updateFavicon(mediaQuery);

    // Event listener jika pengguna mengubah tema browser secara real-time
    mediaQuery.addEventListener("change", updateFavicon);

    return () => {
      mediaQuery.removeEventListener("change", updateFavicon);
    };
  }, [],);

  return null;
}