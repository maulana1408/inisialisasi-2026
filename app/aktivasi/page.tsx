"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AktivasiPage() {
  const router = useRouter();
  const [nim, setNim] = useState("");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Toggle Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSent, setIsSent] = useState(false);

  const handleNamaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = rawVal
      .toLowerCase()
      .replace(/[^a-zA-Z\s]/g, "")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    setNama(formatted);
  };

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const cleanNim = nim.trim();
      const cleanNama = nama.trim().replace(/\s+/g, " ");
      const cleanEmail = email.trim();

      if (!cleanNama || cleanNama.length < 3) {
        throw new Error("Nama lengkap harus diisi dengan benar (minimal 3 karakter)!");
      }

      if (password !== confirmPassword) {
        throw new Error("Password dan Konfirmasi Password tidak sama!");
      }

      if (password.length < 8) {
        throw new Error("Password minimal harus 8 karakter!");
      }

      const { error: upsertError } = await supabase
        .from("users")
        .upsert(
          {
            nim: cleanNim,
            nama: cleanNama,
            email: cleanEmail,
            password_hash: password,
            is_active: false,
          },
          { onConflict: "nim" }
        );

      if (upsertError) {
        throw new Error(`Database Error: ${upsertError.message}`);
      }

      const { error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          emailRedirectTo: "https://inisialisasi-2026.vercel.app/login",
          data: { 
            nim: cleanNim,
            nama: cleanNama 
          },
        },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes("already registered")) {
          await supabase.auth.resend({
            type: "signup",
            email: cleanEmail,
            options: {
              emailRedirectTo: "url?id=0",
            },
          });
        } else {
          throw new Error(`Auth Error: ${authError.message}`);
        }
      }

      setIsSent(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan, silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="spotlight-overlay">
        <div className="spotlight-1"></div>
        <div className="spotlight-2"></div>
      </div>

      <div className="auth-card">
        {!isSent ? (
          <>
            <h1 className="auth-title">REGISTRASI AKUN</h1>
            <p className="auth-subtitle">
              Lengkapi data diri Anda untuk registrasi akun Inisialisasi 2026
            </p>

            {errorMsg && (
              <div style={{ background: "rgba(255, 51, 51, 0.1)", border: "1px solid #FF3333", color: "#FF3333", padding: "10px", borderRadius: "10px", fontSize: "12px", marginBottom: "15px", textAlign: "center" }}>
                ⚠️ {errorMsg}
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
                <label htmlFor="nama">NAMA LENGKAP</label>
                <input
                  type="text"
                  id="nama"
                  placeholder="Contoh: Ahmad Rizky"
                  value={nama}
                  onChange={handleNamaChange}
                  required
                />
              </div>

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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="password">PASSWORD</label>
                  <span style={{ fontSize: "10px", color: password.length >= 8 ? "#fafafa" : "rgba(250, 250, 250, 0.4)", fontWeight: "600" }}>
                    {password.length >= 8 ? "Password memenuhi syarat" : `(${password.length}/8 karakter)`}
                  </span>
                </div>
                <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Buat Password (Min 8 karakter)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ width: "100%", paddingRight: "45px" }}
                  />
                  <button
                    type="button"
                    className="btn-eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute", right: "15px", background: "transparent", border: "none", cursor: "pointer", color: "#1B22A7", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, zIndex: 10
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

              {/* INPUT KONFIRMASI PASSWORD (KETERANGAN MUNCUL SETELAH >= 8 KARAKTER) */}
              <div className="input-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="confirmPassword">KONFIRMASI PASSWORD</label>
                  <span style={{ fontSize: "10px", color: password.length >= 8 && confirmPassword.length >= 8 && password === confirmPassword ? "#fafafa" : "#FF3333", fontWeight: "600" }}>
                    {password.length < 8 || confirmPassword.length < 8
                      ? "" 
                      : password === confirmPassword 
                        ? "Konfirmasi password sesuai dengan password" 
                        : "⚠️ Konfirmasi password belum sesuai password"}
                  </span>
                </div>
                <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    placeholder="Ulangi Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ width: "100%", paddingRight: "45px" }}
                  />
                  <button
                    type="button"
                    className="btn-eye-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute", right: "15px", background: "transparent", border: "none", cursor: "pointer", color: "#1B22A7", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, zIndex: 10
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
                {loading ? "PROSES..." : "REGISTRASI AKUN"}
              </button>
            </form>

            <div className="auth-footer-section" style={{ marginTop: "15px" }}>
              <a 
                href="/login" 
                style={{
                  fontSize: "11px",
                  color: "rgba(250, 250, 250, 0.4)",
                  textDecoration: "none",
                  transition: "color 0.3s ease"
                }}
                onMouseOver={(e) => e.currentTarget.style.color = "#FAFAFA"}
                onMouseOut={(e) => e.currentTarget.style.color = "rgba(250, 250, 250, 0.4)"}
              >
                ← Kembali ke halaman Login
              </a>
            </div>
          </>
        ) : (
          /* CARD KHUSUS SETELAH BERHASIL KLIK AKTIFKAN */
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ width: "50px", height: "50px", background: "rgba(0, 255, 136, 0.1)", border: "2px solid #00FF88", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto", color: "#00FF88", fontSize: "24px" }}>
              ✓
            </div>
            <h2 className="auth-title" style={{ fontSize: "18px", marginBottom: "10px" }}>REGISTRASI BERHASIL</h2>
            <p className="auth-subtitle" style={{ marginBottom: "25px", lineHeight: "1.6" }}>
              Tautan verifikasi telah dikirimkan ke email Anda (<strong style={{ color: "#FAFAFA" }}>{email}</strong>). Silakan buka kotak masuk email Anda untuk mengaktifkan akun.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              <a 
                href="https://mail.google.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={() => router.push("/login")}
                className="btn-auth-submit"
                style={{ 
                  background: "linear-gradient(135deg, #00FF88 0%, #00B359 100%)", 
                  color: "#0A0A0C", 
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                Buka Email / Kotak Masuk →
              </a>

              <a 
                href="/login" 
                className="btn-auth-secondary"
                style={{ width: "100%", textAlign: "center", boxSizing: "border-box" }}
              >
                ← Kembali ke halaman Login
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}