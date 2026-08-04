"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AktivasiPage() {
  const router = useRouter();
  const [nim, setNim] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (password !== confirmPassword) {
        throw new Error("Password dan Konfirmasi Password tidak sama!");
      }

      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("nim", nim.trim())
        .ilike("token_konfirmasi", token.trim())
        .maybeSingle();

      if (error || !user) {
        throw new Error("NIM atau Token Konfirmasi tidak valid!");
      }

      if (user.is_active) {
        throw new Error("Akun ini sudah aktif! Silakan langsung login.");
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({
          is_active: true,
          password_hash: password,
        })
        .eq("nim", nim.trim());

      if (updateError) {
        throw new Error("Gagal mengaktifkan akun. Coba lagi.");
      }

      setSuccessMsg("Aktivasi berhasil! Mengalihkan ke halaman login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* 🟢 ELEMEN LAMPU SOROT */}
      <div className="spotlight-overlay">
        <div className="spotlight-1"></div>
        <div className="spotlight-2"></div>
      </div>

      <div className="auth-card">
        <h1 className="auth-title">AKTIVASI AKUN</h1>
        <p className="auth-subtitle">Aktivasi akunmu terlebih dahulu sebelum login</p>

        {errorMsg && (
          <div style={{ background: "rgba(255, 51, 51, 0.1)", border: "1px solid #FF3333", color: "#FF3333", padding: "10px", borderRadius: "10px", fontSize: "12px", marginBottom: "15px" }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ background: "rgba(0, 255, 136, 0.1)", border: "1px solid #00FF88", color: "#00FF88", padding: "10px", borderRadius: "10px", fontSize: "12px", marginBottom: "15px" }}>
            ✓ {successMsg}
          </div>
        )}

        <form className="auth-form" onSubmit={handleActivation}>
          <div className="input-group">
            <label htmlFor="nim">NIM</label>
            <input
              type="text"
              id="nim"
              placeholder="Masukkan NIM Anda"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="token">TOKEN KONFIRMASI</label>
            <input
              type="text"
              id="token"
              placeholder="Masukkan Token Konfirmasi"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">PASSWORD</label>
            <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Masukkan Password Baru (min. 8 karakter)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                style={{ width: "100%", paddingRight: "45px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "15px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#1B22A7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  zIndex: 10
                }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">KONFIRMASI PASSWORD</label>
            <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Masukkan Ulang Password Baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                style={{ width: "100%", paddingRight: "45px" }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  right: "15px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#1B22A7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  zIndex: 10
                }}
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? "MEMPROSES..." : "AKTIFKAN AKUN"}
          </button>
        </form>

        <div className="auth-footer-section" style={{ marginTop: "15px" }}>
          <a href="/login" className="btn-auth-secondary">Kembali Ke Halaman Login</a>
          
          <a 
            href="/" 
            style={{
              display: "inline-block",
              marginTop: "0px",
              fontSize: "11px",
              color: "rgba(250, 250, 250, 0.4)",
              textDecoration: "none",
              transition: "color 0.3s ease"
            }}
            onMouseOver={(e) => e.currentTarget.style.color = "#FAFAFA"}
            onMouseOut={(e) => e.currentTarget.style.color = "rgba(250, 250, 250, 0.4)"}
          >
            ← Kembali ke Home
          </a>
        </div>
      </div>
    </div>
  );
}