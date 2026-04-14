import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [refreshing, setRefreshing] = useState(false);
  const [pulled, setPulled] = useState(false);
  const startY = useRef(0);
  const pullY = useMotionValue(0);
  const opacity = useTransform(pullY, [0, THRESHOLD], [0, 1]);
  const rotate = useTransform(pullY, [0, THRESHOLD], [0, 180]);
  const scale = useTransform(pullY, [0, THRESHOLD], [0.5, 1]);

  const isInputTarget = (e) => {
    const tag = e.target?.tagName?.toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || e.target?.isContentEditable;
  };

  const handleTouchStart = (e) => {
    if (refreshing || isInputTarget(e)) return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (refreshing || isInputTarget(e)) return;
    // Only trigger if the page scroll is at the very top
    const scrollEl = document.querySelector("main") || document.documentElement;
    if (scrollEl.scrollTop > 5) return;

    const delta = e.touches[0].clientY - startY.current;
    if (delta > 10) {
      const clamped = Math.min((delta - 10) * 0.4, THRESHOLD + 20);
      pullY.set(clamped);
      setPulled(clamped >= THRESHOLD);
    }
  };

  const handleTouchEnd = async () => {
    if (refreshing) return;
    if (pulled) {
      setRefreshing(true);
      pullY.set(THRESHOLD * 0.5);
      await onRefresh();
      setRefreshing(false);
    }
    pullY.set(0);
    setPulled(false);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <motion.div
        style={{ opacity }}
        className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none z-20"
      >
        <motion.div
          style={{ scale }}
          className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors ${
            pulled || refreshing ? "bg-amber-400" : "bg-white border border-slate-200"
          }`}
        >
          <motion.div style={{ rotate }}>
            <RefreshCw
              className={`w-4 h-4 ${pulled || refreshing ? "text-slate-900" : "text-slate-400"} ${refreshing ? "animate-spin" : ""}`}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Content shifted down while pulling */}
      <motion.div style={{ y: pullY }}>
        {children}
      </motion.div>
    </div>
  );
}