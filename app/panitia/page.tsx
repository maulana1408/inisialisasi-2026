"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import { User, Eye, Plus, Megaphone, FileSpreadsheet, Filter, CheckCircle2, AlertCircle } from "lucide-react";

export default function PanitiaDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"rekap" | "tugas" | "pengumuman">("rekap");

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [tasksMap, setTasksMap] = useState<{ [key: string]: any }>({});
  const [tasks, setTasks] = useState<any[]>([]);

  // 🟢 State Filter Rekap (Kategori, Status, dan Judul Tugas)
  const [filterCategory, setFilterCategory] = useState<"all" | "individu" | "kelompok" | "angkatan">("all");
  const [filterLateStatus, setFilterLateStatus] = useState<"all" | "ontime" | "late">("all");
  const [filterTaskTitle, setFilterTaskTitle] = useState<string>("all");

  const [taskId, setTaskId] = useState("");
  const [taskCategory, setTaskCategory] = useState("individu");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskRules, setTaskRules] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");

  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [loading, setLoading] = useState(false);

  const [userNama, setUserNama] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

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
    const savedNama = localStorage.getItem("user_nama");
    if (!nim) {
      router.push("/login");
      return;
    }

    if (savedNama) setUserNama(savedNama);

    async function verifyRole() {
      const { data } = await supabase.from("users").select("role, nama").eq("nim", nim).single();
      if (!data || (data.role !== "panitia" && data.role !== "admin")) {
        triggerToast("AKSES DITOLAK", "Halaman khusus Panitia/Admin!", true);
        router.push("/penugasan");
        return;
      }
      if (data.nama) {
        setUserNama(data.nama);
        localStorage.setItem("user_nama", data.nama);
      }
      setIsLoaded(true);
    }

    verifyRole();
    loadData();
  }, []);

  const loadData = async () => {
    const { data: taskData } = await supabase.from("tasks").select("*").order("created_at", { ascending: true });
    const { data: subData } = await supabase.from("submissions").select("*, users(nama, nim)").order("submitted_at", { ascending: false });

    if (taskData) {
      setTasks(taskData);
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
      is_active: true,
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
      is_active: true,
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

  const getCleanViewUrl = (rawUrl: string) => {
    if (!rawUrl) return "#";
    return rawUrl.split("?download=")[0];
  };

  const processedSubmissions = submissions.map((sub) => {
    const task = tasksMap[sub.task_id];
    let isLate = sub.status ? sub.status.toUpperCase() === "TERLAMBAT" : false;
    let category = task?.category || "individu";
    let taskTitleDisplay = task?.title || sub.tugas_id || sub.task_id;

    if (!sub.status && task && task.deadline) {
      isLate = new Date(sub.submitted_at) > new Date(task.deadline);
    }

    return { 
      ...sub, 
      isLate, 
      category,
      task_title: taskTitleDisplay,
      displayNama: sub.nama || sub.users?.nama || "-",
      viewUrl: getCleanViewUrl(sub.file_url)
    };
  });

  // 🟢 Filter Berdasarkan Kategori, Status, dan Judul Tugas
  const filteredSubmissions = processedSubmissions.filter((sub) => {
    let matchCat = true;
    if (filterCategory !== "all") {
      matchCat = sub.category?.toLowerCase() === filterCategory;
    }

    let matchStatus = true;
    if (filterLateStatus === "ontime") matchStatus = !sub.isLate;
    if (filterLateStatus === "late") matchStatus = sub.isLate;

    let matchTitle = true;
    if (filterTaskTitle !== "all") {
      matchTitle = sub.task_title === filterTaskTitle;
    }

    return matchCat && matchStatus && matchTitle;
  });

  const countOntime = filteredSubmissions.filter((s) => !s.isLate).length;
  const countLate = filteredSubmissions.filter((s) => s.isLate).length;

  const uniqueTaskTitles = Array.from(
    new Set(tasks.map((t) => t.title).filter(Boolean))
  );

  return (
    <>
      <Navbar />

      <div className="dashboard-container" style={{ maxWidth: "1200px", width: "100%", margin: "0 auto", padding: "120px 24px 60px 24px", boxSizing: "border-box" }}>
        <aside className="task-sidebar">
          <div style={{ marginBottom: "15px" }}>
            {isLoaded && userNama && (
              <div style={{ marginBottom: "10px", background: "rgba(0, 255, 136, 0.1)", border: "1px solid #00FF88", padding: "6px 12px", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <User size={13} style={{ color: "#00FF88" }} />
                <span style={{ fontSize: "11px", color: "#00FF88", fontWeight: 700 }}>{userNama}</span>
              </div>
            )}

            <h2 className="sidebar-header-title">MENU UTAMA</h2>
          </div>

          <div className="sidebar-menu">
            <button type="button" className={`sidebar-btn ${activeTab === "rekap" ? "active" : ""}`} onClick={() => setActiveTab("rekap")}>📊 REKAP PENGUMPULAN</button>
            <button type="button" className={`sidebar-btn ${activeTab === "tugas" ? "active" : ""}`} onClick={() => setActiveTab("tugas")}>➕ TAMBAH TUGAS</button>
            <button type="button" className={`sidebar-btn ${activeTab === "pengumuman" ? "active" : ""}`} onClick={() => setActiveTab("pengumuman")}>📢 BUAT PENGUMUMAN</button>
            <a href="/penugasan" className="sidebar-btn" style={{ marginTop: "15px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#FAFAFA", textAlign: "center", textDecoration: "none", display: "block" }}>👁️ TAMPILAN MAHASISWA</a>
          </div>
        </aside>

        <main className="task-main-content">
          {activeTab === "rekap" && (
            <div className="clickable-task-card" style={{ cursor: "default", padding: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileSpreadsheet color="#00FF88" size={20} style={{ flexShrink: 0 }} />
                    <h3 style={{ color: "#FAFAFA", fontSize: "15px", margin: 0, fontWeight: 700 }}>
                      REKAP PENGUMPULAN
                    </h3>
                  </div>
                  
                  <div style={{ display: "flex", gap: "6px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "50px", background: "rgba(0, 255, 136, 0.12)", border: "1px solid #00FF88", color: "#00FF88", whiteSpace: "nowrap" }}>
                      Tepat Waktu: {countOntime}
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "50px", background: "rgba(255, 51, 51, 0.15)", border: "1px solid #FF3333", color: "#FF3333", whiteSpace: "nowrap" }}>
                      Terlambat: {countLate}
                    </span>
                  </div>
                </div>

                {/* 🟢 Tiga Dropdown Filter: Kategori, Status, dan Judul Tugas */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", flexWrap: "wrap" }}>
                  <Filter size={14} color="#888" style={{ flexShrink: 0 }} />
                  
                  {/* Filter Jenis Tugas */}
                  <select 
                    value={filterCategory} 
                    onChange={(e: any) => setFilterCategory(e.target.value)} 
                    style={{ flex: 1, minWidth: "130px", background: "#0a0a0a", border: "1px solid #333", color: "#FAFAFA", padding: "8px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, outline: "none" }}
                  >
                    <option value="all">Semua Kategori</option>
                    <option value="individu">Tugas Individu</option>
                    <option value="kelompok">Tugas Kelompok</option>
                    <option value="angkatan">Tugas Angkatan</option>
                  </select>

                  {/* Filter Judul Tugas */}
                  <select 
                    value={filterTaskTitle} 
                    onChange={(e: any) => setFilterTaskTitle(e.target.value)} 
                    style={{ flex: 1.2, minWidth: "150px", background: "#0a0a0a", border: "1px solid #333", color: "#FAFAFA", padding: "8px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, outline: "none" }}
                  >
                    <option value="all">Semua Judul Tugas</option>
                    {uniqueTaskTitles.map((title, idx) => (
                      <option key={idx} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>

                  {/* Filter Status Pengumpulan */}
                  <select 
                    value={filterLateStatus} 
                    onChange={(e: any) => setFilterLateStatus(e.target.value)} 
                    style={{ flex: 1, minWidth: "130px", background: "#0a0a0a", border: "1px solid #333", color: "#FAFAFA", padding: "8px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, outline: "none" }}
                  >
                    <option value="all">Semua Status ({filteredSubmissions.length})</option>
                    <option value="ontime">Tepat Waktu</option>
                    <option value="late">Terlambat</option>
                  </select>
                </div>
              </div>

              <div className="detail-divider" style={{ marginBottom: "15px" }} />

              <div className="desktop-rekap-table" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", color: "#FAFAFA", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#888", textAlign: "left" }}>
                      <th style={{ padding: "10px" }}>NIM</th>
                      <th style={{ padding: "10px" }}>NAMA</th>
                      <th style={{ padding: "10px" }}>JUDUL TUGAS</th>
                      <th style={{ padding: "10px" }}>WAKTU</th>
                      <th style={{ padding: "10px" }}>STATUS</th>
                      <th style={{ padding: "10px" }}>BERKAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#666" }}>Tidak ada data yang sesuai filter.</td></tr>
                    ) : (
                      filteredSubmissions.map((sub, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: "10px", fontFamily: "monospace", fontWeight: "bold", color: sub.isLate ? "#FF3333" : "#00FF88" }}>{sub.user_nim}</td>
                          <td style={{ padding: "10px", color: "#FAFAFA" }}>{sub.displayNama}</td>
                          <td style={{ padding: "10px", fontWeight: 600 }}>{sub.task_title}</td>
                          <td style={{ padding: "10px", color: sub.isLate ? "#FF3333" : "#aaa" }}>{new Date(sub.submitted_at).toLocaleString("id-ID")}</td>
                          <td style={{ padding: "10px" }}>
                            {sub.isLate ? (
                              <span style={{ background: "rgba(255,51,51,0.15)", border: "1px solid #FF3333", color: "#FF3333", padding: "3px 8px", borderRadius: "50px", fontSize: "10px", fontWeight: 800, whiteSpace: "nowrap" }}>TERLAMBAT</span>
                            ) : (
                              <span style={{ background: "rgba(0,255,136,0.12)", border: "1px solid #00FF88", color: "#00FF88", padding: "3px 8px", borderRadius: "50px", fontSize: "10px", fontWeight: 800, whiteSpace: "nowrap" }}>TEPAT WAKTU</span>
                            )}
                          </td>
                          <td style={{ padding: "10px" }}>
                            <a href={sub.viewUrl} target="_blank" rel="noreferrer" style={{ color: "#00FF88", display: "inline-flex", alignItems: "center", gap: "5px", textDecoration: "none", fontWeight: 600 }}>
                              <Eye size={14} /> View Berkas
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mobile-rekap-cards" style={{ display: "none", flexDirection: "column", gap: "10px" }}>
                {filteredSubmissions.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "20px", color: "#666", fontSize: "13px", margin: 0 }}>
                    Tidak ada data yang sesuai filter.
                  </p>
                ) : (
                  filteredSubmissions.map((sub, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        background: "transparent", 
                        borderBottom: "1px solid rgba(255, 255, 255, 0.08)", 
                        padding: "12px 4px", 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "8px" 
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: "bold", fontSize: "13px", color: sub.isLate ? "#FF3333" : "#00FF88" }}>
                          {sub.user_nim}
                        </span>

                        {sub.isLate ? (
                          <span style={{ background: "rgba(255,51,51,0.15)", border: "1px solid #FF3333", color: "#FF3333", padding: "2px 8px", borderRadius: "50px", fontSize: "10px", fontWeight: 800, whiteSpace: "nowrap" }}>
                            TERLAMBAT
                          </span>
                        ) : (
                          <span style={{ background: "rgba(0,255,136,0.12)", border: "1px solid #00FF88", color: "#00FF88", padding: "2px 8px", borderRadius: "50px", fontSize: "10px", fontWeight: 800, whiteSpace: "nowrap" }}>
                            TEPAT WAKTU
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: "13px", color: "#FAFAFA", fontWeight: "600" }}>
                        {sub.displayNama}
                      </div>

                      <div style={{ fontSize: "11.5px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                        <span style={{ color: "rgba(250, 250, 250, 0.7)" }}>
                          Judul: <strong style={{ color: "#FAFAFA" }}>{sub.task_title}</strong>
                        </span>
                        <span style={{ color: sub.isLate ? "#FF3333" : "#aaa", fontSize: "11px" }}>
                          {new Date(sub.submitted_at).toLocaleString("id-ID")}
                        </span>
                      </div>

                      <div style={{ marginTop: "2px", textAlign: "left" }}>
                        <a 
                          href={sub.viewUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ 
                            color: "#00FF88", 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: "6px", 
                            textDecoration: "none", 
                            fontSize: "12px",
                            fontWeight: 600 
                          }}
                        >
                          <Eye size={14} /> View Berkas
                        </a>
                      </div>
                    </div>
                  ))
                )}
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
                <div className="input-group"><label style={{ fontSize: "12px", color: "#aaa" }}>ID Tugas</label><input type="text" placeholder="Contoh: individu-2" value={taskId} onChange={(e) => setTaskId(e.target.value)} required style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                <div className="input-group"><label style={{ fontSize: "12px", color: "#aaa" }}>Kategori</label><select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }}><option value="individu">Individu</option><option value="kelompok">Kelompok</option><option value="angkatan">Angkatan</option></select></div>
                <div className="input-group"><label style={{ fontSize: "12px", color: "#aaa" }}>Judul</label><input type="text" placeholder="Judul..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                <div className="input-group"><label style={{ fontSize: "12px", color: "#aaa" }}>Ketentuan (1 baris per poin)</label><textarea rows={4} placeholder="Poin..." value={taskRules} onChange={(e) => setTaskRules(e.target.value)} required style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
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

      {/* DYNAMIC ISLAND TOAST */}
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