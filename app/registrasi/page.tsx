"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function RegistrasiPage() {
  const router = useRouter();

  return (
    <div className="auth-page">
      {/* ELEMEN LAMPU SOROT */}
      <div className="spotlight-overlay">
        <div className="spotlight-1"></div>
        <div className="spotlight-2"></div>
      </div>

      <div className="auth-card" style={{ maxWidth: "440px", textAlign: "center" }}>
        <div 
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "rgba(255, 51, 51, 0.1)",
            border: "1.5px solid #FF3333",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px"
          }}
        >
          <ShieldAlert size={26} style={{ color: "#FF3333" }} />
        </div>

        <h1 className="auth-title" style={{ fontSize: "20px", marginBottom: "8px" }}>
          REGISTRASI DITUTUP
        </h1>

        <p 
          className="auth-subtitle" 
          style={{ 
            fontSize: "12.5px", 
            lineHeight: "1.6", 
            marginBottom: "20px", 
            color: "rgba(250, 250, 250, 0.7)" 
          }}
        >
          Pendaftaran mandiri telah dinonaktifkan. Seluruh akun mahasiswa baru telah dibuatkan secara resmi oleh Panitia Inisialisasi 2026.
        </p>

        <div 
          style={{
            background: "#0A0A0C",
            border: "1.5px solid #1B22A7",
            borderRadius: "12px",
            padding: "14px 16px",
            marginBottom: "20px",
            fontSize: "12px",
            color: "rgba(250, 250, 250, 0.8)",
            lineHeight: "1.6",
            textAlign: "left"
          }}
        >
          <div style={{ color: "#FAFAFA", fontWeight: 700, marginBottom: "4px" }}>
            Petunjuk Masuk:
          </div>
          Silakan langsung masuk ke sistem menggunakan <strong>NIM</strong> dan <strong>Password Default</strong> yang telah dibagikan oleh pendamping kelompok Anda.
        </div>

        <button
          type="button"
          className="btn-auth-submit"
          onClick={() => router.push("/login")}
          style={{ width: "100%", padding: "12px" }}
        >
          MASUK KE HALAMAN LOGIN
        </button>

        <div className="auth-footer-section" style={{ marginTop: "16px" }}>
          <a
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              color: "rgba(250, 250, 250, 0.4)",
              textDecoration: "none",
              transition: "color 0.3s ease"
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#FAFAFA")}
            onMouseOut={(e) => (e.currentTarget.style.color = "rgba(250, 250, 250, 0.4)")}
          >
            <ArrowLeft size={12} /> Kembali ke Home
          </a>
        </div>
      </div>
    </div>
  );
}