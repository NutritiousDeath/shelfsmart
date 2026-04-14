import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
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
  const [scanHint, setScanHint] = useState("Align barcode within the frame");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const scanningRef = useRef(false);
  const detectorRef = useRef(null);
  const canvasRef = useRef(null);

  // ─── Stop everything cleanly ────────────────────────────────────────────────
  const stopScanner = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  // ─── Apply autofocus to the live track ──────────────────────────────────────
  const applyAutofocus = (stream) => {
    try {
      const track = stream.getVideoTracks()[0];
      if (!track) return;
      const caps = track.getCapabilities ? track.getCapabilities() : {};
      const constraints = {};
      if (caps.focusMode && caps.focusMode.includes("continuous")) {
        constraints.focusMode = "continuous";
      }
      if (caps.exposureMode && caps.exposureMode.includes("continuous")) {
        constraints.exposureMode = "continuous";
      }
      if (caps.whiteBalanceMode && caps.whiteBalanceMode.includes("continuous")) {
        constraints.whiteBalanceMode = "continuous";
      }
      if (Object.keys(constraints).length > 0) {
        track.applyConstraints({ advanced: [constraints] }).catch(() => {});
      }
    } catch (_) {}
  };

  // ─── Main scan loop using BarcodeDetector (native Android WebView API) ──────
  // BarcodeDetector is built into Android WebView (Chrome 83+) and works
  // perfectly in Capacitor apps. It handles autofocus natively because it
  // reads directly from the video stream frame-by-frame.
  const startScanLoop = useCallback((stream) => {
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector) return;

    const tick = async () => {
      if (!scanningRef.current && video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
          const barcodes = await detector.detect(video);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            if (code) {
              scanningRef.current = true;
              stopScanner();
              handleScan(code);
              return;
            }
          }
        } catch (_) {}
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, [stopScanner]);

  // ─── Fallback: zxing for devices without BarcodeDetector ────────────────────
  const startZxingFallback = useCallback(async (stream) => {
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/library");
      const reader = new BrowserMultiFormatReader();
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      const tick = () => {
        if (scanningRef.current) return;
        try {
          // Draw frame to canvas and decode
          const canvas = canvasRef.current;
          if (!canvas || !video || video.readyState < 2) {
            animFrameRef.current = requestAnimationFrame(tick);
            return;
          }
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          try {
            const result = reader.decodeFromImageData ? reader.decodeFromImageData(imageData) : null;
            if (result) {
              scanningRef.current = true;
              stopScanner();
              handleScan(result.getText());
              return;
            }
          } catch (_) {}
        } catch (_) {}
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch (err) {
      setScanError("Scanner unavailable. Use manual entry instead.");
      setScanning(false);
    }
  }, [stopScanner]);

  const startScanner = async () => {
    setScanError(null);
    setScanHint("Align barcode within the frame");
    setScannedCode(null);
    setProducts([]);
    setStatus(null);
    setSaved(false);
    scanningRef.current = false;
    setScanning(true);

    try {
      // ── Step 1: Get camera stream with autofocus-friendly constraints ────────
      // Do NOT request exact resolution — this disables autofocus on many
      // Android devices. Use ideal values only and let the device negotiate.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      // ── Step 2: Attach stream to video element ───────────────────────────────
      const video = videoRef.current;
      if (!video) { stopScanner(); return; }
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();

      // ── Step 3: Apply autofocus after stream is live ─────────────────────────
      applyAutofocus(stream);

      // ── Step 4: Start scanning with BarcodeDetector if available, else zxing ─
      if (typeof BarcodeDetector !== "undefined") {
        setScanHint("Hold steady — scanning...");
        const detector = new BarcodeDetector({
          formats: [
            "ean_13", "ean_8", "upc_a", "upc_e",
            "code_128", "code_39", "code_93",
            "qr_code", "data_matrix", "itf",
          ],
        });
        detectorRef.current = detector;
        startScanLoop(stream);
      } else {
        // Fallback for older devices
        setScanHint("Align barcode — tap to focus if needed");
        await startZxingFallback(stream);
      }

    } catch (err) {
      setScanning(false);
      const msg = err?.message || "";
      if (msg.includes("NotAllowed") || msg.includes("Permission")) {
        setScanError("Camera access denied. Please allow camera permissions in your device settings and try again.");
      } else if (msg.includes("NotFound") || msg.includes("Requested device not found")) {
        setScanError("No camera found on this device. Use manual entry instead.");
      } else {
        setScanError("Camera error: " + msg + ". Try manual entry.");
      }
    }
  };

  const handleScan = async (code) => {
    setScannedCode(code);
    const found = await base44.entities.Product.filter({ upc: code });
    if (found.length > 0) {
      setProducts(found);
      setStatus("found");
    } else {
      setStatus("not_found");
      setNewProductDefaults({ upc: code });
    }
  };

  const handleManualSearch = async () => {
    if (!manualEntry.trim()) return;
    await handleScan(manualEntry.trim());
  };

  const handleAdjust = async (productId, delta) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;
    setSaving(true);
    setSelectedProductId(productId);
    const newQty = Math.max(0, target.quantity_on_hand + delta);
    let newStatus = "in_stock";
    if (newQty === 0) newStatus = "out_of_stock";
    else if (newQty <= target.min_stock_level) newStatus = "low_stock";
    const prevProducts = products;
    setProducts(products.map(p => p.id === productId ? { ...p, quantity_on_hand: newQty, status: newStatus } : p));
    try {
      await base44.entities.Product.update(productId, { quantity_on_hand: newQty, status: newStatus });
      setSaved(true);
    } catch (err) {
      setProducts(prevProducts);
    }
    setSaving(false);
    setTimeout(() => { setSaved(false); setSelectedProductId(null); }, 2000);
  };

  const handleAddNew = async (data) => {
    let newStatus = "in_stock";
    if (data.quantity_on_hand === 0) newStatus = "out_of_stock";
    else if (data.quantity_on_hand <= data.min_stock_level) newStatus = "low_stock";
    try {
      const created = await base44.entities.Product.create({ ...data, status: newStatus });
      setProducts(prev => prev.length > 0 ? [...prev, created] : [created]);
      setStatus("found");
    } catch (err) {
      alert("Failed to create product. Please try again.");
    }
    setShowAddModal(false);
  };

  const reset = () => {
    scanningRef.current = false;
    setScannedCode(null);
    setProducts([]);
    setStatus(null);
    setSaved(false);
    setManualEntry("");
  };

  useEffect(() => {
    startScanner();
    return () => { stopScanner(); };
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Barcode Scanner</h2>
        <p className="text-slate-500 text-sm">Scan a UPC barcode to look up or update inventory</p>
      </div>

      {/* Scanner Area */}
      {!status && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className={scanning ? "relative bg-black" : "hidden"}>
            <video
              ref={videoRef}
              className="w-full"
              style={{ maxHeight: "65vw", objectFit: "cover" }}
              autoPlay
              playsInline
              muted
            />
            {/* Hidden canvas for zxing fallback */}
            <canvas ref={canvasRef} className="hidden" />
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-32 border-2 border-amber-400 rounded-lg relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br" />
              </div>
            </div>
            <p className="absolute bottom-3 left-0 right-0 text-center text-white text-xs opacity-75">{scanHint}</p>
          </div>

          {!scanning && (
            <div className="p-8 flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center">
                <ScanBarcode className="w-10 h-10 text-amber-500" />
              </div>
              <div className="text-center">
                <p className="text-slate-700 dark:text-slate-300 font-medium">Ready to Scan</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Use camera or enter UPC manually</p>
              </div>
              {scanError && (
                <p className="text-red-500 text-sm text-center bg-red-50 px-3 py-2 rounded-xl">{scanError}</p>
              )}
              <button onClick={startScanner}
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold px-6 py-3 rounded-xl transition-colors w-full justify-center">
                <Camera className="w-4 h-4" /> Open Camera
              </button>
            </div>
          )}

          {scanning && (
            <div className="p-3 border-t border-slate-100">
              <button onClick={stopScanner}
                className="w-full py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Cancel Scan
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry */}
      {!status && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Manual UPC Entry</p>
          <div className="flex gap-2">
            <input
              value={manualEntry}
              onChange={e => setManualEntry(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleManualSearch()}
              placeholder="Enter UPC code..."
              className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white dark:bg-slate-900 dark:text-slate-100"
            />
            <button onClick={handleManualSearch}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">
              Search
            </button>
          </div>
        </div>
      )}

      {/* Result: Products Found */}
      {status === "found" && products.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-600">{products.length} Product{products.length > 1 ? "s" : ""} Found</span>
            </div>
            <button onClick={reset} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          {products.map((product) => (
            <div key={product.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 space-y-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{product.name}</h3>
                <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-0.5">
                  {product.sku && <span>SKU: {product.sku}</span>}
                  {product.location && <span>• {product.location}</span>}
                  {product.expiration_date && (
                    <span className={`font-medium ${new Date(product.expiration_date) < new Date(Date.now() + 7 * 86400000) ? "text-red-500" : "text-slate-500"}`}>
                      • Expires: {new Date(product.expiration_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{product.quantity_on_hand}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">On Hand</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-400 dark:text-slate-500">{product.min_stock_level}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Min Level</p>
                </div>
                <div className="text-center flex flex-col items-center justify-center">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    product.status === "in_stock" ? "bg-green-100 text-green-700" :
                    product.status === "low_stock" ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>{product.status?.replace(/_/g, " ")}</span>
                </div>
              </div>
              {saved && selectedProductId === product.id && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-xl text-sm font-medium">
                  <Check className="w-4 h-4" /> Updated!
                </div>
              )}
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">Quick Adjust Quantity</p>
                <div className="flex gap-2">
                  <button onClick={() => handleAdjust(product.id, -1)} disabled={saving || product.quantity_on_hand === 0}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-40 font-medium text-sm">
                    <Minus className="w-3.5 h-3.5" /> Remove 1
                  </button>
                  <button onClick={() => handleAdjust(product.id, 1)} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl transition-colors font-bold text-sm">
                    <Plus className="w-3.5 h-3.5" /> Add 1
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAdjust(product.id, -10)} disabled={saving} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">-10</button>
                  <button onClick={() => handleAdjust(product.id, 10)} disabled={saving} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-colors">+10</button>
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <button
              onClick={() => {
                const ref = products[0];
                setNewProductDefaults({ name: ref.name, upc: ref.upc || scannedCode || manualEntry, sku: ref.sku, category: ref.category, min_stock_level: ref.min_stock_level, unit_cost: ref.unit_cost, retail_price: ref.retail_price, supplier: ref.supplier, location: ref.location, quantity_on_hand: 0, expiration_date: "" });
                setShowAddModal(true);
              }}
              className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add New Entry
            </button>
            <button onClick={reset} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors bg-white">
              Scan Another
            </button>
          </div>
        </div>
      )}

      {/* Not Found */}
      {status === "not_found" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-100 dark:border-red-900 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-semibold text-slate-800">Product Not Found</p>
              <p className="text-slate-400 text-xs font-mono">{scannedCode || manualEntry}</p>
            </div>
          </div>
          <p className="text-slate-500 text-sm">This UPC is not in your inventory. Would you like to add it?</p>
          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button onClick={() => setShowAddModal(true)} className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl text-sm font-bold">Add Product</button>
          </div>
        </div>
      )}

      {showAddModal && (
        <ProductModal
          product={newProductDefaults}
          onSave={handleAddNew}
          onClose={() => setShowAddModal(false)}
          requireExpiration={products.length > 0}
        />
      )}
    </div>
  );
}
