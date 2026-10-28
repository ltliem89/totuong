/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ANIMAL_STATUES,
  PALETTE_COLORS,
  BRUSH_TOOLS,
  STUDIO_THEMES,
  INITIAL_SAVED_BRUSHES,
  DEFAULT_BRUSH_RADIUS_PX,
  AnimalId,
  BrushToolId,
  StudioThemeId,
  PaletteColor,
  StatuePartDef,
  SavedBrushPreset,
} from "./data/statuesData";
import { StatueViewport, StatueViewportHandle } from "./components/StatueViewport";
import { soundEngine } from "./audio/soundEngine";

type GameScreenState = "title" | "playing" | "paused" | "victory";

interface TeacherCoachTip {
  encouragement: string;
  spellingLesson: string;
  funPoem: string;
}

const SAVED_BRUSHES_STORAGE_KEY = "be_my_saved_brushes_v2";

const ANIMAL_ICONS: Record<AnimalId, string> = {
  duck: "🦆",
  bear: "🐻",
  rabbit: "🐰",
  cat: "🐱",
  elephant: "🐘",
};

export default function App() {
  const viewportRef = useRef<StatueViewportHandle | null>(null);

  const [gameState, setGameState] = useState<GameScreenState>("title");
  const [selectedAnimalId, setSelectedAnimalId] = useState<AnimalId>("duck");
  const [isAnimalMenuOpen, setIsAnimalMenuOpen] = useState<boolean>(false);
  const [isHelperMenuOpen, setIsHelperMenuOpen] = useState<boolean>(false);

  const [studioThemeId, setStudioThemeId] = useState<StudioThemeId>("auto");
  const [selectedColor, setSelectedColor] = useState<PaletteColor>(PALETTE_COLORS[0]);
  const [selectedTool, setSelectedTool] = useState<BrushToolId>("smooth");
  const [brushRadiusPx, setBrushRadiusPx] = useState<number>(DEFAULT_BRUSH_RADIUS_PX);

  // Collapsible states for the unified panels
  const [isRightBrushPanelCollapsed, setIsRightBrushPanelCollapsed] = useState<boolean>(false);
  const [isBottomColorBarCollapsed, setIsBottomColorBarCollapsed] = useState<boolean>(false);

  // Saved Custom Brushes Rack (Color + Width)
  const [savedBrushes, setSavedBrushes] = useState<SavedBrushPreset[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_BRUSHES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage errors
    }
    return INITIAL_SAVED_BRUSHES;
  });
  const [justSavedBrushId, setJustSavedBrushId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_BRUSHES_STORAGE_KEY, JSON.stringify(savedBrushes));
    } catch {
      // Ignore storage errors
    }
  }, [savedBrushes]);

  // Track painted parts for the current statue: Map of partId -> hexColor
  const [paintedParts, setPaintedParts] = useState<Record<string, string>>({});
  const [highlightedPartId, setHighlightedPartId] = useState<string | null>(null);

  // Audio & Music states (Biểu tượng Loa Mở/Tắt Tiếng & Nhạc)
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [isGeneratingLyria, setIsGeneratingLyria] = useState<boolean>(false);

  // Compact Hint Popover
  const [coachTip, setCoachTip] = useState<TeacherCoachTip | null>(null);
  const [isLoadingCoach, setIsLoadingCoach] = useState<boolean>(false);

  const currentAnimal =
    ANIMAL_STATUES.find((a) => a.id === selectedAnimalId) || ANIMAL_STATUES[0];
  const currentStudioTheme =
    STUDIO_THEMES.find((t) => t.id === studioThemeId) || STUDIO_THEMES[0];
  const totalPartsCount = currentAnimal.parts.length;
  const paintedPartsCount = Object.keys(paintedParts).length;

  // Toggle Mute / Unmute (Biểu tượng Loa Xanh / Loa Đỏ Tắt Tiếng)
  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
    if (nextMuted) {
      setIsMusicPlaying(false);
    } else {
      soundEngine.playColorPick(4);
    }
  }, [isMuted]);

  // Save a brush configuration (Color + Width + Tool) into the Unified Right Brush Panel
  const saveBrushToRack = useCallback(
    (color: PaletteColor, radius: number, toolId: BrushToolId) => {
      const effectiveToolId: BrushToolId =
        toolId === "eraser" || toolId === "erase_part" || toolId === "fill"
          ? "smooth"
          : toolId;
      const shortColorName = color.nameVi.replace("Màu ", "");

      setSavedBrushes((prev) => {
        const existing = prev.find(
          (b) =>
            b.colorId === color.id &&
            b.radiusPx === radius &&
            b.toolId === effectiveToolId
        );
        if (existing) {
          setJustSavedBrushId(existing.id);
          window.setTimeout(() => setJustSavedBrushId(null), 700);
          return prev;
        }

        const newBrush: SavedBrushPreset = {
          id: `brush-${color.id}-${radius}-${effectiveToolId}-${Date.now()}`,
          colorId: color.id,
          colorHex: color.hex,
          colorNameVi: shortColorName,
          toolId: effectiveToolId,
          toolShortVi: "Nét Cao",
          radiusPx: radius,
        };

        setJustSavedBrushId(newBrush.id);
        window.setTimeout(() => setJustSavedBrushId(null), 700);

        return [newBrush, ...prev].slice(0, 8);
      });

      soundEngine.playColorPick(Math.min(11, Math.floor(radius / 5)));
    },
    []
  );

  // Activate a Saved Brush when clicked
  const handleSelectSavedBrush = useCallback((preset: SavedBrushPreset) => {
    const foundColor =
      PALETTE_COLORS.find((c) => c.id === preset.colorId) ||
      PALETTE_COLORS.find(
        (c) => c.hex.toLowerCase() === preset.colorHex.toLowerCase()
      ) ||
      PALETTE_COLORS[0];

    setSelectedColor(foundColor);
    setBrushRadiusPx(preset.radiusPx);
    setSelectedTool(preset.toolId);
    soundEngine.playColorPick(Math.min(11, Math.floor(preset.radiusPx / 4)));
  }, []);

  // Delete a saved brush on right-click
  const handleDeleteSavedBrush = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setSavedBrushes((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((b) => b.id !== id);
    });
  }, []);

  // Jump back to Default Brush (14px)
  const handleResetToDefaultBrush = useCallback(() => {
    setBrushRadiusPx(DEFAULT_BRUSH_RADIUS_PX);
    if (selectedTool === "eraser" || selectedTool === "erase_part") {
      setSelectedTool("smooth");
    }
    saveBrushToRack(selectedColor, DEFAULT_BRUSH_RADIUS_PX, "smooth");
  }, [saveBrushToRack, selectedColor, selectedTool]);

  // Switch Animal Statue from Dropdown
  const handleSelectAnimal = useCallback((id: AnimalId, announce = true) => {
    const animal = ANIMAL_STATUES.find((a) => a.id === id);
    if (!animal) return;
    setSelectedAnimalId(id);
    setIsAnimalMenuOpen(false);
    setPaintedParts({});
    setHighlightedPartId(null);
    setCoachTip(null);

    if (announce) {
      soundEngine.playAnimalSound(id);
      soundEngine.speakVi(`Tượng ${animal.nameVi}.`, animal.nameEn);
    }
  }, []);

  // Cycle Smart Eye-Care Dark Studio Theme
  const handleCycleStudioTheme = useCallback(() => {
    const idx = STUDIO_THEMES.findIndex((t) => t.id === studioThemeId);
    const nextTheme = STUDIO_THEMES[(idx + 1) % STUDIO_THEMES.length];
    setStudioThemeId(nextTheme.id);
    soundEngine.playColorPick(idx + 2);
  }, [studioThemeId]);

  // Start Game from Title Screen
  const handleStartGame = useCallback(() => {
    setGameState("playing");
    if (!isMuted && !soundEngine.getMusicPlaying()) {
      soundEngine.startMusic();
      setIsMusicPlaying(true);
    }
    soundEngine.playAnimalSound(selectedAnimalId);
    soundEngine.speakVi(
      `Chào bé Mỹ! Mình cùng tô tượng ${currentAnimal.nameVi} nhé!`,
      currentAnimal.nameEn
    );
  }, [currentAnimal, isMuted, selectedAnimalId]);

  // Trigger Hint & Vocabulary Suggestion
  const handleTriggerHint = useCallback(async () => {
    const unpainted = currentAnimal.parts.filter((p) => !paintedParts[p.id]);
    const targetPart: StatuePartDef =
      unpainted.length > 0
        ? unpainted[0]
        : currentAnimal.parts[Math.floor(Math.random() * currentAnimal.parts.length)];

    setHighlightedPartId(targetPart.id);

    const matchingColor = PALETTE_COLORS.find(
      (c) => c.hex.toLowerCase() === targetPart.suggestedColorHex.toLowerCase()
    );
    if (matchingColor) {
      setSelectedColor(matchingColor);
    }
    if (selectedTool === "eraser" || selectedTool === "erase_part") {
      setSelectedTool("smooth");
    }

    const instantTip: TeacherCoachTip = {
      encouragement: `Gợi ý: Tô ${targetPart.suggestedColorNameVi} cho ${targetPart.nameVi}!`,
      spellingLesson: `${targetPart.spellingVi} → ${targetPart.nameVi} (${targetPart.nameEn})`,
      funPoem: currentAnimal.poemVi.join("\n"),
    };
    setCoachTip(instantTip);

    soundEngine.playColorPick(3);
    soundEngine.speakVi(
      `Bé hãy tô ${targetPart.suggestedColorNameVi} cho ${targetPart.nameVi} nhé!`,
      targetPart.nameEn
    );

    const progressPercent = Math.round(
      (Object.keys(paintedParts).length / Math.max(1, currentAnimal.parts.length)) * 100
    );

    setIsLoadingCoach(true);
    try {
      const response = await fetch("/api/coach/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalNameVi: currentAnimal.nameVi,
          animalNameEn: currentAnimal.nameEn,
          partNameVi: targetPart.nameVi,
          partNameEn: targetPart.nameEn,
          suggestedColorVi: targetPart.suggestedColorNameVi,
          progressPercent,
        }),
      });
      const json = await response.json();
      if (json.ok && json.data) {
        setCoachTip({
          encouragement: json.data.encouragement,
          spellingLesson: json.data.spellingLesson,
          funPoem: json.data.funPoem,
        });
      }
    } catch {
      // Keep local tip
    } finally {
      setIsLoadingCoach(false);
    }
  }, [currentAnimal, paintedParts, selectedTool]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameState === "title") {
        if (e.code === "Enter" || e.code === "Space") {
          e.preventDefault();
          handleStartGame();
        } else if (e.code === "KeyM") {
          e.preventDefault();
          handleToggleMute();
        }
        return;
      }

      if (e.code === "Escape") {
        e.preventDefault();
        setIsAnimalMenuOpen(false);
        setIsHelperMenuOpen(false);
        setGameState((prev) => (prev === "paused" ? "playing" : "paused"));
      } else if (e.code === "KeyH") {
        e.preventDefault();
        const nextCollapsed = !(isRightBrushPanelCollapsed && isBottomColorBarCollapsed);
        setIsRightBrushPanelCollapsed(nextCollapsed);
        setIsBottomColorBarCollapsed(nextCollapsed);
      } else if (e.code === "KeyM") {
        e.preventDefault();
        handleToggleMute();
      } else if (e.code === "Space" && gameState === "playing") {
        e.preventDefault();
        handleTriggerHint();
      } else if (e.code === "ArrowLeft" && gameState === "playing") {
        viewportRef.current?.rotateTurntableBy(-Math.PI / 5);
      } else if (e.code === "ArrowRight" && gameState === "playing") {
        viewportRef.current?.rotateTurntableBy(Math.PI / 5);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    gameState,
    handleStartGame,
    handleToggleMute,
    handleTriggerHint,
    isRightBrushPanelCollapsed,
    isBottomColorBarCollapsed,
  ]);

  // Handle when Bé Mỹ paints a part on the 3D statue
  const handlePartPainted = useCallback(
    (partId: string, colorHex: string) => {
      const partDef = currentAnimal.parts.find((p) => p.id === partId);
      const colorDef = PALETTE_COLORS.find(
        (c) => c.hex.toLowerCase() === colorHex.toLowerCase()
      );

      if (highlightedPartId === partId) {
        setHighlightedPartId(null);
      }

      setPaintedParts((prev) => {
        const isNewPart = !prev[partId];
        const next = { ...prev, [partId]: colorHex };

        if (isNewPart && partDef) {
          const colorText = colorDef ? colorDef.nameVi : "màu đẹp";
          soundEngine.speakVi(`${partDef.nameVi}, ${colorText}.`, partDef.nameEn);

          if (Object.keys(next).length === currentAnimal.parts.length) {
            window.setTimeout(() => {
              soundEngine.playVictoryFanfare();
              viewportRef.current?.triggerCelebrationSpin();
              setGameState("victory");
              soundEngine.speakVi(
                `Hoan hô bé Mỹ! Bé đã tô xong tượng ${currentAnimal.nameVi}!`,
                currentAnimal.nameEn
              );
            }, 650);
          }
        }
        return next;
      });
    },
    [currentAnimal, highlightedPartId]
  );

  // Handle when Bé Mỹ erases a part back to white plaster
  const handlePartErased = useCallback((partId: string) => {
    setPaintedParts((prev) => {
      const next = { ...prev };
      delete next[partId];
      return next;
    });
  }, []);

  // Select Color from Bottom Bar (Side-by-side with Width Slider & Save)
  const handlePickColor = (color: PaletteColor, index: number) => {
    setSelectedColor(color);
    const nextTool =
      selectedTool === "eraser" || selectedTool === "erase_part"
        ? "smooth"
        : selectedTool;
    if (selectedTool === "eraser" || selectedTool === "erase_part") {
      setSelectedTool("smooth");
    }

    soundEngine.playColorPick(index);
    soundEngine.speakVi(color.nameVi, color.nameEn);
    saveBrushToRack(color, brushRadiusPx, nextTool);
  };

  // Select Brush Tool from Right Unified Brush Panel
  const handlePickTool = (toolId: BrushToolId) => {
    setSelectedTool(toolId);
    soundEngine.playColorPick(5);
  };

  // Generate custom children's music track via Lyria 3
  const handleGenerateLyriaMusic = async () => {
    if (isGeneratingLyria) return;
    setIsGeneratingLyria(true);

    try {
      const response = await fetch("/api/music/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalNameEn: currentAnimal.nameEn,
          animalNameVi: currentAnimal.nameVi,
          mood: "joyful kindergarten xylophone sing-along",
        }),
      });
      const data = await response.json();
      if (data.ok && data.audioBase64) {
        const binary = atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: data.mimeType || "audio/wav" });
        const audioUrl = URL.createObjectURL(blob);
        if (isMuted) {
          setIsMuted(false);
          soundEngine.setMuted(false);
        }
        soundEngine.playCustomLyriaAudio(audioUrl);
        setIsMusicPlaying(true);
      } else {
        if (isMuted) {
          setIsMuted(false);
          soundEngine.setMuted(false);
        }
        soundEngine.startMusic();
        setIsMusicPlaying(true);
      }
    } catch {
      if (isMuted) {
        setIsMuted(false);
        soundEngine.setMuted(false);
      }
      soundEngine.startMusic();
      setIsMusicPlaying(true);
    } finally {
      setIsGeneratingLyria(false);
    }
  };

  const TOOL_COMPACT_LABELS: Record<BrushToolId, string> = {
    smooth: "Nét Cao",
    fill: "Tô Vùng",
    crayon: "Sáp",
    spray: "Xịt",
    star: "Sao",
    eraser: "Tẩy Nét",
    erase_part: "Xóa Vùng",
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0F172A] text-slate-100 select-none">
      {/* 1. Full-Bleed 3D WebGL Viewport (100vw x 100vh) */}
      <StatueViewport
        ref={viewportRef}
        animalId={selectedAnimalId}
        studioThemeId={studioThemeId}
        selectedColorHex={selectedColor.hex}
        selectedTool={selectedTool}
        brushRadiusPx={brushRadiusPx}
        highlightedPartId={highlightedPartId}
        isTitleScreen={gameState === "title"}
        onPartPainted={handlePartPainted}
        onPartErased={handlePartErased}
        onPartHovered={() => {}}
      />

      {/* 2. TITLE SCREEN OVERLAY */}
      {gameState === "title" && (
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 md:p-10">
          <div className="flex items-center justify-between gap-4 pointer-events-auto flex-wrap">
            <div className="bg-[#151E2E]/95 border border-slate-700/80 rounded-xl px-3.5 py-2 shadow-md flex items-center gap-2.5">
              <svg
                className="w-5 h-5 text-amber-400 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <span className="text-xs sm:text-sm font-semibold text-slate-100">
                Xưởng Tô Tượng 3D · Học Từ Vựng Lớp 1
              </span>
            </div>

            <button
              onClick={handleToggleMute}
              title={isMuted ? "Mở tiếng" : "Tắt tiếng"}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
                isMuted
                  ? "bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-300"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
              }`}
            >
              {isMuted ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>
          </div>

          <div className="max-w-lg bg-[#151E2E]/95 border border-slate-700/80 rounded-2xl p-5 md:p-6 shadow-xl pointer-events-auto">
            <svg
              viewBox="0 0 500 90"
              className="w-full h-auto mb-2"
              role="img"
              aria-label="Bé Mỹ Tô Tượng 3D"
            >
              <defs>
                <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="50%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>
              </defs>
              <circle cx="42" cy="45" r="32" fill="#1E293B" stroke="#FBBF24" strokeWidth="3" />
              <path
                d="M30 57 C30 43, 44 29, 56 23 C60 35, 46 49, 30 57 Z"
                fill="#FF5964"
              />
              <circle cx="28" cy="59" r="5.5" fill="#FFD93D" />
              <circle cx="54" cy="55" r="4.5" fill="#4ECDC4" />
              <text
                x="90"
                y="44"
                fill="url(#titleGrad)"
                fontFamily="Outfit, Plus Jakarta Sans, sans-serif"
                fontWeight="700"
                fontSize="36"
              >
                BÉ MỸ TÔ TƯỢNG 3D
              </text>
              <text
                x="92"
                y="72"
                fill="#CBD5E1"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="600"
                fontSize="17"
              >
                Tô Màu Thạch Cao · Học Từ Vựng Lên Lớp 1
              </text>
            </svg>

            <div className="flex flex-wrap items-center gap-2.5 mt-3">
              <button
                onClick={handleStartGame}
                className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Bắt Đầu Vẽ Ngay</span>
              </button>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-700/80 text-xs font-medium text-slate-400">
              Chuột Trái: Tô màu · Giữ Chuột Phải: Xoay 3D · Phím H: Ẩn/Hiện công cụ
            </div>
          </div>
        </div>
      )}

      {/* 3. STREAMLINED PLAYING WORKSPACE */}
      {gameState !== "title" && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* A. TOP BAR: Left Animal Dropdown Icon + Right Pure Icon Controls */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-2 pointer-events-none">
            {/* TOP-LEFT: Single Animal Icon Button that opens Dropdown List */}
            <div className="relative pointer-events-auto">
              <button
                onClick={() => {
                  setIsAnimalMenuOpen((prev) => !prev);
                  setIsHelperMenuOpen(false);
                }}
                title="Chọn tượng con vật"
                className="flex items-center gap-2 bg-[#151E2E]/95 hover:bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-lg cursor-pointer transition-colors"
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  {ANIMAL_ICONS[selectedAnimalId]}
                </span>
                <span className="text-xs font-bold text-white whitespace-nowrap">
                  {currentAnimal.nameVi}
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-slate-900 text-[10px] font-mono font-bold text-emerald-400 tabular-nums">
                  {paintedPartsCount}/{totalPartsCount}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-slate-300 transition-transform ${
                    isAnimalMenuOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Dropdown List of Animals when clicked */}
              {isAnimalMenuOpen && (
                <div className="absolute left-0 mt-1.5 w-44 bg-[#151E2E]/98 border border-slate-700 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 z-30">
                  {ANIMAL_STATUES.map((animal) => {
                    const isActive = animal.id === selectedAnimalId;
                    return (
                      <button
                        key={animal.id}
                        onClick={() => handleSelectAnimal(animal.id, true)}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                          isActive
                            ? "bg-emerald-500 text-slate-950 shadow-xs"
                            : "text-slate-200 hover:bg-slate-800"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">{ANIMAL_ICONS[animal.id]}</span>
                          <span>{animal.nameVi}</span>
                        </span>
                        {isActive && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* TOP-RIGHT: Pure Icon Audio Controls + Integrated Helper Menu */}
            <div className="pointer-events-auto flex items-center gap-1.5 bg-[#151E2E]/95 border border-slate-700/80 rounded-xl p-1 shadow-lg">
              {/* 1. Sound Mute / Unmute Icon Only (Red Speaker when Muted, Green Speaker when Unmuted) */}
              <button
                onClick={handleToggleMute}
                title={isMuted ? "Đang tắt tiếng (Bấm để mở tiếng)" : "Đang mở tiếng (Bấm để tắt tiếng)"}
                aria-label={isMuted ? "Mở tiếng" : "Tắt tiếng"}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isMuted
                    ? "bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-300 shadow-xs"
                    : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                }`}
              >
                {isMuted ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                )}
              </button>

              {/* 2. Background Music Icon Only (No Text) */}
              <button
                onClick={() => {
                  if (isMuted) {
                    setIsMuted(false);
                    soundEngine.setMuted(false);
                  }
                  const playing = soundEngine.toggleMusic();
                  setIsMusicPlaying(playing);
                }}
                title={isMusicPlaying && !isMuted ? "Tắt nhạc nền" : "Bật nhạc nền"}
                aria-label="Nhạc nền"
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isMusicPlaying && !isMuted
                    ? "bg-sky-500 text-slate-950 shadow-xs"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </button>

              {/* 3. AI Music Icon Only (No Text) */}
              <button
                onClick={handleGenerateLyriaMusic}
                disabled={isGeneratingLyria}
                title="Tạo nhạc thiếu nhi AI"
                aria-label="Nhạc AI"
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isGeneratingLyria
                    ? "bg-violet-500 text-white animate-pulse"
                    : "bg-violet-500/20 hover:bg-violet-500/35 text-violet-300 border border-violet-400/30"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <path d="M19 3l1 2.5L22.5 6.5 20 7.5 19 10l-1-2.5L15.5 6.5 18 5.5z" />
                </svg>
              </button>

              <div className="h-5 w-px bg-slate-700/80" />

              {/* 4. Quick Hint Button (Gợi ý) */}
              <button
                onClick={handleTriggerHint}
                title="Cô giáo gợi ý màu tô & đọc từ"
                className="px-2.5 h-8 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
                </svg>
                <span>Gợi Ý</span>
              </button>

              {/* 5. Integrated Helper Menu Button (Gom Mẫu + Mới + Nền vào 1 nút gọn) */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsHelperMenuOpen((prev) => !prev);
                    setIsAnimalMenuOpen(false);
                  }}
                  title="Tùy chọn: Xem Mẫu, Làm Mới Tượng, Đổi Nền, Tạm Dừng"
                  className={`px-2.5 h-8 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                    isHelperMenuOpen
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>Tùy Chọn</span>
                </button>

                {isHelperMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-48 bg-[#151E2E]/98 border border-slate-700 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 z-30">
                    <button
                      onClick={() => {
                        viewportRef.current?.autoPaintSample();
                        setIsHelperMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold text-emerald-300 hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                    >
                      <span>🎨 Tô Mẫu Gợi Ý</span>
                    </button>

                    <button
                      onClick={() => {
                        viewportRef.current?.resetStatueToWhite();
                        setPaintedParts({});
                        setHighlightedPartId(null);
                        soundEngine.playColorPick(0);
                        setIsHelperMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                    >
                      <span>🔄 Tượng Trắng Mới</span>
                    </button>

                    <button
                      onClick={() => {
                        handleCycleStudioTheme();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold text-indigo-300 hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                    >
                      <span>🌙 {currentStudioTheme.labelVi}</span>
                      <span className="text-[10px] text-slate-400">Đổi</span>
                    </button>

                    <div className="h-px bg-slate-700/80 my-0.5" />

                    <button
                      onClick={() => {
                        setIsHelperMenuOpen(false);
                        setGameState("paused");
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                    >
                      <span>⏸ Tạm Dừng / Xem Thơ</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COMPACT HINT POPOVER (Only visible when user clicks Gợi Ý) */}
          {coachTip && (
            <div className="pointer-events-auto absolute top-14 right-3 z-20 max-w-xs bg-[#151E2E]/95 border border-amber-400/50 rounded-xl p-3 shadow-xl">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-amber-300">
                  {isLoadingCoach ? "Đang tạo gợi ý..." : coachTip.encouragement}
                </span>
                <button
                  onClick={() => {
                    setCoachTip(null);
                    setHighlightedPartId(null);
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-white px-1 rounded cursor-pointer"
                >
                  ×
                </button>
              </div>
              <div className="text-xs font-mono font-bold text-emerald-300 mb-1">
                {coachTip.spellingLesson}
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-line italic">
                {coachTip.funPoem}
              </p>
            </div>
          )}

          {/* B. UNIFIED RIGHT PANEL: KIỂU BÚT / TẨY XÓA + BÚT ĐÃ LƯU NẰM CHUNG MỘT BẢNG */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <button
              onClick={() => setIsRightBrushPanelCollapsed((prev) => !prev)}
              title={isRightBrushPanelCollapsed ? "Mở bảng bút & kiểu bút (H)" : "Thu gọn bảng bút (H)"}
              className="pointer-events-auto w-5 h-12 rounded-l-xl bg-[#151E2E]/95 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center shadow-md cursor-pointer text-xs font-bold"
            >
              {isRightBrushPanelCollapsed ? "◂" : "▸"}
            </button>

            {!isRightBrushPanelCollapsed && (
              <div className="pointer-events-auto bg-[#151E2E]/95 border border-slate-700/80 rounded-2xl p-2 shadow-2xl flex flex-col gap-2 max-h-[76vh] overflow-y-auto w-[92px]">
                {/* SECTION 1: KIỂU BÚT & TẨY XÓA (Nét Cao, Tô Vùng, Sáp, Xịt, Sao, Tẩy, Xóa) */}
                <div className="flex flex-col gap-1 pb-2 border-b border-slate-700/80">
                  <span className="text-[9px] font-mono font-bold text-sky-300 uppercase text-center tracking-tight">
                    Kiểu Bút
                  </span>
                  {BRUSH_TOOLS.map((tool) => {
                    const isActive = selectedTool === tool.id;
                    const isEraser = Boolean(tool.isEraser);
                    return (
                      <button
                        key={tool.id}
                        onClick={() => handlePickTool(tool.id)}
                        title={tool.descVi}
                        className={`w-full px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? isEraser
                              ? "bg-rose-500 text-white ring-2 ring-white shadow-sm"
                              : "bg-slate-900 text-white ring-2 ring-white shadow-sm"
                            : isEraser
                              ? "bg-rose-500/15 text-rose-200 border border-rose-400/30 hover:bg-rose-500/25"
                              : "bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white"
                        }`}
                        style={
                          isActive && !isEraser
                            ? {
                                background: `linear-gradient(135deg, ${selectedColor.hex}55 0%, #0f172a 95%)`,
                              }
                            : undefined
                        }
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-sm border border-white/80 shrink-0"
                          style={{
                            backgroundColor: isEraser ? "#F43F5E" : selectedColor.hex,
                          }}
                        />
                        <span className="truncate">{TOOL_COMPACT_LABELS[tool.id]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* SECTION 2: BÚT ĐÃ LƯU (Nằm chung bảng, hiển thị rõ Màu + Độ rộng px) */}
                <div
                  className="flex flex-col items-center gap-1.5"
                  title="Các bút đã lưu (Chuột trái để chọn, chuột phải để xóa)"
                >
                  <span className="text-[9px] font-mono font-bold text-amber-300 uppercase text-center tracking-tight">
                    Bút Lưu
                  </span>
                  {savedBrushes.map((preset) => {
                    const isCurrent =
                      selectedColor.id === preset.colorId &&
                      brushRadiusPx === preset.radiusPx &&
                      selectedTool === preset.toolId &&
                      selectedTool !== "eraser" &&
                      selectedTool !== "erase_part";
                    const isPop = justSavedBrushId === preset.id;
                    const strokeBarHeight = Math.max(
                      3,
                      Math.min(15, Math.round(preset.radiusPx * 0.32))
                    );

                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectSavedBrush(preset)}
                        onContextMenu={(e) => handleDeleteSavedBrush(e, preset.id)}
                        title={`Cỡ ${preset.radiusPx}px (Chuột phải để xóa)`}
                        className={`relative w-full h-8 rounded-xl flex items-center justify-between px-2 transition-all cursor-pointer shrink-0 ${
                          isCurrent
                            ? "ring-2 ring-white shadow-md -translate-x-0.5 scale-105 z-10"
                            : "hover:scale-103 border border-white/25 opacity-95 hover:opacity-100"
                        } ${isPop ? "ring-2 ring-amber-300 scale-110" : ""}`}
                        style={{
                          background: `linear-gradient(135deg, ${preset.colorHex} 0%, ${preset.colorHex}dd 65%, #0f172a 100%)`,
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]"
                            viewBox="0 0 24 24"
                            fill={preset.colorHex}
                            stroke="#FFFFFF"
                            strokeWidth="2.2"
                          >
                            <path d="M12 19l7-7 3 3-7 7-3-3z" />
                            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                          </svg>
                          <span
                            className="w-3 rounded-full border border-white shadow-xs shrink-0"
                            style={{
                              height: `${strokeBarHeight}px`,
                              backgroundColor: preset.colorHex,
                            }}
                          />
                        </div>

                        <span className="px-1 py-0.5 rounded bg-slate-950/90 border border-white/30 text-[10px] font-mono font-extrabold text-white leading-none tabular-nums">
                          {preset.radiusPx}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* C. UNIFIED SINGLE-ROW BOTTOM BAR: BẢNG MÀU + CHỖ CHỈNH PX & LƯU BÚT NẰM CÙNG MỘT HÀNG */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none max-w-[98vw]">
            {/* Mini Collapse / Rotate Handle */}
            <div className="pointer-events-auto flex items-center gap-1.5 mb-1">
              <button
                onClick={() => viewportRef.current?.rotateTurntableBy(-Math.PI / 4)}
                title="Xoay trái"
                className="px-2 py-0.5 rounded-full bg-[#151E2E]/95 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
              >
                ⟲
              </button>
              <button
                onClick={() => setIsBottomColorBarCollapsed((prev) => !prev)}
                className="px-2.5 py-0.5 rounded-full bg-[#151E2E]/95 border border-slate-700/80 text-slate-300 hover:text-white text-[11px] font-bold cursor-pointer"
              >
                {isBottomColorBarCollapsed ? "▴ Hiện Bảng Màu & Cỡ Bút" : "▾"}
              </button>
              <button
                onClick={() => viewportRef.current?.rotateTurntableBy(Math.PI / 4)}
                title="Xoay phải"
                className="px-2 py-0.5 rounded-full bg-[#151E2E]/95 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
              >
                ⟳
              </button>
            </div>

            {!isBottomColorBarCollapsed && (
              <div className="pointer-events-auto flex items-center gap-2.5 bg-[#151E2E]/95 border border-slate-700/80 rounded-2xl px-3 py-1.5 shadow-2xl overflow-x-auto max-w-[96vw]">
                {/* PART 1: COREL-STYLE PURE COLOR SWATCHES (12 Ô Màu, không chữ) */}
                <div className="flex items-center gap-1 shrink-0">
                  {PALETTE_COLORS.map((color, idx) => {
                    const isSelected =
                      selectedColor.id === color.id &&
                      selectedTool !== "eraser" &&
                      selectedTool !== "erase_part";
                    return (
                      <button
                        key={color.id}
                        onClick={() => handlePickColor(color, idx)}
                        title={color.nameVi}
                        aria-label={color.nameVi}
                        className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-transform cursor-pointer shrink-0 ${
                          isSelected
                            ? "ring-2 ring-white scale-110 z-10 shadow-md"
                            : "hover:scale-105 border border-white/25 opacity-95 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-extrabold text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-slate-700 shrink-0" />

                {/* PART 2: CHỖ CHỈNH ĐỘ RỘNG PX & LƯU BÚT (Nằm ngay cùng hàng với Bảng Màu!) */}
                <div className="flex items-center gap-2 bg-slate-900/95 border border-slate-700/80 rounded-xl px-2.5 py-1 shrink-0">
                  {/* Live Color + Width Preview Badge */}
                  <div
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-white/40 shadow-inner shrink-0"
                    style={{
                      backgroundColor:
                        selectedTool === "eraser" || selectedTool === "erase_part"
                          ? "#F43F5E"
                          : selectedColor.hex,
                    }}
                    title={`Độ rộng bút: ${brushRadiusPx}px`}
                  >
                    <div className="w-4 h-4 rounded-full bg-slate-950/85 border border-white/50 flex items-center justify-center">
                      <span
                        className="rounded-full block"
                        style={{
                          width: `${Math.max(2, Math.min(14, Math.round(brushRadiusPx * 0.28)))}px`,
                          height: `${Math.max(2, Math.min(14, Math.round(brushRadiusPx * 0.28)))}px`,
                          backgroundColor:
                            selectedTool === "eraser" || selectedTool === "erase_part"
                              ? "#F43F5E"
                              : selectedColor.hex,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono font-extrabold text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)] tabular-nums">
                      {brushRadiusPx}px
                    </span>
                  </div>

                  {/* Width Range Slider (1px - 60px) */}
                  <input
                    type="range"
                    min={1}
                    max={60}
                    step={1}
                    value={brushRadiusPx}
                    onChange={(e) => setBrushRadiusPx(Number(e.target.value))}
                    onPointerUp={() =>
                      saveBrushToRack(selectedColor, brushRadiusPx, selectedTool)
                    }
                    onKeyUp={() =>
                      saveBrushToRack(selectedColor, brushRadiusPx, selectedTool)
                    }
                    aria-label="Thanh kéo độ rộng bút"
                    title="Kéo chỉnh cỡ bút (1px–60px), thả tay tự lưu vào bảng Bút Lưu"
                    className="w-24 sm:w-28 accent-emerald-400 cursor-pointer"
                  />

                  <button
                    onClick={() =>
                      saveBrushToRack(selectedColor, brushRadiusPx, selectedTool)
                    }
                    title="Lưu bút với màu và cỡ px này"
                    className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    +Lưu
                  </button>

                  <button
                    onClick={handleResetToDefaultBrush}
                    title={`Về cỡ mặc định (${DEFAULT_BRUSH_RADIUS_PX}px)`}
                    className={`px-2 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                      brushRadiusPx === DEFAULT_BRUSH_RADIUS_PX
                        ? "bg-sky-500 text-slate-950"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    {DEFAULT_BRUSH_RADIUS_PX}px
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. PAUSE / VICTORY MODAL */}
      {(gameState === "paused" || gameState === "victory") && (
        <div className="absolute inset-0 z-30 bg-slate-950/75 flex items-center justify-center p-4">
          <div className="bg-[#151E2E] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              {gameState === "victory"
                ? `Hoan Hô Bé Mỹ Giỏi Quá!`
                : "Đang Tạm Dừng"}
            </h2>
            <p className="text-sm text-slate-300 mb-4">
              {gameState === "victory"
                ? `Bé Mỹ đã tô kín ${totalPartsCount}/${totalPartsCount} bộ phận của tượng ${currentAnimal.nameVi} (${currentAnimal.nameEn})!`
                : `Đang tô tượng ${currentAnimal.nameVi} (${paintedPartsCount}/${totalPartsCount} bộ phận).`}
            </p>

            <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-4 mb-5 text-left">
              <div className="text-xs font-mono font-bold text-emerald-400 mb-1">
                {currentAnimal.spellingVi} · {currentAnimal.nameEn}
              </div>
              <p className="text-sm font-medium text-slate-200 whitespace-pre-line">
                {currentAnimal.poemVi.join("\n")}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setGameState("playing")}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm cursor-pointer whitespace-nowrap shrink-0"
              >
                Tiếp Tục Vẽ
              </button>

              <button
                onClick={() => {
                  const currentIndex = ANIMAL_STATUES.findIndex(
                    (a) => a.id === selectedAnimalId
                  );
                  const nextAnimal =
                    ANIMAL_STATUES[(currentIndex + 1) % ANIMAL_STATUES.length];
                  handleSelectAnimal(nextAnimal.id, true);
                  setGameState("playing");
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm cursor-pointer whitespace-nowrap shrink-0"
              >
                Con Vật Tiếp Theo
              </button>

              <button
                onClick={() => setGameState("title")}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm cursor-pointer whitespace-nowrap shrink-0"
              >
                Màn Hình Chính
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
