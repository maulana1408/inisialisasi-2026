"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AktivasiPage() {
  const router = useRouter();
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (password !== confirmPassword) {
        throw new Error("Password dan Konfirmasi Password tidak sama!");
      }

      if (password.length < 8) {
        throw new Error("Password minimal harus 8 karakter!");
      }

      const cleanNim = nim.trim();
      const cleanEmail = email.trim();

      // 1. Upsert data ke tabel database users
      const { error: upsertError } = await supabase
        .from("users")
        .upsert(
          {
            nim: cleanNim,
            email: cleanEmail,
            password_hash: password,
            is_active: false,
          },
          { onConflict: "nim" }
        );

      if (upsertError) {
        throw new Error(`Database Error: ${upsertError.message}`);
      }

      // 2. Picu pendaftaran Supabase Auth & Pengiriman Email Verifikasi
      const { error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          emailRedirectTo: "https://inisialisasi-2026.vercel.app/login",
          data: { nim: cleanNim },
        },
      });

      if (authError) {
        // Jika email sudah pernah terdaftar di Auth, kirim ulang email konfirmasi
        if (authError.message.toLowerCase().includes("already registered")) {
          const { error: resendError } = await supabase.auth.resend({
            type: "signup",
            email: cleanEmail,
            options: {
              emailRedirectTo: "https://inisialisasi-2026.vercel.app/login",
            },
          });
          if (resendError) throw new Error(`Resend Error: ${resendError.message}`);
        } else {
          throw new Error(`Auth Error: ${authError.message}`);
        }
      }

      // Tampilkan layar petunjuk cek email
      setIsSent(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan, silakan coba lagi.");
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
        {!isSent ? (
          <>
            <h1 className="auth-title">AKTIVASI AKUN</h1>
            <p className="auth-subtitle">Masukkan NIM, Email, dan Password baru Anda</p>

            {errorMsg && (
              <div style={{ background: "rgba(255, 51, 51, 0.1)", border: "1px solid #FF3333", color: "#FF3333", padding: "10px", borderRadius: "10px", fontSize: "12px", marginBottom: "15px", textAlign: "center" }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <form className="auth-form" onSubmit={handleActivation}>
              {/* INPUT NIM (BEBAS) */}
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

              {/* INPUT EMAIL */}
              <div className="input-group">
                <label htmlFor="email">EMAIL AKTIF</label>
                <input
                  type="email"
                  id="email"
                  placeholder="Masukkan Email Anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* INPUT PASSWORD */}
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

              {/* KONFIRMASI PASSWORD */}
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
          </>
        ) : (
          /* TAMPILAN SETELAH FORM BERHASIL DIKIRIM */
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "rgba(27, 34, 167, 0.2)",
              border: "1px solid #1B22A7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px auto"
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#1B22A7" style={{ width: "30px", height: "30px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>

            <h1 className="auth-title" style={{ fontSize: "20px", marginBottom: "8px" }}>CEK EMAIL ANDA</h1>
            <p className="auth-subtitle" style={{ lineHeight: "1.6", marginBottom: "25px" }}>
              Link konfirmasi verifikasi akun telah dikirimkan ke <br />
              <strong style={{ color: "#ffffff" }}>{email}. Harap cek kotak masuk atau spam</strong>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a 
                href="https://mail.google.com" 
                target="_blank" 
                rel="noreferrer" 
                className="btn-auth-submit"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  textDecoration: "none"
                }}
              >
                Buka Email Saya
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>

              <a href="/login" className="btn-auth-secondary" style={{ textDecoration: "none" }}>
                Kembali Ke Halaman Login
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}