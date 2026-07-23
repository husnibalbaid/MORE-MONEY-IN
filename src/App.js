import { useState, useEffect } from "react";

const STORAGE_KEY = "keuangan_data_v1";

// ── Palet warna ──────────────────────────────────────────
const C = {
  bg:       "#5b4c3a", // Deep Espresso Clay
  card:     "#6e5c47", // sedikit lebih terang dari bg untuk card
  border:   "#7a6a56", // border halus
  font:     "#ded1ba", // Warm Putty
  btn:      "#c4b39a", // Soft Mushroom Beige (tombol utama)
  btnText:  "#3a2f22", // teks gelap di atas tombol terang
  masuk:    "#7fb98a", // hijau natural untuk uang masuk
  keluar:   "#c47a7a", // merah natural untuk uang keluar
  input:    "#4a3c2c", // input background
};

const formatRupiah = (n) => {
  const num = Math.round(Number(n) || 0);
  return "Rp" + num.toLocaleString("id-ID");
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const defaultData = {
  cash: 0,
  pockets: [
    { id: "p1", name: "Darurat", pct: 50, balance: 0 },
    { id: "p2", name: "Jalan-jalan", pct: 30, balance: 0 },
    { id: "p3", name: "Investasi", pct: 20, balance: 0 },
  ],
  transactions: [],
};

// ── Audio notifikasi ─────────────────────────────────────
const playAudio = (type) => {
  const file = type === "masuk" ? "/audio-masuk.mp3" : "/audio-keluar.mp3";
  try {
    const audio = new Audio(file);
    audio.volume = 0.7;
    audio.play().catch(() => {});
  } catch (e) {}
};

// ── Icon SVG ─────────────────────────────────────────────
const IcSettings = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const IcX    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
const IcPlus = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const IcTrash= () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const IcUp   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>;
const IcDown = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m8 12 4 4 4-4"/><path d="M12 8v8"/></svg>;

// ── Komponen utama ────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultData;
    } catch { return defaultData; }
  });

  const [formType,    setFormType]    = useState("masuk");
  const [amount,      setAmount]      = useState("");
  const [note,        setNote]        = useState("");
  const [pocketId,    setPocketId]    = useState("");
  const [splitMode,   setSplitMode]   = useState(true);
  const [showSettings,setShowSettings]= useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }, [data]);

  const { cash, pockets, transactions } = data;
  const totalPct          = pockets.reduce((s, p) => s + (Number(p.pct) || 0), 0);
  const totalPocketBalance= pockets.reduce((s, p) => s + (Number(p.balance) || 0), 0);
  const totalAset         = cash + totalPocketBalance;

  function resetForm() { setAmount(""); setNote(""); setPocketId(""); setError(""); }

  function handleAddTransaction() {
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) { setError("Masukkan jumlah yang valid (lebih dari 0)."); return; }

    if (formType === "masuk") {
      if (splitMode) {
        if (pockets.length === 0 || totalPct === 0) { setError("Tambahkan kantong dengan persentase dulu, atau matikan split."); return; }
        const effectiveTotal = totalPct > 100 ? totalPct : 100;
        const newPockets = pockets.map((p) => ({ ...p, balance: (Number(p.balance)||0) + (amt*(Number(p.pct)||0))/effectiveTotal }));
        const remainder  = totalPct < 100 ? amt*(1-totalPct/100) : 0;
        setData((d) => ({ ...d, pockets: newPockets, cash: d.cash+remainder, transactions: [{ id:Date.now().toString(), type:"masuk", amount:amt, note:note||"Pemasukan", date:todayStr(), split:true }, ...d.transactions] }));
      } else {
        setData((d) => ({ ...d, cash: d.cash+amt, transactions: [{ id:Date.now().toString(), type:"masuk", amount:amt, note:note||"Pemasukan", date:todayStr(), split:false }, ...d.transactions] }));
      }
    } else {
      const fromCash = pocketId===""||pocketId==="cash";
      if (fromCash) {
        if (amt>cash) { setError("Saldo kas tidak cukup."); return; }
        setData((d) => ({ ...d, cash:d.cash-amt, transactions:[{ id:Date.now().toString(), type:"keluar", amount:amt, note:note||"Pengeluaran", date:todayStr(), source:"cash" }, ...d.transactions] }));
      } else {
        const pocket = pockets.find((p)=>p.id===pocketId);
        if (!pocket||amt>pocket.balance) { setError("Saldo kantong tidak cukup."); return; }
        setData((d) => ({ ...d, pockets:d.pockets.map((p)=>p.id===pocketId?{...p,balance:p.balance-amt}:p), transactions:[{ id:Date.now().toString(), type:"keluar", amount:amt, note:note||"Pengeluaran", date:todayStr(), source:pocketId }, ...d.transactions] }));
      }
    }
    playAudio(formType);
    resetForm();
  }

  function addPocket()              { setData((d)=>({...d,pockets:[...d.pockets,{id:"p"+Date.now(),name:"Kantong baru",pct:0,balance:0}]})); }
  function updatePocket(id,f,v)     { setData((d)=>({...d,pockets:d.pockets.map((p)=>p.id===id?{...p,[f]:f==="pct"?Number(v)||0:v}:p)})); }
  function removePocket(id)         { setData((d)=>{ const px=d.pockets.find((p)=>p.id===id); return {...d,cash:d.cash+(Number(px?.balance)||0),pockets:d.pockets.filter((p)=>p.id!==id)}; }); }
  function deleteTransaction(id)    { setData((d)=>({...d,transactions:d.transactions.filter((tx)=>tx.id!==id)})); }

  // ── Style helpers ─────────────────────────────────────
  const card   = { background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 18px" };
  const inp    = { background:C.input, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 13px", fontSize:13, color:C.font, outline:"none", width:"100%" };
  const btnMain= { background:C.btn, color:C.btnText, border:"none", borderRadius:8, padding:"10px 0", fontSize:13, fontWeight:600, cursor:"pointer", width:"100%" };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.font, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ maxWidth:640, margin:"0 auto", padding:"32px 16px 48px" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28 }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.02em", color:C.font, margin:0 }}>Catatan Keuangan</h1>
            <p style={{ fontSize:12, color:C.btn, marginTop:3 }}>Uang masuk, keluar, dan split saving otomatis</p>
          </div>
          <button onClick={()=>setShowSettings(true)} style={{ padding:8, borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.font, cursor:"pointer", display:"flex" }}>
            <IcSettings />
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>
          {[["Total aset", totalAset],["Kas tunai", cash]].map(([label,val])=>(
            <div key={label} style={card}>
              <p style={{ fontSize:11, color:C.btn, marginBottom:4 }}>{label}</p>
              <p style={{ fontSize:18, fontWeight:700, color:C.font }}>{formatRupiah(val)}</p>
            </div>
          ))}
        </div>

        {/* Kantong tabungan */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <p style={{ fontSize:13, fontWeight:600, color:C.font }}>Kantong tabungan</p>
            <span style={{ fontSize:12, color: totalPct===100 ? C.masuk : "#e8b97a" }}>Total split: {totalPct}%</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {pockets.map((p)=>(
              <div key={p.id} style={{ ...card, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:C.font }}>{p.name}</p>
                  <p style={{ fontSize:11, color:C.btn }}>{p.pct}% dari pemasukan</p>
                </div>
                <p style={{ fontSize:13, fontWeight:700, color:C.font }}>{formatRupiah(p.balance)}</p>
              </div>
            ))}
            {pockets.length===0 && <p style={{ fontSize:13, color:C.btn, gridColumn:"1/-1" }}>Belum ada kantong.</p>}
          </div>
        </div>

        {/* Form transaksi */}
        <div style={{ ...card, marginBottom:24 }}>
          {/* Toggle masuk/keluar */}
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            {["masuk","keluar"].map((t)=>(
              <button key={t} onClick={()=>setFormType(t)}
                style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  padding:"9px 0", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
                  background: formType===t ? C.btn : C.input,
                  color: formType===t ? C.btnText : C.font,
                  opacity: formType===t ? 1 : 0.7 }}>
                {t==="masuk" ? <IcUp /> : <IcDown />}
                {t==="masuk" ? "Masuk" : "Keluar"}
              </button>
            ))}
          </div>

          {/* Input jumlah & catatan */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            <input type="text" inputMode="numeric" placeholder="Jumlah (Rp)"
              value={amount} onChange={(e)=>setAmount(e.target.value.replace(/[^0-9]/g,""))}
              onKeyDown={(e)=>{ if(e.key==="Enter") handleAddTransaction(); }}
              style={{ ...inp, gridColumn:"1" }} />
            <input type="text" placeholder="Catatan (opsional)"
              value={note} onChange={(e)=>setNote(e.target.value)}
              style={{ ...inp, gridColumn:"2" }} />
          </div>

          {/* Split / pilih kantong */}
          {formType==="masuk" ? (
            <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:C.btn, marginBottom:12, cursor:"pointer" }}>
              <input type="checkbox" checked={splitMode} onChange={(e)=>setSplitMode(e.target.checked)} />
              Bagi otomatis ke kantong tabungan sesuai persentase
            </label>
          ) : (
            <select value={pocketId} onChange={(e)=>setPocketId(e.target.value)}
              style={{ ...inp, marginBottom:12 }}>
              <option value="">Ambil dari kas tunai</option>
              {pockets.map((p)=>(
                <option key={p.id} value={p.id}>Ambil dari {p.name} ({formatRupiah(p.balance)})</option>
              ))}
            </select>
          )}

          {error && <p style={{ fontSize:12, color:"#e08080", marginBottom:8 }}>{error}</p>}

          <button onClick={handleAddTransaction} style={btnMain}>Tambah transaksi</button>
        </div>

        {/* Riwayat transaksi */}
        <div>
          <p style={{ fontSize:13, fontWeight:600, color:C.font, marginBottom:10 }}>Riwayat transaksi</p>
          {transactions.length===0
            ? <p style={{ fontSize:13, color:C.btn }}>Belum ada transaksi.</p>
            : <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {transactions.map((tx)=>(
                  <div key={tx.id} style={{ ...card, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px" }}
                    className="tx-row">
                    <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                      <span style={{ color: tx.type==="masuk" ? C.masuk : C.keluar, flexShrink:0 }}>
                        {tx.type==="masuk" ? <IcUp /> : <IcDown />}
                      </span>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:C.font }}>{tx.note}</p>
                        <p style={{ fontSize:11, color:C.btn }}>{tx.date}{tx.type==="masuk"&&tx.split&&" · dibagi ke kantong"}</p>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                      <p style={{ fontSize:13, fontWeight:700, color: tx.type==="masuk" ? C.masuk : C.keluar }}>
                        {tx.type==="masuk"?"+":"-"}{formatRupiah(tx.amount)}
                      </p>
                      <button onClick={()=>deleteTransaction(tx.id)}
                        className="del-btn"
                        style={{ background:"none", border:"none", cursor:"pointer", color:C.btn, padding:2, display:"flex", opacity:0 }}>
                        <IcTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {/* Modal Pengaturan */}
      {showSettings && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, zIndex:50 }}>
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, maxWidth:420, width:"100%", padding:22, maxHeight:"85vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <p style={{ fontSize:15, fontWeight:700, color:C.font }}>Atur kantong tabungan</p>
              <button onClick={()=>setShowSettings(false)} style={{ background:"none", border:"none", cursor:"pointer", color:C.font }}><IcX /></button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
              {pockets.map((p)=>(
                <div key={p.id} style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <input type="text" value={p.name} onChange={(e)=>updatePocket(p.id,"name",e.target.value)}
                    style={{ ...inp, flex:1 }} />
                  <input type="number" value={p.pct} onChange={(e)=>updatePocket(p.id,"pct",e.target.value)}
                    style={{ ...inp, width:60, textAlign:"right" }} />
                  <span style={{ fontSize:12, color:C.btn }}>%</span>
                  <button onClick={()=>removePocket(p.id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.btn, display:"flex" }}><IcTrash /></button>
                </div>
              ))}
            </div>

            <button onClick={addPocket}
              style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                border:`1px dashed ${C.btn}`, borderRadius:8, padding:"8px 0", fontSize:13, color:C.btn,
                background:"transparent", cursor:"pointer", marginBottom:14 }}>
              <IcPlus /> Tambah kantong
            </button>

            <div style={{ fontSize:12, borderRadius:8, padding:"8px 12px", marginBottom:16,
              background: totalPct===100 ? "rgba(127,185,138,0.15)" : "rgba(232,185,122,0.15)",
              color: totalPct===100 ? C.masuk : "#e8b97a" }}>
              Total: {totalPct}%. {totalPct===100 ? "Pas, semua pemasukan terbagi habis."
                : totalPct<100 ? `Sisa ${100-totalPct}% masuk ke kas tunai.`
                : "Melebihi 100%, akan dinormalkan otomatis."}
            </div>

            <button onClick={()=>setShowSettings(false)} style={btnMain}>Selesai</button>
          </div>
        </div>
      )}

      <style>{`
        .tx-row:hover .del-btn { opacity: 1 !important; }
        input::placeholder { color: ${C.btn}; opacity: 0.7; }
        select option { background: ${C.input}; color: ${C.font}; }
      `}</style>
    </div>
  );
}
