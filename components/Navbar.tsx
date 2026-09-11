"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

interface NavbarProps {
  onPenugasanClick?: () => void;
}

export default function Navbar({ onPenugasanClick }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // 🟢 Cegah mismatch SSR dengan nilai awal false, lalu cek localStorage setelah mounted
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const isProtectedRoute =
    pathname.startsWith("/penugasan") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/panitia");

  useEffect(() => {
    setIsMounted(true);
    const userNim = localStorage.getItem("user_nim");
    setIsLoggedIn(!!userNim || isProtectedRoute);

    if (pathname !== "/") return;

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const sections = ["home", "tata-tertib", "reward-punishment"];

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, [pathname, isProtectedRoute]);

  const handleLogout = () => {
    localStorage.removeItem("user_nim");
    localStorage.removeItem("user_nama");
    localStorage.removeItem("user_role");
    setIsLoggedIn(false);
    router.push("/");
  };

  const handleRestrictedClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setIsMenuOpen(false);
  };

  const handlePenugasanClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsMenuOpen(false);

    const userNim = localStorage.getItem("user_nim");

    if (!userNim) {
      if (onPenugasanClick) {
        onPenugasanClick();
      } else {
        router.push("/#home");
      }
    } else {
      router.push("/penugasan");
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "110px",
          background: "linear-gradient(to top, rgba(10, 10, 12, 0) 0%, rgba(10, 10, 12, 0.75) 45%, rgba(10, 10, 12, 0.98) 85%, #0A0A0C 100%)",
          pointerEvents: "none",
          zIndex: 999990,
        }}
      />

      <nav className="navbar">
        <div className="nav-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          
          <a 
            href="/#home" 
            className="logo-area" 
            style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
            onClick={handleRestrictedClick}
          >
            <div style={{ width: "32px", height: "32px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Image 
                src="/assets/logoinis.png" 
                alt="Logo Inisialisasi" 
                width={25} 
                height={25} 
                style={{ objectFit: "contain", borderRadius: "6px" }}
                priority
              />
            </div>
            <span className="logo-text">Inisialisasi 2026</span>
          </a>

          <button 
            className={`hamburger ${isMenuOpen ? "active" : ""}`} 
            onClick={toggleMenu}
            aria-label="Toggle Menu"
            type="button"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <ul className={`nav-links ${isMenuOpen ? "active" : ""}`} id="navLinks">
            <li>
              <a 
                href="/#home" 
                className={`nav-item ${pathname === "/" && activeSection === "home" ? "active" : ""}`} 
                onClick={handleRestrictedClick}
              >
                Home
              </a>
            </li>
            <li>
              <a 
                href="/#tata-tertib" 
                className={`nav-item ${pathname === "/" && activeSection === "tata-tertib" ? "active" : ""}`} 
                onClick={handleRestrictedClick}
              >
                Tata Tertib
              </a>
            </li>
            <li>
              <a 
                href="/#reward-punishment" 
                className={`nav-item ${pathname === "/" && activeSection === "reward-punishment" ? "active" : ""}`} 
                onClick={handleRestrictedClick}
              >
                Reward & Punishment
              </a>
            </li>
            <li>
              <a 
                href="/penugasan" 
                className={`nav-item ${pathname.startsWith("/penugasan") ? "active" : ""}`} 
                onClick={handlePenugasanClick}
              >
                Penugasan
              </a>
            </li>

            {/* TOMBOL OTENTIKASI (Dirender aman setelah mounted) */}
            <li>
              {isMounted && (isProtectedRoute || isLoggedIn) ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="btn-login-nav"
                >
                  Log Out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/login");
                  }}
                  className="btn-login-nav"
                >
                  Log In
                </button>
              )}
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}