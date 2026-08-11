"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import { 
  Trash2, 
  Eye, 
  Plus, 
  Megaphone, 
  FileSpreadsheet, 
  ShieldAlert, 
  Filter, 
  Pencil, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"rekap" | "tugas" | "pengumuman" | "manage">("rekap");

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [tasksMap, setTasksMap] = useState<{ [key: string]: any }>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // 🟢 State Filter Rekap (Kategori, Status, dan Judul Tugas)
  const [filterCategory, setFilterCategory] = useState<"all" | "individu" | "kelompok" | "angkatan">("all");
  const [filterLateStatus, setFilterLateStatus] = useState<"all" | "ontime" | "late">("all");
  const [filterTaskTitle, setFilterTaskTitle] = useState<string>("all");

  const [isEditAnnModalOpen, setIsEditAnnModalOpen] = useState(false);
  const [editAnnData, setEditAnnData] = useState<any>(null);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [editTaskData, setEditTaskData] = useState<any>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

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

    async function verifyAdmin() {
      const { data } = await supabase.from("users").select("role, nama").eq("nim", nim).single();
      if (!data || data.role !== "admin") {
        triggerToast("AKSES DITOLAK", "Halaman khusus Admin!", true);
        router.push("/panitia");
        return;
      }
      if (data.nama) {
        setUserNama(data.nama);
        localStorage.setItem("user_nama", data.nama);
      }
      setIsLoaded(true);
    }

    verifyAdmin();
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const { data: taskData } = await supabase.from("tasks").select("*").order("created_at", { ascending: true });
    const { data: annData } = await supabase.from("announcements").select("*").order("created_at", { ascending: true });
    const { data: subData } = await supabase.from("submissions").select("*, users(nama, nim)").order("submitted_at", { ascending: false });

    if (taskData) {
      setTasks(taskData);
      const tMap: { [key: string]: any } = {};
      taskData.forEach((t) => (tMap[t.id] = t));
      setTasksMap(tMap);
    }
    if (annData) setAnnouncements(annData);
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
      triggerToast("BERHASIL DITERBITKAN", "Tugas baru berhasil ditambahkan!", false);
      setTaskId(""); setTaskTitle(""); setTaskRules(""); setTaskDeadline("");
      loadAllData();
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
      loadAllData();
    }
  };

  const handleSaveEditAnn = async () => {
    if (!editAnnData) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("announcements")
        .update({
          title: editAnnData.title,
          content: editAnnData.content,
        })
        .eq("id", editAnnData.id);

      if (error) throw error;

      triggerToast("PERUBAHAN DISIMPAN", "Pengumuman berhasil diperbarui!", false);
      setIsEditAnnModalOpen(false);
      loadAllData();
    } catch (err: any) {
      triggerToast("GAGAL UPDATE", err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditTask = async () => {
    if (!editTaskData) return;
    setLoading(true);

    try {
      const rulesArray = typeof editTaskData.rules === "string" 
        ? editTaskData.rules.split("\n").filter((r: string) => r.trim() !== "")
        : editTaskData.rules;

      const { error } = await supabase
        .from("tasks")
        .update({
          title: editTaskData.title,
          category: editTaskData.category,
          rules: rulesArray,
          deadline: new Date(editTaskData.deadline).toISOString(),
        })
        .eq("id", editTaskData.id);

      if (error) throw error;

      triggerToast("PERUBAHAN DISIMPAN", "Tugas berhasil diperbarui!", false);
      setIsEditTaskModalOpen(false);
      loadAllData();
    } catch (err: any) {
      triggerToast("GAGAL UPDATE", err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaskStatus = (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const actionText = nextStatus ? "mengaktifkan" : "menonaktifkan";

    setConfirmModal({
      isOpen: true,
      title: "KONFIRMASI STATUS TUGAS",
      description: `Apakah Anda yakin ingin ${actionText} tugas ${id}?`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        const { error } = await supabase
          .from("tasks")
          .update({ is_active: nextStatus })
          .eq("id", id);

        if (error) {
          triggerToast("GAGAL MENGUBAH STATUS", error.message, true);
        } else {
          triggerToast("STATUS DIPERBARUI", `Tugas ${id} berhasil di-${nextStatus ? "aktifkan" : "nonaktifkan"}!`, false);
          loadAllData();
        }
      },
    });
  };

  const handleToggleAnnStatus = (id: string, title: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const actionText = nextStatus ? "mengaktifkan" : "menonaktifkan";

    setConfirmModal({
      isOpen: true,
      title: "KONFIRMASI PENGUMUMAN",
      description: `Apakah Anda yakin ingin ${actionText} pengumuman "${title}"?`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        const { error } = await supabase
          .from("announcements")
          .update({ is_active: nextStatus })
          .eq("id", id);

        if (error) {
          triggerToast("GAGAL MENGUBAH STATUS", error.message, true);
        } else {
          triggerToast("STATUS DIPERBARUI", `Pengumuman berhasil di-${nextStatus ? "aktifkan" : "nonaktifkan"}!`, false);
          loadAllData();
        }
      },
    });
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

  // Daftar Judul Tugas Unik untuk Opsi Dropdown Filter
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
              <div style={{ marginBottom: "10px", background: "rgba(255, 51, 51, 0.12)", border: "1px solid #FF3333", padding: "6px 12px", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <ShieldAlert size={13} style={{ color: "#FF3333" }} />
                <span style={{ fontSize: "11px", color: "#FF3333", fontWeight: 700 }}>{userNama}</span>
              </div>
            )}

            <h2 className="sidebar-header-title">MENU UTAMA</h2>
          </div>

          <div className="sidebar-menu">
            <button type="button" className={`sidebar-btn ${activeTab === "rekap" ? "active" : ""}`} onClick={() => setActiveTab("rekap")}>📊 REKAP PENGUMPULAN</button>
            <button type="button" className={`sidebar-btn ${activeTab === "tugas" ? "active" : ""}`} onClick={() => setActiveTab("tugas")}>➕ TAMBAH TUGAS</button>
            <button type="button" className={`sidebar-btn ${activeTab === "pengumuman" ? "active" : ""}`} onClick={() => setActiveTab("pengumuman")}>📢 BUAT PENGUMUMAN</button>
            <button type="button" className={`sidebar-btn ${activeTab === "manage" ? "active" : ""}`} onClick={() => setActiveTab("manage")} style={{ color: "#FF3333" }}>⚙️ KELOLA / ARSIP DATA</button>
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

          {activeTab === "manage" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              <div className="clickable-task-card" style={{ cursor: "default" }}>
                <h3 style={{ color: "#FAFAFA", fontSize: "15px", marginBottom: "15px", margin: 0 }}>
                  ⚙️ KELOLA & ARSIP TUGAS
                </h3>
                <div style={{ overflowX: "auto", marginTop: "15px" }}>
                  <table style={{ width: "100%", color: "#FAFAFA", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#888", textAlign: "left" }}>
                        <th style={{ padding: "10px" }}>ID</th>
                        <th style={{ padding: "10px" }}>KATEGORI</th>
                        <th style={{ padding: "10px" }}>JUDUL</th>
                        <th style={{ padding: "10px" }}>VISIBILITAS</th>
                        <th style={{ padding: "10px" }}>AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: "15px", color: "#666" }}>Kosong.</td></tr>
                      ) : (
                        tasks.map((t) => (
                          <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "10px", color: "#00FF88", fontFamily: "monospace" }}>{t.id}</td>
                            <td style={{ padding: "10px" }}>{t.category}</td>
                            <td style={{ padding: "10px" }}>{t.title}</td>
                            
                            <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                              {t.is_active !== false ? (
                                <span style={{ background: "rgba(0,255,136,0.12)", border: "1px solid #00FF88", color: "#00FF88", padding: "4px 10px", borderRadius: "50px", fontSize: "10px", fontWeight: 800, whiteSpace: "nowrap", display: "inline-block" }}>
                                  AKTIF (TAMPIL)
                                </span>
                              ) : (
                                <span style={{ background: "rgba(255,51,51,0.15)", border: "1px solid #FF3333", color: "#FF3333", padding: "4px 10px", borderRadius: "50px", fontSize: "10px", fontWeight: 800, whiteSpace: "nowrap", display: "inline-block" }}>
                                  DISEMBUNYIKAN
                                </span>
                              )}
                            </td>

                            <td style={{ padding: "10px", display: "flex", gap: "8px", whiteSpace: "nowrap" }}>
                              <button 
                                onClick={() => { 
                                  setEditTaskData({ ...t, rules: t.rules?.join("\n") || "", deadline: new Date(t.deadline).toISOString().slice(0, 16) }); 
                                  setIsEditTaskModalOpen(true); 
                                }} 
                                style={{ background: "rgba(0,255,136,0.15)", border: "1px solid #00FF88", color: "#00FF88", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
                              >
                                <Pencil size={13} /> Edit
                              </button>

                              <button 
                                onClick={() => handleToggleTaskStatus(t.id, t.is_active !== false)} 
                                style={{ 
                                  background: t.is_active !== false ? "rgba(255,170,0,0.15)" : "rgba(0,255,136,0.15)", 
                                  border: t.is_active !== false ? "1px solid #FFAA00" : "1px solid #00FF88", 
                                  color: t.is_active !== false ? "#FFAA00" : "#00FF88", 
                                  padding: "6px 12px", 
                                  borderRadius: "6px", 
                                  cursor: "pointer",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                {t.is_active !== false ? "🚫 Sembunyikan" : "👁️ Tampilkan"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="clickable-task-card" style={{ cursor: "default" }}>
                <h3 style={{ color: "#FAFAFA", fontSize: "15px", marginBottom: "15px", margin: 0 }}>
                  📢 KELOLA & ARSIP PENGUMUMAN
                </h3>
                <div style={{ overflowX: "auto", marginTop: "15px" }}>
                  <table style={{ width: "100%", color: "#FAFAFA", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#888", textAlign: "left" }}>
                        <th style={{ padding: "10px" }}>JUDUL</th>
                        <th style={{ padding: "10px" }}>TANGGAL</th>
                        <th style={{ padding: "10px" }}>VISIBILITAS</th>
                        <th style={{ padding: "10px" }}>AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {announcements.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: "15px", color: "#666" }}>Kosong.</td></tr>
                      ) : (
                        announcements.map((a) => (
                          <tr key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "10px" }}>{a.title}</td>
                            <td style={{ padding: "10px", color: "#aaa" }}>{new Date(a.created_at).toLocaleDateString("id-ID")}</td>
                            
                            <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                              {a.is_active !== false ? (
                                <span style={{ background: "rgba(0,255,136,0.12)", border: "1px solid #00FF88", color: "#00FF88", padding: "4px 10px", borderRadius: "50px", fontSize: "10px", fontWeight: 800, whiteSpace: "nowrap", display: "inline-block" }}>
                                  AKTIF (TAMPIL)
                                </span>
                              ) : (
                                <span style={{ background: "rgba(255,51,51,0.15)", border: "1px solid #FF3333", color: "#FF3333", padding: "4px 10px", borderRadius: "50px", fontSize: "10px", fontWeight: 800, whiteSpace: "nowrap", display: "inline-block" }}>
                                  DISEMBUNYIKAN
                                </span>
                              )}
                            </td>

                            <td style={{ padding: "10px", display: "flex", gap: "8px", whiteSpace: "nowrap" }}>
                              <button 
                                onClick={() => { setEditAnnData(a); setIsEditAnnModalOpen(true); }} 
                                style={{ background: "rgba(0,255,136,0.15)", border: "1px solid #00FF88", color: "#00FF88", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
                              >
                                <Pencil size={13} /> Edit
                              </button>

                              <button 
                                onClick={() => handleToggleAnnStatus(a.id, a.title, a.is_active !== false)} 
                                style={{ 
                                  background: a.is_active !== false ? "rgba(255,170,0,0.15)" : "rgba(0,255,136,0.15)", 
                                  border: a.is_active !== false ? "1px solid #FFAA00" : "1px solid #00FF88", 
                                  color: a.is_active !== false ? "#FFAA00" : "#00FF88", 
                                  padding: "6px 12px", 
                                  borderRadius: "6px", 
                                  cursor: "pointer",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                {a.is_active !== false ? "🚫 Sembunyikan" : "👁️ Tampilkan"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL KONFIRMASI CUSTOM */}
      {confirmModal.isOpen && (
        <div className="modal-overlay active" style={{ zIndex: 99999999 }} onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}>
          <div className="modal-card" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <ShieldAlert className="modal-icon" style={{ color: "#FFAA00" }} />
              <h2 style={{ color: "#FFAA00", fontSize: "16px" }}>{confirmModal.title}</h2>
            </div>
            
            <p className="modal-desc" style={{ marginBottom: "25px", fontSize: "13px" }}>
              {confirmModal.description}
            </p>

            <div className="modal-buttons" style={{ flexDirection: "row", gap: "10px" }}>
              <button 
                type="button" 
                className="btn-modal-close" 
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                style={{ flex: 1 }}
              >
                BATAL
              </button>
              
              <button 
                type="button" 
                className="btn-modal-primary" 
                onClick={confirmModal.onConfirm}
                style={{ flex: 1, background: "linear-gradient(135deg, #1B22A7 0%, #121674 100%)" }}
              >
                YA, LANJUTKAN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT PENGUMUMAN */}
      {isEditAnnModalOpen && editAnnData && (
        <div style={{ zIndex: 9999999, position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => !loading && setIsEditAnnModalOpen(false)}>
          <div style={{ maxWidth: "750px", width: "100%", background: "#111115", border: "1px solid #00FF88", borderRadius: "16px", padding: "24px 28px", boxShadow: "0 0 50px rgba(0, 255, 136, 0.25)", maxHeight: "85vh", overflowY: "auto", textAlign: "left" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><Pencil style={{ width: "20px", height: "20px", color: "#00FF88" }} /><h2 style={{ color: "#FAFAFA", fontSize: "17px", margin: 0, fontWeight: 700 }}>EDIT PENGUMUMAN RESMI</h2></div>
              <button onClick={() => setIsEditAnnModalOpen(false)} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div><label style={{ fontSize: "11px", color: "#00FF88", fontWeight: 700, display: "block", marginBottom: "6px" }}>Judul</label><input type="text" value={editAnnData.title} onChange={(e) => setEditAnnData({ ...editAnnData, title: e.target.value })} style={{ background: "#0a0a0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "8px", width: "100%", fontSize: "13px" }} /></div>
              <div><label style={{ fontSize: "11px", color: "#00FF88", fontWeight: 700, display: "block", marginBottom: "6px" }}>Isi</label><textarea rows={8} value={editAnnData.content} onChange={(e) => setEditAnnData({ ...editAnnData, content: e.target.value })} style={{ background: "#0a0a0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "8px", width: "100%", fontSize: "13px", resize: "vertical" }} /></div>
            </div>
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "14px" }}>
              <button type="button" onClick={() => setIsEditAnnModalOpen(false)} disabled={loading} style={{ padding: "8px 18px", background: "transparent", border: "1px solid #444", color: "#aaa", borderRadius: "8px", cursor: "pointer" }}>BATAL</button>
              <button type="button" onClick={handleSaveEditAnn} disabled={loading} style={{ padding: "8px 22px", background: "#00FF88", border: "none", color: "#000", fontWeight: 700, borderRadius: "8px", cursor: "pointer" }}>{loading ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT TUGAS */}
      {isEditTaskModalOpen && editTaskData && (
        <div style={{ zIndex: 9999999, position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => !loading && setIsEditTaskModalOpen(false)}>
          <div style={{ maxWidth: "850px", width: "100%", background: "#111115", border: "1px solid #00FF88", borderRadius: "16px", padding: "24px 28px", boxShadow: "0 0 50px rgba(0, 255, 136, 0.25)", maxHeight: "85vh", overflowY: "auto", textAlign: "left" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><Pencil style={{ width: "20px", height: "20px", color: "#00FF88" }} /><h2 style={{ color: "#FAFAFA", fontSize: "17px", margin: 0, fontWeight: 700 }}>EDIT DATA PENUGASAN</h2></div>
              <button onClick={() => setIsEditTaskModalOpen(false)} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div><label style={{ fontSize: "11px", color: "#00FF88", fontWeight: 700, display: "block", marginBottom: "6px" }}>Judul</label><input type="text" value={editTaskData.title} onChange={(e) => setEditTaskData({ ...editTaskData, title: e.target.value })} style={{ background: "#0a0a0d", border: "1px solid #333", color: "#fff", padding: "10px 12px", borderRadius: "8px", width: "100%", fontSize: "13px" }} /></div>
                <div><label style={{ fontSize: "11px", color: "#00FF88", fontWeight: 700, display: "block", marginBottom: "6px" }}>Kategori</label><select value={editTaskData.category} onChange={(e) => setEditTaskData({ ...editTaskData, category: e.target.value })} style={{ background: "#0a0a0d", border: "1px solid #333", color: "#fff", padding: "10px 12px", borderRadius: "8px", width: "100%", fontSize: "13px" }}><option value="individu">Individu</option><option value="kelompok">Kelompok</option><option value="angkatan">Angkatan</option></select></div>
                <div><label style={{ fontSize: "11px", color: "#00FF88", fontWeight: 700, display: "block", marginBottom: "6px" }}>Deadline</label><input type="datetime-local" value={editTaskData.deadline} onChange={(e) => setEditTaskData({ ...editTaskData, deadline: e.target.value })} style={{ background: "#0a0a0d", border: "1px solid #333", color: "#fff", padding: "10px 12px", borderRadius: "8px", width: "100%", fontSize: "13px" }} /></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ fontSize: "11px", color: "#00FF88", fontWeight: 700, display: "block", marginBottom: "6px" }}>Ketentuan</label>
                <textarea rows={8} value={editTaskData.rules} onChange={(e) => setEditTaskData({ ...editTaskData, rules: e.target.value })} style={{ background: "#0a0a0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "8px", width: "100%", fontSize: "13px", resize: "none", flex: 1 }} />
              </div>
            </div>
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "14px" }}>
              <button type="button" onClick={() => setIsEditTaskModalOpen(false)} disabled={loading} style={{ padding: "8px 18px", background: "transparent", border: "1px solid #444", color: "#aaa", borderRadius: "8px", cursor: "pointer" }}>BATAL</button>
              <button type="button" onClick={handleSaveEditTask} disabled={loading} style={{ padding: "8px 22px", background: "#00FF88", border: "none", color: "#000", fontWeight: 700, borderRadius: "8px", cursor: "pointer" }}>{loading ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}</button>
            </div>
          </div>
        </div>
      )}

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