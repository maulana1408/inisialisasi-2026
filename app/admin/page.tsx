"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import {
  Eye,
  Plus,
  Megaphone,
  FileSpreadsheet,
  Filter,
  Pencil,
  X,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  GraduationCap,
  Search
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
  const [attendancePointsMap, setAttendancePointsMap] = useState<{ [key: string]: number }>({});
  const [attendancePenaltyMap, setAttendancePenaltyMap] = useState<{ [key: string]: boolean }>({});

  // State Filter Rekap
  const [filterCategory, setFilterCategory] = useState<"all" | "individu" | "kelompok" | "angkatan">("all");
  const [filterLateStatus, setFilterLateStatus] = useState<"all" | "ontime" | "late">("all");
  const [filterTaskTitle, setFilterTaskTitle] = useState<string>("all");
  const [filterKelompok, setFilterKelompok] = useState<string>("all");

  // State Filter Presensi & Pencarian
  const [filterAttendanceStatus, setFilterAttendanceStatus] = useState<"all" | "present" | "absent">("all");
  const [filterAttendanceKelompok, setFilterAttendanceKelompok] = useState<string>("all");
  const [attendanceFilterMode, setAttendanceFilterMode] = useState<"all" | "under80" | "above80">("all");
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState("");

  // State Filter Evaluasi Akhir
  const [filterEvalPoints, setFilterEvalPoints] = useState<"all" | "complete" | "incomplete">("all");
  const [filterEvalKelompok, setFilterEvalKelompok] = useState<string>("all");
  const GRADUATION_THRESHOLD = 2300;

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

  const listKelompok = [
    "LARAVEL", "ZEND", "SYMPHONY", "LUMEN", "SLIM", 
    "DART", "PHALCON", "FLUTTER", "LAMINAS", "FLIGHT"
  ];

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

  const formatInputToISO = (datetimeLocalVal: string) => {
    if (!datetimeLocalVal) return "";
    const localDate = new Date(datetimeLocalVal);
    return isNaN(localDate.getTime()) ? datetimeLocalVal : localDate.toISOString();
  };

  const formatISOToInput = (isoString: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const formatDateTimeWIB = (dateString: string) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    return d.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).replace(/\./g, ":");
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
    loadAllData().catch((err: any) => {
      triggerToast("GAGAL MEMUAT DATA", err.message || "Tidak dapat memuat data admin.", true);
    });
  }, []);

  const loadAllData = async () => {
    const [tasksRes, annRes, subRes, usersRes] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: true }),
      supabase.from("announcements").select("*").order("created_at", { ascending: true }),
      supabase.from("submissions").select("*, users(nama, nim, kelompok)").order("submitted_at", { ascending: false }),
      supabase.from("users").select("nim, nama, role, total_points, is_graduated, graduation_status, kelompok").neq("role", "admin").order("total_points", { ascending: false }),
    ]);

    if (tasksRes.error) throw tasksRes.error;
    if (annRes.error) throw annRes.error;
    if (subRes.error) throw subRes.error;
    if (usersRes.error) throw usersRes.error;

    const taskData = tasksRes.data;
    const annData = annRes.data;
    const subData = subRes.data;
    const userData = usersRes.data;

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

  const loadAttendance = async () => {
    if (!currentNim) return;

    const { data, error } = await supabase
      .from("attendance")
      .select("user_nim, session_name, is_present, awarded_points, points_awarded")
      .eq("session_name", selectedSession);

    if (error) {
      triggerToast("GAGAL MEMUAT PRESENSI", error.message, true);
      setAttendanceRecords({});
      setAttendancePointsMap({});
      return;
    }

    const attMap: { [key: string]: boolean } = {};
    const ptsMap: { [key: string]: number } = {};

    (data || []).forEach((att) => {
      attMap[att.user_nim] = !!att.is_present;
      ptsMap[att.user_nim] = Number(att.awarded_points ?? att.points_awarded ?? 0);
    });

    setAttendanceRecords(attMap);
    setAttendancePointsMap(ptsMap);

    const { data: penaltyData, error: penaltyError } = await supabase
      .from("attendance_penalties")
      .select("kelompok")
      .eq("session_name", selectedSession);

    if (!penaltyError) {
      const penaltyMap: { [key: string]: boolean } = {};
      (penaltyData || []).forEach((item) => {
        penaltyMap[item.kelompok] = true;
      });
      setAttendancePenaltyMap(penaltyMap);
    }

    const firstPoints = (data || []).find(
      (item) => item.awarded_points !== null && item.awarded_points !== undefined
    );
    if (firstPoints) setSessionPoints(Number(firstPoints.awarded_points));
  };

  useEffect(() => {
    if (!currentNim) return;
    loadAttendance();
  }, [selectedSession, currentNim]);

  const getGroupAttendancePercentage = (kelompokName: string) => {
    const members = students.filter((s) => s.kelompok === kelompokName);
    if (members.length === 0) return 100;
    const presentCount = members.filter((s) => !!attendanceRecords[s.nim]).length;
    return (presentCount / members.length) * 100;
  };

  const under80Groups = listKelompok.filter((kel) => getGroupAttendancePercentage(kel) < 80);
  const above80Groups = listKelompok.filter((kel) => getGroupAttendancePercentage(kel) >= 80);

  const recalculateUserTotalPoints = async (nim: string) => {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("kelompok")
      .eq("nim", nim)
      .single();

    if (userError || !userData) throw userError || new Error(`Mahasiswa ${nim} tidak ditemukan.`);

    const { data: taskAwards, error: taskError } = await supabase
      .from("task_awards")
      .select("awarded_points")
      .eq("user_nim", nim)
      .eq("is_validated", true);

    if (taskError) throw taskError;

    const { data: attPointsData, error: attError } = await supabase
      .from("attendance")
      .select("awarded_points, points_awarded")
      .eq("user_nim", nim);

    if (attError) throw attError;

    const { data: penalties, error: penaltyError } = await supabase
      .from("attendance_penalties")
      .select("penalty_points")
      .eq("kelompok", userData.kelompok);

    if (penaltyError) throw penaltyError;

    const totalTaskP = (taskAwards || []).reduce(
      (acc, curr) => acc + Number(curr.awarded_points || 0),
      0
    );

    const totalAttP = (attPointsData || []).reduce(
      (acc, curr) => acc + Number(curr.awarded_points ?? curr.points_awarded ?? 0),
      0
    );

    const totalPenalty = (penalties || []).reduce(
      (acc, curr) => acc + Number(curr.penalty_points || 0),
      0
    );

    const grandTotal = totalTaskP + totalAttP - totalPenalty;

    const { error: updateError } = await supabase
      .from("users")
      .update({ total_points: grandTotal })
      .eq("nim", nim);

    if (updateError) throw updateError;

    return grandTotal;
  };

  const recalculateManyUsers = async (nims: string[]) => {
    const uniqueNims = Array.from(new Set(nims.filter(Boolean)));
    for (const nim of uniqueNims) {
      await recalculateUserTotalPoints(nim);
    }
  };

  const handleAttendanceToggle = async (nim: string, currentIsPresent: boolean) => {
    const nextIsPresent = !currentIsPresent;
    const defaultPoints = Number(sessionPoints) || 375;
    const newPoints = nextIsPresent ? defaultPoints : 0;

    setAttendanceRecords((prev) => ({ ...prev, [nim]: nextIsPresent }));
    setAttendancePointsMap((prev) => ({ ...prev, [nim]: newPoints }));

    const { error } = await supabase
      .from("attendance")
      .upsert(
        {
          user_nim: nim,
          session_name: selectedSession,
          is_present: nextIsPresent,
          awarded_points: newPoints,
          points_awarded: newPoints,
        },
        { onConflict: "user_nim,session_name" }
      );

    if (error) {
      setAttendanceRecords((prev) => ({ ...prev, [nim]: currentIsPresent }));
      triggerToast("GAGAL UPDATE KEHADIRAN", error.message, true);
      return;
    }

    try {
      await recalculateUserTotalPoints(nim);
      triggerToast(
        nextIsPresent ? "DITANDAI HADIR" : "DITANDAI TIDAK HADIR",
        `${nim} berhasil diperbarui untuk sesi ${selectedSession}.`,
        false
      );
      await loadAllData();
    } catch (err: any) {
      triggerToast("TOTAL POIN GAGAL DIHITUNG", err.message, true);
    }
  };

  const handleAttendancePointsChange = async (nim: string, newPoints: number) => {
    const isPresent = newPoints > 0;

    setAttendancePointsMap((prev) => ({ ...prev, [nim]: newPoints }));
    setAttendanceRecords((prev) => ({ ...prev, [nim]: isPresent }));

    const { error } = await supabase
      .from("attendance")
      .upsert(
        {
          user_nim: nim,
          session_name: selectedSession,
          is_present: isPresent,
          awarded_points: newPoints,
          points_awarded: newPoints,
        },
        { onConflict: "user_nim,session_name" }
      );

    if (error) {
      triggerToast("GAGAL SIMPAN POIN", error.message, true);
      return;
    }

    try {
      await recalculateUserTotalPoints(nim);
      triggerToast("POIN DIPERBARUI", `Poin presensi ${nim} diset ke ${newPoints} poin!`, false);
      await loadAllData();
    } catch (err: any) {
      triggerToast("TOTAL POIN GAGAL DIHITUNG", err.message, true);
    }
  };

  const handleBatchPenalizeFilteredGroups = async () => {
    setLoading(true);

    try {
      let targetGroups = under80Groups;

      if (filterAttendanceKelompok !== "all") {
        if (getGroupAttendancePercentage(filterAttendanceKelompok) >= 80) {
          triggerToast(
            "KELOMPOK TIDAK MEMENUHI SYARAT",
            `${filterAttendanceKelompok} memiliki kehadiran ${getGroupAttendancePercentage(filterAttendanceKelompok).toFixed(0)}%. Penalti hanya untuk < 80%.`,
            true
          );
          return;
        }
        targetGroups = [filterAttendanceKelompok];
      }

      if (targetGroups.length === 0) {
        triggerToast("TIDAK ADA TARGET", "Tidak ada kelompok dengan kehadiran di bawah 80% pada sesi ini.", true);
        return;
      }

      const { data: existingPenalties, error: existingPenaltyError } = await supabase
        .from("attendance_penalties")
        .select("kelompok")
        .eq("session_name", selectedSession)
        .in("kelompok", targetGroups);

      if (existingPenaltyError) throw existingPenaltyError;

      const alreadyApplied = new Set((existingPenalties || []).map((row) => row.kelompok));
      const groupsToApply = targetGroups.filter((group) => !alreadyApplied.has(group));

      if (groupsToApply.length === 0) {
        triggerToast("SUDAH DITERAPKAN", `Penalti ${selectedSession} sudah pernah diterapkan pada kelompok target.`, true);
        return;
      }

      const penaltyRows = groupsToApply.map((kelompok) => ({
        session_name: selectedSession,
        kelompok,
        penalty_points: 10,
        attendance_percentage: getGroupAttendancePercentage(kelompok),
      }));

      const { error: insertPenaltyError } = await supabase
        .from("attendance_penalties")
        .insert(penaltyRows);

      if (insertPenaltyError) throw insertPenaltyError;

      const targetStudents = students.filter((stu) => groupsToApply.includes(stu.kelompok));
      await recalculateManyUsers(targetStudents.map((stu) => stu.nim));

      await loadAttendance();
      await loadAllData();

      triggerToast(
        "PENALTI BERHASIL",
        `-10 poin diterapkan ke seluruh anggota dari ${groupsToApply.length} kelompok yang kehadirannya di bawah 80%.`,
        false
      );
    } catch (err: any) {
      triggerToast("GAGAL PENALTI", err.message || "Terjadi kesalahan saat memproses penalti massal.", true);
    } finally {
      setLoading(false);
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

  const handleAutoGraduateByThreshold = async () => {
    setLoading(true);
    try {
      const targetStudents = filterEvalKelompok === "all"
        ? students
        : students.filter((s) => s.kelompok === filterEvalKelompok);

      const qualifiedStudents = targetStudents.filter((s) => (s.total_points || 0) >= GRADUATION_THRESHOLD);
      
      for (const stu of qualifiedStudents) {
        await supabase
          .from("users")
          .update({
            is_graduated: true,
            graduation_status: "LULUS & DIKUKUHKAN"
          })
          .eq("nim", stu.nim);
      }

      triggerToast("BERHASIL", `Mahasiswa dengan poin >= ${GRADUATION_THRESHOLD} berhasil diluluskan secara otomatis!`, false);
      loadAllData();
    } catch (err: any) {
      triggerToast("GAGAL", err.message || "Terjadi kesalahan saat memproses kelulusan otomatis.", true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSessionPoints = async () => {
    const pointsVal = Number(sessionPoints) || 0;

    const { error } = await supabase
      .from("attendance")
      .update({
        awarded_points: pointsVal,
        points_awarded: pointsVal,
      })
      .eq("session_name", selectedSession)
      .eq("is_present", true);

    if (error) {
      triggerToast("GAGAL", error.message, true);
      return;
    }

    try {
      const presentStudents = students.filter((stu) => attendanceRecords[stu.nim]);
      await recalculateManyUsers(presentStudents.map((stu) => stu.nim));
      await loadAttendance();
      await loadAllData();
      triggerToast("POIN DIPERBARUI", `Berhasil mengatur ${pointsVal} poin untuk sesi ${selectedSession}!`, false);
    } catch (err: any) {
      triggerToast("TOTAL POIN GAGAL DIHITUNG", err.message, true);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("tasks").insert({
      id: taskId.trim(),
      category: taskCategory,
      title: taskTitle,
      rules: taskRules,
      deadline: formatInputToISO(taskDeadline),
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
      const formattedRules = Array.isArray(editTaskData.rules)
        ? editTaskData.rules.join("\n")
        : (editTaskData.rules || "");

      const { error } = await supabase
        .from("tasks")
        .update({
          title: editTaskData.title,
          category: editTaskData.category,
          rules: formattedRules,
          deadline: formatInputToISO(editTaskData.deadline),
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

  const getTaskPointOptions = (category: string, title: string) => {
    const lowerTitle = (title || "").toLowerCase();
    const isRangkuman = lowerTitle.includes("rangkuman") || lowerTitle.includes("resume");

    if (isRangkuman) {
      return [
        { label: "Tepat waktu (50)", points: 50 },
        { label: "Terlambat (30)", points: 30 },
        { label: "Revisi (25)", points: 25 },
        { label: "Telat & Revisi (20)", points: 20 },
        { label: "Tolak (0)", points: 0 }
      ];
    }

    if (category === "kelompok") {
      return [
        { label: "Tepat waktu (85)", points: 85 },
        { label: "Terlambat (70)", points: 70 },
        { label: "Revisi (60)", points: 60 },
        { label: "Telat & Revisi (35)", points: 35 },
        { label: "Tolak (0)", points: 0 }
      ];
    }

    if (category === "angkatan") {
      return [
        { label: "Tepat waktu (70)", points: 70 },
        { label: "Terlambat (60)", points: 60 },
        { label: "Tolak (0)", points: 0 }
      ];
    }

    return [
      { label: "Tepat waktu (100)", points: 100 },
      { label: "Terlambat (85)", points: 85 },
      { label: "Revisi (70)", points: 70 },
      { label: "Telat & Revisi (45)", points: 45 },
      { label: "Tolak (0)", points: 0 }
    ];
  };

  const handleTaskPointOptionChange = async (submissionId: string, targetNim: string, newPoints: number) => {
    const currentSub = submissions.find((s) => s.id === submissionId);
    if (!currentSub) {
      triggerToast("DATA TIDAK DITEMUKAN", "Submission yang dipilih tidak ditemukan.", true);
      return;
    }

    const targetTask = tasksMap[currentSub.task_id];
    const taskCat = String(targetTask?.category || "individu").toLowerCase();
    const targetKelompok = currentSub?.users?.kelompok;
    const isValidated = newPoints > 0;

    setLoading(true);
    try {
      const { error: submissionError } = await supabase
        .from("submissions")
        .update({
          is_validated: isValidated,
          awarded_points: newPoints,
        })
        .eq("id", submissionId);

      if (submissionError) throw submissionError;

      let recipients = [{ nim: targetNim }];
      let distributionType = "individu";

      if (taskCat === "kelompok") {
        if (!targetKelompok) {
          throw new Error("Mahasiswa perwakilan belum memiliki kelompok.");
        }

        const { data, error } = await supabase
          .from("users")
          .select("nim")
          .eq("kelompok", targetKelompok)
          .neq("role", "admin");

        if (error) throw error;
        recipients = data || [];
        distributionType = "kelompok";
      } else if (taskCat === "angkatan") {
        const { data, error } = await supabase
          .from("users")
          .select("nim")
          .neq("role", "admin");

        if (error) throw error;
        recipients = data || [];
        distributionType = "angkatan";
      }

      const recipientNims = Array.from(new Set(recipients.map((item) => item.nim).filter(Boolean)));

      if (newPoints <= 0) {
        const { error: deleteAwardsError } = await supabase
          .from("task_awards")
          .delete()
          .eq("task_id", currentSub.task_id)
          .in("user_nim", recipientNims);

        if (deleteAwardsError) throw deleteAwardsError;
      } else {
        const awardRows = recipientNims.map((nim) => ({
          task_id: currentSub.task_id,
          user_nim: nim,
          awarded_points: newPoints,
          is_validated: true,
          source_submission_id: submissionId,
          distribution_type: distributionType,
          recorded_at: new Date().toISOString(),
        }));

        const { error: awardError } = await supabase
          .from("task_awards")
          .upsert(awardRows, { onConflict: "task_id,user_nim" });

        if (awardError) throw awardError;
      }

      await recalculateManyUsers(recipientNims);
      await loadAllData();

      if (taskCat === "kelompok") {
        triggerToast(
          "DISTRIBUSI KELOMPOK",
          `Nilai ${newPoints} poin dari tugas ini dibagikan ke ${recipientNims.length} anggota ${targetKelompok}.`,
          false
        );
      } else if (taskCat === "angkatan") {
        triggerToast(
          "DISTRIBUSI ANGKATAN",
          `Nilai ${newPoints} poin dari tugas ini dibagikan ke ${recipientNims.length} mahasiswa maba.`,
          false
        );
      } else {
        triggerToast("POIN PENUGASAN DIUBAH", `Tugas ${targetNim} diset ke ${newPoints} poin!`, false);
      }
    } catch (err: any) {
      triggerToast("GAGAL DISTRIBUSI NILAI", err.message || "Terjadi kesalahan saat mendistribusikan nilai.", true);
    } finally {
      setLoading(false);
    }
  };

  const getCleanViewUrl = (rawUrl: string) => {
    if (!rawUrl) return "#";
    return rawUrl.includes("?") ? rawUrl.replace("download=", "view=") : `${rawUrl}?view=true`;
  };

  const processedSubmissions = submissions.map((sub) => {
    const task = tasksMap[sub.task_id];
    let isLate = false;
    let category = task?.category || "individu";
    let taskTitleDisplay = task?.title || sub.tugas_id || sub.task_id;
    let taskPointsValue = task?.points || 0;
    let userKelompok = sub.users?.kelompok || "-";

    if (task && task.deadline && sub.submitted_at) {
      isLate = new Date(sub.submitted_at) > new Date(task.deadline);
    }

    return { 
      ...sub, 
      isLate, 
      category,
      task_title: taskTitleDisplay,
      task_points: taskPointsValue,
      kelompok: userKelompok,
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

    let matchKelompok = true;
    if (filterKelompok !== "all") {
      matchKelompok = sub.kelompok === filterKelompok;
    }

    return matchCat && matchStatus && matchTitle && matchKelompok;
  });

  const filteredStudents = students.filter((stu) => {
    const isPresent = !!attendanceRecords[stu.nim];
    let matchStatus = true;
    if (filterAttendanceStatus === "present") matchStatus = isPresent;
    if (filterAttendanceStatus === "absent") matchStatus = !isPresent;

    let matchKelompok = true;
    if (filterAttendanceKelompok !== "all") {
      matchKelompok = stu.kelompok === filterAttendanceKelompok;
    }

    let matchAttendanceMode = true;
    if (attendanceFilterMode === "under80") {
      matchAttendanceMode = under80Groups.includes(stu.kelompok);
    } else if (attendanceFilterMode === "above80") {
      matchAttendanceMode = above80Groups.includes(stu.kelompok);
    }

    let matchSearch = true;
    if (attendanceSearchQuery.trim() !== "") {
      const q = attendanceSearchQuery.toLowerCase();
      const nameMatch = (stu.nama || "").toLowerCase().includes(q);
      const nimMatch = (stu.nim || "").toLowerCase().includes(q);
      matchSearch = nameMatch || nimMatch;
    }

    return matchStatus && matchKelompok && matchAttendanceMode && matchSearch;
  });

  const scopedEvaluationStudents = students.filter((stu) => {
    if (filterEvalKelompok !== "all") {
      return stu.kelompok === filterEvalKelompok;
    }
    return true;
  });

  const countCompleteEval = scopedEvaluationStudents.filter((s) => (s.total_points || 0) >= GRADUATION_THRESHOLD).length;
  const countIncompleteEval = scopedEvaluationStudents.length - countCompleteEval;

  const filteredEvaluationStudents = scopedEvaluationStudents.filter((stu) => {
    const points = stu.total_points || 0;
    if (filterEvalPoints === "complete") return points >= GRADUATION_THRESHOLD;
    if (filterEvalPoints === "incomplete") return points < GRADUATION_THRESHOLD;
    return true;
  });

  const countOntime = filteredSubmissions.filter((s) => !s.isLate).length;
  const countLate = filteredSubmissions.filter((s) => s.isLate).length;
  const countPresent = students.filter((s) => attendanceRecords[s.nim]).length;
  const countAbsent = students.length - countPresent;

  const availableTasks = filterCategory === "all" 
    ? tasks 
    : tasks.filter((t) => t.category?.toLowerCase() === filterCategory.toLowerCase());

  const uniqueTaskTitles = Array.from(
    new Set(availableTasks.map((t) => t.title).filter(Boolean))
  );

  return (
    <>
      <Navbar />
      <div 
        className="dashboard-container" 
        style={{ 
          maxWidth: "1360px", 
          width: "100%", 
          margin: "0 auto", 
          padding: "120px 32px 60px 32px", 
          boxSizing: "border-box",
          display: "flex",
          gap: "24px",
          alignItems: "flex-start"
        }}
      >
        {/* SIDEBAR ADMIN */}
        <aside 
          className="task-sidebar" 
          style={{ 
            width: "260px",
            minWidth: "260px",
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
                <span style={{ fontSize: "11px", color: "#FF3333", fontWeight: 700, textTransform: "uppercase" }}>
                  {userNama || "ADMIN UTAMA"}
                </span>
              </div>

              <h2 className="sidebar-header-title">MENU UTAMA</h2>
            </div>

            <div className="sidebar-menu">
              <button type="button" className={`sidebar-btn ${activeTab === "rekap" ? "active" : ""}`} onClick={() => setActiveTab("rekap")}>REKAP PENGUMPULAN</button>
              <button type="button" className={`sidebar-btn ${activeTab === "presensi" ? "active" : ""}`} onClick={() => setActiveTab("presensi")}>INPUT PRESENSI</button>
              <button type="button" className={`sidebar-btn ${activeTab === "evaluasi" ? "active" : ""}`} onClick={() => setActiveTab("evaluasi")}>EVALUASI AKHIR</button>
              <button type="button" className={`sidebar-btn ${activeTab === "tugas" ? "active" : ""}`} onClick={() => setActiveTab("tugas")}>TAMBAH TUGAS</button>
              <button type="button" className={`sidebar-btn ${activeTab === "pengumuman" ? "active" : ""}`} onClick={() => setActiveTab("pengumuman")}>BUAT PENGUMUMAN</button>
              <button type="button" className={`sidebar-btn ${activeTab === "manage" ? "active" : ""}`} onClick={() => setActiveTab("manage")} style={{ color: "#FF3333" }}>KELOLA ARSIP DATA</button>
              <a href="/penugasan" className="sidebar-btn" style={{ marginTop: "15px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#FAFAFA", textAlign: "center", textDecoration: "none", display: "block" }}>TAMPILAN MAHASISWA</a>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="task-main-content" style={{ flex: 1, minWidth: 0 }}>
          {activeTab === "rekap" && (
            <div className="clickable-task-card" style={{ cursor: "default", padding: "20px", width: "100%", boxSizing: "border-box" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileSpreadsheet color="#00FF88" size={20} style={{ flexShrink: 0 }} />
                    <h3 style={{ color: "#FAFAFA", fontSize: "15px", margin: 0, fontWeight: 700 }}>
                      REKAP PENGUMPULAN
                    </h3>
                  </div>
                  
                  <div style={{ display: "flex", gap: "6px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "50px", background: "transparent", border: "1px solid #00FF88", color: "#00FF88", whiteSpace: "nowrap" }}>
                      Tepat Waktu: {countOntime}
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "50px", background: "transparent", border: "1px solid #FF3333", color: "#FF3333", whiteSpace: "nowrap" }}>
                      Terlambat: {countLate}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", flexWrap: "wrap" }}>
                  <Filter size={14} color="#888" style={{ flexShrink: 0 }} />
                  
                  <select 
                    value={filterCategory} 
                    onChange={(e: any) => {
                      setFilterCategory(e.target.value);
                      setFilterTaskTitle("all");
                    }} 
                    style={{ flex: 1, minWidth: "120px", background: "#0a0a0a", border: "1px solid #333", color: "#FAFAFA", padding: "8px 10px", borderRadius: "50px", fontSize: "12px", fontWeight: 600, outline: "none" }}
                  >
                    <option value="all">Semua Kategori</option>
                    <option value="individu">Tugas Individu</option>
                    <option value="kelompok">Tugas Kelompok</option>
                    <option value="angkatan">Tugas Angkatan</option>
                  </select>

                  <select 
                    value={filterTaskTitle} 
                    onChange={(e: any) => setFilterTaskTitle(e.target.value)} 
                    style={{ flex: 1.2, minWidth: "140px", background: "#0a0a0a", border: "1px solid #333", color: "#FAFAFA", padding: "8px 10px", borderRadius: "50px", fontSize: "12px", fontWeight: 600, outline: "none" }}
                  >
                    <option value="all">Semua Judul Tugas</option>
                    {uniqueTaskTitles.map((title, idx) => (
                      <option key={idx} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>

                  <select 
                    value={filterKelompok} 
                    onChange={(e: any) => setFilterKelompok(e.target.value)} 
                    style={{ flex: 1, minWidth: "130px", background: "#0a0a0a", border: "1px solid #333", color: "#FAFAFA", padding: "8px 10px", borderRadius: "50px", fontSize: "12px", fontWeight: 600, outline: "none" }}
                  >
                    <option value="all">Semua Kelompok</option>
                    {listKelompok.map((kel) => (
                      <option key={kel} value={kel}>{kel}</option>
                    ))}
                  </select>

                  <select 
                    value={filterLateStatus} 
                    onChange={(e: any) => setFilterLateStatus(e.target.value)} 
                    style={{ flex: 1, minWidth: "120px", background: "#0a0a0a", border: "1px solid #333", color: "#FAFAFA", padding: "8px 10px", borderRadius: "50px", fontSize: "12px", fontWeight: 600, outline: "none" }}
                  >
                    <option value="all">Status ({filteredSubmissions.length})</option>
                    <option value="ontime">Tepat Waktu</option>
                    <option value="late">Terlambat</option>
                  </select>
                </div>
              </div>

              <div className="detail-divider" style={{ marginBottom: "15px" }} />

              <div className="desktop-rekap-table" style={{ width: "100%", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#fafafa", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      <th style={{ padding: "12px 10px" }}>NIM</th>
                      <th style={{ padding: "12px 10px" }}>NAMA</th>
                      <th style={{ padding: "12px 10px" }}>KELOMPOK</th>
                      <th style={{ padding: "12px 10px" }}>JUDUL TUGAS</th>
                      <th style={{ padding: "12px 10px" }}>WAKTU PENGUMPULAN</th>
                      <th style={{ padding: "12px 10px" }}>BERKAS</th>
                      <th style={{ padding: "12px 10px", textAlign: "right" }}>VALIDASI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#666" }}>Tidak ada data yang sesuai filter.</td></tr>
                    ) : (
                      filteredSubmissions.map((sub, i) => {
                        const options = getTaskPointOptions(sub.category, sub.task_title);
                        const currentPoints = sub.is_validated ? (sub.awarded_points || 0) : 0;
                        const rowColor = sub.isLate ? "#FF3333" : "#00FF88";

                        return (
                          <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "12px 10px", fontFamily: "monospace", fontWeight: "bold", color: rowColor, whiteSpace: "nowrap" }}>
                              {sub.user_nim}
                            </td>
                            <td style={{ padding: "12px 10px", fontWeight: 600, color: rowColor, whiteSpace: "nowrap" }}>
                              {sub.displayNama}
                            </td>
                            <td style={{ padding: "12px 10px", fontWeight: 600, color: rowColor, whiteSpace: "nowrap" }}>
                              {sub.kelompok || "-"}
                            </td>
                            <td style={{ padding: "12px 10px", fontWeight: 600, color: rowColor }}>
                              {sub.task_title}
                            </td>
                            <td style={{ padding: "12px 10px", color: rowColor, fontSize: "12px", whiteSpace: "nowrap" }}>
                              {formatDateTimeWIB(sub.submitted_at)} WIB
                            </td>
                            <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>
                              <a 
                                href={sub.viewUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                style={{ 
                                  color: rowColor, 
                                  display: "inline-flex", 
                                  alignItems: "center", 
                                  gap: "4px", 
                                  textDecoration: "none", 
                                  fontWeight: 700, 
                                  fontSize: "12px" 
                                }}
                              >
                                <Eye size={13} style={{ color: rowColor }} /> View
                              </a>
                            </td>
                            <td style={{ padding: "12px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                              <select
                                value={currentPoints}
                                onChange={(e) => handleTaskPointOptionChange(sub.id, sub.user_nim, Number(e.target.value))}
                                style={{
                                  background: "#0a0a0a",
                                  border: `1px solid ${currentPoints > 0 ? rowColor : "#333"}`,
                                  color: currentPoints > 0 ? rowColor : "#888",
                                  padding: "6px 10px",
                                  borderRadius: "50px",
                                  fontSize: "11.5px",
                                  fontWeight: 600,
                                  outline: "none",
                                  cursor: "pointer",
                                  width: "165px"
                                }}
                              >
                                {options.map((opt, idx) => (
                                  <option key={idx} value={opt.points} style={{ color: opt.points > 0 ? "#00FF88" : "#FF3333" }}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
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

          {activeTab === "presensi" && (
            <div className="clickable-task-card" style={{ cursor: "default", padding: "20px", width: "100%", boxSizing: "border-box" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <UserCheck color="#00FF88" size={20} style={{ flexShrink: 0 }} />
                    <h3 style={{ color: "#FAFAFA", fontSize: "15px", margin: 0, fontWeight: 700 }}>
                      INPUT PRESENSI
                    </h3>
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "50px", background: "transparent", border: "1px solid #00FF88", color: "#00FF88", whiteSpace: "nowrap" }}>
                      Hadir: ({countPresent})
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "50px", background: "transparent", border: "1px solid #FF3333", color: "#FF3333", whiteSpace: "nowrap" }}>
                      Tidak Hadir: ({countAbsent})
                    </span>
                  </div>
                </div>

                {/* Kolom Cari Nama/NIM Panjang di Atas */}
                <div style={{ display: "flex", width: "100%", gap: "10px", alignItems: "flex-end" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", color: "#aaa", fontWeight: 600 }}>Cari Nama / NIM Mahasiswa:</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <Search size={15} color="#888" style={{ position: "absolute", left: "14px" }} />
                      <input 
                        type="text" 
                        placeholder="Ketik nama lengkap atau NIM mahasiswa..."
                        value={attendanceSearchQuery}
                        onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                        style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px 14px 10px 38px", borderRadius: "50px", fontSize: "13px", fontWeight: 600, width: "100%", outline: "none" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sesi, Kelompok, Filter Status, Poin, & Tombol Simpan */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", width: "100%", flexWrap: "wrap", marginTop: "4px" }}>
                  <div style={{ flex: 1.5, minWidth: "160px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", color: "#aaa", fontWeight: 600 }}>Pilih Sesi Kehadiran:</label>
                    <select 
                      value={selectedSession} 
                      onChange={(e) => setSelectedSession(e.target.value)} 
                      style={{ background: "#0a0a0a", border: "1px solid #333", color: "#FAFAFA", padding: "10px", borderRadius: "50px", fontSize: "13px", fontWeight: 600, outline: "none", width: "100%" }}
                    >
                      <option value="pra-inisialisasi">Pra-Inisialisasi</option>
                      <option value="inisialisasi-day1">Inisialisasi Day 1</option>
                      <option value="inisialisasi-day2">Inisialisasi Day 2</option>
                      <option value="inisialisasi-day3">Inisialisasi Day 3</option>
                      <option value="inisialisasi-day4">Inisialisasi Day 4</option>
                      <option value="pengukuhan">Pengukuhan</option>
                    </select>
                  </div>

                  <div style={{ flex: 1.2, minWidth: "140px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", color: "#aaa", fontWeight: 600 }}>Filter Kelompok:</label>
                    <select 
                      value={filterAttendanceKelompok} 
                      onChange={(e: any) => setFilterAttendanceKelompok(e.target.value)} 
                      style={{ background: "#0a0a0a", border: "1px solid #333", color: "#FAFAFA", padding: "10px", borderRadius: "50px", fontSize: "13px", fontWeight: 600, outline: "none", width: "100%" }}
                    >
                      <option value="all">Semua Kelompok</option>
                      {listKelompok.map((kel) => (
                        <option key={kel} value={kel}>{kel}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ flex: 1.2, minWidth: "140px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", color: "#aaa", fontWeight: 600 }}>Filter Status:</label>
                    <select 
                      value={filterAttendanceStatus} 
                      onChange={(e: any) => setFilterAttendanceStatus(e.target.value)} 
                      style={{ background: "#0a0a0a", border: "1px solid #333", color: "#FAFAFA", padding: "10px", borderRadius: "50px", fontSize: "13px", fontWeight: 600, outline: "none", width: "100%" }}
                    >
                      <option value="all">Semua ({students.length})</option>
                      <option value="present">Hadir ({countPresent})</option>
                      <option value="absent">Tidak Hadir ({countAbsent})</option>
                    </select>
                  </div>

                  <div style={{ flex: 1, minWidth: "110px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", color: "#aaa", fontWeight: 600 }}>Poin Kehadiran:</label>
                    <input 
                      type="number" 
                      placeholder="Default: 375"
                      value={sessionPoints} 
                      onChange={(e) => setSessionPoints(e.target.value === "" ? "" : Number(e.target.value))} 
                      style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fafafa", padding: "10px", borderRadius: "50px", fontSize: "13px", fontWeight: 600, width: "100%" }} 
                    />
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <button 
                      type="button"
                      onClick={handleSaveSessionPoints}
                      style={{ background: "transparent", border: "1px solid #333", color: "#fafafa", padding: "10px 16px", borderRadius: "50px", fontSize: "13px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      Simpan Poin
                    </button>
                  </div>
                </div>

                {/* Baris Filter Persentase Kehadiran Kelompok */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginTop: "12px", background: "transparent", border: "1px solid #333", padding: "12px 16px", borderRadius: "50px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "#aaa", fontWeight: 700, marginRight: "4px" }}>Kehadiran Kelompok:</span>
                    
                    <button
                      type="button"
                      onClick={() => setAttendanceFilterMode(attendanceFilterMode === "under80" ? "all" : "under80")}
                      style={{
                        background: attendanceFilterMode === "under80" ? "transparent" : "#0a0a0a",
                        border: `1px solid ${attendanceFilterMode === "under80" ? "#FF3333" : "#333"}`,
                        color: attendanceFilterMode === "under80" ? "#FF3333" : "#FAFAFA",
                        padding: "6px 14px",
                        borderRadius: "50px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      di bawah 80% ({under80Groups.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttendanceFilterMode(attendanceFilterMode === "above80" ? "all" : "above80")}
                      style={{
                        background: attendanceFilterMode === "above80" ? "transparent" : "#0a0a0a",
                        border: `1px solid ${attendanceFilterMode === "above80" ? "#00FF88" : "#333"}`,
                        color: attendanceFilterMode === "above80" ? "#00FF88" : "#FAFAFA",
                        padding: "6px 14px",
                        borderRadius: "50px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      di atas 80% ({above80Groups.length})
                    </button>
                  </div>

                  {attendanceFilterMode !== "all" && (
                    <button
                      type="button"
                      onClick={handleBatchPenalizeFilteredGroups}
                      disabled={loading}
                      style={{
                        background: "transparent",
                        border: "1px solid #FF3333",
                        color: "#FF3333",
                        padding: "6px 14px",
                        borderRadius: "50px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        whiteSpace: "nowrap"
                      }}
                    >
                      -10 Poin Semua Anggota Kelompok Terpilih
                    </button>
                  )}
                </div>
              </div>

              <div className="detail-divider" style={{ marginBottom: "15px" }} />

              <div style={{ width: "100%", overflowX: "auto" }}>
                <table style={{ width: "100%", color: "#FAFAFA", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#fafafa", textAlign: "left" }}>
                      <th style={{ padding: "10px", textAlign: "center" }}>NIM</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>NAMA MAHASISWA</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>KELOMPOK</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>STATUS KEHADIRAN</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>POIN PRESENSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#666" }}>Tidak ada data mahasiswa yang sesuai filter.</td></tr>
                    ) : (
                      filteredStudents.map((stu, i) => {
                        const isPresent = !!attendanceRecords[stu.nim];
                        const currentPoints = attendancePointsMap[stu.nim] ?? (isPresent ? 375 : 0);

                        return (
                          <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "12px 10px", fontFamily: "monospace", fontWeight: "bold", color: "#00FF88" }}>{stu.nim}</td>
                            <td style={{ padding: "12px 10px", color: "#FAFAFA", fontWeight: 600 }}>{stu.nama}</td>
                            <td style={{ padding: "12px 10px", color: "#FAFAFA", fontWeight: 600 }}>{stu.kelompok || "-"}</td>
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
                            <td style={{ padding: "12px 10px" }}>
                              <select
                                value={currentPoints}
                                onChange={(e) => handleAttendancePointsChange(stu.nim, Number(e.target.value))}
                                style={{
                                  background: "#0a0a0a",
                                  border: "1px solid #333",
                                  color: currentPoints > 0 ? "#00FF88" : "#FF3333",
                                  padding: "6px 12px",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  outline: "none",
                                  cursor: "pointer",
                                  minWidth: "240px"
                                }}
                              >
                                <option value={375} style={{ color: "#00FF88" }}>Hadir tepat waktu (+375 poin)</option>
                                <option value={365} style={{ color: "#00FF88" }}>Terlambat 5–15 menit (+365 poin)</option>
                                <option value={355} style={{ color: "#00FF88" }}>Terlambat &gt; 15 menit (+355 poin)</option>
                                <option value={150} style={{ color: "#00FF88" }}>Sakit dengan izin (+150 poin)</option>
                                <option value={150} style={{ color: "#00FF88" }}>Izin dengan keterangan (+150 poin)</option>
                                <option value={0} style={{ color: "#FF3333" }}>Tidak hadir tanpa izin (0 poin)</option>
                              </select>
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
            <div className="clickable-task-card" style={{ cursor: "default", padding: "20px", width: "100%", boxSizing: "border-box" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <GraduationCap color="#00FF88" size={22} />
                    <h3 style={{ color: "#FAFAFA", fontSize: "15px", margin: 0, fontWeight: 700 }}>
                      EVALUASI AKHIR & PENENTUAN KELULUSAN MAHASISWA
                    </h3>
                  </div>

                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                    <button 
                      type="button"
                      onClick={handleAutoGraduateByThreshold}
                      disabled={loading}
                      style={{
                        background: "transparent",
                        border: "1px solid #fafafa",
                        color: "#fafafa",
                        padding: "3px 8px",
                        borderRadius: "50px",
                        fontSize: "10px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px"
                      }}
                    >
                    Tombol Otomatis Luluskan (&ge; {GRADUATION_THRESHOLD})
                    </button>

                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "50px", background: "transparent", border: "1px solid #00FF88", color: "#00FF88", whiteSpace: "nowrap" }}>
                      Memenuhi (&ge; {GRADUATION_THRESHOLD}): ({countCompleteEval})
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "50px", background: "transparent", border: "1px solid #FF3333", color: "#FF3333", whiteSpace: "nowrap" }}>
                      Belum Memenuhi (&lt; {GRADUATION_THRESHOLD}): ({countIncompleteEval})
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginTop: "10px" }}>
                  <p style={{ fontSize: "12.5px", color: "rgba(250,250,250,0.6)", margin: 0, flex: 1, minWidth: "220px" }}>
                    Syarat minimal kelulusan adalah <strong>{GRADUATION_THRESHOLD} Poin</strong>. Gunakan dropdown filter di samping untuk memilih tampilan data mahasiswa.
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ width: "170px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "11px", color: "#aaa", fontWeight: 600 }}>Filter Kelompok:</label>
                      <select 
                        value={filterEvalKelompok} 
                        onChange={(e: any) => setFilterEvalKelompok(e.target.value)} 
                        style={{ background: "#0a0a0a", border: "1px solid #333", color: "#FAFAFA", padding: "10px", borderRadius: "50px", fontSize: "13px", fontWeight: 600, outline: "none", width: "100%", cursor: "pointer" }}
                      >
                        <option value="all">Semua Kelompok</option>
                        {listKelompok.map((kel) => (
                          <option key={kel} value={kel}>{kel}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ width: "230px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "11px", color: "#aaa", fontWeight: 600 }}>Filter Poin:</label>
                      <select 
                        value={filterEvalPoints} 
                        onChange={(e: any) => setFilterEvalPoints(e.target.value)} 
                        style={{ background: "#0a0a0a", border: "1px solid #333", color: "#FAFAFA", padding: "10px", borderRadius: "50px", fontSize: "13px", fontWeight: 600, outline: "none", width: "100%", cursor: "pointer" }}
                      >
                        <option value="all">Semua Mahasiswa ({scopedEvaluationStudents.length})</option>
                        <option value="complete">Memenuhi Syarat (&ge; {GRADUATION_THRESHOLD}) - ({countCompleteEval})</option>
                        <option value="incomplete">Belum Memenuhi (&lt; {GRADUATION_THRESHOLD}) - ({countIncompleteEval})</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-divider" style={{ marginBottom: "15px" }} />

              <div style={{ width: "100%", overflowX: "auto" }}>
                <table style={{ width: "100%", color: "#FAFAFA", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#fafafa", textAlign: "left" }}>
                      <th style={{ padding: "10px" }}>NIM</th>
                      <th style={{ padding: "10px" }}>NAMA MAHASISWA</th>
                      <th style={{ padding: "10px" }}>KELOMPOK</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>TOTAL POIN</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>STATUS KELULUSAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvaluationStudents.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#666" }}>Tidak ada data mahasiswa yang sesuai filter.</td></tr>
                    ) : (
                      filteredEvaluationStudents.map((stu, i) => {
                        const isGraduated = !!stu.is_graduated;
                        const points = stu.total_points || 0;
                        const meetsThreshold = points >= GRADUATION_THRESHOLD;

                        return (
                          <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "12px 10px", fontFamily: "monospace", fontWeight: "bold", color: "#00FF88" }}>{stu.nim}</td>
                            <td style={{ padding: "12px 10px", color: "#FAFAFA", fontWeight: 600 }}>{stu.nama}</td>
                            <td style={{ padding: "12px 10px", color: "#FAFAFA", fontWeight: 600 }}>{stu.kelompok || "-"}</td>
                            <td style={{ padding: "12px 10px", textAlign: "center" }}>
                              <span style={{ fontWeight: "bold", color: meetsThreshold ? "#00FF88" : "#FF3333" }}>
                                {points} Poin
                              </span>
                            </td>
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
                
                <div className="input-group">
                  <label style={{ fontSize: "11px", color: "#aaa" }}>Ketentuan Tugas (Tulis sebagai paragraf / penjelasan bebas)</label>
                  <textarea rows={6} placeholder="Tulis rincian ketentuan penugasan..." value={taskRules} onChange={(e) => setTaskRules(e.target.value)} required style={{ background: "#0a0a0a", border: "1.5px solid #1B22A7", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} />
                </div>
                
                <div className="input-group">
                  <label style={{ fontSize: "12px", color: "#aaa" }}>Poin yang akan didapatkan</label>
                  <input type="number" placeholder="Contoh: 10" value={taskPoints} onChange={(e) => setTaskPoints(e.target.value === "" ? "" : Number(e.target.value))} required style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} />
                </div>

                <div className="input-group">
                  <label style={{ fontSize: "12px", color: "#aaa" }}>Deadline</label>
                  <input 
                    type="datetime-local" 
                    step="1"
                    value={taskDeadline} 
                    onChange={(e) => setTaskDeadline(e.target.value)} 
                    required 
                    style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} 
                  />
                </div>
                <button type="submit" className="btn-auth-submit" disabled={loading} style={{ marginTop: "10px", padding: "12px", background: "#00FF88", color: "#00FF88", fontWeight: 700, border: "none", borderRadius: "8px", cursor: "pointer" }}>{loading ? "MENYIMPAN..." : "TERBITKAN TUGAS"}</button>
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
                <div className="input-group"><label style={{ fontSize: "11px", color: "#aaa" }}>Isi</label><textarea rows={6} placeholder="Isi..." value={annContent} onChange={(e) => setAnnContent(e.target.value)} required style={{ background: "#0a0a0a", border: "1.5px solid #1B22A7", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                <button type="submit" className="btn-auth-submit" disabled={loading} style={{ marginTop: "10px", padding: "12px", background: "#00FF88", color: "#00FF88", fontWeight: 700, border: "none", borderRadius: "8px", cursor: "pointer" }}>{loading ? "TERBITKAN..." : "TERBITKAN PENGUMUMAN"}</button>
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
                        <th style={{ padding: "10px" }}>DEADLINE</th>
                        <th style={{ padding: "10px" }}>VISIBILITAS</th>
                        <th style={{ padding: "10px" }}>AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.length === 0 ? (
                        <tr><td colSpan={7} style={{ padding: "15px", color: "#666" }}>Kosong.</td></tr>
                      ) : (
                        tasks.map((t) => (
                          <tr key={t.id} style={{ borderBottom: "1px solid transparent" }}>
                            <td style={{ padding: "10px", color: "#fafafa", fontFamily: "monospace" }}>{t.id}</td>
                            <td style={{ padding: "10px" }}>{t.category}</td>
                            <td style={{ padding: "10px" }}>{t.title}</td>
                            <td style={{ padding: "10px", color: "#fafafa", fontWeight: "bold" }}>+{t.points || 0}</td>
                            <td style={{ padding: "10px", color: "#aaa", fontSize: "12px", whiteSpace: "nowrap" }}>
                              {formatDateTimeWIB(t.deadline)} WIB
                            </td>
                            
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
                                  setEditTaskData({ 
                                    ...t, 
                                    rules: Array.isArray(t.rules) ? t.rules.join("\n") : (t.rules || ""), 
                                    deadline: formatISOToInput(t.deadline), 
                                    points: t.points || 0 
                                  }); 
                                  setIsEditTaskModalOpen(true); 
                                }} 
                                style={{ background: "transparent", border: "1px solid #fafafa", color: "#FAFAFA", padding: "6px 12px", borderRadius: "50px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
                              >
                                <Pencil size={13} /> Edit
                              </button>

                              <button 
                                onClick={() => handleToggleTaskStatus(t.id, t.is_active !== false)} 
                                style={{ 
                                  background: "transparent", 
                                  border: "1px solid #fafafa", 
                                  color: "#FAFAFA", 
                                  padding: "6px 12px", 
                                  borderRadius: "50px", 
                                  cursor: "pointer",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                {t.is_active !== false ? "Sembunyikan" : "Tampilkan"}
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
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#fafafa", textAlign: "left" }}>
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
                                style={{ background: "transparent", border: "1px solid #fafafa", color: "#FAFAFA", padding: "6px 12px", borderRadius: "50px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
                              >
                                <Pencil size={13} /> Edit
                              </button>

                              <button 
                                onClick={() => handleToggleAnnStatus(a.id, a.title, a.is_active !== false)} 
                                style={{ 
                                  background: "transparent", 
                                  border: "1px solid #fafafa", 
                                  color: "#FAFAFA", 
                                  padding: "6px 12px", 
                                  borderRadius: "50px", 
                                  cursor: "pointer",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                {a.is_active !== false ? "Sembunyikan" : "Tampilkan"}
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
                <label style={{ fontSize: "11px", color: "#aaa" }}>Ketentuan Tugas (Paragraf Bebas)</label>
                <textarea 
                  rows={5} 
                  value={editTaskData.rules} 
                  onChange={(e) => setEditTaskData({ ...editTaskData, rules: e.target.value })} 
                  style={{ background: "#0a0a0a", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%" }} 
                />
              </div>

              <div className="input-group">
                <label style={{ fontSize: "11px", color: "#aaa" }}>Poin</label>
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
                  step="1"
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
                <button type="button" onClick={handleSaveEditAnn} className="btn-modal-primary" disabled={loading} style={{ background: "#00FF88", color: "#00FF88", fontWeight: 700 }}>
                  {loading ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
                </button>
                <button type="button" onClick={() => setIsEditAnnModalOpen(false)} className="btn-modal-close">BATAL</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI */}
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

      {/* DYNAMIC ISLAND NOTIFICATION TOAST */}
      <div style={{ position: "fixed", top: "110px", left: "50%", transform: "translateX(-50%)", zIndex: 99999999, pointerEvents: "none", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{
          background: "#0a0a0e",
          border: toast.isError ? "1.5px solid rgba(255, 51, 51, 0.9)" : "1.5px solid rgba(0, 255, 136, 0.9)",
          borderRadius: "50px",
          height: "48px",
          minWidth: toast.isExpanded ? "340px" : "48px",
          maxWidth: toast.isExpanded ? "480px" : "48px",
          padding: toast.isExpanded ? "0 18px 0 8px" : "0",
          boxShadow: toast.isError ? "0 15px 35px rgba(255, 51, 51, 0.35)" : "0 15px 35px rgba(0, 255, 136, 0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: toast.isExpanded ? "flex-start" : "center",
          backdropFilter: "blur(20px)",
          boxSizing: "border-box",
          overflow: "hidden",
          transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          opacity: toast.show ? 1 : 0,
          transform: toast.show ? "scale(1)" : "scale(0.1)"
        }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: toast.isError ? "rgba(255, 51, 51, 0.2)" : "rgba(0, 255, 136, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {toast.isError ? <AlertCircle style={{ width: "18px", height: "18px", color: "#FF3333" }} /> : <CheckCircle2 style={{ width: "18px", height: "18px", color: "#00FF88" }} />}
          </div>
          {toast.isExpanded && (
            <div style={{ display: "flex", flexDirection: "column", textAlign: "left", paddingLeft: "10px", whiteSpace: "nowrap", overflow: "hidden" }}>
              <h4 style={{ margin: 0, fontSize: "12px", fontWeight: 800, color: toast.isError ? "#FF3333" : "#00FF88", textTransform: "uppercase" }}>{toast.message}</h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "11.5px", color: "rgba(250, 250, 250, 0.9)" }}>{toast.subMessage}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}