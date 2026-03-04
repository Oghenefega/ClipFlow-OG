import React, { useState, useEffect, useRef } from "react";
import T from "../styles/theme";

// ============ SUBCOMPONENTS ============
const PulseDot = ({ color = T.green, size = 8 }) => (
  <span style={{ position: "relative", display: "inline-block", width: size, height: size }}>
    <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color }} />
  </span>
);

const GamePill = ({ tag, color, size = "md" }) => {
  const s = size === "sm" ? { px: 6, py: 2, fs: 9 } : { px: 10, py: 4, fs: 11 };
  return (
    <span
      style={{
        display: "inline-flex",
        padding: `${s.py}px ${s.px}px`,
        background: `${color}18`,
        border: `1px solid ${color}44`,
        borderRadius: 6,
        fontSize: s.fs,
        fontWeight: 700,
        color,
        fontFamily: T.mono,
        letterSpacing: "1px",
      }}
    >
      {tag}
    </span>
  );
};

const Card = ({ children, style: x, onClick, borderColor }) => (
  <div
    onClick={onClick}
    style={{
      background: T.surface,
      borderRadius: T.radius.lg,
      border: `1px solid ${borderColor || T.border}`,
      cursor: onClick ? "pointer" : "default",
      ...x,
    }}
  >
    {children}
  </div>
);

const MiniSpinbox = ({ value, onChange, min = 1, max = 999, label }) => {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(String(value));
  const timerRef = useRef(null);
  const intRef = useRef(null);
  const valRef = useRef(value);

  useEffect(() => {
    valRef.current = value;
    setEditVal(String(value));
  }, [value]);

  const startHold = (d) => {
    const step = () => {
      valRef.current = Math.max(min, Math.min(max, valRef.current + d));
      onChange(valRef.current);
    };
    step();
    timerRef.current = setTimeout(() => {
      intRef.current = setInterval(step, 80);
    }, 350);
  };

  const stopHold = () => {
    clearTimeout(timerRef.current);
    clearInterval(intRef.current);
  };

  const commitEdit = () => {
    const n = parseInt(editVal);
    if (!isNaN(n) && n >= min && n <= max) onChange(n);
    setEditing(false);
  };

  const btnStyle = {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: `1px solid ${T.border}`,
    background: "rgba(255,255,255,0.03)",
    color: T.textSecondary,
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: T.font,
    userSelect: "none",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {label && (
        <span style={{ color: T.textTertiary, fontSize: 11, fontWeight: 600, marginRight: 4 }}>
          {label}
        </span>
      )}
      <button onMouseDown={() => startHold(-1)} onMouseUp={stopHold} onMouseLeave={stopHold} style={btnStyle}>
        −
      </button>
      {editing ? (
        <input
          value={editVal}
          onChange={(e) => setEditVal(e.target.value.replace(/\D/g, ""))}
          onBlur={commitEdit}
          onKeyDown={(e) => e.key === "Enter" && commitEdit()}
          autoFocus
          style={{
            width: 42,
            textAlign: "center",
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${T.accentBorder}`,
            borderRadius: 6,
            padding: 4,
            color: T.text,
            fontSize: 14,
            fontWeight: 700,
            fontFamily: T.mono,
            outline: "none",
          }}
        />
      ) : (
        <div
          onClick={() => {
            setEditing(true);
            setEditVal(String(value));
          }}
          style={{
            width: 36,
            textAlign: "center",
            color: T.text,
            fontSize: 14,
            fontWeight: 700,
            fontFamily: T.mono,
            cursor: "text",
            padding: "4px 0",
          }}
        >
          {value}
        </div>
      )}
      <button onMouseDown={() => startHold(1)} onMouseUp={stopHold} onMouseLeave={stopHold} style={btnStyle}>
        +
      </button>
    </div>
  );
};

// ============ RENAME VIEW ============
export default function RenameView({ gamesDb }) {
  const [watchFolder, setWatchFolder] = useState(
    "W:\\YouTube Gaming Recordings Onward\\Vertical Recordings Onwards"
  );
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [subTab, setSubTab] = useState("pending");
  const [renaming, setRenaming] = useState(false);
  const [renameDone, setRenameDone] = useState(false);

  // Try to connect to real file system via Electron bridge
  const isElectron = typeof window !== "undefined" && window.clipflow;

  useEffect(() => {
    if (isElectron) {
      // Start file watcher
      window.clipflow.startWatching(watchFolder);
      window.clipflow.onFileAdded((file) => {
        setPending((prev) => {
          // Don't add duplicates
          if (prev.find((p) => p.fileName === file.name)) return prev;
          // Auto-detect game from filename patterns or default
          const detected = detectGame(file.name, gamesDb);
          return [
            ...prev,
            {
              id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              fileName: file.name,
              filePath: file.path,
              game: detected.game,
              tag: detected.tag,
              color: detected.color,
              day: detected.day,
              part: prev.filter((p) => p.tag === detected.tag && p.day === detected.day).length + 1,
              createdAt: file.createdAt,
            },
          ];
        });
      });

      return () => {
        window.clipflow.removeFileListeners();
      };
    }
  }, [watchFolder, isElectron, gamesDb]);

  const detectGame = (fileName, games) => {
    // Default — in production, OBS log parser provides the exe
    const defaultGame = games[0] || { name: "Unknown", tag: "??", color: "#888", dayCount: 1 };
    return {
      game: defaultGame.name,
      tag: defaultGame.tag,
      color: defaultGame.color,
      day: defaultGame.dayCount + 1,
    };
  };

  const getProposed = (r) => `${r.fileName.slice(0, 10)} ${r.tag} Day${r.day} Pt${r.part}.mp4`;

  const updatePending = (id, field, value) => {
    setPending((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const u = { ...r, [field]: value };
        if (field === "game") {
          const g = gamesDb.find((x) => x.name === value);
          if (g) {
            u.tag = g.tag;
            u.color = g.color;
          }
        }
        return u;
      })
    );
  };

  const renameOne = async (id) => {
    const r = pending.find((x) => x.id === id);
    if (!r) return;

    const newName = getProposed(r);

    // Real rename via Electron
    if (isElectron && r.filePath) {
      const dir = r.filePath.substring(0, r.filePath.lastIndexOf("\\"));
      const monthFolder = r.fileName.slice(0, 7); // "2026-03"
      const targetDir = `${dir}\\${monthFolder}`;
      const newPath = `${targetDir}\\${newName}`;
      const result = await window.clipflow.renameFile(r.filePath, newPath);
      if (result.error) {
        console.error("Rename failed:", result.error);
        return;
      }
    }

    setHistory((prev) => [
      {
        id: `h-${Date.now()}`,
        oldName: r.fileName,
        newName,
        game: r.game,
        tag: r.tag,
        color: r.color,
        day: r.day,
        part: r.part,
        time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        undone: false,
      },
      ...prev,
    ]);
    setPending((prev) => prev.filter((x) => x.id !== id));
  };

  const hideOne = (id) => setPending((prev) => prev.filter((x) => x.id !== id));

  // Auto-correct duplicate names then rename all
  const renameAll = async () => {
    setRenaming(true);

    // Sort by creation time
    const sorted = [...pending].sort(
      (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );

    // Group by tag+day to detect duplicates
    const groups = {};
    sorted.forEach((r) => {
      const key = `${r.tag}-Day${r.day}`;
      if (!groups[key]) groups[key] = { minPart: r.part, items: [] };
      groups[key].items.push(r);
      if (r.part < groups[key].minPart) groups[key].minPart = r.part;
    });

    // Auto-correct: assign sequential parts within each group
    const corrected = [];
    for (const g of Object.values(groups)) {
      for (let idx = 0; idx < g.items.length; idx++) {
        const r = g.items[idx];
        const part = g.items.length > 1 ? g.minPart + idx : r.part;
        const newName = `${r.fileName.slice(0, 10)} ${r.tag} Day${r.day} Pt${part}.mp4`;

        // Real rename
        if (isElectron && r.filePath) {
          const dir = r.filePath.substring(0, r.filePath.lastIndexOf("\\"));
          const monthFolder = r.fileName.slice(0, 7);
          const targetDir = `${dir}\\${monthFolder}`;
          const newPath = `${targetDir}\\${newName}`;
          await window.clipflow.renameFile(r.filePath, newPath);
        }

        corrected.push({
          id: `h-${Date.now()}-${r.id}`,
          oldName: r.fileName,
          newName,
          game: r.game,
          tag: r.tag,
          color: r.color,
          day: r.day,
          part,
          time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          undone: false,
        });
      }
    }

    setHistory((prev) => [...corrected, ...prev]);
    setPending([]);
    setRenaming(false);
    setRenameDone(true);
    setTimeout(() => setRenameDone(false), 3000);
  };

  const toggleUndo = (h) => {
    if (!h.undone) {
      setPending((prev) => [
        ...prev,
        {
          id: `r-undo-${h.id}`,
          fileName: h.oldName,
          game: h.game,
          tag: h.tag,
          color: h.color,
          day: h.day || 1,
          part: h.part || 1,
          detectedExe: "",
        },
      ]);
    } else {
      setPending((prev) => prev.filter((r) => r.id !== `r-undo-${h.id}`));
    }
    setHistory((prev) => prev.map((x) => (x.id === h.id ? { ...x, undone: !x.undone } : x)));
  };

  const refresh = () => {
    if (isElectron) {
      // Re-trigger watcher scan
      window.clipflow.stopWatching().then(() => {
        window.clipflow.startWatching(watchFolder);
      });
    }
  };

  const tabs = [
    { id: "pending", label: "Pending", count: pending.length },
    { id: "history", label: "History", count: history.length },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: T.text, margin: 0, letterSpacing: "-0.6px" }}>
              Rename
            </h2>
            <p style={{ color: T.textSecondary, fontSize: 14, margin: "6px 0 0" }}>
              OBS recordings → structured names
            </p>
          </div>
          <button
            onClick={refresh}
            style={{
              padding: "8px 14px",
              borderRadius: T.radius.md,
              border: `1px solid ${T.border}`,
              background: "rgba(255,255,255,0.03)",
              color: T.textSecondary,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: T.font,
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Watch status */}
      <Card
        style={{
          padding: "16px 20px",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PulseDot />
          <span style={{ color: T.green, fontSize: 13, fontWeight: 600 }}>WATCHING</span>
          <span
            style={{
              color: T.textMuted,
              fontSize: 11,
              fontFamily: T.mono,
              maxWidth: 300,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {watchFolder}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <PulseDot color={T.cyan} />
          <span style={{ color: T.cyan, fontSize: 12, fontWeight: 600 }}>OBS LOG</span>
        </div>
      </Card>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {[
          { l: "Total", v: "—", c: T.text },
          { l: "Today", v: String(pending.length), c: T.green },
          { l: "Games", v: String(gamesDb.length), c: T.accent },
          { l: "Day", v: "—", c: T.yellow },
        ].map((s) => (
          <Card key={s.l} style={{ padding: 14, textAlign: "center" }}>
            <div style={{ color: s.c, fontSize: 24, fontWeight: 800, fontFamily: T.mono }}>{s.v}</div>
            <div
              style={{
                color: T.textTertiary,
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginTop: 4,
              }}
            >
              {s.l}
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.03)", borderRadius: T.radius.md, padding: 4 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: subTab === t.id ? "rgba(255,255,255,0.07)" : "transparent",
              color: subTab === t.id ? T.text : T.textTertiary,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: T.font,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {t.label}
            <span
              style={{
                background: subTab === t.id ? T.accentDim : "rgba(255,255,255,0.04)",
                color: subTab === t.id ? T.accentLight : T.textTertiary,
                padding: "2px 8px",
                borderRadius: 5,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ marginTop: 16 }}>
        {subTab === "pending" && (
          <>
            {pending.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pending.map((r) => (
                  <Card key={r.id} style={{ padding: "18px 20px" }} borderColor={`${r.color}44`}>
                    <div style={{ color: T.textTertiary, fontSize: 12, fontFamily: T.mono, marginBottom: 8 }}>
                      {r.fileName}
                    </div>
                    <div
                      style={{
                        color: T.yellow,
                        fontSize: 16,
                        fontWeight: 700,
                        fontFamily: T.mono,
                        marginBottom: 14,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ color: T.textMuted }}>→</span>
                      {getProposed(r)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <GamePill tag={r.tag} color={r.color} size="sm" />
                        <select
                          value={r.game}
                          onChange={(e) => updatePending(r.id, "game", e.target.value)}
                          style={{
                            background: T.surface,
                            border: `1px solid ${T.border}`,
                            borderRadius: T.radius.md,
                            padding: "8px 12px",
                            color: T.text,
                            fontSize: 13,
                            fontFamily: T.font,
                            outline: "none",
                            cursor: "pointer",
                            minWidth: 140,
                          }}
                        >
                          {gamesDb.map((g) => (
                            <option key={g.name} value={g.name} style={{ background: T.surface, color: T.text }}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <MiniSpinbox label="Day" value={r.day} onChange={(v) => updatePending(r.id, "day", v)} />
                      <MiniSpinbox label="Pt" value={r.part} onChange={(v) => updatePending(r.id, "part", v)} />
                      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                        <button
                          onClick={() => renameOne(r.id)}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 8,
                            border: "none",
                            background: T.greenDim,
                            color: T.green,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: T.font,
                          }}
                        >
                          RENAME
                        </button>
                        <button
                          onClick={() => hideOne(r.id)}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 8,
                            border: "none",
                            background: T.redDim,
                            color: T.red,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: T.font,
                          }}
                        >
                          HIDE
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
                <button
                  onClick={renameAll}
                  disabled={renaming}
                  style={{
                    width: "100%",
                    padding: "16px 24px",
                    borderRadius: T.radius.md,
                    border: "none",
                    background: renaming
                      ? "rgba(255,255,255,0.04)"
                      : `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`,
                    color: renaming ? T.textMuted : "#fff",
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: T.font,
                    cursor: renaming ? "default" : "pointer",
                    boxShadow: renaming ? "none" : "0 4px 24px rgba(139,92,246,0.3)",
                  }}
                >
                  {renaming ? "Renaming..." : `Rename All ${pending.length} Files`}
                </button>
              </div>
            ) : (
              <Card style={{ padding: "40px 20px", textAlign: "center" }}>
                {renameDone ? (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                    <div style={{ color: T.green, fontSize: 16, fontWeight: 700 }}>All files renamed!</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>📁</div>
                    <div style={{ color: T.textTertiary, fontSize: 14 }}>
                      No pending files — watching for new recordings...
                    </div>
                  </>
                )}
              </Card>
            )}
          </>
        )}

        {subTab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.length === 0 ? (
              <Card style={{ padding: 40, textAlign: "center" }}>
                <div style={{ color: T.textTertiary }}>No rename history yet</div>
              </Card>
            ) : (
              history.map((h) => (
                <Card key={h.id} style={{ padding: "14px 18px", opacity: h.undone ? 0.45 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <GamePill tag={h.tag} color={h.color} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          color: T.textTertiary,
                          fontSize: 12,
                          fontFamily: T.mono,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h.oldName}
                      </div>
                      <div
                        style={{
                          color: h.undone ? T.red : T.green,
                          fontSize: 14,
                          fontWeight: 600,
                          fontFamily: T.mono,
                          marginTop: 2,
                          textDecoration: h.undone ? "line-through" : "none",
                        }}
                      >
                        {h.newName}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleUndo(h)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: `1px solid ${h.undone ? T.greenBorder : T.yellowBorder}`,
                        background: h.undone ? T.greenDim : T.yellowDim,
                        color: h.undone ? T.green : T.yellow,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: T.font,
                      }}
                    >
                      {h.undone ? "REDO" : "UNDO"}
                    </button>
                    <span style={{ color: T.textMuted, fontSize: 11, fontFamily: T.mono, flexShrink: 0 }}>
                      {h.time}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Info banner */}
      <div
        style={{
          marginTop: 16,
          background: T.yellowDim,
          border: `1px solid ${T.yellowBorder}`,
          borderRadius: T.radius.md,
          padding: "14px 18px",
        }}
      >
        <p style={{ color: T.yellow, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
          ⚠️ Files are never auto-renamed. Review game, day & part, then hit Rename.
        </p>
      </div>
    </div>
  );
}
