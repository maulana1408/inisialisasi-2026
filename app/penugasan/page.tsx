"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { 
  Megaphone, 
  FileText, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud, 
  FileCheck,
  User,
  ShieldAlert,
  Inbox,
  Pencil,
  X,
  ExternalLink,
  Award,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function PenugasanPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pengumuman");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isEditAnnModalOpen, setIsEditAnnModalOpen] = useState(false);
  const [editTaskData, setEditTaskData] = useState<any>(null);
  const [editAnnData, setEditAnnData] = useState<any>(null);

  const [currentNim, setCurrentNim] = useState<string | null>(null);
  
  const [userNama, setUserNama] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [userPoints, setUserPoints] = useState<number>(0);
  const [isGraduatedStatus, setIsGraduatedStatus] = useState<boolean>(false);
  const [graduationLabel, setGraduationLabel] = useState<string>("TIDAK LULUS");
  const [isLoaded, setIsLoaded] = useState(false);

  const [dbAnnouncements, setDbAnnouncements] = useState<any[]>([]);
  const [dbTasks, setDbTasks] = useState<any[]>([]);
  const [submissionsMap, setSubmissionsMap] = useState<{ [key: string]: any }>({});

  const [isAccessBlocked, setIsAccessBlocked] = useState(false);

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
    }, 500);

    setTimeout(() => {
      setToast((prev) => ({ ...prev, isExpanded: false }));
      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 500);
    }, 4200);
  };

  useEffect(() => {
    const savedNim = localStorage.getItem("user_nim");
    const savedNama = localStorage.getItem("user_nama");
    const savedRole = localStorage.getItem("user_role");

    if (!savedNim) {
      setIsAccessBlocked(true);
      document.body.style.overflow = "hidden";
      setIsLoaded(true);
      return;
    }

    if (savedNama) setUserNama(savedNama);
    if (savedRole) setUserRole(savedRole);
    setCurrentNim(savedNim);

    supabase.from("users").select("role, nama, total_points, is_graduated, graduation_status").eq("nim", savedNim).single().then(({ data }) => {
      if (data) {
        setUserRole(data.role || "mahasiswa");
        setUserPoints(data.total_points || 0);
        setIsGraduatedStatus(data.is_graduated || false);
        if (data.graduation_status) setGraduationLabel(data.graduation_status);
        if (data.nama) {
          setUserNama(data.nama);
          localStorage.setItem("user_nama", data.nama);
        }
        if (data.role) localStorage.setItem("user_role", data.role);
      }
      setIsLoaded(true);
    });
  }, []);

  const fetchData = async () => {
    if (!currentNim) return;

    try {
      const { data: subData } = await supabase
        .from("submissions")
        .select("task_id, submitted_at, file_url, file_name, status, nama, is_validated, awarded_points")
        .eq("user_nim", currentNim);

      const { data: attData } = await supabase
        .from("attendance")
        .select("session_name, is_present, awarded_points")
        .eq("user_nim", currentNim)
        .eq("is_present", true);

      if (subData) {
        const map: { [key: string]: any } = {};
        let calculatedTotalPoints = 0;

        subData.forEach((item) => {
          map[item.task_id] = item;
          if (item.is_validated && item.awarded_points) {
            calculatedTotalPoints += Number(item.awarded_points);
          }
        });

        if (attData) {
          attData.forEach((att) => {
            if (att.awarded_points) {
              calculatedTotalPoints += Number(att.awarded_points);
            }
          });
        }

        setSubmissionsMap(map);
        setUserPoints(calculatedTotalPoints);

        await supabase
          .from("users")
          .update({ total_points: calculatedTotalPoints })
          .eq("nim", currentNim);
      }

      const { data: annData } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (annData) setDbAnnouncements(annData);

      const { data: taskData } = await supabase
        .from("tasks")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (taskData) setDbTasks(taskData);

    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    if (currentNim) {
      fetchData();
    }
  }, [currentNim]);

  const handleTaskClick = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const handleOpenUploadModal = (taskId: string) => {
    setActiveTaskId(taskId);
    setSelectedFile(null);
    setIsUploadModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const getCleanViewUrl = (rawUrl: string) => {
    if (!rawUrl) return "#";
    return rawUrl.includes("?") ? rawUrl.replace("download=", "view=") : `${rawUrl}?view=true`;
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      triggerToast("GAGAL MENGIRIM BERKAS", "Silakan pilih berkas tugas Anda terlebih dahulu!", true);
      return;
    }

    const MAX_FILE_SIZE_MB = 25;
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      triggerToast("UKURAN FILE TERLALU BESAR", `Maksimal ukuran berkas adalah ${MAX_FILE_SIZE_MB}MB.`, true);
      return;
    }

    if (!activeTaskId || !currentNim) return;

    setIsUploading(true);

    try {
      const targetTask = dbTasks.find((t) => t.id === activeTaskId);
      const now = new Date();

      const sanitize = (text: string) => {
        return text.trim().toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      };

      const finalNama = userNama || localStorage.getItem("user_nama") || currentNim;
      const cleanNim = sanitize(currentNim);
      const cleanNama = sanitize(finalNama);
      const cleanKategori = sanitize(targetTask?.category || "tugas");
      const cleanJudul = sanitize(targetTask?.title || activeTaskId);
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'pdf';

      const timestampTag = Date.now();
      const formattedFileName = `${cleanNim}_${cleanNama}_${cleanKategori}_${cleanJudul}_${timestampTag}.${fileExt}`;
      const filePath = `${activeTaskId}/${cleanNim}_${cleanNama}_${cleanKategori}_${cleanJudul}.${fileExt}`;

      let isLate = false;
      if (targetTask?.deadline) {
        const deadlineDate = new Date(targetTask.deadline);
        if (!isNaN(deadlineDate.getTime())) {
          isLate = now.getTime() > deadlineDate.getTime();
        }
      }
      const statusText = isLate ? "TERLAMBAT" : "TEPAT WAKTU";

      await supabase.storage.from('task-files').remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from('task-files')
        .upload(filePath, selectedFile, { 
          upsert: true, 
          cacheControl: '3600',
          contentType: selectedFile.type,
          headers: {
            'Content-Disposition': `inline; filename="${formattedFileName}"`
          }
        });

      if (uploadError) throw new Error(`Storage error: ${uploadError.message}`);

      const { data: urlData } = supabase.storage
        .from('task-files')
        .getPublicUrl(filePath);

      const downloadPublicUrl = `${urlData.publicUrl}?v=${timestampTag}&view=true`;
      const submittedAt = now.toISOString();

      const { error: dbError } = await supabase
        .from('submissions')
        .upsert(
          {
            task_id: activeTaskId,
            user_nim: currentNim,
            nama: finalNama,
            tugas_id: targetTask?.title || activeTaskId,
            file_url: downloadPublicUrl,
            file_name: formattedFileName,
            submitted_at: submittedAt,
            status: statusText,
          },
          { onConflict: 'task_id,user_nim' }
        );

      if (dbError) throw new Error(`Database error: ${dbError.message}`);

      setSubmissionsMap((prev) => ({
        ...prev,
        [activeTaskId]: { 
          ...prev[activeTaskId],
          task_id: activeTaskId, 
          submitted_at: submittedAt, 
          file_url: downloadPublicUrl, 
          file_name: formattedFileName,
          status: statusText,
          nama: finalNama
        }
      }));

      setIsUploadModalOpen(false);
      setSelectedFile(null);
      fetchData();

      if (isLate) {
        triggerToast("BERKAS DIPERBARUI (TERLAMBAT)", "Tugas berhasil diunggah ulang namun melewati deadline!", true);
      } else {
        triggerToast("BERKAS DIPERBARUI", "Tugas berhasil diperbarui dan dikirim tepat waktu!", false);
      }

    } catch (error: any) {
      console.error("Upload Error:", error);
      triggerToast("GAGAL UNGGAH", error.message || "Terjadi kesalahan saat mengunggah berkas.", true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveEditTask = async () => {
    if (!editTaskData) return;
    setIsUploading(true);

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

      triggerToast("PERUBAHAN DISIMPAN", "Data penugasan berhasil diperbarui!", false);
      setIsEditTaskModalOpen(false);
      fetchData();
    } catch (err: any) {
      triggerToast("GAGAL UPDATE", err.message || "Gagal memperbarui tugas", true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveEditAnn = async () => {
    if (!editAnnData) return;
    setIsUploading(true);

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
      fetchData();
    } catch (err: any) {
      triggerToast("GAGAL UPDATE", err.message || "Gagal memperbarui pengumuman", true);
    } finally {
      setIsUploading(false);
    }
  };

  const renderContentWithLinks = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#FAFAFA", textDecoration: "underline", wordBreak: "break-all" }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const getTaskSubmissionStatus = (task: any) => {
    const sub = submissionsMap[task.id];
    if (!sub) {
      const isPastDeadline = new Date() > new Date(task.deadline);
      return { isSubmitted: false, isLate: isPastDeadline };
    }

    const isLateSubmitted = sub.status ? sub.status.toUpperCase() === "TERLAMBAT" : new Date(sub.submitted_at) > new Date(task.deadline);
    return { isSubmitted: true, isLate: isLateSubmitted };
  };

  const renderTaskIcon = (task: any, isLate: boolean) => {
    const { isSubmitted } = getTaskSubmissionStatus(task);
    if (isSubmitted || isLate) {
      return isLate ? (
        <AlertCircle style={{ width: "22px", height: "22px", color: "#FF3333" }} />
      ) : (
        <CheckCircle2 style={{ width: "22px", height: "22px", color: "#00FF88" }} />
      );
    }
    if (task.category === "kelompok" || task.category === "angkatan") {
      return <Users style={{ width: "22px", height: "22px", color: "#FAFAFA" }} />;
    }
    return <FileText style={{ width: "22px", height: "22px", color: "#FAFAFA" }} />;
  };

  const renderTaskCard = (task: any) => {
    const { isSubmitted, isLate } = getTaskSubmissionStatus(task);
    const userSubmission = submissionsMap[task.id];
    const themeColor = isLate ? "#FF3333" : "#00FF88";

    return (
      <div 
        key={task.id}
        className="clickable-task-card"
        onClick={() => handleTaskClick(task.id)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          marginBottom: "16px",
          display: "flex",
          flexDirection: "column",
          border: `2px solid ${themeColor}`,
          backgroundColor: isLate ? "rgba(255, 51, 51, 0.04)" : "rgba(0, 255, 136, 0.02)"
        }}
      >
        <div className="task-card-summary" style={{ display: "flex", alignItems: "flex-start", gap: "16px", width: "100%" }}>
          <div 
            className="task-icon-box" 
            style={{ 
              flexShrink: 0, 
              marginTop: "2px",
              background: isLate ? "rgba(255, 51, 51, 0.2)" : "rgba(0, 255, 136, 0.1)",
              border: `1.5px solid ${themeColor}`,
              borderRadius: "10px",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {renderTaskIcon(task, isLate)}
          </div>

          <div className="task-summary-text" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", width: "100%", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#FAFAFA", fontWeight: 700 }}>{task.title}</h3>
                
                {userSubmission && userSubmission.is_validated && (
                  <span style={{ background: isLate ? "transparent" : "transparent", border: `1px solid ${themeColor}`, color: themeColor, fontSize: "10px", fontWeight: "800", padding: "3px 10px", borderRadius: "50px", letterSpacing: "1px", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                    {isLate ? <AlertCircle style={{ width: "12px", height: "12px" }} /> : <CheckCircle2 style={{ width: "12px", height: "12px" }} />} TERVALIDASI
                  </span>
                )}

                {/* 🟢 Badge Menunggu Validasi diubah menjadi warna BIRU (#1B22A7) */}
                {userSubmission && !userSubmission.is_validated && (
                  <span style={{ background: "transparent", border: "2px solid #1B22A7", color: "#fafafa", fontSize: "10px", fontWeight: "800", padding: "3px 10px", borderRadius: "50px", letterSpacing: "1px", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                    ⏳ MENUNGGU VALIDASI
                  </span>
                )}

                {isSubmitted && !isLate && (
                  <span style={{ background: "transparent", border: "1px solid #00FF88", color: "#00FF88", fontSize: "10px", fontWeight: "800", padding: "3px 10px", borderRadius: "50px", letterSpacing: "1px", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                    <CheckCircle2 style={{ width: "12px", height: "12px" }} /> TEPAT WAKTU
                  </span>
                )}

                {(isSubmitted && isLate) || (!isSubmitted && isLate) ? (
                  <span style={{ background: "transparent", border: "1px solid #FF3333", color: "#FF3333", fontSize: "10px", fontWeight: "800", padding: "3px 10px", borderRadius: "50px", letterSpacing: "1px", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                    <AlertCircle style={{ width: "12px", height: "12px" }} /> TERLAMBAT
                  </span>
                ) : null}
              </div>

              {/* 🟢 Tombol Edit Tugas untuk Admin/Panitia diubah menjadi warna BIRU (#1B22A7) */}
              {(userRole === "panitia" || userRole === "admin") && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditTaskData({
                      ...task,
                      rules: task.rules?.join("\n") || "",
                      deadline: new Date(task.deadline).toISOString().slice(0, 16),
                      points: task.points || 0
                    });
                    setIsEditTaskModalOpen(true);
                  }}
                  style={{
                    background: "transparent",
                    border: "2px solid #1B22A7",
                    color: "#fafafa",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    flexShrink: 0
                  }}
                >
                  <Pencil size={12} /> EDIT
                </button>
              )}
            </div>

            <span className="task-meta-subtitle" style={{ color: "rgba(250, 250, 250, 0.6)", fontSize: "12px", marginTop: "6px", display: "block" }}>
              {task.rules?.length || 0} Ketentuan • Klik untuk rincian & upload
            </span>
          </div>
        </div>

        {expandedTask === task.id && (
          <div className="task-expanded-detail open" style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
            {task.rules?.map((rule: string, idx: number) => (
              <div 
                key={idx} 
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "24px 1fr", 
                  alignItems: "start", 
                  gap: "10px", 
                  marginBottom: "10px", 
                  textAlign: "left" 
                }}
              >
                <span 
                  style={{ 
                    color: "#FAFAFA",
                    fontWeight: 700, 
                    fontSize: "11px",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    background: "rgba(255, 255, 255, 0.05)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  {idx + 1}
                </span>
                <p 
                  style={{ 
                    margin: 0, 
                    fontSize: "13.5px", 
                    color: "rgba(250, 250, 250, 0.85)", 
                    textAlign: "left", 
                    lineHeight: "1.5"
                  }}
                >
                  {renderContentWithLinks(rule)}
                </p>
              </div>
            ))}

            {userSubmission && (
              <div style={{ marginTop: "15px", background: isLate ? "transparent" : "transparent", border: `1px solid ${themeColor}`, borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                  <FileCheck size={18} style={{ color: themeColor, flexShrink: 0 }} />
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span style={{ fontSize: "11px", color: themeColor, fontWeight: 700, textTransform: "uppercase" }}>Berkas Dikirim</span>
                    <span style={{ fontSize: "12px", color: "#FAFAFA", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {userSubmission.file_name || "Lihat File Tugas Anda"}
                    </span>
                  </div>
                </div>

                <a 
                  href={getCleanViewUrl(userSubmission.file_url)} 
                  target="_blank" 
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ background: themeColor, color: isLate ? "#FAFAFA" : "#000", fontSize: "11px", fontWeight: 800, padding: "5px 12px", borderRadius: "6px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", flexShrink: 0 }}
                >
                  CEK BERKAS <ExternalLink size={12} />
                </a>
              </div>
            )}

            <div className="task-action-footer" style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <span className="deadline-tag" style={{ fontSize: "11px", color: themeColor, fontWeight: 700, letterSpacing: "0.5px" }}>
                DEADLINE: {new Date(task.deadline).toLocaleString("id-ID")}
              </span>
              <button 
                type="button" 
                className="btn-task-upload"
                style={{
                  borderColor: themeColor,
                  color: isLate ? "#FAFAFA" : themeColor,
                  background: isLate ? "#FF3333" : "transparent"
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenUploadModal(task.id);
                }}
              >
                {isSubmitted ? "UNGGAH ULANG" : "UPLOAD TUGAS"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      <div className={isAccessBlocked ? "blur-behind" : ""}>
        <Navbar />
      </div>

      <div 
        className={`dashboard-container ${isAccessBlocked ? "blur-behind" : ""}`}
        style={{
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
          padding: "120px 24px 60px 24px",
          boxSizing: "border-box"
        }}
      >
        <aside 
          className="task-sidebar" 
          style={{ 
            display: "flex", 
            flexDirection: "column", 
            position: "sticky", 
            top: "120px", 
            height: "calc(100vh - 140px)", 
            maxHeight: "800px",
            boxSizing: "border-box",
            padding: "24px" 
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <div style={{ marginBottom: "5px" }}>
              <div style={{ 
                minHeight: "38px",
                marginBottom: "10px", 
                background: userRole === "admin" ? "transparent" : "transparent", 
                border: userRole === "admin" ? "1px solid #FF3333" : "2px solid #1B22A7", 
                padding: "6px 12px", 
                borderRadius: "20px", 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "6px" 
              }}>
                {userRole === "admin" ? <ShieldAlert size={13} style={{ color: "#FF3333" }} /> : <User size={13} style={{ color: "#fafafa" }} />}
                <span style={{ fontSize: "11px", color: userRole === "admin" ? "#FF3333" : "#fafafa", fontWeight: 700, textTransform: "uppercase" }}>
                  {userNama || "MEMUAT..."}
                </span>
              </div>

              <h2 className="sidebar-header-title">MENU UTAMA</h2>
            </div>

            <div className="sidebar-menu">
              <button type="button" className={`sidebar-btn ${activeTab === "pengumuman" ? "active" : ""}`} onClick={() => setActiveTab("pengumuman")}>
                PENGUMUMAN
              </button>
              <button type="button" className={`sidebar-btn ${activeTab === "individu" ? "active" : ""}`} onClick={() => setActiveTab("individu")}>
                INDIVIDU
              </button>
              <button type="button" className={`sidebar-btn ${activeTab === "kelompok" ? "active" : ""}`} onClick={() => setActiveTab("kelompok")}>
                KELOMPOK
              </button>
              <button type="button" className={`sidebar-btn ${activeTab === "angkatan" ? "active" : ""}`} onClick={() => setActiveTab("angkatan")}>
                ANGKATAN
              </button>
            </div>
          </div>

          <div style={{ marginTop: "auto", flexShrink: 0, paddingTop: "20px" }}>
            {userRole !== "admin" && userRole !== "panitia" && (
              <div style={{ background: "#0a0a0e", border: "2px solid #1B22A7", borderRadius: "14px", padding: "16px", textAlign: "left", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#fafafa", fontWeight: 700, textTransform: "uppercase" }}>Akumulasi Poin</span>
                  <Award size={16} style={{ color: "#fafafa" }} />
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "24px", fontWeight: 800, color: "#FAFAFA" }}>{userPoints}</span>
                  <span style={{ fontSize: "13px", color: "rgba(250, 250, 250, 0.5)", fontWeight: 600 }}>/ 300</span>
                </div>

                <div style={{ borderTop: "1px solid #1B22A7", paddingTop: "10px" }}>
                  <span style={{ fontSize: "10px", color: "#fafafa", display: "block", marginBottom: "4px" }}>Status Kelulusan:</span>
                  {isGraduatedStatus ? (
                    <div style={{ background: "rgba(0, 255, 136, 0.12)", border: "1px solid #00FF88", color: "#00FF88", padding: "6px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
                      <CheckCircle size={14} /> {graduationLabel}
                    </div>
                  ) : (
                    <div style={{ background: "transparent", border: "2px solid #1B22A7", color: "rgba(250, 250, 250, 0.5)", padding: "6px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
                      ⏳ MENUNGGU KEPUTUSAN
                    </div>
                  )}
                </div>
              </div>
            )}

            {(userRole === "panitia" || userRole === "admin") && (
              <a 
                href={userRole === "admin" ? "/admin" : "/panitia"} 
                className="sidebar-btn" 
                style={{ background: "rgba(0, 255, 136, 0.08)", border: "1px solid #00FF88", color: "#00FF88", textAlign: "center", textDecoration: "none", display: "block" }}
              >
                ⚙️ PANEL {userRole.toUpperCase()}
              </a>
            )}
          </div>
        </aside>

        <main className="task-main-content">
          {activeTab === "pengumuman" && (
            <div className="tab-panel active">
              {dbAnnouncements.length > 0 ? (
                dbAnnouncements.map((ann) => (
                  <div key={ann.id} className="clickable-task-card" style={{ cursor: "default", marginBottom: "16px" }}>
                    <div className="task-card-summary" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div className="task-icon-box" style={{ flexShrink: 0 }}>
                        <Megaphone style={{ width: "22px", height: "22px", color: "#fafafa" }} />
                      </div>
                      <div className="task-summary-text" style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: "16px" }}>{ann.title}</h3>
                            <span className="task-meta-subtitle" style={{ color: "#00FF88", fontWeight: 700, fontSize: "12px" }}>
                              {new Date(ann.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                            </span>
                          </div>

                          {/* 🟢 Tombol Edit Pengumuman untuk Admin/Panitia */}
                          {(userRole === "panitia" || userRole === "admin") && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditAnnData(ann);
                                setIsEditAnnModalOpen(true);
                              }}
                              style={{
                                background: "transparent",
                                border: "2px solid #1B22A7",
                                color: "#fafafa",
                                padding: "5px 12px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <Pencil size={12} /> EDIT
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="detail-divider" style={{ margin: "12px 0", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }} />
                    <div style={{ color: "rgba(250, 250, 250, 0.85)", fontSize: "13.5px", lineHeight: 1.6, whiteSpace: "pre-line", textAlign: "left" }}>
                      <p style={{ margin: 0 }}>{renderContentWithLinks(ann.content)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="clickable-task-card" style={{ cursor: "default", textAlign: "center", padding: "40px 20px" }}>
                  <Inbox style={{ width: "40px", height: "40px", color: "#666", marginBottom: "10px" }} />
                  <p style={{ color: "#888", fontSize: "14px", margin: 0 }}>Belum ada pengumuman resmi.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "individu" && (
            <div className="tab-panel active">
              {dbTasks.filter(t => t.category === "individu").length > 0 ? (
                dbTasks.filter(t => t.category === "individu").map(renderTaskCard)
              ) : (
                <div className="clickable-task-card" style={{ cursor: "default", textAlign: "center", padding: "40px 20px" }}>
                  <Inbox style={{ width: "40px", height: "40px", color: "#666", marginBottom: "10px" }} />
                  <p style={{ color: "#888", fontSize: "14px", margin: 0 }}>Belum ada tugas individu.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "kelompok" && (
            <div className="tab-panel active">
              {dbTasks.filter(t => t.category === "kelompok").length > 0 ? (
                dbTasks.filter(t => t.category === "kelompok").map(renderTaskCard)
              ) : (
                <div className="clickable-task-card" style={{ cursor: "default", textAlign: "center", padding: "40px 20px" }}>
                  <Inbox style={{ width: "40px", height: "40px", color: "#666", marginBottom: "10px" }} />
                  <p style={{ color: "#888", fontSize: "14px", margin: 0 }}>Belum ada tugas kelompok.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "angkatan" && (
            <div className="tab-panel active">
              {dbTasks.filter(t => t.category === "angkatan").length > 0 ? (
                dbTasks.filter(t => t.category === "angkatan").map(renderTaskCard)
              ) : (
                <div className="clickable-task-card" style={{ cursor: "default", textAlign: "center", padding: "40px 20px" }}>
                  <Inbox style={{ width: "40px", height: "40px", color: "#666", marginBottom: "10px" }} />
                  <p style={{ color: "#888", fontSize: "14px", margin: 0 }}>Belum ada tugas angkatan.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL AKSES DIBATASI */}
      {isAccessBlocked && (
        <div className="modal-overlay active" style={{ zIndex: 99999999 }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <ShieldAlert className="modal-icon" />
              <h2>AKSES DIBATASI</h2>
            </div>
            
            <p className="modal-desc">
              Anda harus melakukan <strong>Log In</strong> atau <strong>Aktivasi Akun</strong> terlebih dahulu untuk melihat berkas penugasan.
            </p>

            <div className="modal-buttons">
              <a href="/login" className="btn-modal-primary">
                Log In / Aktivasi
              </a>
              <button type="button" className="btn-modal-close" onClick={() => router.push("/")}>
                KEMBALI KE BERANDA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD (.pdf, .mp4, .txt) */}
      {isUploadModalOpen && (
        <div className="modal-overlay active" style={{ zIndex: 999999 }} onClick={() => !isUploading && setIsUploadModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <UploadCloud style={{ width: "38px", height: "38px", color: "#1B22A7" }} />
              <h2 style={{ color: "#FAFAFA", fontSize: "18px", margin: 0 }}>UNGGAH BERKAS TUGAS</h2>
            </div>
            <p className="modal-desc" style={{ marginBottom: "20px" }}>Silakan pilih berkas tugas Anda (Format: PDF, MP4, atau TXT untuk link Drive).</p>

            <label 
              htmlFor="fileInput" 
              className="dropzone-area" 
              style={{ display: "block", cursor: "pointer" }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setSelectedFile(e.dataTransfer.files[0]);
                }
              }}
            >
              <div className="dropzone-info">
                <UploadCloud style={{ width: "28px", height: "28px", color: "#1B22A7", marginBottom: "8px" }} />
                <p className="dropzone-text">Tarik & Lepaskan atau <span style={{ color: "#FAFAFA", fontWeight: 700 }}>Pilih Berkas</span></p>
                <span className="file-spec">Format dapat berupa: .pdf, .mp4, atau .txt (Maks. 25MB)</span>
              </div>
              <input type="file" id="fileInput" style={{ display: "none" }} accept=".pdf,.mp4,.txt" onChange={handleFileChange} disabled={isUploading} />
            </label>

            {selectedFile && (
              <div style={{ marginTop: "15px", textAlign: "left", background: "rgba(0, 255, 136, 0.08)", border: "1px solid #00FF88", padding: "12px 16px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                <FileCheck style={{ width: "20px", height: "20px", color: "#00FF88" }} />
                <span style={{ fontSize: "12.5px", color: "#FAFAFA", fontWeight: 600 }}>{selectedFile.name}</span>
              </div>
            )}

            <div className="modal-buttons" style={{ marginTop: "25px" }}>
              <button type="button" className="btn-modal-primary" onClick={handleUploadSubmit} disabled={isUploading}>
                {isUploading ? "MENGUNGGAH..." : "KIRIM TUGAS"}
              </button>
              <button type="button" className="btn-modal-close" onClick={() => setIsUploadModalOpen(false)} disabled={isUploading}>KEMBALI</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT TUGAS */}
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
                  style={{ background: "#0a0a0a", border: "22px solid #fafafa", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} 
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button type="button" onClick={handleSaveEditTask} className="btn-modal-primary" disabled={isUploading} style={{ background: "#00FF88", color: "#000", fontWeight: 700 }}>
                  {isUploading ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
                </button>
                <button type="button" onClick={() => setIsEditTaskModalOpen(false)} className="btn-modal-close">BATAL</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT PENGUMUMAN */}
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
                <button type="button" onClick={handleSaveEditAnn} className="btn-modal-primary" disabled={isUploading} style={{ background: "#00FF88", color: "#000", fontWeight: 700 }}>
                  {isUploading ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
                </button>
                <button type="button" onClick={() => setIsEditAnnModalOpen(false)} className="btn-modal-close">BATAL</button>
              </div>
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
    </div>
  );
}