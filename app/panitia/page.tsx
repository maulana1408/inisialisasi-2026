"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import { User, Download, Plus, Megaphone, FileSpreadsheet, Filter, CheckCircle2, AlertCircle } from "lucide-react";

export default function PanitiaDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"rekap" | "tugas" | "pengumuman">("rekap");

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [tasksMap, setTasksMap] = useState<{ [key: string]: any }>({});

  const [filterLateStatus, setFilterLateStatus] = useState<"all" | "ontime" | "late">("all");

  const [taskId, setTaskId] = useState("");
  const [taskCategory, setTaskCategory] = useState("individu");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskRules, setTaskRules] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");

  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [loading, setLoading] = useState(false);

  // 🏝️ State Dynamic Island Sempurna
  const [toast, setToast] = useState<{ show: boolean; isExpanded: boolean; message: string; subMessage: string; isError: boolean }>({
    show: false,
    isExpanded: false,
    message: "",
    subMessage: "",
    isError: false,
  });

  const triggerToast = (message: string, subMessage: string, isError: boolean = false) => {
    setToast({ show: true, isExpanded: false, message, subMessage, isError });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, isExpanded: true }));
    }, 220);

    setTimeout(() => {
      setToast((prev) => ({ ...prev, isExpanded: false }));
      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 350);
    }, 4200);
  };

  useEffect(() => {
    const nim = localStorage.getItem("user_nim");
    if (!nim) {
      router.push("/login");
      return;
    }

    async function verifyRole() {
      const { data } = await supabase.from("users").select("role").eq("nim", nim).single();
      if (!data || (data.role !== "panitia" && data.role !== "admin")) {
        triggerToast("AKSES DITOLAK", "Halaman khusus Panitia/Admin!", true);
        router.push("/penugasan");
        return;
      }
    }

    verifyRole();
    loadData();
  }, []);

  const loadData = async () => {
    const { data: taskData } = await supabase.from("tasks").select("*").order("created_at", { ascending: true }); // Terbaru di bawah
    const { data: subData } = await supabase.from("submissions").select("*, users(nama, nim)").order("submitted_at", { ascending: false });

    if (taskData) {
      const tMap: { [key: string]: any } = {};
      taskData.forEach((t) => (tMap[t.id] = t));
      setTasksMap(tMap);
    }
    if (subData) setSubmissions(subData);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const rulesArray = taskRules.split("\n").filter((r) => r.trim() !== "");

    const { error } = await supabase.from("tasks").insert({
      id: taskId.trim(),
      category: taskCategory,
      title: taskTitle,
      rules: rulesArray,
      deadline: new Date(taskDeadline).toISOString(),
    });

    setLoading(false);
    if (error) {
      triggerToast("GAGAL TAMBAH TUGAS", error.message, true);
    } else {
      triggerToast("BERHASIL DITERBITKAN", "Tugas baru telah dipublikasikan!", false);
      setTaskId(""); setTaskTitle(""); setTaskRules(""); setTaskDeadline("");
      loadData();
    }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("announcements").insert({
      title: annTitle,
      content: annContent,
    });

    setLoading(false);
    if (error) {
      triggerToast("GAGAL TERBITKAN", error.message, true);
    } else {
      triggerToast("BERHASIL DITERBITKAN", "Pengumuman resmi telah dipublikasikan!", false);
      setAnnTitle(""); setAnnContent("");
      loadData();
    }
  };

  const processedSubmissions = submissions.map((sub) => {
    const task = tasksMap[sub.task_id];
    let isLate = false;
    if (task && task.deadline) {
      isLate = new Date(sub.submitted_at) > new Date(task.deadline);
    }
    return { ...sub, isLate };
  });

  const filteredSubmissions = processedSubmissions.filter((sub) => {
    if (filterLateStatus === "ontime") return !sub.isLate;
    if (filterLateStatus === "late") return sub.isLate;
    return true;
  });

  return (
    <>
      <Navbar />

      <div className="dashboard-container" style={{ display: "flex", gap: "24px", maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <aside className="task-sidebar" style={{ width: "260px", flexShrink: 0 }}>
          <div style={{ marginBottom: "15px" }}>
            <div style={{ marginBottom: "10px", background: "rgba(0, 255, 136, 0.1)", border: "1px solid #00FF88", padding: "6px 12px", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <User size={13} style={{ color: "#00FF88" }} />
              <span style={{ fontSize: "11px", color: "#00FF88", fontWeight: 700 }}>PANITIA</span>
            </div>
            <h2 className="sidebar-header-title">MENU UTAMA</h2>
          </div>

          <div className="sidebar-menu" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button type="button" className={`sidebar-btn ${activeTab === "rekap" ? "active" : ""}`} onClick={() => setActiveTab("rekap")}>📊 REKAP PENGUMPULAN</button>
            <button type="button" className={`sidebar-btn ${activeTab === "tugas" ? "active" : ""}`} onClick={() => setActiveTab("tugas")}>➕ TAMBAH TUGAS</button>
            <button type="button" className={`sidebar-btn ${activeTab === "pengumuman" ? "active" : ""}`} onClick={() => setActiveTab("pengumuman")}>📢 BUAT PENGUMUMAN</button>
            <a href="/penugasan" className="sidebar-btn" style={{ marginTop: "15px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#FAFAFA", textAlign: "center", textDecoration: "none", display: "block" }}>👁️ TAMPILAN MAHASISWA</a>
          </div>
        </aside>

        <main className="task-main-content" style={{ flex: 1, minWidth: 0 }}>
          {activeTab === "rekap" && (
            <div className="clickable-task-card" style={{ cursor: "default" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FileSpreadsheet color="#00FF88" size={20} />
                  <h3 style={{ color: "#FAFAFA", fontSize: "16px", margin: 0 }}>REKAP HASIL PENGUMPULAN TUGAS</h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Filter size={14} color="#888" />
                  <select value={filterLateStatus} onChange={(e: any) => setFilterLateStatus(e.target.value)} style={{ background: "#0a0a0a", border: "1px solid #333", color: "#FAFAFA", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                    <option value="all">Semua ({processedSubmissions.length})</option>
                    <option value="ontime">Tepat Waktu ({processedSubmissions.filter(s => !s.isLate).length})</option>
                    <option value="late">Terlambat ({processedSubmissions.filter(s => s.isLate).length})</option>
                  </select>
                </div>
              </div>
              <div className="detail-divider" style={{ marginBottom: "20px" }} />
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", color: "#FAFAFA", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#888", textAlign: "left" }}>
                      <th style={{ padding: "12px" }}>NIM</th>
                      <th style={{ padding: "12px" }}>NAMA</th>
                      <th style={{ padding: "12px" }}>TUGAS ID</th>
                      <th style={{ padding: "12px" }}>WAKTU</th>
                      <th style={{ padding: "12px" }}>STATUS</th>
                      <th style={{ padding: "12px" }}>BERKAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#666" }}>Tidak ada data.</td></tr>
                    ) : (
                      filteredSubmissions.map((sub, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: "12px", fontFamily: "monospace", fontWeight: "bold", color: sub.isLate ? "#FF3333" : "#00FF88" }}>{sub.user_nim}</td>
                          <td style={{ padding: "12px" }}>{sub.users?.nama || "-"}</td>
                          <td style={{ padding: "12px" }}>{sub.task_id}</td>
                          <td style={{ padding: "12px", color: sub.isLate ? "#FF3333" : "#aaa" }}>{new Date(sub.submitted_at).toLocaleString("id-ID")}</td>
                          <td style={{ padding: "12px" }}>
                            {sub.isLate ? <span style={{ background: "rgba(255,51,51,0.15)", border: "1px solid #FF3333", color: "#FF3333", padding: "3px 8px", borderRadius: "50px", fontSize: "10px", fontWeight: 800 }}>TERLAMBAT</span> : <span style={{ background: "rgba(0,255,136,0.12)", border: "1px solid #00FF88", color: "#00FF88", padding: "3px 8px", borderRadius: "50px", fontSize: "10px", fontWeight: 800 }}>TEPAT WAKTU</span>}
                          </td>
                          <td style={{ padding: "12px" }}><a href={sub.file_url} target="_blank" rel="noreferrer" style={{ color: "#00FF88", display: "inline-flex", alignItems: "center", gap: "5px", textDecoration: "none", fontWeight: 600 }}><Download size={14} /> Download</a></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "tugas" && (
            <div className="clickable-task-card" style={{ cursor: "default", maxWidth: "600px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                <Plus color="#00FF88" size={20} />
                <h3 style={{ color: "#FAFAFA", fontSize: "16px", margin: 0 }}>BUAT PENUGASAN BARU</h3>
              </div>
              <div className="detail-divider" style={{ marginBottom: "20px" }} />
              <form onSubmit={handleAddTask} className="auth-form" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="input-group"><label style={{ fontSize: "12px", color: "#aaa" }}>ID Tugas</label><input type="text" placeholder="Contoh: (individu-2" value={taskId} onChange={(e) => setTaskId(e.target.value)} required style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                <div className="input-group"><label style={{ fontSize: "12px", color: "#aaa" }}>Kategori</label><select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }}><option value="individu">Individu</option><option value="kelompok">Kelompok</option><option value="angkatan">Angkatan</option></select></div>
                <div className="input-group"><label style={{ fontSize: "12px", color: "#aaa" }}>Judul</label><input type="text" placeholder="Judul..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                <div className="input-group"><label style={{ fontSize: "12px", color: "#aaa" }}>Ketentuan</label><textarea rows={4} placeholder="Poin...(klik enter untuk memisahkan tiap poin)" value={taskRules} onChange={(e) => setTaskRules(e.target.value)} required style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                <div className="input-group"><label style={{ fontSize: "12px", color: "#aaa" }}>Deadline</label><input type="datetime-local" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} required style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                <button type="submit" className="btn-auth-submit" disabled={loading} style={{ marginTop: "10px", padding: "12px", background: "#00FF88", color: "#000", fontWeight: 700, border: "none", borderRadius: "8px", cursor: "pointer" }}>{loading ? "MENYIMPAN..." : "TERBITKAN TUGAS"}</button>
              </form>
            </div>
          )}

          {activeTab === "pengumuman" && (
            <div className="clickable-task-card" style={{ cursor: "default", maxWidth: "600px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                <Megaphone color="#00FF88" size={20} />
                <h3 style={{ color: "#FAFAFA", fontSize: "16px", margin: 0 }}>BUAT PENGUMUMAN RESMI</h3>
              </div>
              <div className="detail-divider" style={{ marginBottom: "20px" }} />
              <form onSubmit={handleAddAnnouncement} className="auth-form" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="input-group"><label style={{ fontSize: "12px", color: "#aaa" }}>Judul</label><input type="text" placeholder="Judul..." value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} required style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                <div className="input-group"><label style={{ fontSize: "12px", color: "#aaa" }}>Isi</label><textarea rows={6} placeholder="Isi..." value={annContent} onChange={(e) => setAnnContent(e.target.value)} required style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                <button type="submit" className="btn-auth-submit" disabled={loading} style={{ marginTop: "10px", padding: "12px", background: "#00FF88", color: "#000", fontWeight: 700, border: "none", borderRadius: "8px", cursor: "pointer" }}>{loading ? "TERBITKAN..." : "TERBITKAN PENGUMUMAN"}</button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* 🏝️ DYNAMIC ISLAND SEMPURNA */}
      <div style={{ position: "fixed", top: "110px", left: "50%", transform: "translateX(-50%)", zIndex: 99999999, pointerEvents: "none", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{
          background: "#0a0a0e",
          border: toast.isError ? "1.5px solid rgba(255, 51, 51, 0.9)" : "1.5px solid rgba(0, 255, 136, 0.9)",
          borderRadius: "50px",
          height: "48px",
          minWidth: toast.isExpanded ? "340px" : "48px",
          maxWidth: toast.isExpanded ? "480px" : "48px",
          padding: toast.isExpanded ? "0 18px 0 8px" : "0",
          boxShadow: toast.isError ? "0 15px 35px rgba(255, 51, 51, 0.35), 0 0 15px rgba(255, 51, 51, 0.2)" : "0 15px 35px rgba(0, 255, 136, 0.35), 0 0 15px rgba(0, 255, 136, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: toast.isExpanded ? "flex-start" : "center",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxSizing: "border-box",
          overflow: "hidden",
          transition: toast.show && !toast.isExpanded ? "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)" : "all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
          opacity: toast.show ? 1 : 0,
          transform: toast.show ? "scale(1)" : "scale(0.1)"
        }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: toast.isError ? "rgba(255, 51, 51, 0.2)" : "rgba(0, 255, 136, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {toast.isError ? <AlertCircle style={{ width: "18px", height: "18px", color: "#FF3333" }} /> : <CheckCircle2 style={{ width: "18px", height: "18px", color: "#00FF88" }} />}
          </div>
          {toast.isExpanded && (
            <div style={{ display: "flex", flexDirection: "column", textAlign: "left", paddingLeft: "10px", whiteSpace: "nowrap", overflow: "hidden" }}>
              <h4 style={{ margin: 0, fontSize: "12px", fontWeight: 800, color: toast.isError ? "#FF3333" : "#00FF88", letterSpacing: "0.6px", textTransform: "uppercase", lineHeight: "1.2" }}>{toast.message}</h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "11.5px", color: "rgba(250, 250, 250, 0.9)", lineHeight: "1.2" }}>{toast.subMessage}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}