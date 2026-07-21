import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "keuangan_data_v1";

const formatRupiah = (n) => {
  const num = Math.round(Number(n) || 0);
  return "Rp" + num.toLocaleString("id-ID");
};

const todayStr = () => new Date().toISOString().slice(0, 10);

function playNotifSound(ctx) {
  try {
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn("Gagal memutar suara notifikasi:", e);
  }
}

const defaultData = {
  cash: 0,
  pockets: [
    { id: "p1", name: "Darurat", pct: 50, balance: 0 },
    { id: "p2", name: "Jalan-jalan", pct: 30, balance: 0 },
    { id: "p3", name: "Investasi", pct: 20, balance: 0 },
  ],
  transactions: [],
};

// Icons
const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5v14"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);
const IconUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/>
  </svg>
);
const IconDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="m8 12 4 4 4-4"/><path d="M12 8v8"/>
  </svg>
);

export default function App() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultData;
    } catch { return defaultData; }
  });

  const [formType, setFormType] = useState("masuk");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pocketId, setPocketId] = useState("");
  const [splitMode, setSplitMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [error, setError] = useState("");
  const audioCtxRef = useRef(null);

  // Simpan ke localStorage setiap kali data berubah
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }, [data]);

  const { cash, pockets, transactions } = data;
  const totalPct = pockets.reduce((s, p) => s + (Number(p.pct) || 0), 0);
  const totalPocketBalance = pockets.reduce((s, p) => s + (Number(p.balance) || 0), 0);
  const totalAset = cash + totalPocketBalance;

  function resetForm() { setAmount(""); setNote(""); setPocketId(""); setError(""); }

  function handleAddTransaction() {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Masukkan jumlah yang valid (lebih dari 0).");
      return;
    }
    if (formType === "masuk") {
      if (splitMode) {
        if (pockets.length === 0 || totalPct === 0) {
          setError("Tambahkan kantong dengan persentase dulu, atau matikan split.");
          return;
        }
        const effectiveTotal = totalPct > 100 ? totalPct : 100;
        const newPockets = pockets.map((p) => ({
          ...p,
          balance: (Number(p.balance) || 0) + (amt * (Number(p.pct) || 0)) / effectiveTotal,
        }));
        const remainder = totalPct < 100 ? amt * (1 - totalPct / 100) : 0;
        setData((d) => ({
          ...d,
          pockets: newPockets,
          cash: d.cash + remainder,
          transactions: [{ id: Date.now().toString(), type: "masuk", amount: amt, note: note || "Pemasukan", date: todayStr(), split: true }, ...d.transactions],
        }));
        playNotifSound(audioCtxRef.current);
      } else {
        setData((d) => ({
          ...d,
          cash: d.cash + amt,
          transactions: [{ id: Date.now().toString(), type: "masuk", amount: amt, note: note || "Pemasukan", date: todayStr(), split: false }, ...d.transactions],
        }));
        playNotifSound(audioCtxRef.current);
      }
    } else {
      const fromCash = pocketId === "" || pocketId === "cash";
      if (fromCash) {
        if (amt > cash) { setError("Saldo kas tidak cukup."); return; }
        setData((d) => ({
          ...d,
          cash: d.cash - amt,
          transactions: [{ id: Date.now().toString(), type: "keluar", amount: amt, note: note || "Pengeluaran", date: todayStr(), source: "cash" }, ...d.transactions],
        }));
        playNotifSound(audioCtxRef.current);
      } else {
        const pocket = pockets.find((p) => p.id === pocketId);
        if (!pocket || amt > pocket.balance) { setError("Saldo kantong tidak cukup."); return; }
        setData((d) => ({
          ...d,
          pockets: d.pockets.map((p) => p.id === pocketId ? { ...p, balance: p.balance - amt } : p),
          transactions: [{ id: Date.now().toString(), type: "keluar", amount: amt, note: note || "Pengeluaran", date: todayStr(), source: pocketId }, ...d.transactions],
        }));
        playNotifSound(audioCtxRef.current);
      }
    }
    resetForm();
  }

  function addPocket() {
    setData((d) => ({ ...d, pockets: [...d.pockets, { id: "p" + Date.now(), name: "Kantong baru", pct: 0, balance: 0 }] }));
  }
  function updatePocket(id, field, value) {
    setData((d) => ({ ...d, pockets: d.pockets.map((p) => p.id === id ? { ...p, [field]: field === "pct" ? Number(value) || 0 : value } : p) }));
  }
  function removePocket(id) {
    setData((d) => {
      const pocket = d.pockets.find((p) => p.id === id);
      return { ...d, cash: d.cash + (Number(pocket?.balance) || 0), pockets: d.pockets.filter((p) => p.id !== id) };
    });
  }
  function handleResetAll() {
    setData((d) => ({
      cash: 0,
      pockets: d.pockets.map((p) => ({ ...p, balance: 0 })),
      transactions: [],
    }));
    setConfirmReset(false);
    setShowSettings(false);
  }
  function deleteTransaction(id) {
    setData((d) => ({ ...d, transactions: d.transactions.filter((tx) => tx.id !== id) }));
  }

  const s = styles;
  return (
    <div style={s.page}>
      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Catatan Keuangan</h1>
            <p style={s.subtitle}>Uang masuk, keluar, dan split saving otomatis</p>
          </div>
          <button onClick={() => setShowSettings(true)} style={s.iconBtn} aria-label="Pengaturan">
            <IconSettings />
          </button>
        </div>

        {/* Summary */}
        <div style={s.grid2}>
          <div style={s.card}>
            <p style={s.cardLabel}>Total aset</p>
            <p style={s.cardValue}>{formatRupiah(totalAset)}</p>
          </div>
          <div style={s.card}>
            <p style={s.cardLabel}>Kas tunai</p>
            <p style={s.cardValue}>{formatRupiah(cash)}</p>
          </div>
        </div>

        {/* Pockets */}
        <div style={{ marginBottom: 24 }}>
          <div style={s.rowBetween}>
            <p style={s.sectionTitle}>Kantong tabungan</p>
            <span style={{ fontSize: 12, color: totalPct === 100 ? "#16a34a" : "#d97706" }}>Total split: {totalPct}%</span>
          </div>
          <div style={s.grid2}>
            {pockets.map((p) => (
              <div key={p.id} style={s.card}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</p>
                  <p style={s.cardLabel}>{p.pct}% dari pemasukan</p>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{formatRupiah(p.balance)}</p>
              </div>
            ))}
            {pockets.length === 0 && <p style={{ fontSize: 13, color: "#a8a29e", gridColumn: "1/-1" }}>Belum ada kantong.</p>}
          </div>
        </div>

        {/* Form */}
        <div style={{ ...s.card, marginBottom: 24, display: "block" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={() => setFormType("masuk")} style={{ ...s.typeBtn, ...(formType === "masuk" ? s.typeBtnActive("#705D40") : s.typeBtnInactive) }}>
              <IconUp /> Masuk
            </button>
            <button onClick={() => setFormType("keluar")} style={{ ...s.typeBtn, ...(formType === "keluar" ? s.typeBtnActive("#705D40") : s.typeBtnInactive) }}>
              <IconDown /> Keluar
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <input
              type="text" inputMode="numeric" placeholder="Jumlah (Rp)"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddTransaction(); }}
              style={s.input}
            />
            <input
              type="text" placeholder="Catatan (opsional)"
              value={note} onChange={(e) => setNote(e.target.value)}
              style={s.input}
            />
          </div>

          {formType === "masuk" ? (
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#57534e", marginBottom: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={splitMode} onChange={(e) => setSplitMode(e.target.checked)} />
              Bagi otomatis ke kantong tabungan sesuai persentase
            </label>
          ) : (
            <select value={pocketId} onChange={(e) => setPocketId(e.target.value)} style={{ ...s.input, width: "100%", marginBottom: 12 }}>
              <option value="">Ambil dari kas tunai</option>
              {pockets.map((p) => (
                <option key={p.id} value={p.id}>Ambil dari {p.name} ({formatRupiah(p.balance)})</option>
              ))}
            </select>
          )}

          {error && <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 8 }}>{error}</p>}

          <button onClick={handleAddTransaction} style={s.submitBtn}>Tambah transaksi</button>
        </div>

        {/* Transactions */}
        <div>
          <p style={{ ...s.sectionTitle, marginBottom: 8 }}>Riwayat transaksi</p>
          {transactions.length === 0 ? (
            <p style={{ fontSize: 13, color: "#a8a29e" }}>Belum ada transaksi.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {transactions.map((tx) => (
                <div key={tx.id} style={s.txRow} className="tx-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <span style={{ color: tx.type === "masuk" ? "#16a34a" : "#dc2626", flexShrink: 0 }}>
                      {tx.type === "masuk" ? <IconUp /> : <IconDown />}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.note}</p>
                      <p style={{ fontSize: 11, color: "#a8a29e" }}>{tx.date}{tx.type === "masuk" && tx.split && " · dibagi ke kantong"}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: tx.type === "masuk" ? "#16a34a" : "#dc2626" }}>
                      {tx.type === "masuk" ? "+" : "-"}{formatRupiah(tx.amount)}
                    </p>
                    <button onClick={() => deleteTransaction(tx.id)} style={s.deleteBtn} aria-label="Hapus">
                      <IconTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={{ ...s.rowBetween, marginBottom: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 600 }}>Atur kantong tabungan</p>
              <button onClick={() => setShowSettings(false)} style={s.iconBtn}><IconX /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {pockets.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="text" value={p.name} onChange={(e) => updatePocket(p.id, "name", e.target.value)} style={{ ...s.input, flex: 1 }} />
                  <input type="number" value={p.pct} onChange={(e) => updatePocket(p.id, "pct", e.target.value)} style={{ ...s.input, width: 64, textAlign: "right" }} />
                  <span style={{ fontSize: 12, color: "#78716c" }}>%</span>
                  <button onClick={() => removePocket(p.id)} style={s.deleteBtn}><IconTrash /></button>
                </div>
              ))}
            </div>
            <button onClick={addPocket} style={s.addPocketBtn}><IconPlus /> Tambah kantong</button>
            <div style={{ fontSize: 12, borderRadius: 8, padding: "8px 12px", marginTop: 12, background: totalPct === 100 ? "#f0fdf4" : "#fffbeb", color: totalPct === 100 ? "#15803d" : "#92400e" }}>
              Total: {totalPct}%. {totalPct === 100 ? "Pas, semua pemasukan terbagi habis." : totalPct < 100 ? `Sisa ${100 - totalPct}% masuk ke kas tunai.` : "Melebihi 100%, akan dinormalkan otomatis."}
            </div>
            <button onClick={() => setShowSettings(false)} style={{ ...s.submitBtn, marginTop: 16 }}>Selesai</button>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #e7e5e4" }}>
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  style={{ width: "100%", background: "white", color: "#dc2626", border: "1px solid #dc2626", borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
                >
                  Reset semua data ke Rp0
                </button>
              ) : (
                <div>
                  <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 8, textAlign: "center" }}>
                    Yakin? Semua saldo dan riwayat transaksi akan dihapus permanen dan tidak bisa dikembalikan.
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setConfirmReset(false)} style={{ flex: 1, background: "#f5f5f4", color: "#57534e", border: "none", borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                      Batal
                    </button>
                    <button onClick={handleResetAll} style={{ flex: 1, background: "#dc2626", color: "white", border: "none", borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                      Ya, Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`.tx-row:hover .del-btn { opacity: 1 !important; }`}</style>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#E3D7CA", padding: "0 0 40px" },
  container: { maxWidth: 640, margin: "0 auto", padding: "32px 16px" },
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" },
  subtitle: { fontSize: 12, color: "#78716c", marginTop: 2 },
  iconBtn: { padding: 8, borderRadius: 8, border: "1px solid #e7e5e4", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  card: { background: "white", borderRadius: 12, border: "1px solid #e7e5e4", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  cardLabel: { fontSize: 11, color: "#78716c", marginBottom: 2 },
  cardValue: { fontSize: 18, fontWeight: 600 },
  sectionTitle: { fontSize: 13, fontWeight: 500, color: "#44403c" },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  input: { border: "1px solid #e7e5e4", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", background: "white" },
  typeBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  typeBtnActive: (color) => ({ background: color, color: "white" }),
  typeBtnInactive: { background: "#f5f5f4", color: "#57534e" },
  submitBtn: { width: "100%", background: "#705D40", color: "white", border: "none", borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  txRow: { background: "white", borderRadius: 8, border: "1px solid #e7e5e4", padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  deleteBtn: { background: "none", border: "none", cursor: "pointer", color: "#a8a29e", padding: 2, display: "flex" },
  addPocketBtn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: "1px dashed #d6d3d1", borderRadius: 8, padding: "8px 0", fontSize: 13, color: "#57534e", background: "white", cursor: "pointer" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 },
  modal: { background: "white", borderRadius: 12, maxWidth: 420, width: "100%", padding: 20, maxHeight: "85vh", overflowY: "auto" },
};
