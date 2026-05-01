"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const C = {
  mint: "#f0faf8",
  powder: "#b9e5e8",
  steel: "#7bb3d4",
  navy: "#4a638b",
  white: "#ffffff",
  text: "#1e3048",
  textS: "#5a7595",
  textM: "#8aacbf",
};

const PRESETS = [
  { id: 1, name: "Instagram Feed", sub: "1:1 · 1080×1080", w: 1080, h: 1080 },
  { id: 2, name: "Story / Reels", sub: "9:16 · 1080×1920", w: 1080, h: 1920 },
  { id: 3, name: "X / YouTube", sub: "16:9 · 1280×720", w: 1280, h: 720 },
  { id: 4, name: "Facebook OG", sub: "1.91:1 · 1200×630", w: 1200, h: 630 },
  { id: 5, name: "Pinterest", sub: "2:3 · 1000×1500", w: 1000, h: 1500 },
  { id: 6, name: "IG Portrait", sub: "4:5 · 1080×1350", w: 1080, h: 1350 },
];

const AGRID = [
  ["top-left", "top", "top-right"],
  ["left", "center", "right"],
  ["bottom-left", "bottom", "bottom-right"],
];

const AICON: Record<string, string> = {
  "top-left": "↖",
  top: "↑",
  "top-right": "↗",
  left: "←",
  center: "✦",
  right: "→",
  "bottom-left": "↙",
  bottom: "↓",
  "bottom-right": "↘",
};

interface Offset {
  x: number;
  y: number;
}

interface State {
  align: string;
  scale: number;
  bg: "white" | "black" | "transparent";
  offset: Offset;
}

interface Preset {
  id: number;
  name: string;
  sub: string;
  w: number;
  h: number;
}

function calcSize(preset: Preset, maxW = 170, maxH = 144) {
  const r = preset.w / preset.h;
  let w = maxW,
    h = w / r;
  if (h > maxH) {
    h = maxH;
    w = h * r;
  }
  return { w: Math.round(w), h: Math.round(h) };
}

function getBasePos(
  align: string,
  cw: number,
  ch: number,
  sw: number,
  sh: number
) {
  let x = (cw - sw) / 2,
    y = (ch - sh) / 2;
  if (align.includes("left")) x = 0;
  if (align.includes("right")) x = cw - sw;
  if (align.startsWith("top")) y = 0;
  if (align.startsWith("bottom")) y = ch - sh;
  return { x, y };
}

function draw(
  canvas: HTMLCanvasElement | null,
  img: HTMLImageElement | null,
  s: State,
  cw: number,
  ch: number,
  refW: number,
  refH: number
) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = cw;
  canvas.height = ch;
  ctx.clearRect(0, 0, cw, ch);
  if (s.bg === "white") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, cw, ch);
  }
  if (s.bg === "black") {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, cw, ch);
  }
  if (!img) return;

  const ir = img.naturalWidth / img.naturalHeight,
    cr = cw / ch;
  const fw = ir > cr ? cw : ch * ir;
  const fh = ir > cr ? cw / ir : ch;
  const sw = fw * s.scale,
    sh = fh * s.scale;
  const base = getBasePos(s.align, cw, ch, sw, sh);

  const scaleX = refW ? cw / refW : 1;
  const scaleY = refH ? ch / refH : 1;
  const x = base.x + (s.offset?.x || 0) * scaleX;
  const y = base.y + (s.offset?.y || 0) * scaleY;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, cw, ch);
  ctx.clip();
  ctx.drawImage(img, x, y, sw, sh);
  ctx.restore();
}

function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: C.textM,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "1px",
        textTransform: "uppercase",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : 16}px)`,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.22s, transform 0.22s",
        pointerEvents: "none",
        zIndex: 9999,
        background: C.navy,
        color: C.white,
        borderRadius: 10,
        padding: "10px 20px",
        fontSize: 13,
        fontWeight: 600,
        boxShadow: "0 6px 24px rgba(30,48,72,0.22)",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 15 }}>✓</span>
      {message}
    </div>
  );
}

interface CardProps {
  preset: Preset;
  img: HTMLImageElement | null;
  s: State;
  onOffsetChange: (offset: Offset) => void;
  onCopied: () => void;
}

function Card({ preset, img, s, onOffsetChange, onCopied }: CardProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const offsetStart = useRef<Offset>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const { w: dw, h: dh } = calcSize(preset);

  useEffect(() => {
    draw(ref.current, img, s, dw, dh, dw, dh);
  }, [img, s, dw, dh]);

  const cp = useCallback(() => {
    if (!img) return;
    const c = document.createElement("canvas");
    draw(c, img, s, preset.w, preset.h, dw, dh);
    c.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        onCopied();
      } catch {
        await navigator.clipboard.writeText(c.toDataURL("image/png"));
        onCopied();
      }
    });
  }, [img, s, preset.w, preset.h, dw, dh, onCopied]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!img) return;
      e.preventDefault();
      dragging.current = true;
      didDrag.current = false;
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      offsetStart.current = { x: s.offset?.x || 0, y: s.offset?.y || 0 };
    },
    [img, s.offset]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !dragStart.current) return;
      const ddx = e.clientX - dragStart.current.x;
      const ddy = e.clientY - dragStart.current.y;
      if (Math.abs(ddx) > 4 || Math.abs(ddy) > 4) didDrag.current = true;
      onOffsetChange({
        x: offsetStart.current.x + ddx,
        y: offsetStart.current.y + ddy,
      });
    };
    const onUp = () => {
      if (!dragging.current) return;
      if (!didDrag.current) cp();
      dragging.current = false;
      setIsDragging(false);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onOffsetChange, cp]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!img) return;
      const t = e.touches[0];
      dragging.current = true;
      didDrag.current = false;
      dragStart.current = { x: t.clientX, y: t.clientY };
      offsetStart.current = { x: s.offset?.x || 0, y: s.offset?.y || 0 };
    },
    [img, s.offset]
  );

  useEffect(() => {
    const onTMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      const t = e.touches[0];
      const ddx = t.clientX - dragStart.current!.x;
      const ddy = t.clientY - dragStart.current!.y;
      if (Math.abs(ddx) > 4 || Math.abs(ddy) > 4) didDrag.current = true;
      onOffsetChange({
        x: offsetStart.current.x + ddx,
        y: offsetStart.current.y + ddy,
      });
    };
    const onTEnd = () => {
      if (!didDrag.current) cp();
      dragging.current = false;
    };
    window.addEventListener("touchmove", onTMove);
    window.addEventListener("touchend", onTEnd);
    return () => {
      window.removeEventListener("touchmove", onTMove);
      window.removeEventListener("touchend", onTEnd);
    };
  }, [onOffsetChange, cp]);

  const dl = () => {
    if (!img) return;
    const c = document.createElement("canvas");
    draw(c, img, s, preset.w, preset.h, dw, dh);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `SNS_${preset.name.replace(/[\s/]+/g, "_")}_${preset.w}x${preset.h}.png`;
    a.click();
  };

  const canvasBg =
    s.bg === "transparent"
      ? {
          backgroundImage: `repeating-conic-gradient(#d4d4d4 0% 25%,#f0f0f0 0% 50%)`,
          backgroundSize: "10px 10px",
        }
      : {};

  const hasOffset = (s.offset?.x || 0) !== 0 || (s.offset?.y || 0) !== 0;

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 12,
        border: `1px solid ${C.powder}`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.15s,box-shadow 0.15s",
        boxShadow: `0 1px 4px rgba(74,99,139,0.07)`,
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = `0 8px 24px rgba(74,99,139,0.16)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = `0 1px 4px rgba(74,99,139,0.07)`;
        }
      }}
    >
      <div
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        style={{
          backgroundColor: C.mint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 164,
          position: "relative",
          cursor: img ? (isDragging ? "grabbing" : "grab") : "default",
          userSelect: "none",
        }}
      >
        <div
          style={{
            ...canvasBg,
            lineHeight: 0,
            boxShadow: "0 2px 10px rgba(30,48,72,0.15)",
          }}
        >
          <canvas
            ref={ref}
            style={{ display: "block", pointerEvents: "none" }}
          />
        </div>

        {img && !isDragging && (
          <div
            style={{
              position: "absolute",
              bottom: 6,
              right: 7,
              fontSize: 9,
              color: C.textM,
              background: "rgba(255,255,255,0.75)",
              borderRadius: 4,
              padding: "2px 5px",
              pointerEvents: "none",
              letterSpacing: "0.2px",
            }}
          >
            ドラッグで移動
          </div>
        )}

        {isDragging && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              border: `2px solid ${C.steel}`,
              borderRadius: 0,
              pointerEvents: "none",
            }}
          />
        )}

        {hasOffset && !isDragging && (
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 7,
              fontSize: 9,
              color: C.white,
              background: C.steel,
              borderRadius: 4,
              padding: "2px 6px",
              pointerEvents: "none",
            }}
          >
            移動中
          </div>
        )}
      </div>

      <div
        style={{
          padding: "10px 13px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `1px solid ${C.powder}`,
        }}
      >
        <div>
          <div style={{ color: C.text, fontSize: 11, fontWeight: 600 }}>
            {preset.name}
          </div>
          <div
            style={{
              color: C.textM,
              fontSize: 9,
              marginTop: 2,
              fontFamily: "monospace",
            }}
          >
            {preset.sub}
          </div>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <button
            onClick={cp}
            disabled={!img}
            title="クリップボードにコピー"
            style={{
              background: img ? C.mint : C.mint,
              color: img ? C.steel : C.textM,
              border: `1px solid ${img ? C.powder : C.powder}`,
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 11,
              fontWeight: 700,
              cursor: img ? "pointer" : "default",
              transition: "background 0.15s,transform 0.1s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (img)
                (e.currentTarget as HTMLButtonElement).style.background =
                  C.powder;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = C.mint;
            }}
            onMouseDown={(e) => {
              if (img)
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "scale(0.93)";
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "scale(1)";
            }}
          >
            コピー
          </button>
          <button
            onClick={dl}
            disabled={!img}
            style={{
              background: img ? C.navy : C.mint,
              color: img ? C.white : C.textM,
              border: "none",
              borderRadius: 6,
              padding: "5px 14px",
              fontSize: 11,
              fontWeight: 700,
              cursor: img ? "pointer" : "default",
              transition: "background 0.15s,transform 0.1s",
            }}
            onMouseEnter={(e) => {
              if (img)
                (e.currentTarget as HTMLButtonElement).style.background =
                  C.steel;
            }}
            onMouseLeave={(e) => {
              if (img)
                (e.currentTarget as HTMLButtonElement).style.background =
                  C.navy;
            }}
            onMouseDown={(e) => {
              if (img)
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "scale(0.93)";
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "scale(1)";
            }}
          >
            DL
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Resizer() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [fname, setFname] = useState("");
  const [fileDrag, setFileDrag] = useState(false);
  const [s, setS] = useState<State>({
    align: "center",
    scale: 1,
    bg: "white",
    offset: { x: 0, y: 0 },
  });
  const fref = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, message: "コピーしました" });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      2200
    );
  }, []);

  const load = (file: File | null | undefined, name?: string) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      setImg(im);
      setFname(name || file.name);
    };
    im.src = url;
  };

  const set = <K extends keyof State>(k: K, v: State[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const setAlign = (a: string) =>
    setS((p) => ({ ...p, align: a, offset: { x: 0, y: 0 } }));

  const resetOffset = () => setS((p) => ({ ...p, offset: { x: 0, y: 0 } }));

  const onOffsetChange = useCallback((offset: Offset) => {
    setS((p) => ({ ...p, offset }));
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) load(file, "クリップボードから貼り付け");
          break;
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const dlAll = () => {
    if (!img) return;
    PRESETS.forEach((p, i) =>
      setTimeout(() => {
        const { w: dw, h: dh } = calcSize(p);
        const c = document.createElement("canvas");
        draw(c, img, s, p.w, p.h, dw, dh);
        const a = document.createElement("a");
        a.href = c.toDataURL("image/png");
        a.download = `${p.name.replace(/[\s/]+/g, "_")}_${p.w}x${p.h}.png`;
        a.click();
      }, i * 220)
    );
  };

  const hasOffset = (s.offset?.x || 0) !== 0 || (s.offset?.y || 0) !== 0;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: C.mint,
        fontFamily: "-apple-system,'Helvetica Neue',sans-serif",
        overflow: "hidden",
        color: C.text,
      }}
    >
      {/* LEFT PANEL */}
      <div
        style={{
          width: 270,
          minWidth: 270,
          background: C.white,
          borderRight: `1px solid ${C.powder}`,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ background: C.navy, padding: "20px 20px 18px" }}>
          <div
            style={{
              color: C.white,
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "-0.5px",
            }}
          >
            SNSリサイザー
          </div>
          <div
            style={{
              color: C.powder,
              fontSize: 9,
              marginTop: 5,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
            }}
          >
            6 Presets · PNG Export
          </div>
        </div>

        {/* Upload */}
        <div
          style={{
            padding: "16px 18px",
            borderBottom: `1px solid ${C.mint}`,
          }}
        >
          <Lbl>元画像</Lbl>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setFileDrag(true);
            }}
            onDragLeave={() => setFileDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setFileDrag(false);
              load(e.dataTransfer.files[0]);
            }}
            onClick={() => fref.current?.click()}
            style={{
              border: `1.5px dashed ${fileDrag ? C.steel : C.powder}`,
              borderRadius: 10,
              padding: "16px 10px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              background: fileDrag ? C.mint : "transparent",
            }}
          >
            {img ? (
              <>
                <div style={{ fontSize: 18, color: C.steel, marginBottom: 4 }}>
                  ✓
                </div>
                <div
                  style={{
                    color: C.textS,
                    fontSize: 10,
                    wordBreak: "break-all",
                    lineHeight: 1.5,
                  }}
                >
                  {fname}
                </div>
                <div style={{ color: C.textM, fontSize: 9, marginTop: 4 }}>
                  タップで変更
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: 22,
                    color: C.powder,
                    marginBottom: 6,
                  }}
                >
                  ↑
                </div>
                <div style={{ color: C.textS, fontSize: 11 }}>
                  ドロップ or タップ
                </div>
                <div style={{ color: C.textM, fontSize: 9, marginTop: 4 }}>
                  JPG · PNG · WebP
                </div>
                <div
                  style={{
                    marginTop: 8,
                    display: "inline-block",
                    background: C.mint,
                    border: `1px solid ${C.powder}`,
                    borderRadius: 5,
                    padding: "2px 7px",
                    color: C.textS,
                    fontSize: 9,
                    fontFamily: "monospace",
                  }}
                >
                  ⌘V / Ctrl+V で貼り付け
                </div>
              </>
            )}
          </div>
          <input
            ref={fref}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => load(e.target.files?.[0])}
          />
        </div>

        {/* Align */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: `1px solid ${C.mint}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Lbl>配置</Lbl>
            {hasOffset && (
              <button
                onClick={resetOffset}
                style={{
                  fontSize: 9,
                  color: C.steel,
                  background: "transparent",
                  border: `1px solid ${C.powder}`,
                  borderRadius: 4,
                  padding: "2px 7px",
                  cursor: "pointer",
                  marginTop: -10,
                  letterSpacing: "0.3px",
                }}
              >
                リセット
              </button>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 4,
              maxWidth: 114,
              margin: "0 auto",
            }}
          >
            {AGRID.flat().map((a) => (
              <button
                key={a}
                onClick={() => setAlign(a)}
                style={{
                  background: s.align === a ? C.navy : C.mint,
                  color: s.align === a ? C.white : C.textS,
                  border: `1px solid ${s.align === a ? C.navy : C.powder}`,
                  borderRadius: 6,
                  width: 34,
                  height: 34,
                  cursor: "pointer",
                  fontSize: s.align === a ? 14 : 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.12s",
                  fontWeight: s.align === a ? 700 : 400,
                }}
              >
                {AICON[a]}
              </button>
            ))}
          </div>
          {hasOffset && (
            <div
              style={{
                textAlign: "center",
                marginTop: 8,
                fontSize: 9,
                color: C.textM,
              }}
            >
              X: {Math.round(s.offset.x)}px　Y: {Math.round(s.offset.y)}px
            </div>
          )}
        </div>

        {/* Scale */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: `1px solid ${C.mint}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Lbl>拡大率</Lbl>
            <span
              style={{
                color: C.navy,
                fontSize: 12,
                fontWeight: 800,
                fontFamily: "monospace",
                marginTop: -10,
              }}
            >
              {Math.round(s.scale * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={30}
            max={300}
            value={Math.round(s.scale * 100)}
            onChange={(e) => set("scale", Number(e.target.value) / 100)}
            style={{ width: "100%", accentColor: C.navy, cursor: "pointer" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            <span
              style={{
                color: C.textM,
                fontSize: 8,
                fontFamily: "monospace",
              }}
            >
              30%
            </span>
            <span
              style={{
                color: C.textM,
                fontSize: 8,
                fontFamily: "monospace",
              }}
            >
              300%
            </span>
          </div>
        </div>

        {/* Background */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: `1px solid ${C.mint}`,
          }}
        >
          <Lbl>背景</Lbl>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              {
                id: "white" as const,
                label: "白",
                style: {
                  backgroundColor: "#fff",
                  border: `1px solid ${C.powder}`,
                },
                fg: C.textS,
              },
              {
                id: "black" as const,
                label: "黒",
                style: {
                  backgroundColor: "#1e2d40",
                  border: "1px solid #1e2d40",
                },
                fg: "#fff",
              },
              {
                id: "transparent" as const,
                label: "透過",
                style: {
                  backgroundImage: `repeating-conic-gradient(#d4d4d4 0% 25%,#f0f0f0 0% 50%)`,
                  backgroundSize: "8px 8px",
                  border: `1px solid ${C.powder}`,
                },
                fg: C.textS,
              },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => set("bg", b.id)}
                style={{
                  flex: 1,
                  outline:
                    s.bg === b.id
                      ? `2.5px solid ${C.navy}`
                      : "2.5px solid transparent",
                  outlineOffset: 2,
                  borderRadius: 8,
                  padding: "9px 0",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  transition: "outline 0.12s",
                  ...b.style,
                  color: b.fg,
                }}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* DL All */}
        <div style={{ padding: "14px 18px" }}>
          <button
            onClick={dlAll}
            disabled={!img}
            style={{
              width: "100%",
              padding: "12px 0",
              background: img ? C.navy : C.mint,
              color: img ? C.white : C.textM,
              border: "none",
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 700,
              cursor: img ? "pointer" : "default",
              letterSpacing: "0.5px",
              boxShadow: img ? `0 4px 14px rgba(74,99,139,0.30)` : "none",
            }}
          >
            ⬇ 全6枚を一括ダウンロード
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 14,
          }}
        >
          {PRESETS.map((p) => (
            <Card
              key={p.id}
              preset={p}
              img={img}
              s={s}
              onOffsetChange={onOffsetChange}
              onCopied={showToast}
            />
          ))}
        </div>
      </div>
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
