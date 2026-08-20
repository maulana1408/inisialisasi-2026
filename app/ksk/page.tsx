"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { 
  ShieldAlert, 
  UserCheck, 
  AlertTriangle, 
  FileCheck2, 
  ExternalLink,
  Award,
  CheckCircle,
  Unlock
} from "lucide-react";

export default function KskPanelPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Data State
  const [students, setStudents] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<"presensi" | "pelanggaran" | "tugas" | "kelulusan">("presensi");

  // Form Presensi
  const [presensiNim, setPresensiNim] = useState("");
  const [sessionName, setSessionName] = useState("Day 1");

  // Form Pelanggaran / Pengurangan Poin
  const [violationNim, setViolationNim] = useState("");
  const [pointDeduction, setPointDeduction] = useState<number>(10);
  const [violationReason, setViolationReason] = useState("");

  // Toast Notif
  const [toast, setToast] = useState({ show: false, message: "", isError: false });

  const triggerToast = (message: string, isError: boolean = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: "", isError: false }), 3500);
  };

  useEffect(() => {
    const savedNim = localStorage.getItem("user_nim");
    const savedRole = localStorage.getItem("user_role");

    if (!savedNim) {
      router.push("/login");
      return;
    }

    supabase.from("users").select("role").eq("nim", savedNim).single().then(({ data }) => {
      if (data && (data.role === "ksk" || data.role === "panitia" || data.role === "admin")) {
        setUserRole(data.role);
        setIsAuthorized(true);
        fetchKskData();
      } else {
        router.push("/penugasan");
      }
    });
  }, []);

  const fetchKskData = async () => {
    try {
      const { data: userData } = await supabase
        .from("users")
        .select("nim, nama, total_points, is_graduated")
        .order("nama", { ascending: true });
      if (userData) setStudents(userData);

      const { data: subData } = await supabase
        .from("submissions")
        .select("*")
        .order("submitted_at", { ascending: false });
      if (subData) setSubmissions(subData);
    } catch (err) {
      console.error("Error fetching KSK data:", err);
    }
  };

  // 1. Input Presensi (+75 Poin)
  const handleAddAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presensiNim) return;

    try {
      const targetStudent = students.find(s => s.nim === presensiNim);
      if (!targetStudent) {
        triggerToast("NIM mahasiswa tidak ditemukan!", true);
        return;
      }

      const { error: attError } = await supabase
        .from("attendance")
        .insert([{ user_nim: presensiNim, session_name: sessionName, points_awarded: 75 }]);

      if (attError) {
        if (attError.message.includes("duplicate")) {
          throw new Error(`Mahasiswa dengan NIM ${presensiNim} sudah tercatat presensi untuk sesi ${sessionName}!`);
        }
        throw attError;
      }

      const newTotalPoints = (targetStudent.total_points || 0) + 75;
      
      // Otomatis tentukan status kelulusan jika poin >= 300
      const isGraduatedAuto = newTotalPoints >= 300;

      await supabase
        .from("users")
        .update({ total_points: newTotalPoints, is_graduated: isGraduatedAuto })
        .eq("nim", presensiNim);

      await supabase.from("point_logs").insert([{
        user_nim: presensiNim,
        points_change: 75,
        reason: `Presensi ${sessionName}`,
        created_by: localStorage.getItem("user_nim")
      }]);

      triggerToast(`Berhasil mencatat presensi ${sessionName} (+75 Poin) untuk ${targetStudent.nama}`);
      setPresensiNim("");
      fetchKskData();
    } catch (err: any) {
      triggerToast(err.message || "Gagal mencatat presensi", true);
    }
  };

  // 2. Catat Pelanggaran
  const handleAddViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!violationNim || !violationReason) return;

    try {
      const targetStudent = students.find(s => s.nim === violationNim);
      if (!targetStudent) {
        triggerToast("NIM mahasiswa tidak ditemukan!", true);
        return;
      }

      const deduction = -Math.abs(pointDeduction);
      const newTotalPoints = Math.max(0, (targetStudent.total_points || 0) + deduction);
      const isGraduatedAuto = newTotalPoints >= 300;

      await supabase
        .from("users")
        .update({ total_points: newTotalPoints, is_graduated: isGraduatedAuto })
        .eq("nim", violationNim);

      await supabase.from("point_logs").insert([{
        user_nim: violationNim,
        points_change: deduction,
        reason: `Pelanggaran: ${violationReason}`,
        created_by: localStorage.getItem("user_nim")
      }]);

      triggerToast(`Berhasil mencatat sanksi (${deduction} Poin) untuk ${targetStudent.nama}`);
      setViolationNim("");
      setViolationReason("");
      fetchKskData();
    } catch (err: any) {
      triggerToast(err.message || "Gagal mencatat pelanggaran", true);
    }
  };

  // 3. Trigger Buka Serentak Status Kelulusan Berdasarkan Target 300 Poin
  const handleTriggerGlobalGraduation = async () => {
    if (!confirm("Apakah Anda yakin ingin mengunci dan merilis status kelulusan akhir untuk seluruh Maba berdasarkan akumulasi 300 poin?")) return;

    try {
      // Update massal di database berdasarkan poin >= 300
      for (const student of students) {
        const passed = (student.total_points || 0) >= 300;
        await supabase
          .from("users")
          .update({ is_graduated: passed })
          .eq("nim", student.nim);
      }

      triggerToast("Status kelulusan berhasil dirilis dan diperbarui untuk seluruh Maba!");
      fetchKskData();
    } catch (err: any) {
      triggerToast("Gagal merilis status kelulusan: " + err.message, true);
    }
  };

  if (!isAuthorized) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "#0a0a0e" }}>
        <p>Memverifikasi Akses KSK...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0a0a0e", color: "#FAFAFA" }}>
      <Navbar />

      <div style={{ maxWidth: "1200px", width: "100%", margin: "0 auto", padding: "120px 24px 60px 24px", boxSizing: "border-box" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(0, 255, 136, 0.1)", border: "1px solid #00FF88", padding: "6px 12px", borderRadius: "8px", marginBottom: "10px" }}>
              <ShieldAlert size={14} style={{ color: "#00FF88" }} />
              <span style={{ fontSize: "11px", color: "#00FF88", fontWeight: 700, textTransform: "uppercase" }}>PANEL KHUSUS KSK / KEDISIPLINAN</span>
            </div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800 }}>Manajemen Presensi, Poin & Kelulusan Maba</h1>
          </div>
          
          <a href="/penugasan" style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontSize: "12px", textDecoration: "none", fontWeight: 600 }}>
            ← Kembali ke Menu Utama
          </a>
        </div>

        {/* TAB NAVIGASI */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "25px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "15px", flexWrap: "wrap" }}>
          <button 
            onClick={() => setSelectedTab("presensi")}
            style={{ background: selectedTab === "presensi" ? "#00FF88" : "rgba(255,255,255,0.05)", color: selectedTab === "presensi" ? "#000" : "#fff", border: selectedTab === "presensi" ? "none" : "1px solid rgba(255,255,255,0.1)", padding: "10px 20px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}
          >
            📋 Input Presensi Harian
          </button>
          <button 
            onClick={() => setSelectedTab("pelanggaran")}
            style={{ background: selectedTab === "pelanggaran" ? "#FF3333" : "rgba(255,255,255,0.05)", color: selectedTab === "pelanggaran" ? "#fff" : "#fff", border: selectedTab === "pelanggaran" ? "none" : "1px solid rgba(255,255,255,0.1)", padding: "10px 20px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}
          >
            ⚠️ Sanksi & Pengurangan Poin
          </button>
          <button 
            onClick={() => setSelectedTab("tugas")}
            style={{ background: selectedTab === "tugas" ? "#00FF88" : "rgba(255,255,255,0.05)", color: selectedTab === "tugas" ? "#000" : "#fff", border: selectedTab === "tugas" ? "none" : "1px solid rgba(255,255,255,0.1)", padding: "10px 20px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}
          >
            📁 Validasi Tugas Maba ({submissions.length})
          </button>
          <button 
            onClick={() => setSelectedTab("kelulusan")}
            style={{ background: selectedTab === "kelulusan" ? "#1B22A7" : "rgba(255,255,255,0.05)", color: "#fff", border: selectedTab === "kelulusan" ? "none" : "1px solid rgba(255,255,255,0.1)", padding: "10px 20px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}
          >
            🎓 Rilis Kelulusan Akhir
          </button>
        </div>

        {/* TOAST NOTIFIKASI */}
        {toast.show && (
          <div style={{ background: toast.isError ? "rgba(255, 51, 51, 0.15)" : "rgba(0, 255, 136, 0.15)", border: toast.isError ? "1px solid #FF3333" : "1px solid #00FF88", color: toast.isError ? "#FF3333" : "#00FF88", padding: "12px 20px", borderRadius: "10px", marginBottom: "20px", fontSize: "13px", fontWeight: 600 }}>
            {toast.isError ? "⚠️ " : "✅ "} {toast.message}
          </div>
        )}

        {/* KONTEN TAB 1: PRESENSI */}
        {selectedTab === "presensi" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", alignItems: "start" }}>
            <div style={{ background: "#111115", border: "1px solid rgba(255,255,255,0.1)", padding: "24px", borderRadius: "16px" }}>
              <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <UserCheck size={18} style={{ color: "#00FF88" }} /> Input Kehadiran Sesi
              </h3>
              <form onSubmit={handleAddAttendance} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "rgba(250,250,250,0.6)", fontWeight: 700, display: "block", marginBottom: "6px" }}>NIM Mahasiswa</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 082211133" 
                    value={presensiNim} 
                    onChange={(e) => setPresensiNim(e.target.value)}
                    required
                    style={{ width: "100%", background: "#0a0a0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "8px", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "rgba(250,250,250,0.6)", fontWeight: 700, display: "block", marginBottom: "6px" }}>Sesi Acara</label>
                  <select 
                    value={sessionName} 
                    onChange={(e) => setSessionName(e.target.value)}
                    style={{ width: "100%", background: "#0a0a0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "8px", fontSize: "13px" }}
                  >
                    <option value="Pra-Inisialisasi">Pra-Inisialisasi (+75 Poin)</option>
                    <option value="Day 1">Day 1 (+75 Poin)</option>
                    <option value="Day 2">Day 2 (+75 Poin)</option>
                    <option value="Day 3">Day 3 (+75 Poin)</option>
                    <option value="Day 4">Day 4 (+75 Poin)</option>
                  </select>
                </div>
                <button type="submit" style={{ background: "#00FF88", color: "#000", fontWeight: 800, padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "5px" }}>
                  SIMPAN KEHADIRAN (+75 POIN)
                </button>
              </form>
            </div>

            <div style={{ background: "#111115", border: "1px solid rgba(255,255,255,0.1)", padding: "24px", borderRadius: "16px" }}>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>📊 Rekap Poin Maba</h3>
              <p style={{ fontSize: "12px", color: "rgba(250,250,250,0.5)", marginBottom: "15px" }}>Target kelulusan minimal adalah 300 poin.</p>
              <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {students.map((s) => (
                  <div key={s.nim} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 700, display: "block" }}>{s.nama}</span>
                      <span style={{ fontSize: "11px", color: "rgba(250,250,250,0.5)" }}>NIM: {s.nim}</span>
                    </div>
                    <div style={{ background: "rgba(0, 255, 136, 0.1)", border: "1px solid #00FF88", padding: "4px 10px", borderRadius: "6px", color: "#00FF88", fontWeight: 800, fontSize: "12px" }}>
                      {s.total_points || 0} Poin
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KONTEN TAB 2: PELANGGARAN */}
        {selectedTab === "pelanggaran" && (
          <div style={{ background: "#111115", border: "1px solid rgba(255,255,255,0.1)", padding: "24px", borderRadius: "16px", maxWidth: "600px" }}>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={18} style={{ color: "#FF3333" }} /> Kurangi Poin (Keterlambatan / Pelanggaran)
            </h3>
            <form onSubmit={handleAddViolation} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "rgba(250,250,250,0.6)", fontWeight: 700, display: "block", marginBottom: "6px" }}>NIM Mahasiswa</label>
                <input 
                  type="text" 
                  placeholder="Contoh: 082211133" 
                  value={violationNim} 
                  onChange={(e) => setViolationNim(e.target.value)}
                  required
                  style={{ width: "100%", background: "#0a0a0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "8px", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "rgba(250,250,250,0.6)", fontWeight: 700, display: "block", marginBottom: "6px" }}>Jumlah Poin yang Dikurangi</label>
                <input 
                  type="number" 
                  value={pointDeduction} 
                  onChange={(e) => setPointDeduction(Number(e.target.value))}
                  required
                  style={{ width: "100%", background: "#0a0a0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "8px", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "rgba(250,250,250,0.6)", fontWeight: 700, display: "block", marginBottom: "6px" }}>Alasan Pelanggaran</label>
                <textarea 
                  rows={3}
                  placeholder="Contoh: Terlambat hadir Day 2 selama 30 menit" 
                  value={violationReason} 
                  onChange={(e) => setViolationReason(e.target.value)}
                  required
                  style={{ width: "100%", background: "#0a0a0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "8px", fontSize: "13px", resize: "vertical" }}
                />
              </div>
              <button type="submit" style={{ background: "#FF3333", color: "#fff", fontWeight: 800, padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "5px" }}>
                KURANGI POIN MAHASISWA
              </button>
            </form>
          </div>
        )}

        {/* KONTEN TAB 3: VALIDASI TUGAS */}
        {selectedTab === "tugas" && (
          <div style={{ background: "#111115", border: "1px solid rgba(255,255,255,0.1)", padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FileCheck2 size={18} style={{ color: "#00FF88" }} /> Daftar Tugas Masuk Maba
            </h3>
            {submissions.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {submissions.map((sub) => (
                  <div key={sub.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "14px 18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <span style={{ fontSize: "14px", fontWeight: 700, display: "block", color: "#00FF88" }}>{sub.tugas_id || "Tugas Penugasan"}</span>
                      <span style={{ fontSize: "12px", color: "rgba(250,250,250,0.8)" }}>Oleh: <strong>{sub.nama}</strong> (NIM: {sub.user_nim})</span>
                      <span style={{ fontSize: "11px", color: "rgba(250, 250, 250, 0.5)", display: "block", marginTop: "2px" }}>Status: {sub.status} • Dikirim: {new Date(sub.submitted_at).toLocaleString("id-ID")}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <a href={sub.file_url} target="_blank" rel="noreferrer" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", textDecoration: "none", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        LIHAT BERKAS <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "rgba(250,250,250,0.5)", fontSize: "13px", textAlign: "center", padding: "30px 0" }}>Belum ada pengumpulan tugas dari mahasiswa.</p>
            )}
          </div>
        )}

        {/* KONTEN TAB 4: RILIS KELULUSAN */}
        {selectedTab === "kelulusan" && (
          <div style={{ background: "#111115", border: "1px solid rgba(255,255,255,0.1)", padding: "24px", borderRadius: "16px", maxWidth: "600px" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Award size={18} style={{ color: "#00FF88" }} /> Pengumuman Kelulusan Akhir (Sebelum Pengukuhan)
            </h3>
            <p style={{ fontSize: "13px", color: "rgba(250,250,250,0.7)", lineHeight: "1.6", marginBottom: "20px" }}>
              Tombol ini digunakan untuk membuka dan mengumumkan status kelulusan mahasiswa secara serentak. Sistem akan otomatis mengevaluasi mahasiswa yang telah mencapai minimal 300 poin untuk dinyatakan <strong>LULUS</strong>.
            </p>
            <button 
              onClick={handleTriggerGlobalGraduation}
              style={{ background: "linear-gradient(135deg, #00FF88 0%, #00B359 100%)", color: "#000", fontWeight: 800, padding: "14px 24px", border: "none", borderRadius: "10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px" }}
            >
              <Unlock size={16} /> RILIS STATUS KELULUSAN SERENTAK
            </button>
          </div>
        )}

      </div>
    </div>
  );
}