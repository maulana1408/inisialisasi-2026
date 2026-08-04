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

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== "undefined") {
      if (pathname.startsWith("/penugasan") || pathname.startsWith("/admin") || pathname.startsWith("/panitia")) {
        return true;
      }
      const userNim = localStorage.getItem("user_nim");
      return !!userNim;
    }
    return false;
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);

  // Helper untuk mengecek apakah user sedang berada di route terproteksi/sesi aktif
  const isProtectedRoute =
    pathname.startsWith("/penugasan") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/panitia");

  useEffect(() => {
    // Sinkronisasi status login setiap rute berubah
    const userNim = localStorage.getItem("user_nim");
    setIsLoggedIn(!!userNim);

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
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("user_nim");
    localStorage.removeItem("user_nama");
    localStorage.removeItem("user_role");
    setIsLoggedIn(false);
    router.push("/");
  };

  const handleRestrictedClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isProtectedRoute) {
      e.preventDefault();
      setIsMenuOpen(false);
      setShowRestrictionModal(true);
    } else {
      setIsMenuOpen(false);
    }
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
      <nav className="navbar">
        <div className="nav-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          
          {/* AREA LOGO & JUDUL: Ditambahkan onClick handleRestrictedClick */}
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

          {/* TOMBOL HAMBURGER MOBILE */}
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

          {/* MENU UTAMA & TOMBOL LOGIN/LOGOUT */}
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

            {/* TOMBOL OTENTIKASI */}
            <li>
              {isProtectedRoute || isLoggedIn ? (
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

      {/* MODAL PERINGATAN AKSES DIBATASI */}
      {showRestrictionModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h2>Akses Dibatasi</h2>
            </div>
            <p className="modal-desc">
              Anda harus melakukan <strong>Log Out</strong> terlebih dahulu sebelum berpindah ke menu lain selama sesi aktif.
            </p>
            <div className="modal-buttons">
              <button 
                type="button" 
                onClick={() => {
                  setShowRestrictionModal(false);
                  handleLogout();
                }}
                className="btn-modal-primary"
              >
                Log Out Sekarang
              </button>
              <button 
                type="button" 
                onClick={() => setShowRestrictionModal(false)}
                className="btn-modal-close"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}