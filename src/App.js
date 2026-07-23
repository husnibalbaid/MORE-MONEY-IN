import { useState, useEffect } from "react";

const STORAGE_KEY = "keuangan_data_v1";

const formatRupiah = (n) => {
  const num = Math.round(Number(n) || 0);
  return "Rp" + num.toLocaleString("id-ID");
};

const todayStr = () => new Date().toISOString().slice(0, 10);

// Putar audio notifikasi custom
const playAudio = (type) => {
  const file = type === "masuk" ? "/audio-masuk.mp3" : "/audio-keluar.mp3";
  try {
    const audio = new Audio(file);
    audio.volume = 0.7;
    audio.play().catch(() => {});
  } catch (e) {}
};

const defaultData = {
  cash: 0,
  pockets: [
    { id: "p1", name: "Darurat", pct: 50, balance: 0 },
    { id: "p2", name: "Jalan-jalan", pct: 30, balance: 0 },
    { id: "p3", name: "Investasi", pct: 20, balance: 0 },
  ],
  transactions: [],
};

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
  const [error, setError] = useState("");

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }, [data]);

  const { cash, pockets, transactions } = data;
  const totalPct = pockets.reduce((s, p) => s + (Number(p.pct) || 0), 0);
  const totalPocketBalance = pockets.reduce((s, p) => s + (Number(p.balance) || 0), 0);
  const totalAset = cash + totalPocketBalance;

  function resetForm() { setAmount(""); setNote(""); setPocketId(""); setError(""); }

  function handleAddTransaction() {
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
      } else {
        setData((d) => ({
          ...d,
          cash: d.cash + amt,
          transactions: [{ id: Date.now().toString(), type: "masuk", amount: amt, note: note || "Pemasukan", date: todayStr(), split: false }, ...d.transactions],
        }));
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
      } else {
        const pocket = pockets.find((p) => p.id === pocketId);
        if (!pocket || amt > pocket.balance) { setError("Saldo kantong tidak cukup."); return; }
        setData((d) => ({
          ...d,
          pockets: d.pockets.map((p) => p.id === pocketId ? { ...p, balance: p.balance - amt } : p),
          transactions: [{ id: Date.now().toString(), type: "keluar", amount: amt, note: note || "Pengeluaran", date: todayStr(), source: pocketId }, ...d.transactions],
        }));
      }
    }
    playAudio(formType);
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
  function deleteTransaction(id) {
    setData((d) => ({ ...d, transactions: d.transactions.filter((tx) => tx.id !== id) }));
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Catatan Keuangan</h1>
            <p className="text-xs text-stone-500 mt-0.5">Uang masuk, keluar, dan split saving otomatis</p>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 transition" aria-label="Pengaturan">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-stone-200 px-4 py-3">
            <p className="text-xs text-stone-500 mb-1">Total aset</p>
            <p className="text-lg font-semibold">{formatRupiah(totalAset)}</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 px-4 py-3">
            <p className="text-xs text-stone-500 mb-1">Kas tunai</p>
            <p className="text-lg font-semibold">{formatRupiah(cash)}</p>
          </div>
        </div>

        {/* Pockets */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-stone-700">Kantong tabungan</p>
            <span className={`text-xs ${totalPct === 100 ? "text-emerald-600" : "text-amber-600"}`}>Total split: {totalPct}%</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pockets.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-stone-500">{p.pct}% dari pemasukan</p>
                </div>
                <p className="text-sm font-semibold">{formatRupiah(p.balance)}</p>
              </div>
            ))}
            {pockets.length === 0 && <p className="text-sm text-stone-400 col-span-2">Belum ada kantong.</p>}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6">
          <div className="flex gap-2 mb-3">
            <button onClick={() => setFormType("masuk")} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${formType === "masuk" ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-600"}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>
              Masuk
            </button>
            <button onClick={() => setFormType("keluar")} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${formType === "keluar" ? "bg-red-600 text-white" : "bg-stone-100 text-stone-600"}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m8 12 4 4 4-4"/><path d="M12 8v8"/></svg>
              Keluar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <input
              type="text" inputMode="numeric" placeholder="Jumlah (Rp)"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddTransaction(); }}
              className="border border-stone-200 rounded-lg px-3 py-2 text-sm col-span-2 sm:col-span-1 focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
            <input
              type="text" placeholder="Catatan (opsional)"
              value={note} onChange={(e) => setNote(e.target.value)}
              className="border border-stone-200 rounded-lg px-3 py-2 text-sm col-span-2 sm:col-span-1 focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>

          {formType === "masuk" ? (
            <label className="flex items-center gap-2 text-sm text-stone-600 mb-3 cursor-pointer">
              <input type="checkbox" checked={splitMode} onChange={(e) => setSplitMode(e.target.checked)} className="rounded" />
              Bagi otomatis ke kantong tabungan sesuai persentase
            </label>
          ) : (
            <select value={pocketId} onChange={(e) => setPocketId(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-stone-300">
              <option value="">Ambil dari kas tunai</option>
              {pockets.map((p) => (
                <option key={p.id} value={p.id}>Ambil dari {p.name} ({formatRupiah(p.balance)})</option>
              ))}
            </select>
          )}

          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

          <button onClick={handleAddTransaction} className="w-full bg-stone-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-stone-800 transition">
            Tambah transaksi
          </button>
        </div>

        {/* Transactions */}
        <div>
          <p className="text-sm font-medium text-stone-700 mb-2">Riwayat transaksi</p>
          {transactions.length === 0 ? (
            <p className="text-sm text-stone-400">Belum ada transaksi.</p>
          ) : (
            <div className="space-y-1.5">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-white rounded-lg border border-stone-200 px-3 py-2.5 flex items-center justify-between group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`shrink-0 ${tx.type === "masuk" ? "text-emerald-600" : "text-red-600"}`}>
                      {tx.type === "masuk"
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m8 12 4 4 4-4"/><path d="M12 8v8"/></svg>
                      }
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm truncate">{tx.note}</p>
                      <p className="text-xs text-stone-400">{tx.date}{tx.type === "masuk" && tx.split && " · dibagi ke kantong"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className={`text-sm font-medium ${tx.type === "masuk" ? "text-emerald-700" : "text-red-700"}`}>
                      {tx.type === "masuk" ? "+" : "-"}{formatRupiah(tx.amount)}
                    </p>
                    <button onClick={() => deleteTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 transition text-stone-400 hover:text-red-600" aria-label="Hapus">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-semibold">Atur kantong tabungan</p>
              <button onClick={() => setShowSettings(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="space-y-2 mb-4">
              {pockets.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <input type="text" value={p.name} onChange={(e) => updatePocket(p.id, "name", e.target.value)} className="flex-1 border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
                  <input type="number" value={p.pct} onChange={(e) => updatePocket(p.id, "pct", e.target.value)} className="w-16 border border-stone-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-stone-300" />
                  <span className="text-xs text-stone-500">%</span>
                  <button onClick={() => removePocket(p.id)} className="text-stone-400 hover:text-red-600 p-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addPocket} className="w-full flex items-center justify-center gap-1.5 border border-dashed border-stone-300 rounded-lg py-2 text-sm text-stone-600 hover:bg-stone-50 transition mb-4">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Tambah kantong
            </button>
            <div className={`text-xs rounded-lg px-3 py-2 ${totalPct === 100 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              Total: {totalPct}%. {totalPct === 100 ? "Pas, semua pemasukan terbagi habis." : totalPct < 100 ? `Sisa ${100 - totalPct}% masuk ke kas tunai.` : "Melebihi 100%, akan dinormalkan otomatis."}
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full bg-stone-900 text-white rounded-lg py-2 text-sm font-medium mt-4 hover:bg-stone-800 transition">Selesai</button>
          </div>
        </div>
      )}
    </div>
  );
}
