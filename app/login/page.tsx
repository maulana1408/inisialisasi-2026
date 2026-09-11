"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Tautan Google Spreadsheet data akun mahasiswa baru
  const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/173coAN3e1z7JT4538SomxEHe59SVlPHO3w08WsqexgM/edit?usp=sharing";

  // State Modal Wajib Ganti Password Saat First Login
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const cleanNim = nim.trim();

      // 1. Ambil data user dari tabel users berdasarkan NIM
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("nim", cleanNim)
        .maybeSingle();

      if (error || !user) {
        throw new Error("NIM atau Password yang Anda masukkan salah!");
      }

      // 2. Cek apakah password cocok
      if (user.password_hash !== password) {
        throw new Error("NIM atau Password yang Anda masukkan salah!");
      }

      // 3. Cek apakah status akun sudah aktif
      if (!user.is_active) {
        throw new Error("Akun Anda belum aktif. Hubungi panitia pendamping kelompok Anda.");
      }

      // 4. Cek apakah pengguna wajib mengganti password awal
      if (user.must_change_password) {
        setActiveUser(user);
        setIsChangeModalOpen(true);
        setLoading(false);
        return;
      }

      // 5. Simpan session di LocalStorage dengan penanganan nilai NULL
      localStorage.setItem("user_nim", user.nim);
      localStorage.setItem("user_nama", user.nama || user.nim);
      if (user.role) localStorage.setItem("user_role", user.role);

      // Redirect ke halaman penugasan
      router.push("/penugasan");
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat login.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!newPassword || newPassword.length < 8) {
      setModalError("Password baru minimal harus 8 karakter!");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setModalError("Konfirmasi password baru tidak cocok!");
      return;
    }

    if (newPassword === activeUser?.password_hash) {
      setModalError("Password baru tidak boleh sama dengan password default!");
      return;
    }

    setModalLoading(true);

    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          password_hash: newPassword,
          must_change_password: false,
        })
        .eq("nim", activeUser.nim);

      if (updateError) {
        throw new Error(`Gagal menyimpan password: ${updateError.message}`);
      }

      localStorage.setItem("user_nim", activeUser.nim);
      localStorage.setItem("user_nama", activeUser.nama || activeUser.nim);
      if (activeUser.role) localStorage.setItem("user_role", activeUser.role);

      setIsChangeModalOpen(false);
      router.push("/penugasan");
    } catch (err: any) {
      setModalError(err.message || "Gagal memperbarui password.");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ELEMEN LAMPU SOROT */}
      <div className="spotlight-overlay">
        <div className="spotlight-1"></div>
        <div className="spotlight-2"></div>
      </div>

      <div className="auth-card">
        <h1 className="auth-title">LOGIN</h1>
        <p className="auth-subtitle">Login dengan menggunakan NIM dan Password akun Anda</p>

        {errorMsg && (
          <div style={{ background: "rgba(255, 51, 51, 0.1)", border: "1px solid #FF3333", color: "#FF3333", padding: "10px", borderRadius: "10px", fontSize: "12px", marginBottom: "15px", textAlign: "center" }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form className="auth-form" onSubmit={handleLogin}>
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

          {/* INPUT PASSWORD */}
          <div className="input-group">
            <label htmlFor="password">PASSWORD</label>
            <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Masukkan Password Anda"
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
                  zIndex: 10,
                  transform: "none !important",
                  boxShadow: "none !important",
                  transition: "none !important"
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

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? "MEMERIKSA..." : "LOGIN"}
          </button>
        </form>

        {/* TAUTAN MENUJU SPREADSHEET DATA AKUN MABA */}
        <div className="auth-footer-section" style={{ marginTop: "15px" }}>
          <a 
            href={SPREADSHEET_URL} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-auth-secondary"
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: "6px",
              textDecoration: "none"
            }}
          >
            <span>Cek Data Akun & Kelompok Inisialisasi 2026</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 0 0" strokeWidth="2" stroke="currentColor" style={{ width: "13px", height: "0px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
          
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

      {/* MODAL WAJIB GANTI PASSWORD */}
      {isChangeModalOpen && (
        <div className="modal-overlay active" style={{ zIndex: 999999 }}>
          <div className="auth-card" style={{ maxWidth: "440px", margin: "0 auto" }} onClick={(e) => e.stopPropagation()}>
            <h1 className="auth-title" style={{ fontSize: "18px", marginBottom: "8px" }}>
              AKTIVASI PASSWORD BARU
            </h1>
            <p className="auth-subtitle" style={{ fontSize: "12px", marginBottom: "20px", lineHeight: "1.5" }}>
              Halo <strong style={{ color: "#FAFAFA" }}>{activeUser?.nama}</strong>! Buat password pribadi Anda sebelum melanjutkan ke dashboard penugasan.
            </p>

            {modalError && (
              <div style={{ background: "rgba(255, 51, 51, 0.1)", border: "1px solid #FF3333", color: "#FF3333", padding: "10px", borderRadius: "10px", fontSize: "12px", marginBottom: "15px", textAlign: "center" }}>
                ⚠️ {modalError}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSaveNewPassword}>
              {/* PASSWORD BARU */}
              <div className="input-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="newPassword">PASSWORD BARU</label>
                  <span style={{ fontSize: "10px", color: newPassword.length >= 8 ? "#fafafa" : "rgba(250, 250, 250, 0.4)", fontWeight: "600" }}>
                    {newPassword.length >= 8 ? "Password memenuhi syarat" : `(${newPassword.length}/8)`}
                  </span>
                </div>
                <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    placeholder="Minimal 8 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ width: "100%", paddingRight: "45px" }}
                  />
                  <button
                    type="button"
                    className="btn-eye-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
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
                      zIndex: 10,
                      transform: "none !important",
                      boxShadow: "none !important",
                      transition: "none !important"
                    }}
                    aria-label="Toggle password visibility"
                  >
                    {showNewPassword ? (
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

              {/* KONFIRMASI PASSWORD BARU */}
              <div className="input-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="confirmNewPassword">KONFIRMASI PASSWORD</label>
                  <span style={{ fontSize: "10px", color: newPassword.length >= 8 && confirmNewPassword.length >= 8 && newPassword === confirmNewPassword ? "#fafafa" : "#FF3333", fontWeight: "600" }}>
                    {newPassword.length < 8 || confirmNewPassword.length < 8
                      ? ""
                      : newPassword === confirmNewPassword
                        ? "Konfirmasi password sesuai"
                        : "⚠️ Konfirmasi password belum cocok"}
                  </span>
                </div>
                <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    id="confirmNewPassword"
                    placeholder="Ulangi Password Baru"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    style={{ width: "100%", paddingRight: "45px" }}
                  />
                  <button
                    type="button"
                    className="btn-eye-toggle"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
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
                      zIndex: 10,
                      transform: "none !important",
                      boxShadow: "none !important",
                      transition: "none !important"
                    }}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmNewPassword ? (
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

              <button type="submit" className="btn-auth-submit" disabled={modalLoading} style={{ marginTop: "10px" }}>
                {modalLoading ? "MEMPROSES..." : "SIMPAN PASSWORD & MASUK"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}