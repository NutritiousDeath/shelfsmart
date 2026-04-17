import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/api/supabaseClient";
import { ScanBarcode, Plus, Minus, Check, AlertCircle, X, Camera } from "lucide-react";
import ProductModal from "../components/inventory/ProductModal";

export default function Scanner() {
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductDefaults, setNewProductDefaults] = useState(null);
  const [manualEntry, setManualEntry] = useState("");
  const [scanError, setScanError] = useState(null);
  const [debugInfo, setDebugInfo] = useState("Ready");

  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const scanningRef = useRef(false);

  const stopScanner = useCallback(async () => {
    try {
      if (readerRef.current) {
        readerRef.current.reset();
        readerRef.current = null;
      }
    } catch (_) {}
    setScanning(false);
  }, []);

  const startScanner = async () => {
    setScanError(null);
    setScannedCode(null); setProducts([]); setStatus(null); setSaved(false);
    scanningRef.current = false;
    setDebugInfo("Loading scanner...");

    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      setScanning(true);
      setDebugInfo("Getting cameras...");

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      setDebugInfo(`Found ${devices.length} camera(s)`);

      const backCamera = devices.find(d =>
        d.label.toLowerCase().includes("back") ||
        d.label.toLowerCase().includes("rear") ||
        d.label.toLowerCase().includes("environment") ||
        d.label.toLowerCase().includes("0,")
      ) || devices[devices.length - 1];

      const deviceId = backCamera?.deviceId;
      setDebugInfo(`Camera: ${backCamera?.label?.slice(0, 30) || "default"}`);

      await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result && !scanningRef.current) {
            const code = result.getText();
            if (!code || code.trim() === "") return;
            scanningRef.current = true;
            setDebugInfo(`✓ Scanned: ${code}`);
            stopScanner();
            handleScan(code);
          }
        }
      );

      setDebugInfo("Scanning — align barcode in frame");

    } catch (err) {
      setScanning(false);
      const msg = String(err?.message || err || "");
      setDebugInfo(`Error: ${msg.slice(0, 60)}`);
      if (msg.includes("NotAllowed") || msg.includes("Permission")) {
        setScanError("Camera access denied. Allow camera permissions in settings.");
      } else if (msg.includes("NotFound") || msg.includes("device")) {
        setScanError("No camera found. Use manual entry instead.");
      } else {
        setScanError("Camera error. Use manual entry.");
      }
    }
  };

  const handleScan = async (code) => {
    setScannedCode(code);
    try {
      const { data: found } = await supabase.from('products').select('*').eq('upc', code);
      if (found && found.length > 0) { setProducts(found); setStatus("found"); }
      else { setStatus("not_found"); setNewProductDefaults({ upc: code }); }
    } catch (err) { setStatus("not_found"); setNewProductDefaults({ upc: code }); }
  };

  const handleManualSearch = async () => { if (!manualEntry.trim()) return; await handleScan(manualEntry.trim()); };

  const handleAdjust = async (productId, delta) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;
    setSaving(true); setSelectedProductId(productId);
    const newQty = Math.max(0, target.quantity_on_hand + delta);
    let newStatus = newQty === 0 ? "out_of_stock" : newQty <= target.min_stock_level ? "low_stock" : "in_stock";
    const prevProducts = products;
    setProducts(products.map(p => p.id === productId ? { ...p, quantity_on_hand: newQty, status: newStatus } : p));
    try { await supabase.from('products').update({ quantity_on_hand: newQty, status: newStatus }).eq('id', productId); setSaved(true); }
    catch (err) { setProducts(prevProducts); }
    setSaving(false);
    setTimeout(() => { setSaved(false); setSelectedProductId(null); }, 2000);
  };

  const handleAddNew = async (data) => {
    let newStatus = data.quantity_on_hand === 0 ? "out_of_stock" : data.quantity_on_hand <= data.min_stock_level ? "low_stock" : "in_stock";
    try {
      const { data: created } = await supabase.from('products').insert({ ...data, status: newStatus }).select().single();
      if (created) { setProducts(prev => prev.length > 0 ? [...prev, created] : [created]); setStatus("found"); }
    } catch (err) { alert("Failed to create product. Please try again."); }
    setShowAddModal(false);
  };

  const reset = async () => {
    await stopScanner();
    setScannedCode(null); setProducts([]); setStatus(null);
    setSaved(false); setManualEntry(""); setDebugInfo("Ready");
    setTimeout(() => startScanner(), 300);
  };

  useEffect(() => {
    startScanner();
    return () => { stopScanner(); };
  }, []);

  // Scanning overlay corners
  const Corner = ({ top, bottom, left, right }) => (
    <div style={{
      position: "absolute",
      ...(top !== undefined ? { top } : {}),
      ...(bottom !== undefined ? { bottom } : {}),
      ...(left !== undefined ? { left } : {}),
      ...(right !== undefined ? { right } : {}),
      width: 24, height: 24,
      borderTop: top !== undefined ? "3px solid var(--primary)" : "none",
      borderBottom: bottom !== undefined ? "3px solid var(--primary)" : "none",
      borderLeft: left !== undefined ? "3px solid var(--primary)" : "none",
      borderRight: right !== undefined ? "3px solid var(--primary)" : "none",
    }} />
  );

  return (
    <div style={{ padding: "1rem", maxWidth: 500, margin: "0 auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", letterSpacing: 2, color: "var(--white)", marginBottom: 4 }}>BARCODE SCANNER</h2>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--grey)", letterSpacing: 1 }}>// scan upc to look up or update inventory</p>
      </div>

      <div style={{ background: "rgba(0,240,255,0.05)", border: "1px solid var(--primary-border)", borderRadius: 4, padding: "0.5rem 0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--primary)", wordBreak: "break-all" }}>
        {debugInfo}
      </div>

      {!status && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--primary-border)", borderRadius: 4, overflow: "hidden" }}>

          {/* Camera view */}
          <div style={{ display: scanning ? "block" : "none", position: "relative", background: "#000" }}>
            <video
              ref={videoRef}
              style={{ width: "100%", maxHeight: "60vw", objectFit: "cover", display: "block" }}
              autoPlay playsInline muted
            />
            {/* Scanner overlay */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              {/* Dark overlay around scan area */}
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
              {/* Scan window */}
              <div style={{
                position: "relative",
                width: "80%",
                height: 120,
                background: "transparent",
                zIndex: 1,
              }}>
                {/* Clear window cutout */}
                <div style={{ position: "absolute", inset: 0, background: "transparent", boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)" }} />
                {/* Animated scan line */}
                <div style={{
                  position: "absolute", left: 0, right: 0, height: 2,
                  background: "linear-gradient(90deg, transparent, var(--primary), transparent)",
                  boxShadow: "var(--primary-glow)",
                  animation: "scanline 2s ease-in-out infinite",
                }} />
                {/* Corner markers */}
                <Corner top={-1} left={-1} />
                <Corner top={-1} right={-1} />
                <Corner bottom={-1} left={-1} />
                <Corner bottom={-1} right={-1} />
              </div>
            </div>
            <p style={{ position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center", color: "var(--primary)", fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: 1, zIndex: 2 }}>
              ALIGN BARCODE IN FRAME
            </p>
            <style>{`@keyframes scanline { 0%,100%{top:0} 50%{top:calc(100% - 2px)} }`}</style>
          </div>

          {!scanning && (
            <div style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 60, height: 60, background: "var(--primary-dim)", border: "1px solid var(--primary-border)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                <ScanBarcode size={26} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "0.7rem", letterSpacing: 2, color: "var(--white)", marginBottom: 4 }}>READY TO SCAN</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--grey)" }}>Use camera or enter UPC manually</p>
              </div>
              {scanError && <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#ff4444", background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.3)", borderRadius: 4, padding: "0.5rem 0.75rem", textAlign: "center", width: "100%" }}>{scanError}</p>}
              <button onClick={startScanner} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--primary)", color: "var(--bg)", border: "none", borderRadius: 4, padding: "0.75rem 1.5rem", fontFamily: "var(--font-display)", fontSize: "0.68rem", letterSpacing: 2, cursor: "pointer", width: "100%", justifyContent: "center" }}>
                <Camera size={15} /> OPEN CAMERA
              </button>
            </div>
          )}

          {scanning && (
            <div style={{ padding: "0.6rem", borderTop: "1px solid var(--primary-border)" }}>
              <button onClick={stopScanner} style={{ width: "100%", padding: "0.55rem", background: "transparent", border: "1px solid var(--primary-border)", color: "var(--grey)", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: "0.65rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <X size={13} /> CANCEL SCAN
              </button>
            </div>
          )}
        </div>
      )}

      {!status && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--primary-border)", borderRadius: 4, padding: "0.85rem" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--grey)", letterSpacing: 2, marginBottom: 8 }}>MANUAL UPC ENTRY</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={manualEntry} onChange={e => setManualEntry(e.target.value)} onKeyDown={e => e.key === "Enter" && handleManualSearch()} placeholder="Enter UPC code..."
              style={{ flex: 1, padding: "0.6rem 0.75rem", background: "rgba(8,13,26,0.9)", border: "1px solid var(--primary-border)", borderRadius: 4, color: "var(--white)", fontFamily: "var(--font-mono)", fontSize: "0.78rem", outline: "none" }} />
            <button onClick={handleManualSearch} style={{ padding: "0.6rem 0.9rem", background: "var(--primary)", color: "var(--bg)", border: "none", borderRadius: 4, fontFamily: "var(--font-display)", fontSize: "0.62rem", letterSpacing: 1, cursor: "pointer" }}>SEARCH</button>
          </div>
        </div>
      )}

      {status === "found" && products.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Check size={15} color="#00ff88" />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#00ff88", letterSpacing: 1 }}>{products.length} PRODUCT{products.length > 1 ? "S" : ""} FOUND</span>
            </div>
            <button onClick={reset} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--grey)", padding: 4 }}><X size={15} /></button>
          </div>
          {products.map((product) => (
            <div key={product.id} style={{ background: "var(--bg-card)", border: "1px solid var(--primary-border)", borderRadius: 4, padding: "1rem" }}>
              <div style={{ marginBottom: "0.75rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.82rem", letterSpacing: 1, color: "var(--white)", marginBottom: 4 }}>{product.name}</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--grey)" }}>
                  {product.sku && <span>SKU: {product.sku}</span>}
                  {product.location && <span>// {product.location}</span>}
                  {product.expiration_date && <span style={{ color: new Date(product.expiration_date) < new Date(Date.now() + 7 * 86400000) ? "#ff4444" : "var(--grey)" }}>EXP: {new Date(product.expiration_date).toLocaleDateString()}</span>}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "0.6rem 0", borderTop: "1px solid var(--primary-border)", borderBottom: "1px solid var(--primary-border)", marginBottom: "0.75rem" }}>
                {[["qty",product.quantity_on_hand,"ON HAND","var(--white)"],["min",product.min_stock_level,"MIN LEVEL","var(--grey)"]].map(([k,v,l,c]) => (
                  <div key={k} style={{ textAlign: "center" }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700, color: c }}>{v}</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "var(--grey)", letterSpacing: 1 }}>{l}</p>
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: 1, padding: "3px 7px", borderRadius: 3,
                    background: product.status === "in_stock" ? "rgba(0,255,136,0.1)" : product.status === "low_stock" ? "var(--primary-dim)" : "rgba(255,68,68,0.1)",
                    color: product.status === "in_stock" ? "#00ff88" : product.status === "low_stock" ? "var(--primary)" : "#ff4444",
                    border: `1px solid ${product.status === "in_stock" ? "rgba(0,255,136,0.3)" : product.status === "low_stock" ? "var(--primary-border)" : "rgba(255,68,68,0.3)"}` }}>
                    {product.status?.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
              </div>
              {saved && selectedProductId === product.id && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", borderRadius: 4, padding: "0.4rem 0.6rem", marginBottom: "0.6rem", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#00ff88" }}>
                  <Check size={12} /> UPDATED
                </div>
              )}
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", color: "var(--grey)", letterSpacing: 2, marginBottom: 6 }}>QUICK ADJUST</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <button onClick={() => handleAdjust(product.id, -1)} disabled={saving || product.quantity_on_hand === 0}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "0.6rem", background: "transparent", border: "1px solid var(--primary-border)", color: "var(--grey)", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: "0.65rem", cursor: "pointer", opacity: (saving || product.quantity_on_hand === 0) ? 0.4 : 1 }}>
                  <Minus size={12} /> REMOVE 1
                </button>
                <button onClick={() => handleAdjust(product.id, 1)} disabled={saving}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "0.6rem", background: "var(--primary)", color: "var(--bg)", border: "none", borderRadius: 4, fontFamily: "var(--font-display)", fontSize: "0.62rem", letterSpacing: 1, cursor: "pointer", opacity: saving ? 0.5 : 1 }}>
                  <Plus size={12} /> ADD 1
                </button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[-10, 10].map(n => (
                  <button key={n} onClick={() => handleAdjust(product.id, n)} disabled={saving}
                    style={{ flex: 1, padding: "0.45rem", background: "transparent", border: "1px solid var(--primary-border)", color: "var(--grey)", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: "0.68rem", cursor: "pointer" }}>
                    {n > 0 ? `+${n}` : n}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { const ref = products[0]; setNewProductDefaults({ name: ref.name, upc: ref.upc || scannedCode || manualEntry, sku: ref.sku, category: ref.category, min_stock_level: ref.min_stock_level, unit_cost: ref.unit_cost, retail_price: ref.retail_price, supplier: ref.supplier, location: ref.location, quantity_on_hand: 0, expiration_date: "" }); setShowAddModal(true); }}
              style={{ flex: 1, padding: "0.7rem", background: "var(--primary)", color: "var(--bg)", border: "none", borderRadius: 4, fontFamily: "var(--font-display)", fontSize: "0.62rem", letterSpacing: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Plus size={13} /> ADD NEW ENTRY
            </button>
            <button onClick={reset} style={{ flex: 1, padding: "0.7rem", background: "transparent", border: "1px solid var(--primary-border)", color: "var(--primary)", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: "0.65rem", cursor: "pointer" }}>
              SCAN ANOTHER
            </button>
          </div>
        </div>
      )}

      {status === "not_found" && (
        <div style={{ background: "var(--bg-card)", border: "1px solid rgba(255,68,68,0.3)", borderRadius: 4, padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.75rem" }}>
            <AlertCircle size={18} color="#ff4444" />
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "0.78rem", letterSpacing: 1, color: "var(--white)" }}>PRODUCT NOT FOUND</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--grey)", marginTop: 2 }}>{scannedCode || manualEntry}</p>
            </div>
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--grey)", marginBottom: "1rem" }}>This UPC is not in your inventory. Would you like to add it?</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={reset} style={{ flex: 1, padding: "0.65rem", background: "transparent", border: "1px solid var(--primary-border)", color: "var(--grey)", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: "0.65rem", cursor: "pointer" }}>CANCEL</button>
            <button onClick={() => setShowAddModal(true)} style={{ flex: 1, padding: "0.65rem", background: "var(--primary)", color: "var(--bg)", border: "none", borderRadius: 4, fontFamily: "var(--font-display)", fontSize: "0.62rem", letterSpacing: 1, cursor: "pointer" }}>ADD PRODUCT</button>
          </div>
        </div>
      )}

      {showAddModal && (
        <ProductModal product={newProductDefaults} onSave={handleAddNew} onClose={() => setShowAddModal(false)} requireExpiration={products.length > 0} />
      )}
    </div>
  );
}