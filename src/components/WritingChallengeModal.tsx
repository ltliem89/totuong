import React, { useState, useRef, useEffect, useCallback } from "react";
import { PALETTE_COLORS, PaletteColor } from "../data/statuesData";
import { soundEngine } from "../audio/soundEngine";

export type ChallengeCategory = "animals" | "letters" | "numbers";

export interface WritingChallengeItem {
  id: string;
  category: ChallengeCategory;
  charDisplay: string;
  titleVi: string;
  wordExampleVi: string;
  spellingVi: string;
  wordEn: string;
  emoji: string;
  hintStrokeVi: string;
  suggestedColorHex: string;
}

export const WRITING_CHALLENGES: WritingChallengeItem[] = [
  // 1. Chữ Cái Theo Con Vật & Bé Mỹ
  {
    id: "animal-v",
    category: "animals",
    charDisplay: "V",
    titleVi: "Chữ V (Vờ)",
    wordExampleVi: "Con Vịt",
    spellingVi: "Vờ - i - t - vịt - nặng - vịt",
    wordEn: "Duck",
    emoji: "🦆",
    hintStrokeVi: "Kéo nét xiên trái từ trên xuống giữa, rồi hất nét xiên phải lên cao",
    suggestedColorHex: "#FFD93D",
  },
  {
    id: "animal-g",
    category: "animals",
    charDisplay: "G",
    titleVi: "Chữ G (Gờ)",
    wordExampleVi: "Con Gấu",
    spellingVi: "Gờ - âu - gâu - sắc - gấu",
    wordEn: "Bear",
    emoji: "🐻",
    hintStrokeVi: "Viết nét cong tròn hở phải, rồi kéo nét ngang ngắn vào giữa",
    suggestedColorHex: "#FF924C",
  },
  {
    id: "animal-t",
    category: "animals",
    charDisplay: "T",
    titleVi: "Chữ T (Tờ)",
    wordExampleVi: "Con Thỏ",
    spellingVi: "Thờ - o - tho - hỏi - thỏ",
    wordEn: "Rabbit",
    emoji: "🐰",
    hintStrokeVi: "Viết nét ngang trên đầu, rồi kéo một nét thẳng đứng từ giữa xuống",
    suggestedColorHex: "#FF70A6",
  },
  {
    id: "animal-m",
    category: "animals",
    charDisplay: "M",
    titleVi: "Chữ M (Mờ)",
    wordExampleVi: "Con Mèo & Bé Mỹ",
    spellingVi: "Mờ - eo - meo - huyền - mèo",
    wordEn: "Cat",
    emoji: "🐱",
    hintStrokeVi: "Kéo nét thẳng lên, xiên xuống giữa, xiên lên đỉnh rồi kéo thẳng xuống",
    suggestedColorHex: "#4ECDC4",
  },
  {
    id: "animal-b",
    category: "animals",
    charDisplay: "B",
    titleVi: "Chữ B (Bờ)",
    wordExampleVi: "Bé Mỹ Chăm Ngoan",
    spellingVi: "Bờ - e - be - sắc - bé",
    wordEn: "Baby",
    emoji: "🌟",
    hintStrokeVi: "Kéo nét thẳng đứng bên trái, rồi vẽ hai bụng cong tròn bên phải",
    suggestedColorHex: "#FF5964",
  },
  {
    id: "animal-c",
    category: "animals",
    charDisplay: "C",
    titleVi: "Chữ C (Cờ)",
    wordExampleVi: "Con Cá Vàng",
    spellingVi: "Cờ - a - ca - sắc - cá",
    wordEn: "Fish",
    emoji: "🐠",
    hintStrokeVi: "Đặt bút từ trên phải, uốn một nét cong tròn mềm mại sang trái",
    suggestedColorHex: "#4D96FF",
  },

  // 2. Bảng Chữ Cái Lớp 1
  {
    id: "letter-a",
    category: "letters",
    charDisplay: "A",
    titleVi: "Chữ A",
    wordExampleVi: "Quả Cam · Ánh Sao",
    spellingVi: "A - bờ - cờ",
    wordEn: "Apple",
    emoji: "🍎",
    hintStrokeVi: "Kéo hai nét xiên từ đỉnh xuống hai bên, rồi gạch nét ngang ở giữa",
    suggestedColorHex: "#FF5964",
  },
  {
    id: "letter-d",
    category: "letters",
    charDisplay: "D",
    titleVi: "Chữ D (Dờ)",
    wordExampleVi: "Quả Dưa Hấu",
    spellingVi: "Dờ - ưa - dưa",
    wordEn: "Watermelon",
    emoji: "🍉",
    hintStrokeVi: "Kéo nét thẳng đứng bên trái, rồi nối nét cong lớn bên phải",
    suggestedColorHex: "#6BCB77",
  },
  {
    id: "letter-e",
    category: "letters",
    charDisplay: "E",
    titleVi: "Chữ E",
    wordExampleVi: "Em Bé Ngoan",
    spellingVi: "E - mờ - em",
    wordEn: "Elephant",
    emoji: "🐘",
    hintStrokeVi: "Kéo nét thẳng đứng bên trái, rồi vẽ 3 nét ngang trên - giữa - dưới",
    suggestedColorHex: "#A685E2",
  },
  {
    id: "letter-h",
    category: "letters",
    charDisplay: "H",
    titleVi: "Chữ H (Hờ)",
    wordExampleVi: "Bông Hoa Hồng",
    spellingVi: "Hờ - oa - hoa",
    wordEn: "Flower",
    emoji: "🌸",
    hintStrokeVi: "Kéo hai nét thẳng đứng song song, rồi nối nét ngang ở giữa",
    suggestedColorHex: "#FF70A6",
  },
  {
    id: "letter-l",
    category: "letters",
    charDisplay: "L",
    titleVi: "Chữ L (Lờ)",
    wordExampleVi: "Chiếc Lá Xanh",
    spellingVi: "Lờ - a - la - sắc - lá",
    wordEn: "Leaf",
    emoji: "🍃",
    hintStrokeVi: "Kéo một nét thẳng từ trên xuống, rồi gạch ngang sang phải ở chân",
    suggestedColorHex: "#A3E635",
  },
  {
    id: "letter-n",
    category: "letters",
    charDisplay: "N",
    titleVi: "Chữ N (Nờ)",
    wordExampleVi: "Ông Mặt Trời Nắng",
    spellingVi: "Nờ - ăng - năng - sắc - nắng",
    wordEn: "Sun",
    emoji: "☀️",
    hintStrokeVi: "Kéo nét thẳng bên trái, nét xiên chéo xuống phải, rồi kéo thẳng lên",
    suggestedColorHex: "#FFD93D",
  },
  {
    id: "letter-o",
    category: "letters",
    charDisplay: "O",
    titleVi: "Chữ O",
    wordExampleVi: "Con Ong Chăm Chỉ",
    spellingVi: "O - ngờ - ong",
    wordEn: "Bee",
    emoji: "🐝",
    hintStrokeVi: "Đặt bút ở đỉnh trên, xoay một vòng tròn khép kín thật tròn trịa",
    suggestedColorHex: "#FF924C",
  },
  {
    id: "letter-s",
    category: "letters",
    charDisplay: "S",
    titleVi: "Chữ S (Sờ)",
    wordExampleVi: "Ngôi Sao Sáng",
    spellingVi: "Sờ - ao - sao",
    wordEn: "Star",
    emoji: "⭐",
    hintStrokeVi: "Uốn nét cong trái ở trên nối liền nét cong phải ở dưới như dòng sông",
    suggestedColorHex: "#FDE047",
  },

  // 3. Chữ Số Đếm (0 - 10)
  {
    id: "num-1",
    category: "numbers",
    charDisplay: "1",
    titleVi: "Số 1 (Một)",
    wordExampleVi: "1 Chú Vịt Vàng",
    spellingVi: "Mờ - ôt - môt - nặng - một",
    wordEn: "One",
    emoji: "1️⃣",
    hintStrokeVi: "Hất nhẹ nét xiên ngắn ở đầu, rồi kéo thẳng đứng từ trên xuống dưới",
    suggestedColorHex: "#FFD93D",
  },
  {
    id: "num-2",
    category: "numbers",
    charDisplay: "2",
    titleVi: "Số 2 (Hai)",
    wordExampleVi: "2 Đôi Tai Thỏ",
    spellingVi: "Hờ - ai - hai",
    wordEn: "Two",
    emoji: "2️⃣",
    hintStrokeVi: "Vẽ nét cong trên như cổ vịt, kéo xiên xuống trái rồi gạch ngang chân",
    suggestedColorHex: "#FF5964",
  },
  {
    id: "num-3",
    category: "numbers",
    charDisplay: "3",
    titleVi: "Số 3 (Ba)",
    wordExampleVi: "3 Chú Mèo Con",
    spellingVi: "Bờ - a - ba",
    wordEn: "Three",
    emoji: "3️⃣",
    hintStrokeVi: "Vẽ hai nét cong tròn bên phải nối liền nhau ở giữa",
    suggestedColorHex: "#4ECDC4",
  },
  {
    id: "num-4",
    category: "numbers",
    charDisplay: "4",
    titleVi: "Số 4 (Bốn)",
    wordExampleVi: "4 Chân Chú Voi",
    spellingVi: "Bờ - ôn - bôn - sắc - bốn",
    wordEn: "Four",
    emoji: "4️⃣",
    hintStrokeVi: "Kéo nét xiên xuống trái, gạch ngang sang phải, rồi kéo nét thẳng cắt qua",
    suggestedColorHex: "#6BCB77",
  },
  {
    id: "num-5",
    category: "numbers",
    charDisplay: "5",
    titleVi: "Số 5 (Năm)",
    wordExampleVi: "5 Cánh Sao Vàng",
    spellingVi: "Nờ - ăm - năm",
    wordEn: "Five",
    emoji: "5️⃣",
    hintStrokeVi: "Gạch ngang trên, kéo thẳng xuống một đoạn rồi vẽ bụng tròn ở dưới",
    suggestedColorHex: "#FF924C",
  },
  {
    id: "num-6",
    category: "numbers",
    charDisplay: "6",
    titleVi: "Số 6 (Sáu)",
    wordExampleVi: "6 Bông Hoa Đẹp",
    spellingVi: "Sờ - au - sau - sắc - sáu",
    wordEn: "Six",
    emoji: "6️⃣",
    hintStrokeVi: "Đặt bút từ trên uốn cong xuống dưới rồi cuộn tròn ở bụng dưới",
    suggestedColorHex: "#FF70A6",
  },
  {
    id: "num-7",
    category: "numbers",
    charDisplay: "7",
    titleVi: "Số 7 (Bảy)",
    wordExampleVi: "7 Sắc Cầu Vồng",
    spellingVi: "Bờ - ay - bay - hỏi - bảy",
    wordEn: "Seven",
    emoji: "🌈",
    hintStrokeVi: "Kéo nét ngang trên đầu, rồi kéo nét xiên dài từ phải sang trái xuống chân",
    suggestedColorHex: "#4D96FF",
  },
  {
    id: "num-8",
    category: "numbers",
    charDisplay: "8",
    titleVi: "Số 8 (Tám)",
    wordExampleVi: "8 Chú Gấu Nhỏ",
    spellingVi: "Tờ - am - tam - sắc - tám",
    wordEn: "Eight",
    emoji: "8️⃣",
    hintStrokeVi: "Vẽ hai vòng tròn xếp chồng lên nhau như hình người tuyết",
    suggestedColorHex: "#A685E2",
  },
  {
    id: "num-9",
    category: "numbers",
    charDisplay: "9",
    titleVi: "Số 9 (Chín)",
    wordExampleVi: "9 Quả Táo Đỏ",
    spellingVi: "Chờ - in - chin - sắc - chín",
    wordEn: "Nine",
    emoji: "9️⃣",
    hintStrokeVi: "Vẽ vòng tròn ở đầu trên, rồi kéo nét móc thẳng xuống dưới bên phải",
    suggestedColorHex: "#A3E635",
  },
  {
    id: "num-10",
    category: "numbers",
    charDisplay: "10",
    titleVi: "Số 10 (Mười)",
    wordExampleVi: "Điểm 10 Hoa Đỏ",
    spellingVi: "Mờ - ươi - mươi - huyền - mười",
    wordEn: "Ten",
    emoji: "🔟",
    hintStrokeVi: "Viết số 1 thẳng đứng bên trái, rồi vẽ số 0 tròn trịa bên phải",
    suggestedColorHex: "#FFD93D",
  },
];

const STARS_STORAGE_KEY = "be_my_writing_challenge_stars_v1";
const CANVAS_SIZE = 360;

interface WritingChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedColor: PaletteColor;
  onSelectColor: (color: PaletteColor, idx: number) => void;
}

export const WritingChallengeModal: React.FC<WritingChallengeModalProps> = ({
  isOpen,
  onClose,
  selectedColor,
  onSelectColor,
}) => {
  const [activeCategory, setActiveCategory] = useState<ChallengeCategory>("animals");
  const [currentChallenge, setCurrentChallenge] = useState<WritingChallengeItem>(
    WRITING_CHALLENGES[0]
  );
  const [showGuideOutline, setShowGuideOutline] = useState<boolean>(true);
  const [strokeWidth, setStrokeWidth] = useState<number>(24);
  const [coveragePercent, setCoveragePercent] = useState<number>(0);
  const [hasCompletedCurrent, setHasCompletedCurrent] = useState<boolean>(false);

  // Persisted stars per challenge id (0..3)
  const [earnedStars, setEarnedStars] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(STARS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore storage errors
    }
    return {};
  });

  const guideCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Save stars to browser localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STARS_STORAGE_KEY, JSON.stringify(earnedStars));
    } catch {
      // Ignore storage errors
    }
  }, [earnedStars]);

  // Draw the elementary notebook grid + dotted guide character + hidden evaluation mask
  const renderGuideAndMask = useCallback(
    (item: WritingChallengeItem, showGuide: boolean) => {
      const guideCanvas = guideCanvasRef.current;
      const drawCanvas = drawCanvasRef.current;
      if (!guideCanvas || !drawCanvas) return;

      if (!maskCanvasRef.current) {
        maskCanvasRef.current = document.createElement("canvas");
        maskCanvasRef.current.width = CANVAS_SIZE;
        maskCanvasRef.current.height = CANVAS_SIZE;
      }
      const maskCanvas = maskCanvasRef.current;

      const gCtx = guideCanvas.getContext("2d")!;
      const dCtx = drawCanvas.getContext("2d")!;
      const mCtx = maskCanvas.getContext("2d")!;

      // Clear all
      gCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      dCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      mCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // 1. Eye-care dark elementary school grid (Ô ly tiểu học nền tối dịu mắt)
      gCtx.fillStyle = "#0F172A";
      gCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const step = 36; // 10x10 grid cells
      for (let i = 0; i <= CANVAS_SIZE; i += step) {
        const isMajor = i % (step * 2) === 0;
        gCtx.strokeStyle = isMajor
          ? "rgba(56, 189, 248, 0.24)"
          : "rgba(148, 163, 184, 0.11)";
        gCtx.lineWidth = isMajor ? 1.4 : 0.8;

        gCtx.beginPath();
        gCtx.moveTo(i, 0);
        gCtx.lineTo(i, CANVAS_SIZE);
        gCtx.stroke();

        gCtx.beginPath();
        gCtx.moveTo(0, i);
        gCtx.lineTo(CANVAS_SIZE, i);
        gCtx.stroke();
      }

      // Font settings for character
      const isTwoChars = item.charDisplay.length > 1;
      const fontSize = isTwoChars ? 215 : 255;
      const fontSpec = `800 ${fontSize}px "Outfit", "Plus Jakarta Sans", sans-serif`;

      // 2. Render solid silhouette onto hidden maskCanvas for accuracy scoring
      mCtx.fillStyle = "#FFFFFF";
      mCtx.font = fontSpec;
      mCtx.textAlign = "center";
      mCtx.textBaseline = "middle";
      mCtx.fillText(item.charDisplay, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 8);

      // 3. Render dotted guide character onto guideCanvas if enabled
      if (showGuide) {
        gCtx.save();
        gCtx.font = fontSpec;
        gCtx.textAlign = "center";
        gCtx.textBaseline = "middle";

        // Soft inner track fill
        gCtx.fillStyle = "rgba(255, 255, 255, 0.08)";
        gCtx.fillText(item.charDisplay, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 8);

        // Dashed outline guide
        gCtx.setLineDash([10, 8]);
        gCtx.lineWidth = 4;
        gCtx.strokeStyle = "rgba(251, 191, 36, 0.72)";
        gCtx.strokeText(item.charDisplay, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 8);
        gCtx.restore();
      }
    },
    []
  );

  // Initialize or reset when challenge changes
  useEffect(() => {
    if (!isOpen) return;
    setCoveragePercent(0);
    setHasCompletedCurrent(false);
    renderGuideAndMask(currentChallenge, showGuideOutline);
  }, [isOpen, currentChallenge, showGuideOutline, renderGuideAndMask]);

  // Speak the current challenge letter/number & example word
  const handleSpeakCurrent = useCallback(
    (item: WritingChallengeItem) => {
      soundEngine.playColorPick(5);
      soundEngine.speakVi(
        `${item.titleVi}. ${item.wordExampleVi}. ${item.hintStrokeVi}.`,
        item.wordEn
      );
    },
    []
  );

  // Switch challenge item
  const handleSelectChallenge = (item: WritingChallengeItem) => {
    setCurrentChallenge(item);
    setCoveragePercent(0);
    setHasCompletedCurrent(false);
    handleSpeakCurrent(item);
  };

  // Clear current writing strokes
  const handleClearWriting = () => {
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const dCtx = drawCanvas.getContext("2d")!;
    dCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    setCoveragePercent(0);
    setHasCompletedCurrent(false);
    soundEngine.playBrushStroke("erase_part");
  };

  // Evaluate how much of the character mask Bé Mỹ has traced
  const evaluateCoverage = useCallback(() => {
    const drawCanvas = drawCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!drawCanvas || !maskCanvas) return;

    const dCtx = drawCanvas.getContext("2d")!;
    const mCtx = maskCanvas.getContext("2d")!;

    const drawData = dCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
    const maskData = mCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;

    let maskPixels = 0;
    let coveredMaskPixels = 0;
    let outsidePixels = 0;

    // Sample every 4th pixel for instant zero-lag scoring on mobile/tablet
    for (let i = 3; i < maskData.length; i += 16) {
      const inMask = maskData[i] > 90;
      const isDrawn = drawData[i] > 60;
      if (inMask) {
        maskPixels++;
        if (isDrawn) coveredMaskPixels++;
      } else if (isDrawn) {
        outsidePixels++;
      }
    }

    if (maskPixels === 0) return;

    const rawCoverage = (coveredMaskPixels / maskPixels) * 100;
    // Slight penalty only if drawing wildly outside the whole board
    const penalty = Math.max(0, (outsidePixels / maskPixels - 0.65) * 25);
    const score = Math.min(100, Math.max(0, Math.round(rawCoverage - penalty)));

    setCoveragePercent(score);

    // Trigger completion & 3 stars when coverage reaches >= 68%
    if (score >= 68 && !hasCompletedCurrent) {
      setHasCompletedCurrent(true);
      const stars = score >= 82 ? 3 : 2;
      setEarnedStars((prev) => ({
        ...prev,
        [currentChallenge.id]: Math.max(prev[currentChallenge.id] || 0, stars),
      }));
      soundEngine.playVictoryFanfare();
      soundEngine.speakVi(
        `Giỏi quá bé Mỹ ơi! Bé đã viết xong ${currentChallenge.titleVi}, ${currentChallenge.wordExampleVi}!`,
        currentChallenge.wordEn
      );
    }
  }, [currentChallenge, hasCompletedCurrent]);

  // Pointer drawing handlers on the writing canvas
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_SIZE,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_SIZE,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const pt = getCanvasPoint(e);
    lastPointRef.current = pt;

    const ctx = canvas.getContext("2d")!;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = selectedColor.hex;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, strokeWidth / 2, 0, Math.PI * 2);
    ctx.fill();

    soundEngine.playBrushStroke("smooth");
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    const pt = getCanvasPoint(e);
    const last = lastPointRef.current || pt;

    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = selectedColor.hex;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();

    lastPointRef.current = pt;
    soundEngine.playBrushStroke("smooth");
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    evaluateCoverage();
  };

  // Move to next challenge in the current category
  const handleNextChallenge = () => {
    const list = WRITING_CHALLENGES.filter((c) => c.category === activeCategory);
    const idx = list.findIndex((c) => c.id === currentChallenge.id);
    const nextItem = list[(idx + 1) % list.length];
    handleSelectChallenge(nextItem);
  };

  if (!isOpen) return null;

  const filteredChallenges = WRITING_CHALLENGES.filter(
    (c) => c.category === activeCategory
  );
  const totalStarsCount = (Object.values(earnedStars) as number[]).reduce(
    (acc, val) => acc + val,
    0
  );

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/85 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#151E2E] border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[94dvh] flex flex-col p-3 sm:p-4 shadow-2xl overflow-hidden">
        {/* 1. HEADER: Title + Total Stars + Category Tabs + Close */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-700/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl">✍️</span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                Thử Thách Tập Viết Chữ Cái & Số Lớp 1
              </h2>
              <p className="text-[11px] text-slate-400">
                Bé dùng ngón tay, bút cảm ứng hoặc chuột tô theo nét chữ trên vở ô ly
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 font-mono font-bold text-xs flex items-center gap-1">
              <span>⭐ {totalStarsCount} Sao</span>
            </div>
            <button
              onClick={onClose}
              title="Đóng bảng tập viết"
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 2. CATEGORY TABS + HORIZONTAL CHALLENGE SELECTOR */}
        <div className="py-2 flex flex-col gap-2 border-b border-slate-800 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                setActiveCategory("animals");
                const first = WRITING_CHALLENGES.find((c) => c.category === "animals")!;
                handleSelectChallenge(first);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                activeCategory === "animals"
                  ? "bg-emerald-500 text-slate-950 shadow-xs"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              🦆 Chữ Theo Con Vật
            </button>

            <button
              onClick={() => {
                setActiveCategory("letters");
                const first = WRITING_CHALLENGES.find((c) => c.category === "letters")!;
                handleSelectChallenge(first);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                activeCategory === "letters"
                  ? "bg-sky-400 text-slate-950 shadow-xs"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              🔤 Bảng Chữ Cái A–Z
            </button>

            <button
              onClick={() => {
                setActiveCategory("numbers");
                const first = WRITING_CHALLENGES.find((c) => c.category === "numbers")!;
                handleSelectChallenge(first);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                activeCategory === "numbers"
                  ? "bg-amber-400 text-slate-950 shadow-xs"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              🔢 Chữ Số Đếm 1–10
            </button>
          </div>

          {/* Character Buttons Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {filteredChallenges.map((item) => {
              const isSelected = item.id === currentChallenge.id;
              const stars = earnedStars[item.id] || 0;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectChallenge(item)}
                  className={`relative px-2.5 py-1.5 rounded-xl font-mono font-extrabold text-sm flex items-center gap-1 shrink-0 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-white text-slate-950 ring-2 ring-amber-400 scale-105 shadow-md"
                      : stars > 0
                        ? "bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/30"
                        : "bg-slate-800/90 text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  <span>{item.charDisplay}</span>
                  {stars > 0 && <span className="text-[10px]">⭐</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. MAIN WORKSPACE: Left Interactive Ô Ly Canvas + Right Word & Controls */}
        <div className="flex-1 min-h-0 overflow-y-auto py-2.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* LEFT: Interactive Elementary Grid Writing Canvas */}
          <div className="md:col-span-6 flex flex-col items-center">
            <div className="relative w-[250px] h-[250px] sm:w-[290px] sm:h-[290px] rounded-2xl overflow-hidden border-2 border-sky-400/50 shadow-xl bg-[#0F172A] touch-none">
              <canvas
                ref={guideCanvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
              <canvas
                ref={drawCanvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
              />

              {/* Progress Pill on Canvas Top-Right */}
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-[11px] font-mono font-bold text-emerald-300 pointer-events-none">
                Độ phủ nét: {coveragePercent}%
              </div>

              {/* Celebration Banner when >= 68% */}
              {hasCompletedCurrent && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg whitespace-nowrap pointer-events-none">
                  ⭐⭐⭐ Giỏi quá! Đã hoàn thành chữ {currentChallenge.charDisplay}!
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Vocabulary Lesson Card, Color Picker, & Action Buttons */}
          <div className="md:col-span-6 flex flex-col gap-2.5">
            {/* Word & Pronunciation Card */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl leading-none">{currentChallenge.emoji}</span>
                  <div>
                    <div className="text-base sm:text-lg font-extrabold text-white">
                      {currentChallenge.titleVi} · {currentChallenge.wordExampleVi}
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      {currentChallenge.spellingVi} ({currentChallenge.wordEn})
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSpeakCurrent(currentChallenge)}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer shrink-0 flex items-center gap-1 shadow-xs"
                >
                  <span>🔊 Nghe Đọc</span>
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-300 bg-slate-950/70 rounded-xl px-2.5 py-1.5 border border-slate-800">
                💡 <strong>Hướng dẫn nét viết:</strong> {currentChallenge.hintStrokeVi}
              </p>
            </div>

            {/* Color & Brush Size Selector for Writing */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2.5 flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-slate-300">
                  Màu mực tập viết:
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-slate-400">
                    Nét bút: {strokeWidth}px
                  </span>
                  <input
                    type="range"
                    min={12}
                    max={38}
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-20 accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {PALETTE_COLORS.map((c, idx) => {
                  const isActive = c.id === selectedColor.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => onSelectColor(c, idx)}
                      title={c.nameVi}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg cursor-pointer transition-transform ${
                        isActive
                          ? "ring-2 ring-white scale-110 z-10"
                          : "opacity-90 hover:opacity-100 border border-white/20"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Action Buttons: Clear, Toggle Guide, Next Challenge */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleClearWriting}
                className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/40 text-rose-200 font-bold text-xs cursor-pointer"
              >
                🧹 Xóa Viết Lại
              </button>

              <button
                onClick={() => setShowGuideOutline((prev) => !prev)}
                className={`px-3 py-2 rounded-xl font-bold text-xs cursor-pointer border ${
                  showGuideOutline
                    ? "bg-slate-800 border-slate-700 text-amber-300"
                    : "bg-indigo-500 border-indigo-400 text-white"
                }`}
              >
                {showGuideOutline ? "👁️ Đang Hiện Nét Mẫu" : "✍️ Chế Độ Tự Viết"}
              </button>

              <button
                onClick={handleNextChallenge}
                className="flex-1 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer text-center shadow-md"
              >
                Chữ / Số Tiếp Theo ➔
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
