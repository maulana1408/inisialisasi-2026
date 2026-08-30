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
  AlertCircle,
  UserCheck,
  GraduationCap 
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"rekap" | "presensi" | "evaluasi" | "tugas" | "pengumuman" | "manage">("rekap");

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [tasksMap, setTasksMap] = useState<{ [key: string]: any }>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [key: string]: boolean }>({});

  const [filterCategory, setFilterCategory] = useState<"all" | "individu" | "kelompok" | "angkatan">("all");
  const [filterLateStatus, setFilterLateStatus] = useState<"all" | "ontime" | "late">("all");
  const [filterTaskTitle, setFilterTaskTitle] = useState<string>("all");
  const [filterAttendanceStatus, setFilterAttendanceStatus] = useState<"all" | "present" | "absent">("all");
  const [filterEvalPoints, setFilterEvalPoints] = useState<"all" | "complete" | "incomplete">("all");

  const [selectedSession, setSelectedSession] = useState<string>("pra-inisialisasi");
  const [sessionPoints, setSessionPoints] = useState<number | "">("");
  const [currentNim, setCurrentNim] = useState<string | null>(null);

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
  const [taskPoints, setTaskPoints] = useState<number | "">(""); 
  
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
    setCurrentNim(nim);

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
    const { data: userData } = await supabase.from("users").select("nim, nama, role, total_points, is_graduated, graduation_status").neq("role", "admin").order("total_points", { ascending: false });

    if (taskData) {
      setTasks(taskData);
      const tMap: { [key: string]: any } = {};
      taskData.forEach((t) => (tMap[t.id] = t));
      setTasksMap(tMap);
    }
    if (annData) setAnnouncements(annData);
    if (subData) setSubmissions(subData);
    if (userData) setStudents(userData);
  };

  useEffect(() => {
    if (!currentNim) return;
    async function loadAttendance() {
      const { data } = await supabase
        .from("attendance")
        .select("user_nim, is_present, awarded_points")
        .eq("session_name", selectedSession);

      if (data && data.length > 0) {
        const attMap: { [key: string]: boolean } = {};
        data.forEach((att) => {
          attMap[att.user_nim] = att.is_present;
        });
        setAttendanceRecords(attMap);
        if (data[0].awarded_points !== undefined && data[0].awarded_points !== null) {
          setSessionPoints(data[0].awarded_points);
        }
      } else {
        setAttendanceRecords({});
      }
    }
    loadAttendance();
  }, [selectedSession, currentNim]);

  const handleAttendanceToggle = async (nim: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const currentPoints = Number(sessionPoints) || 0;
    
    setAttendanceRecords((prev) => ({ ...prev, [nim]: nextStatus }));

    const { error } = await supabase
      .from("attendance")
      .upsert(
        {
          user_nim: nim,
          session_name: selectedSession,
          is_present: nextStatus,
          awarded_points: nextStatus ? currentPoints : 0
        },
        { onConflict: 'user_nim,session_name' }
      );

    if (error) {
      triggerToast("GAGAL SIMPAN", error.message, true);
    } else {
      const { data: subPointsData } = await supabase
        .from("submissions")
        .select("awarded_points")
        .eq("user_nim", nim)
        .eq("is_validated", true);

      const { data: attPointsData } = await supabase
        .from("attendance")
        .select("awarded_points")
        .eq("user_nim", nim)
        .eq("is_present", true);

      const totalTaskP = subPointsData?.reduce((acc, curr) => acc + (curr.awarded_points || 0), 0) || 0;
      const totalAttP = attPointsData?.reduce((acc, curr) => acc + (curr.awarded_points || 0), 0) || 0;
      const grandTotal = totalTaskP + totalAttP;

      await supabase
        .from("users")
        .update({ total_points: grandTotal })
        .eq("nim", nim);

      loadAllData();
      triggerToast(
        nextStatus ? "HADIR DICATAT" : "KEHADIRAN DIHAPUS",
        nextStatus ? `Memberikan ${currentPoints} poin presensi untuk ${nim}` : `Kehadiran ${nim} dibatalkan`,
        false
      );
    }
  };

  const handleGraduationToggle = async (nim: string, currentGraduatedState: boolean) => {
    const nextState = !currentGraduatedState;
    const statusText = nextState ? "LULUS & DIKUKUHKAN" : "TIDAK LULUS";

    const { error } = await supabase
      .from("users")
      .update({
        is_graduated: nextState,
        graduation_status: statusText
      })
      .eq("nim", nim);

    if (error) {
      triggerToast("GAGAL EVALUASI", error.message, true);
    } else {
      triggerToast(
        nextState ? "MAHASISWA LULUS" : "STATUS DIBATALKAN",
        `Mahasiswa dengan NIM ${nim} dinyatakan ${statusText}!`,
        false
      );
      loadAllData();
    }
  };

  const handleSaveSessionPoints = async () => {
    const pointsVal = Number(sessionPoints) || 0;
    const { error } = await supabase
      .from("attendance")
      .update({ awarded_points: pointsVal })
      .eq("session_name", selectedSession)
      .eq("is_present", true);

    if (error) {
      triggerToast("GAGAL", error.message, true);
    } else {
      triggerToast("POIN DIPERBARUI", `Berhasil mengatur ${pointsVal} poin untuk sesi ${selectedSession}!`, false);
    }
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
      points: Number(taskPoints) || 0,
      is_active: true,
    });

    setLoading(false);
    if (error) {
      triggerToast("GAGAL TAMBAH TUGAS", error.message, true);
    } else {
      triggerToast("BERHASIL DITERBITKAN", "Tugas baru berhasil ditambahkan!", false);
      setTaskId(""); setTaskTitle(""); setTaskRules(""); setTaskDeadline(""); setTaskPoints("");
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
          points: Number(editTaskData.points) || 0,
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

  const handleValidationToggle = async (submissionId: string, currentValidatedState: boolean, pointsToAward: number, targetNim: string) => {
    const nextState = !currentValidatedState;
    const awardedPoints = nextState ? pointsToAward : 0;

    const { error } = await supabase
      .from("submissions")
      .update({ 
        is_validated: nextState,
        awarded_points: awardedPoints 
      })
      .eq("id", submissionId);

    if (error) {
      triggerToast("GAGAL VALIDASI", error.message, true);
    } else {
      const { data: subPointsData } = await supabase
        .from("submissions")
        .select("awarded_points")
        .eq("user_nim", targetNim)
        .eq("is_validated", true);

      const { data: attPointsData } = await supabase
        .from("attendance")
        .select("awarded_points")
        .eq("user_nim", targetNim)
        .eq("is_present", true);

      const totalTaskP = subPointsData?.reduce((acc, curr) => acc + (curr.awarded_points || 0), 0) || 0;
      const totalAttP = attPointsData?.reduce((acc, curr) => acc + (curr.awarded_points || 0), 0) || 0;
      const grandTotal = totalTaskP + totalAttP;

      await supabase
        .from("users")
        .update({ total_points: grandTotal })
        .eq("nim", targetNim);

      triggerToast(
        nextState ? "POIN DIKIRIM" : "VALIDASI DIBATALKAN", 
        nextState ? `Berhasil memberikan ${awardedPoints} poin ke ${targetNim}!` : `Poin untuk ${targetNim} ditarik kembali.`, 
        false
      );
      loadAllData();
    }
  };

  const getCleanViewUrl = (rawUrl: string) => {
    if (!rawUrl) return "#";
    return rawUrl.includes("?") ? rawUrl.replace("download=", "view=") : `${rawUrl}?view=true`;
  };

  const processedSubmissions = submissions.map((sub) => {
    const task = tasksMap[sub.task_id];
    let isLate = sub.status ? sub.status.toUpperCase() === "TERLAMBAT" : false;
    let category = task?.category || "individu";
    let taskTitleDisplay = task?.title || sub.tugas_id || sub.task_id;
    let taskPointsValue = task?.points || 0;

    if (!sub.status && task && task.deadline) {
      isLate = new Date(sub.submitted_at) > new Date(task.deadline);
    }

    return { 
      ...sub, 
      isLate, 
      category,
      task_title: taskTitleDisplay,
      task_points: taskPointsValue,
      displayNama: sub.nama || sub.users?.nama || "-",
      viewUrl: getCleanViewUrl(sub.file_url)
    };
  });

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

  const filteredStudents = students.filter((stu) => {
    const isPresent = !!attendanceRecords[stu.nim];
    if (filterAttendanceStatus === "present") return isPresent;
    if (filterAttendanceStatus === "absent") return !isPresent;
    return true;
  });

  const countCompleteEval = students.filter((s) => (s.total_points || 0) >= 300).length;
  const countIncompleteEval = students.length - countCompleteEval;

  const filteredEvaluationStudents = students.filter((stu) => {
    const points = stu.total_points || 0;
    if (filterEvalPoints === "complete") return points >= 300;
    if (filterEvalPoints === "incomplete") return points < 300;
    return true;
  });

  const countOntime = filteredSubmissions.filter((s) => !s.isLate).length;
  const countLate = filteredSubmissions.filter((s) => s.isLate).length;
  const countPresent = students.filter((s) => attendanceRecords[s.nim]).length;
  const countAbsent = students.length - countPresent;

  const uniqueTaskTitles = Array.from(
    new Set(tasks.map((t) => t.title).filter(Boolean))
  );

  return (
    <>
      <Navbar />
      <div className="dashboard-container" style={{ maxWidth: "1200px", width: "100%", margin: "0 auto", padding: "120px 24px 60px 24px", boxSizing: "border-box" }}>
        {/* 🟢 SIDEBAR ADMIN */}
        <aside 
          className="task-sidebar" 
          style={{ 
            display: "flex", 
            flexDirection: "column", 
            position: "sticky", 
            top: "120px", 
            height: "calc(100vh - 140px)", 
            maxHeight: "820px",
            boxSizing: "border-box",
            padding: "24px" 
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <div style={{ marginBottom: "5px" }}>
              <div style={{ 
                minHeight: "38px",
                marginBottom: "10px", 
                background: "transparent", 
                border: "1px solid #FF3333", 
                padding: "6px 12px", 
                borderRadius: "20px", 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "6px" 
              }}>
                <ShieldAlert size={13} style={{ color: "#FF3333" }} />
                <span style={{ fontSize: "11px", color: "#FF3333", fontWeight: 700, textTransform: "uppercase" }}>
                  {userNama || "ADMIN UTAMA"}
                </span>
              </div>

              <h2 className="sidebar-header-title">MENU UTAMA</h2>
            </div>

            <div className="sidebar-menu">
              <button type="button" className={`sidebar-btn ${activeTab === "rekap" ? "active" : ""}`} onClick={() => setActiveTab("rekap")}>📊 REKAP PENGUMPULAN</button>
              <button type="button" className={`sidebar-btn ${activeTab === "presensi" ? "active" : ""}`} onClick={() => setActiveTab("presensi")}>✅ INPUT PRESENSI</button>
              <button type="button" className={`sidebar-btn ${activeTab === "evaluasi" ? "active" : ""}`} onClick={() => setActiveTab("evaluasi")}>🎓 EVALUASI AKHIR</button>
              <button type="button" className={`sidebar-btn ${activeTab === "tugas" ? "active" : ""}`} onClick={() => setActiveTab("tugas")}>➕ TAMBAH TUGAS</button>
              <button type="button" className={`sidebar-btn ${activeTab === "pengumuman" ? "active" : ""}`} onClick={() => setActiveTab("pengumuman")}>📢 BUAT PENGUMUMAN</button>
              <button type="button" className={`sidebar-btn ${activeTab === "manage" ? "active" : ""}`} onClick={() => setActiveTab("manage")} style={{ color: "#FF3333" }}>⚙️ KELOLA ARSIP DATA</button>
              <a href="/penugasan" className="sidebar-btn" style={{ marginTop: "15px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#FAFAFA", textAlign: "center", textDecoration: "none", display: "block" }}>👁️ TAMPILAN MAHASISWA</a>
            </div>
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

                <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", flexWrap: "wrap" }}>
                  <Filter size={14} color="#888" style={{ flexShrink: 0 }} />
                  
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
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#fafafa", textAlign: "left" }}>
                      <th style={{ padding: "10px" }}>NIM</th>
                      <th style={{ padding: "10px" }}>NAMA</th>
                      <th style={{ padding: "10px" }}>JUDUL TUGAS</th>
                      <th style={{ padding: "10px" }}>WAKTU</th>
                      <th style={{ padding: "10px" }}>STATUS</th>
                      <th style={{ padding: "10px" }}>VALIDASI PENUGASAN</th>
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
                            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                              <a href={sub.viewUrl} target="_blank" rel="noreferrer" style={{ color: "#00FF88", display: "inline-flex", alignItems: "center", gap: "5px", textDecoration: "none", fontWeight: 600 }}>
                                <Eye size={14} /> View Berkas
                              </a>
                              <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", cursor: "pointer", fontSize: "11px", color: sub.is_validated ? "#00FF88" : "#aaa", fontWeight: 600 }}>
                                <input 
                                  type="checkbox" 
                                  checked={!!sub.is_validated} 
                                  onChange={() => handleValidationToggle(sub.id, !!sub.is_validated, sub.task_points, sub.user_nim)}
                                  style={{ width: "16px", height: "16px", accentColor: "#00FF88", cursor: "pointer" }} 
                                />
                              </label>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "presensi" && (
            <div className="clickable-task-card" style={{ cursor: "default", padding: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <UserCheck color="#00FF88" size={20} style={{ flexShrink: 0 }} />
                    <h3 style={{ color: "#FAFAFA", fontSize: "15px", margin: 0, fontWeight: 700 }}>
                      INPUT PRESENSI
                    </h3>
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "50px", background: "rgba(0, 255, 136, 0.12)", border: "1px solid #00FF88", color: "#00FF88", whiteSpace: "nowrap" }}>
                      Hadir: ({countPresent})
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "50px", background: "rgba(255, 51, 51, 0.15)", border: "1px solid #FF3333", color: "#FF3333", whiteSpace: "nowrap" }}>
                      Tidak Hadir: ({countAbsent})
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", width: "100%", flexWrap: "wrap", marginTop: "10px" }}>
                  <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", color: "#aaa", fontWeight: 600 }}>Pilih Sesi Kehadiran:</label>
                    <select 
                      value={selectedSession} 
                      onChange={(e) => setSelectedSession(e.target.value)} 
                      style={{ background: "#0a0a0a", border: "1px solid #333", color: "#FAFAFA", padding: "10px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, outline: "none", width: "100%" }}
                    >
                      <option value="pra-inisialisasi">Pra-Inisialisasi</option>
                      <option value="inisialisasi-day1">Inisialisasi Day 1</option>
                      <option value="inisialisasi-day2">Inisialisasi Day 2</option>
                      <option value="inisialisasi-day3">Inisialisasi Day 3</option>
                      <option value="inisialisasi-day4">Inisialisasi Day 4</option>
                      <option value="pengukuhan">Pengukuhan</option>
                    </select>
                  </div>

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", color: "#aaa", fontWeight: 600 }}>Poin Kehadiran Sesi Ini:</label>
                    <input 
                      type="number" 
                      placeholder="Masukkan poin..."
                      value={sessionPoints} 
                      onChange={(e) => setSessionPoints(e.target.value === "" ? "" : Number(e.target.value))} 
                      style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, width: "100%" }} 
                    />
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <button 
                      type="button"
                      onClick={handleSaveSessionPoints}
                      style={{ background: "transparent", border: "2px solid #1B22A7", color: "#fafafa", padding: "10px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      Simpan Poin Sesi
                    </button>
                  </div>

                  <div style={{ flex: 1.5, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", color: "#aaa", fontWeight: 600 }}>Filter Status:</label>
                    <select 
                      value={filterAttendanceStatus} 
                      onChange={(e: any) => setFilterAttendanceStatus(e.target.value)} 
                      style={{ background: "#0a0a0a", border: "1px solid #333", color: "#FAFAFA", padding: "10px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, outline: "none", width: "100%" }}
                    >
                      <option value="all">Semua Mahasiswa ({students.length})</option>
                      <option value="present">Hadir ({countPresent})</option>
                      <option value="absent">Tidak Hadir ({countAbsent})</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="detail-divider" style={{ marginBottom: "15px" }} />

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", color: "#FAFAFA", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#fafafa", textAlign: "left" }}>
                      <th style={{ padding: "10px" }}>NIM</th>
                      <th style={{ padding: "10px" }}>NAMA MAHASISWA</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>STATUS KEHADIRAN (CEKLIS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr><td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "#666" }}>Tidak ada data mahasiswa yang sesuai filter.</td></tr>
                    ) : (
                      filteredStudents.map((stu, i) => {
                        const isPresent = !!attendanceRecords[stu.nim];
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "12px 10px", fontFamily: "monospace", fontWeight: "bold", color: "#00FF88" }}>{stu.nim}</td>
                            <td style={{ padding: "12px 10px", color: "#FAFAFA", fontWeight: 600 }}>{stu.nama}</td>
                            <td style={{ padding: "12px 10px", textAlign: "center" }}>
                              <label style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                <input 
                                  type="checkbox" 
                                  checked={isPresent} 
                                  onChange={() => handleAttendanceToggle(stu.nim, isPresent)}
                                  style={{ width: "18px", height: "18px", accentColor: "#00FF88", cursor: "pointer" }} 
                                />
                              </label>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "evaluasi" && (
            <div className="clickable-task-card" style={{ cursor: "default", padding: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <GraduationCap color="#00FF88" size={22} />
                    <h3 style={{ color: "#FAFAFA", fontSize: "15px", margin: 0, fontWeight: 700 }}>
                      EVALUASI AKHIR & PENENTUAN KELULUSAN MAHASISWA
                    </h3>
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "50px", background: "rgba(0, 255, 136, 0.12)", border: "1px solid #00FF88", color: "#00FF88", whiteSpace: "nowrap" }}>
                      Memenuhi: ({countCompleteEval})
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "50px", background: "rgba(255, 51, 51, 0.15)", border: "1px solid #FF3333", color: "#FF3333", whiteSpace: "nowrap" }}>
                      Belum Memenuhi: ({countIncompleteEval})
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginTop: "10px" }}>
                  <p style={{ fontSize: "12.5px", color: "rgba(250,250,250,0.6)", margin: 0, flex: 1 }}>
                    Centang kotak pada baris mahasiswa yang dinyatakan <strong>Lulus & Dikukuhkan</strong> setelah Day 4. Jika dibiarkan kosong, status mahasiswa akan menjadi <strong>Tidak Lulus</strong>.
                  </p>

                  <div style={{ width: "260px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", color: "#aaa", fontWeight: 600 }}>Filter Poin Mahasiswa:</label>
                    <select 
                      value={filterEvalPoints} 
                      onChange={(e: any) => setFilterEvalPoints(e.target.value)} 
                      style={{ background: "#0a0a0a", border: "1px solid #333", color: "#FAFAFA", padding: "10px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, outline: "none", width: "100%" }}
                    >
                      <option value="all">Semua Mahasiswa ({students.length})</option>
                      <option value="complete">Memenuhi 300/300 ({countCompleteEval})</option>
                      <option value="incomplete">Belum Memenuhi ({countIncompleteEval})</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="detail-divider" style={{ marginBottom: "15px" }} />

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", color: "#FAFAFA", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#fafafa", textAlign: "left" }}>
                      <th style={{ padding: "10px" }}>NIM</th>
                      <th style={{ padding: "10px" }}>NAMA MAHASISWA</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>TOTAL POIN</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>STATUS KELULUSAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvaluationStudents.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "#666" }}>Tidak ada data mahasiswa yang sesuai filter.</td></tr>
                    ) : (
                      filteredEvaluationStudents.map((stu, i) => {
                        const isGraduated = !!stu.is_graduated;
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "12px 10px", fontFamily: "monospace", fontWeight: "bold", color: "#00FF88" }}>{stu.nim}</td>
                            <td style={{ padding: "12px 10px", color: "#FAFAFA", fontWeight: 600 }}>{stu.nama}</td>
                            <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: "bold", color: "#00FF88" }}>{stu.total_points || 0} / 300</td>
                            <td style={{ padding: "12px 10px", textAlign: "center" }}>
                              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: isGraduated ? "#00FF88" : "#FF3333", fontWeight: 700 }}>
                                <input 
                                  type="checkbox" 
                                  checked={isGraduated} 
                                  onChange={() => handleGraduationToggle(stu.nim, isGraduated)}
                                  style={{ width: "16px", height: "16px", accentColor: "#00FF88", cursor: "pointer" }} 
                                />
                                <span>{isGraduated ? "LULUS & DIKUKUHKAN" : "TIDAK LULUS"}</span>
                              </label>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "tugas" && (
            <div className="clickable-task-card" style={{ cursor: "default", maxWidth: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                <Plus color="#00FF88" size={20} />
                <h3 style={{ color: "#FAFAFA", fontSize: "16px", margin: 0 }}>BUAT PENUGASAN BARU</h3>
              </div>
              <div className="detail-divider" style={{ marginBottom: "20px" }} />
              <form onSubmit={handleAddTask} className="auth-form" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="input-group"><label style={{ fontSize: "12px", color: "#aaa" }}>ID Tugas</label><input type="text" placeholder="Contoh: individu-2" value={taskId} onChange={(e) => setTaskId(e.target.value)} required style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                <div className="input-group"><label style={{ fontSize: "12px", color: "#aaa" }}>Kategori</label><select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} style={{ background: "#0a0a0a", border: "1.5px solid #1B22A7", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }}><option value="individu">Individu</option><option value="kelompok">Kelompok</option><option value="angkatan">Angkatan</option></select></div>
                <div className="input-group"><label style={{ fontSize: "12px", color: "#aaa" }}>Judul</label><input type="text" placeholder="Judul..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                <div className="input-group"><label style={{ fontSize: "12px", color: "#aaa" }}>Ketentuan (klik enter untuk ketentuan selanjutnya)</label><textarea rows={4} placeholder="Ketentuan..." value={taskRules} onChange={(e) => setTaskRules(e.target.value)} required style={{ background: "#0a0a0a", border: "1.5px solid #1B22A7", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                
                <div className="input-group">
                  <label style={{ fontSize: "12px", color: "#aaa" }}>Poin yang akan didapatkan</label>
                  <input type="number" placeholder="Contoh: 10" value={taskPoints} onChange={(e) => setTaskPoints(e.target.value === "" ? "" : Number(e.target.value))} required style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} />
                </div>

                <div className="input-group"><label style={{ fontSize: "12px", color: "#aaa" }}>Deadline</label><input type="datetime-local" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} required style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                <button type="submit" className="btn-auth-submit" disabled={loading} style={{ marginTop: "10px", padding: "12px", background: "#00FF88", color: "#000", fontWeight: 700, border: "none", borderRadius: "8px", cursor: "pointer" }}>{loading ? "MENYIMPAN..." : "TERBITKAN TUGAS"}</button>
              </form>
            </div>
          )}

          {activeTab === "pengumuman" && (
            <div className="clickable-task-card" style={{ cursor: "default", maxWidth: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                <Megaphone color="#00FF88" size={20} />
                <h3 style={{ color: "#FAFAFA", fontSize: "16px", margin: 0 }}>BUAT PENGUMUMAN RESMI</h3>
              </div>
              <div className="detail-divider" style={{ marginBottom: "20px" }} />
              <form onSubmit={handleAddAnnouncement} className="auth-form" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="input-group"><label style={{ fontSize: "12px", color: "#aaa" }}>Judul</label><input type="text" placeholder="Judul..." value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} required style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                <div className="input-group"><label style={{ fontSize: "12px", color: "#aaa" }}>Isi</label><textarea rows={6} placeholder="Isi..." value={annContent} onChange={(e) => setAnnContent(e.target.value)} required style={{ background: "#0a0a0a", border: "1.5px solid #1B22A7", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
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
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#fafafa", textAlign: "left" }}>
                        <th style={{ padding: "10px" }}>ID</th>
                        <th style={{ padding: "10px" }}>KATEGORI</th>
                        <th style={{ padding: "10px" }}>JUDUL</th>
                        <th style={{ padding: "10px" }}>POIN</th>
                        <th style={{ padding: "10px" }}>VISIBILITAS</th>
                        <th style={{ padding: "10px" }}>AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: "15px", color: "#666" }}>Kosong.</td></tr>
                      ) : (
                        tasks.map((t) => (
                          <tr key={t.id} style={{ borderBottom: "1px solid transparent" }}>
                            <td style={{ padding: "10px", color: "#fafafa", fontFamily: "monospace" }}>{t.id}</td>
                            <td style={{ padding: "10px" }}>{t.category}</td>
                            <td style={{ padding: "10px" }}>{t.title}</td>
                            <td style={{ padding: "10px", color: "#fafafa", fontWeight: "bold" }}>+{t.points || 0}</td>
                            
                            <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                              {t.is_active !== false ? (
                                <span style={{ background: "transparent", border: "1px solid #00FF88", color: "#00FF88", padding: "4px 10px", borderRadius: "50px", fontSize: "10px", fontWeight: 800, whiteSpace: "nowrap", display: "inline-block" }}>
                                  DIAKTIFKAN
                                </span>
                              ) : (
                                <span style={{ background: "transparent", border: "1px solid #FF3333", color: "#FF3333", padding: "4px 10px", borderRadius: "50px", fontSize: "10px", fontWeight: 800, whiteSpace: "nowrap", display: "inline-block" }}>
                                  DISEMBUNYIKAN
                                </span>
                              )}
                            </td>

                            <td style={{ padding: "10px", display: "flex", gap: "8px", whiteSpace: "nowrap" }}>
                              <button 
                                onClick={() => { 
                                  setEditTaskData({ ...t, rules: t.rules?.join("\n") || "", deadline: new Date(t.deadline).toISOString().slice(0, 16), points: t.points || 0 }); 
                                  setIsEditTaskModalOpen(true); 
                                }} 
                                style={{ background: "transparent", border: "1.5px solid #1B22A7", color: "#FAFAFA", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
                              >
                                <Pencil size={13} /> Edit
                              </button>

                              <button 
                                onClick={() => handleToggleTaskStatus(t.id, t.is_active !== false)} 
                                style={{ 
                                  background: t.is_active !== false ? "transparent" : "transparent", 
                                  border: t.is_active !== false ? "1px solid #FAFAFA" : "1.5px solid #1B22A7", 
                                  color: t.is_active !== false ? "#FAFAFA" : "#FAFAFA", 
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
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#FAFAFA", textAlign: "left" }}>
                        <th style={{ padding: "10px" }}>JUDUL</th>
                        <th style={{ padding: "10px" }}>TANGGAL</th>
                        <th style={{ padding: "10px" }}>VISIBILITAS</th>
                        <th style={{ padding: "10px" }}>AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {announcements.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: "15px", color: "#FAFAFA" }}>Kosong.</td></tr>
                      ) : (
                        announcements.map((a) => (
                          <tr key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "10px" }}>{a.title}</td>
                            <td style={{ padding: "10px", color: "#FAFAFA" }}>{new Date(a.created_at).toLocaleDateString("id-ID")}</td>
                            
                            <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                              {a.is_active !== false ? (
                                <span style={{ background: "transparent", border: "1px solid #00FF88", color: "#00FF88", padding: "4px 10px", borderRadius: "50px", fontSize: "10px", fontWeight: 800, whiteSpace: "nowrap", display: "inline-block" }}>
                                  DIAKTFKAN
                                </span>
                              ) : (
                                <span style={{ background: "transparent", border: "1px solid #FF3333", color: "#FF3333", padding: "4px 10px", borderRadius: "50px", fontSize: "10px", fontWeight: 800, whiteSpace: "nowrap", display: "inline-block" }}>
                                  DISEMBUNYIKAN
                                </span>
                              )}
                            </td>

                            <td style={{ padding: "10px", display: "flex", gap: "8px", whiteSpace: "nowrap" }}>
                              <button 
                                onClick={() => { setEditAnnData(a); setIsEditAnnModalOpen(true); }} 
                                style={{ background: "transparent", border: "1.5px solid #1B22A7", color: "#FAFAFA", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
                              >
                                <Pencil size={13} /> Edit
                              </button>

                              <button 
                                onClick={() => handleToggleAnnStatus(a.id, a.title, a.is_active !== false)} 
                                style={{ 
                                  background: a.is_active !== false ? "transparent" : "transparent", 
                                  border: a.is_active !== false ? "1px solid #FAFAFA" : "1.5px solid #1B22A7", 
                                  color: a.is_active !== false ? "#FAFAFA" : "#FAFAFA", 
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

      {/* 🟢 MODAL POP-UP EDIT TUGAS */}
      {isEditTaskModalOpen && editTaskData && (
        <div className="modal-overlay active" style={{ zIndex: 999999 }}>
          <div className="modal-card" style={{ maxWidth: "500px", textAlign: "left" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", width: "100%" }}>
              <h3 style={{ color: "#FAFAFA", fontSize: "16px", margin: 0 }}>EDIT TUGAS</h3>
              <button onClick={() => setIsEditTaskModalOpen(false)} style={{ background: "transparent", border: "none", color: "#aaa", cursor: "pointer" }}><X size={20} /></button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              <div className="input-group">
                <label style={{ fontSize: "11px", color: "#aaa" }}>Judul</label>
                <input 
                  type="text" 
                  value={editTaskData.title} 
                  onChange={(e) => setEditTaskData({ ...editTaskData, title: e.target.value })} 
                  style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} 
                />
              </div>

              <div className="input-group">
                <label style={{ fontSize: "11px", color: "#aaa" }}>Kategori</label>
                <select 
                  value={editTaskData.category} 
                  onChange={(e) => setEditTaskData({ ...editTaskData, category: e.target.value })} 
                  style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }}
                >
                  <option value="individu">Individu</option>
                  <option value="kelompok">Kelompok</option>
                  <option value="angkatan">Angkatan</option>
                </select>
              </div>

              <div className="input-group">
                <label style={{ fontSize: "11px", color: "#aaa" }}>Ketentuan (klik enter untuk ketentuan selanjunya)</label>
                <textarea 
                  rows={4} 
                  value={editTaskData.rules} 
                  onChange={(e) => setEditTaskData({ ...editTaskData, rules: e.target.value })} 
                  style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} 
                />
              </div>

              <div className="input-group">
                <label style={{ fontSize: "11px", color: "#aaa" }}>Poin yang akan didapatkan</label>
                <input 
                  type="number" 
                  value={editTaskData.points} 
                  onChange={(e) => setEditTaskData({ ...editTaskData, points: e.target.value })} 
                  style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} 
                />
              </div>

              <div className="input-group">
                <label style={{ fontSize: "11px", color: "#aaa" }}>Deadline</label>
                <input 
                  type="datetime-local" 
                  value={editTaskData.deadline} 
                  onChange={(e) => setEditTaskData({ ...editTaskData, deadline: e.target.value })} 
                  style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} 
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button type="button" onClick={handleSaveEditTask} className="btn-modal-primary" disabled={loading} style={{ background: "#00FF88", color: "#000", fontWeight: 700 }}>
                  {loading ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
                </button>
                <button type="button" onClick={() => setIsEditTaskModalOpen(false)} className="btn-modal-close">BATAL</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 MODAL POP-UP EDIT PENGUMUMAN */}
      {isEditAnnModalOpen && editAnnData && (
        <div className="modal-overlay active" style={{ zIndex: 999999 }}>
          <div className="modal-card" style={{ maxWidth: "500px", textAlign: "left" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", width: "100%" }}>
              <h3 style={{ color: "#FAFAFA", fontSize: "16px", margin: 0 }}>EDIT PENGUMUMAN</h3>
              <button onClick={() => setIsEditAnnModalOpen(false)} style={{ background: "transparent", border: "none", color: "#aaa", cursor: "pointer" }}><X size={20} /></button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              <div className="input-group">
                <label style={{ fontSize: "11px", color: "#aaa" }}>Judul</label>
                <input 
                  type="text" 
                  value={editAnnData.title} 
                  onChange={(e) => setEditAnnData({ ...editAnnData, title: e.target.value })} 
                  style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} 
                />
              </div>

              <div className="input-group">
                <label style={{ fontSize: "11px", color: "#aaa" }}>Isi</label>
                <textarea 
                  rows={5} 
                  value={editAnnData.content} 
                  onChange={(e) => setEditAnnData({ ...editAnnData, content: e.target.value })} 
                  style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} 
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button type="button" onClick={handleSaveEditAnn} className="btn-modal-primary" disabled={loading} style={{ background: "#00FF88", color: "#000", fontWeight: 700 }}>
                  {loading ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
                </button>
                <button type="button" onClick={() => setIsEditAnnModalOpen(false)} className="btn-modal-close">BATAL</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 MODAL KONFIRMASI AKSI */}
      {confirmModal.isOpen && (
        <div className="modal-overlay active" style={{ zIndex: 9999999 }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <AlertCircle className="modal-icon" style={{ color: "#FFAA00" }} />
              <h2>{confirmModal.title}</h2>
            </div>
            <p className="modal-desc" style={{ marginBottom: "20px" }}>{confirmModal.description}</p>
            <div className="modal-buttons">
              <button type="button" className="btn-modal-primary" onClick={confirmModal.onConfirm} style={{ background: "#FFAA00", color: "#000" }}>YA, LANJUTKAN</button>
              <button type="button" className="btn-modal-close" onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}>BATAL</button>
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