"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { 
  CalendarClock, 
  ShieldAlert, 
  NotebookPen, 
  Trophy, 
  Award, 
  Gavel, 
  Hourglass 
} from "lucide-react";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ref untuk Judul Gradasi
  const titleRef = useRef<HTMLHeadingElement>(null);

  // State Animasi Ketik (Typewriter)
  const fullText = "PERJALANANMU";
  const [typedText, setTypedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Kunci Scroll saat Modal Terbuka
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // Effect Animasi Ketikan Berulang
  useEffect(() => {
    const typingSpeed = isDeleting ? 80 : 150;
    
    const timer = setTimeout(() => {
      if (!isDeleting) {
        setTypedText(fullText.substring(0, typedText.length + 1));
        if (typedText === fullText) {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        setTypedText(fullText.substring(0, typedText.length - 1));
        if (typedText === "") {
          setIsDeleting(false);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [typedText, isDeleting]);

  // Handler Interaksi Kursor Mouse Melacak Posisi Horizontal (X)
  const handleMouseMove = (e: React.MouseEvent<HTMLHeadingElement>) => {
    if (!titleRef.current) return;

    const rect = titleRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;

    titleRef.current.style.setProperty("--x", `${x}%`);
  };

  const handleMouseLeave = () => {
    if (!titleRef.current) return;
    titleRef.current.style.removeProperty("--x");
  };

  const closeAll = () => {
    setIsModalOpen(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>

      {/* 🟢 LAMPU SOROT FIXED MELAYANG (Melayang Bebas di Atas Grid, Tertutup Sempurna di Hero) */}
      <div className="spotlight-overlay spotlight-1" />
      <div className="spotlight-overlay spotlight-2" />

      {/* Navbar & Layer Utama */}
      <div className={isModalOpen ? "blur-behind" : ""}>
        <Navbar onPenugasanClick={() => setIsModalOpen(true)} />
      </div>

      <main style={{ flex: 1, position: "relative", zIndex: 2 }} className={isModalOpen ? "blur-behind" : ""}>
        {/* HERO SECTION */}
        <header id="home" className="hero-section">
          <div className="container flex-center">
            <h3 className="hero-subtitle">ARE YOU READY TO</h3>
            
            {/* Judul INITIALIZE dengan Gradasi Vertikal Memanjang Kiri-Kanan */}
            <h1 
              ref={titleRef}
              className="hero-title"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              INITIALIZE
            </h1>
            
            <p className="hero-tagline">&quot;GROWING TOGETHER FOR A BRIGHTER FUTURE&quot;</p>
            <div className="hero-buttons">
              <a href="#about" className="btn-outline">Lihat Informasi</a>
              <a href="#reward-punishment" className="btn-outline">Reward & Punishment</a>
            </div>
          </div>
        </header>

        {/* ABOUT SECTION */}
        <section id="about" className="about-section">
          <div className="container about-container-flex">
            <div className="about-text-card">
              <div className="about-badge-pill">WHAT IS INISIALISASI</div>
              <h2 className="about-card-title">
                Memulai Babak Baru<br />
                <span className="about-title-spacing typewriter-text">
                  {typedText}
                  <span className="typewriter-cursor">|</span>
                </span>
              </h2>
              <p className="about-card-desc">
                INISIALISASI merupakan serangkaian kegiatan yang rutin diselenggarakan setiap tahunnya oleh Himpunan Mahasiswa Teknik Informatika (HIMTI) Universitas Airlangga. Kegiatan ini bertujuan untuk memberikan bekal awal kepada Mahasiswa Baru D4 Teknik Informatika, baik dalam hal akademik maupun non-akademik.
              </p>
              <p className="about-card-desc highlight-desc">
                Kamu akan mengenal lingkungan kampus, mendapatkan wawasan dari para alumni industri, dan membangun koneksi yang akan menemanimu sepanjang studi hingga masa nanti.
              </p>
            </div>

            <div className="about-image-card-wrap">
              <div className="about-glow-effect"></div>
              <div className="about-outer-frame">
                <div className="about-inner-photo-frame">
                  <img src="assets/fotobarenginis.webp" alt="Dokumentasi Inisialisasi" className="about-img-fluid" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TATA TERTIB SECTION */}
        <section id="tata-tertib" className="rules-section">
          <div className="container">
            <div className="section-header-center">
              <h2 className="main-section-title">INISIALISASI 2026</h2>
              <div className="title-badge-container">
                <div className="title-badge-inner">TATA TERTIB</div>
              </div>
            </div>

            <div className="reward-container">
              {/* KEHADIRAN & KETERTIBAN */}
              <div className="wide-card">
                <div className="wide-card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CalendarClock className="rules-icon" />
                  <h3>Kehadiran & Ketertiban</h3>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">1</span><p>Peserta wajib datang ke tempat 30 menit sebelum acara dimulai.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">2</span><p>Peserta wajib memakai seragam sesuai ketentuan.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">3</span><p>Peserta wajib memakai atribut dan ID card sesuai ketentuan.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">4</span><p>Peserta yang tidak memakai seragam dan atribut sesuai ketentuan akan dikenakan pengurangan poin.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">5</span><p>Peserta yang terlambat hadir akan dikenakan pengurangan poin sesuai ketentuan dan hukuman yang berlaku.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">6</span><p>Peserta wajib untuk mengikuti semua kegiatan inisialisasi yang telah ditentukan.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">7</span><p>Kehadiran 80% dari setiap kelompok merupakan syarat minimal. Jika kehadiran anggota kelompok tidak mencapai 80%, maka akan dikenakan pengurangan poin, kecuali bagi mahasiswa yang sudah izin ke kakak pendamping bahwa tidak bisa mengikuti inisialisasi.</p></div>
                </div>
              </div>

              {/* LARANGAN & PERILAKU */}
              <div className="wide-card">
                <div className="wide-card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldAlert className="rules-icon" />
                  <h3>Larangan & Perilaku</h3>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">1</span><p>Peserta dilarang membawa senjata tajam dan senjata api.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">2</span><p>Peserta dilarang membawa rokok, miras, vape beserta liquidnya, serta obat-obatan terlarang lainnya.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">3</span><p>Peserta dilarang memakai aksesori dan makeup yang berlebihan.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">4</span><p>Peserta tidak diperbolehkan meninggalkan kegiatan yang sedang berlangsung tanpa seizin panitia/kakak pendamping.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">5</span><p>Pada saat menyanyikan lagu Indonesia Raya dan Hymne Airlangga, peserta dimohon berdiri dengan sikap sempurna serta menampakkan seragam yang dikenakan dan meletakkan tangan tangan di bagian dada sebelah kiri.</p></div>
                </div>
              </div>

              {/* KEWAJIBAN PESERTA */}
              <div className="wide-card">
                <div className="wide-card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <NotebookPen className="rules-icon" />
                  <h3>Kewajiban Peserta</h3>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">1</span><p>Peserta wajib untuk memperhatikan dan mencatat seluruh materi yang disampaikan selama kegiatan berlangsung di booklet yang sudah ditentukan.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">2</span><p>Peserta wajib menjaga kekondusifan selama materi berlangsung saat pemateri menyampaikan materi. Tidak diperkenankan untuk membahas hal yang diluar topik. Saat ingin bertanya, peserta diwajibkan meminta izin kepada pemateri dengan angkat tangan terlebih dahulu dan setelah diizinkan peserta diperbolehkan bertanya.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">3</span><p>Peserta diperbolehkan ke kamar mandi di sela-sela rangkaian kegiatan dengan meminta izin terlebih dahulu kepada panitia/kakak pendamping, apabila sudah diizinkan peserta diperbolehkan ke kamar mandi.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">4</span><p>Peserta wajib menyelesaikan penugasan yang telah diberikan sesuai waktu yang telah ditentukan. Apabila terlambat/tidak menyelesaikan penugasan, maka akan dikenakan pengurangan poin.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">5</span><p>Untuk mahasiswa baru yang berhalangan dan tidak bisa mengikuti rangkaian kegiatan diharapkan izin 3-4 hari sebelum acara dimulai kepada kakak pendamping dengan menyertakan alasannya.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">6</span><p>Untuk mahasiswa baru yang sakit pada saat sebelum/saat acara Inisialisasi 2026 berlangsung, dihimbau untuk segera izin kepada kakak pendamping. Apabila tidak menghubungi kakak pendamping, maka akan dianggap tidak hadir.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">7</span><p>Peserta wajib menjaga barang pribadinya, jika terdapat kehilangan bukan termasuk tanggung jawab panitia.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">8</span><p>Peserta dianjurkan membawa obat-obatan pribadi (apabila membutuhkan).</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* KETENTUAN ATRIBUT */}
        <section className="attribute-section">
          <div className="container">
            <div className="section-header-center">
              <h2 className="main-section-title">INISIALISASI 2026</h2>
              <div className="title-badge-container">
                <div className="title-badge-inner">KETENTUAN ATRIBUT</div>
              </div>
            </div>
            <div className="grid-2">
              <div className="attribute-card flex-center">
                <div className="image-border-box"><img src="assets/atribut-laki.webp" alt="Atribut Laki-Laki" className="responsive-img" /></div>
                <div className="attr-badges"><span className="badge-item">Rambut Rapi</span><span className="badge-item">Bersabuk</span><span className="badge-item">Sepatu Pantofel</span></div>
              </div>
              <div className="attribute-card flex-center">
                <div className="image-border-box"><img src="assets/atribut-perempuan.webp" alt="Atribut Perempuan" className="responsive-img" /></div>
                <div className="attr-badges"><span className="badge-item">Kerudung Rapi</span><span className="badge-item">Bersabuk</span><span className="badge-item">Sepatu Pantofel</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* REWARD & PUNISHMENT */}
        <section id="reward-punishment" className="reward-section">
          <div className="container">
            <div className="section-header-center">
              <h2 className="main-section-title">INISIALISASI 2026</h2>
              <div className="title-badge-container">
                <div className="title-badge-inner">REWARD & PUNISHMENT</div>
              </div>
            </div>

            <div className="reward-container">
              {/* REWARD CARD */}
              <div className="wide-card">
                <div className="wide-card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Trophy className="rules-icon" />
                  <h3>Reward</h3>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">1</span><p>Kelompok dengan kehadiran di atas 80% mendapatkan nilai tambahan untuk setiap anggota kelompok.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">2</span><p>Kelompok yang aktif mendapat nilai tambahan untuk setiap anggota kelompok.</p></div>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">3</span><p>Peserta yang aktif secara individu mendapat nilai tambahan.</p></div>
                </div>
              </div>

              {/* SYARAT KELULUSAN CARD */}
              <div className="wide-card">
                <div className="wide-card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Award className="rules-icon" />
                  <h3>Syarat Kelulusan</h3>
                </div>
                <div className="point-row">
                  <div className="point-left">
                    <p>Mahasiswa baru diwajibkan mengumpulkan minimal <strong>300 poin</strong> agar dapat lulus dan dikukuhkan.</p>
                  </div>
                </div>
              </div>

              {/* PUNISHMENT CARD */}
              <div className="wide-card">
                <div className="wide-card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Gavel className="rules-icon" />
                  <h3>Punishment</h3>
                </div>
                <div className="point-row">
                  <div className="point-left">
                    <p>Bagi peserta yang dinyatakan tidak lulus dalam agenda inisialisasi maka tidak dapat mengikuti seluruh agenda dan program kerja Hima serta tidak bisa mendaftarkan diri sebagai fungsionaris Hima itu sendiri.</p>
                  </div>
                </div>
              </div>

              {/* PENGURANGAN POIN KETERLAMBATAN */}
              <div className="wide-card">
                <div className="wide-card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Hourglass className="rules-icon" />
                  <h3>Pengurangan Poin Keterlambatan Mengikuti Acara</h3>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">1</span><p>Terlambat 5-15 menit</p></div>
                  <span className="minus-point">-5 poin</span>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">2</span><p>Terlambat &gt; 15 menit</p></div>
                  <span className="minus-point">-10 poin</span>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">3</span><p>Terlambat mengumpulkan resume &gt; 15 menit</p></div>
                  <span className="minus-point">-5 poin</span>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">4</span><p>Tidak mengumpulkan resume</p></div>
                  <span className="minus-point">-10 poin</span>
                </div>
              </div>

              {/* PELANGGARAN SELAMA ACARA */}
              <div className="wide-card">
                <div className="wide-card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldAlert className="rules-icon" />
                  <h3>Pelanggaran Selama Acara</h3>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">1</span><p>Seragam dan atribut tidak sesuai ketentuan</p></div>
                  <span className="minus-point">-10 poin</span>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">2</span><p>Membawa barang terlarang (senjata tajam, senjata api, rokok, vape, miras, obat-obatan terlarang)</p></div>
                  <span className="minus-point">-100 poin</span>
                </div>
                <div className="point-row">
                  <div className="point-left"><span className="num-bullet">3</span><p>Melakukan joki atau kecurangan lainnya dalam mengerjakan tugas</p></div>
                  <span className="minus-point style-no-point">-Tidak dapat poin penugasan</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="main-footer" style={{ position: "relative", zIndex: 10 }}>
        <div className="container footer-flex">
          <div className="footer-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Image 
                src="/assets/logoinis.webp" 
                alt="Logo Inisialisasi Footer" 
                width={28} 
                height={28} 
                style={{ objectFit: "contain", borderRadius: "8px" }}
              />
            </div>
            <div>
              <h4 style={{ margin: 0 }}>INISIALISASI 2026</h4>
              <p style={{ margin: 0 }}>D4 TEKNIK INFORMATIKA</p>
            </div>
          </div>
          <div className="footer-center">
            <p>© 2026 Inisialisasi - D4 Teknik Informatika</p>
          </div>
          <div className="footer-right">
            <a href="https://www.instagram.com/inisialisasi2025" target="_blank" rel="noreferrer" className="ig-link">
              <svg className="footer-ig-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              INSTAGRAM INISIALISASI
            </a>
          </div>
        </div>
      </footer>

      {/* MODAL OVERLAY */}
      {isModalOpen && (
        <div className="modal-overlay active" onClick={closeAll} style={{ zIndex: 100 }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <ShieldAlert className="modal-icon" />
              <h2>AKSES DIBATASI</h2>
            </div>
            
            <p className="modal-desc">
              Anda harus melakukan <strong>Log In</strong> atau <strong>Registrasi Akun</strong> terlebih dahulu untuk melihat berkas penugasan.
            </p>

            <div className="modal-buttons">
              <a href="/login" className="btn-modal-primary">
                Log In / Registrasi
              </a>
              <button type="button" className="btn-modal-close" onClick={closeAll}>
                KEMBALI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}