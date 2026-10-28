export interface PaletteColor {
  id: string;
  hex: string;
  nameVi: string;
  spellingVi: string;
  nameEn: string;
  exampleVi: string;
}

export type BrushToolId =
  | "smooth"
  | "fill"
  | "crayon"
  | "spray"
  | "star"
  | "eraser"
  | "erase_part";

export interface BrushTool {
  id: BrushToolId;
  nameVi: string;
  shortVi: string;
  descVi: string;
  speechVi: string;
  isEraser?: boolean;
}

export interface StatuePartDef {
  id: string;
  nameVi: string;
  spellingVi: string;
  nameEn: string;
  sentenceVi: string;
  suggestedColorHex: string;
  suggestedColorNameVi: string;
}

export type AnimalId = "duck" | "bear" | "rabbit" | "cat" | "elephant";

export type StudioThemeId = "auto" | "midnight" | "forest" | "plum" | "warm_slate";

export interface StudioThemePalette {
  id: StudioThemeId;
  labelVi: string;
  descVi: string;
  skyHex: string;
  floorHex: string;
  rimHex: string;
  uiBgHex: string;
}

export const STUDIO_THEMES: StudioThemePalette[] = [
  {
    id: "auto",
    labelVi: "Nền: Tự Động",
    descVi: "Tự động phối màu nền tối dịu mắt theo từng con vật và màu cọ của bé",
    skyHex: "#111827",
    floorHex: "#182235",
    rimHex: "#38BDF8",
    uiBgHex: "#151E2E",
  },
  {
    id: "midnight",
    labelVi: "Nền: Xanh Đêm",
    descVi: "Tông xanh biển đêm dịu nhẹ giúp mắt bé thư giãn",
    skyHex: "#0F172A",
    floorHex: "#16223B",
    rimHex: "#38BDF8",
    uiBgHex: "#141D30",
  },
  {
    id: "forest",
    labelVi: "Nền: Rừng Đêm",
    descVi: "Tông xanh rêu trầm ấm áp như khu vườn đom đóm",
    skyHex: "#101A17",
    floorHex: "#172621",
    rimHex: "#34D399",
    uiBgHex: "#14201C",
  },
  {
    id: "plum",
    labelVi: "Nền: Tím Ánh Sao",
    descVi: "Tông tím nhung trầm mộng mơ làm nổi bật màu tươi sáng",
    skyHex: "#171324",
    floorHex: "#221C35",
    rimHex: "#C084FC",
    uiBgHex: "#1C172B",
  },
  {
    id: "warm_slate",
    labelVi: "Nền: Xám Nhung",
    descVi: "Tông xám than ấm chuẩn phòng vẽ nghệ thuật chống mỏi mắt",
    skyHex: "#16161A",
    floorHex: "#212128",
    rimHex: "#FBBF24",
    uiBgHex: "#1B1B22",
  },
];

export const ANIMAL_DARK_HARMONIES: Record<
  AnimalId,
  { skyHex: string; floorHex: string; rimHex: string }
> = {
  duck: {
    skyHex: "#101929", // Deep lake twilight navy (makes yellow/orange duck pop!)
    floorHex: "#17253B",
    rimHex: "#38BDF8",
  },
  bear: {
    skyHex: "#121A18", // Cozy forest night green-slate (harmonizes with warm brown/honey bear)
    floorHex: "#192622",
    rimHex: "#FBBF24",
  },
  rabbit: {
    skyHex: "#161426", // Soft velvet night plum (makes white/pink bunny & orange carrot glow)
    floorHex: "#211E36",
    rimHex: "#F472B6",
  },
  cat: {
    skyHex: "#111827", // Deep midnight indigo (complements cream/orange kitten & mint collar)
    floorHex: "#1A2438",
    rimHex: "#2DD4BF",
  },
  elephant: {
    skyHex: "#141824", // Warm dusk slate (contrasts gently with sky-blue elephant & gold crown)
    floorHex: "#1D2436",
    rimHex: "#60A5FA",
  },
};

export interface AnimalStatueDef {
  id: AnimalId;
  nameVi: string;
  spellingVi: string;
  syllablesVi: string[];
  nameEn: string;
  soundTextVi: string;
  poemVi: string[];
  sentenceVi: string;
  accentColor: string;
  parts: StatuePartDef[];
}

export const PALETTE_COLORS: PaletteColor[] = [
  {
    id: "sunny_yellow",
    hex: "#FFD93D",
    nameVi: "Màu Vàng Tươi",
    spellingVi: "V - À - N - G   ->   VÀNG",
    nameEn: "Yellow",
    exampleVi: "Màu vàng tươi như chú vịt con và ông mặt trời",
  },
  {
    id: "tangerine_orange",
    hex: "#FF8E3C",
    nameVi: "Màu Cam",
    spellingVi: "C - A - M   ->   CAM",
    nameEn: "Orange",
    exampleVi: "Màu cam ngọt ngào như củ cà rốt và quả cam",
  },
  {
    id: "strawberry_red",
    hex: "#FF5964",
    nameVi: "Màu Đỏ Hồng",
    spellingVi: "Đ - Ỏ   ->   ĐỎ",
    nameEn: "Red",
    exampleVi: "Màu đỏ tươi như trái dâu tây chín mọng",
  },
  {
    id: "blossom_pink",
    hex: "#FF9EBB",
    nameVi: "Màu Hồng Phấn",
    spellingVi: "H - Ồ - N - G   ->   HỒNG",
    nameEn: "Pink",
    exampleVi: "Màu hồng phấn xinh xắn như đôi má bé Mỹ",
  },
  {
    id: "mint_green",
    hex: "#4ECDC4",
    nameVi: "Màu Xanh Ngọc",
    spellingVi: "X - A - N - H   N - G - Ọ - C",
    nameEn: "Mint Green",
    exampleVi: "Màu xanh ngọc mát lành như làn nước trong veo",
  },
  {
    id: "meadow_green",
    hex: "#6BCB77",
    nameVi: "Màu Xanh Lá",
    spellingVi: "X - A - N - H   L - Á",
    nameEn: "Green",
    exampleVi: "Màu xanh lá cây tươi mát trên đồng cỏ",
  },
  {
    id: "sky_blue",
    hex: "#4D96FF",
    nameVi: "Màu Xanh Dương",
    spellingVi: "X - A - N - H   D - Ư - Ơ - N - G",
    nameEn: "Blue",
    exampleVi: "Màu xanh dương dịu dàng như bầu trời mùa thu",
  },
  {
    id: "lavender_purple",
    hex: "#A685E2",
    nameVi: "Màu Tím Mộng Mơ",
    spellingVi: "T - Í - M   ->   TÍM",
    nameEn: "Purple",
    exampleVi: "Màu tím nhẹ nhàng như cánh hoa bằng lăng",
  },
  {
    id: "caramel_brown",
    hex: "#C68B59",
    nameVi: "Màu Nâu Mật Ong",
    spellingVi: "N - Â - U   ->   NÂU",
    nameEn: "Brown",
    exampleVi: "Màu nâu ấm áp như chú gấu bông đáng yêu",
  },
  {
    id: "cream_peach",
    hex: "#FFE5B4",
    nameVi: "Màu Kem Sữa",
    spellingVi: "K - E - M   ->   KEM",
    nameEn: "Cream",
    exampleVi: "Màu kem sữa mềm mịn như bụng gấu con",
  },
  {
    id: "cloud_white",
    hex: "#FAF8F5",
    nameVi: "Màu Trắng Sứ",
    spellingVi: "T - R - Ắ - N - G   ->   TRẮNG",
    nameEn: "White",
    exampleVi: "Màu trắng tinh khôi như đám mây bồng bềnh",
  },
  {
    id: "charcoal_berry",
    hex: "#353B48",
    nameVi: "Màu Đen Tuyền",
    spellingVi: "Đ - E - N   ->   ĐEN",
    nameEn: "Black",
    exampleVi: "Màu đen nhánh như đôi mắt tròn xoe long lanh",
  },
];

export interface SavedBrushPreset {
  id: string;
  colorId: string;
  colorHex: string;
  colorNameVi: string;
  toolId: BrushToolId;
  toolShortVi: string;
  radiusPx: number;
  isDefault?: boolean;
}

export const DEFAULT_BRUSH_RADIUS_PX = 14;

export const INITIAL_SAVED_BRUSHES: SavedBrushPreset[] = [
  {
    id: "preset-default-yellow-14",
    colorId: "sunny_yellow",
    colorHex: "#FFD93D",
    colorNameVi: "Vàng Tươi",
    toolId: "smooth",
    toolShortVi: "Bút Nét Cao",
    radiusPx: 14,
    isDefault: true,
  },
  {
    id: "preset-detail-black-2",
    colorId: "charcoal_berry",
    colorHex: "#353B48",
    colorNameVi: "Đen Tuyền",
    toolId: "smooth",
    toolShortVi: "Bút Tỉ Mỉ",
    radiusPx: 2,
  },
  {
    id: "preset-detail-orange-5",
    colorId: "tangerine_orange",
    colorHex: "#FF8E3C",
    colorNameVi: "Cam",
    toolId: "smooth",
    toolShortVi: "Bút Chi Tiết",
    radiusPx: 5,
  },
  {
    id: "preset-detail-pink-8",
    colorId: "blossom_pink",
    colorHex: "#FF9EBB",
    colorNameVi: "Hồng Phấn",
    toolId: "smooth",
    toolShortVi: "Bút Nét Cao",
    radiusPx: 8,
  },
  {
    id: "preset-broad-blue-26",
    colorId: "sky_blue",
    colorHex: "#4D96FF",
    colorNameVi: "Xanh Dương",
    toolId: "smooth",
    toolShortVi: "Bút Nét Cao",
    radiusPx: 26,
  },
];

export const BRUSH_TOOLS: BrushTool[] = [
  {
    id: "smooth",
    nameVi: "Bút Vẽ Độ Nét Cao (Tỉ Mỉ)",
    shortVi: "Bút Nét Cao",
    descVi: "Đầu bút sắc nét độ phân giải cao, kéo thanh trượt để vẽ chi tiết siêu nhỏ hoặc tô mảng",
    speechVi: "Bút vẽ độ nét cao, giúp bé tô các chi tiết nhỏ thật sắc nét và chính xác!",
  },
  {
    id: "fill",
    nameVi: "Cọ Tô Đầy Bộ Phận",
    shortVi: "Tô Nhanh",
    descVi: "Chạm một lần để tô kín cả bộ phận tượng",
    speechVi: "Cọ tô nhanh, bé chạm vào đâu là bộ phận đó đổi màu ngay!",
  },
  {
    id: "crayon",
    nameVi: "Bút Sáp Màu",
    shortVi: "Bút Sáp",
    descVi: "Vẽ nét sáp có vân hạt nổi sinh động",
    speechVi: "Bút sáp màu, cho nét vẽ xốp mịn như sáp dầu!",
  },
  {
    id: "spray",
    nameVi: "Bình Xịt Màu",
    shortVi: "Bình Xịt",
    descVi: "Phun sương màu chuyển sắc nhẹ nhàng",
    speechVi: "Bình xịt màu, phun những hạt màu li ti thật vui mắt!",
  },
  {
    id: "star",
    nameVi: "Bút Sao Lấp Lánh",
    shortVi: "Bút Sao",
    descVi: "Vẽ màu kèm họa tiết ngôi sao nhỏ",
    speechVi: "Bút ngôi sao lấp lánh, trang trí tượng thật lung linh!",
  },
  {
    id: "eraser",
    nameVi: "Cục Tẩy Xóa Nét",
    shortVi: "Tẩy Nét",
    descVi: "Kéo trên tượng để xóa từng nét màu đã tô về màu thạch cao trắng",
    speechVi: "Cục tẩy xóa nét, bé muốn xóa chỗ nào thì chà nhẹ lên chỗ đó nhé!",
    isEraser: true,
  },
  {
    id: "erase_part",
    nameVi: "Xóa Màu Bộ Phận",
    shortVi: "Xóa Vùng",
    descVi: "Chạm vào một bộ phận để xóa sạch màu bộ phận đó về trắng",
    speechVi: "Xóa màu bộ phận, chạm một lần để làm trắng lại bộ phận đó nhé!",
    isEraser: true,
  },
];

export const ANIMAL_STATUES: AnimalStatueDef[] = [
  {
    id: "duck",
    nameVi: "Con Vịt",
    spellingVi: "C - O - N   V - Ị - T",
    syllablesVi: ["CON", "VỊT"],
    nameEn: "Little Duck",
    soundTextVi: "Quạc quạc! Quạc quạc!",
    poemVi: [
      "Vịt con lông vàng",
      "Đi đều từng bước",
      "Thích bơi dưới nước",
      "Quạc quạc vui ghê!",
    ],
    sentenceVi: "Con vịt bơi lội tung tăng dưới hồ nước mát.",
    accentColor: "#FFD93D",
    parts: [
      {
        id: "head",
        nameVi: "Cái Đầu",
        spellingVi: "C - Á - I   Đ - Ầ - U",
        nameEn: "Head",
        sentenceVi: "Cái đầu tròn xoe của chú vịt con.",
        suggestedColorHex: "#FFD93D",
        suggestedColorNameVi: "Màu Vàng Tươi",
      },
      {
        id: "beak",
        nameVi: "Cái Mỏ",
        spellingVi: "C - Á - I   M - Ỏ",
        nameEn: "Beak",
        sentenceVi: "Cái mỏ vịt màu cam kêu quạc quạc.",
        suggestedColorHex: "#FF8E3C",
        suggestedColorNameVi: "Màu Cam",
      },
      {
        id: "cheeks",
        nameVi: "Đôi Má Hồng",
        spellingVi: "Đ - Ô - I   M - Á",
        nameEn: "Cheeks",
        sentenceVi: "Đôi má ửng hồng chúm chím đáng yêu.",
        suggestedColorHex: "#FF9EBB",
        suggestedColorNameVi: "Màu Hồng Phấn",
      },
      {
        id: "body",
        nameVi: "Thân Vịt",
        spellingVi: "T - H - Â - N   V - Ị - T",
        nameEn: "Body",
        sentenceVi: "Thân vịt bầu bĩnh nổi trên mặt nước.",
        suggestedColorHex: "#FFD93D",
        suggestedColorNameVi: "Màu Vàng Tươi",
      },
      {
        id: "belly",
        nameVi: "Cái Bụng",
        spellingVi: "C - Á - I   B - Ụ - N - G",
        nameEn: "Belly",
        sentenceVi: "Cái bụng tròn màu kem ấm áp.",
        suggestedColorHex: "#FFE5B4",
        suggestedColorNameVi: "Màu Kem Sữa",
      },
      {
        id: "wings",
        nameVi: "Đôi Cánh",
        spellingVi: "Đ - Ô - I   C - Á - N - H",
        nameEn: "Wings",
        sentenceVi: "Đôi cánh nhỏ vẫy vẫy chào bé Mỹ.",
        suggestedColorHex: "#FFD93D",
        suggestedColorNameVi: "Màu Vàng Tươi",
      },
      {
        id: "bowtie",
        nameVi: "Chiếc Nơ Xinh",
        spellingVi: "C - H - I - Ế - C   N - Ơ",
        nameEn: "Bowtie",
        sentenceVi: "Chiếc nơ đỏ thắt trước cổ thật lịch sự.",
        suggestedColorHex: "#FF5964",
        suggestedColorNameVi: "Màu Đỏ Hồng",
      },
      {
        id: "tail",
        nameVi: "Cái Đuôi",
        spellingVi: "C - Á - I   Đ - U - Ô - I",
        nameEn: "Tail",
        sentenceVi: "Cái đuôi nhỏ xinh cong cong phía sau.",
        suggestedColorHex: "#FFD93D",
        suggestedColorNameVi: "Màu Vàng Tươi",
      },
      {
        id: "feet",
        nameVi: "Đôi Chân",
        spellingVi: "Đ - Ô - I   C - H - Â - N",
        nameEn: "Webbed Feet",
        sentenceVi: "Đôi chân vịt có màng bơi rất giỏi.",
        suggestedColorHex: "#FF8E3C",
        suggestedColorNameVi: "Màu Cam",
      },
      {
        id: "eyes",
        nameVi: "Đôi Mắt",
        spellingVi: "Đ - Ô - I   M - Ắ - T",
        nameEn: "Eyes",
        sentenceVi: "Đôi mắt tròn đen láy nhìn bé Mỹ.",
        suggestedColorHex: "#353B48",
        suggestedColorNameVi: "Màu Đen Tuyền",
      },
    ],
  },
  {
    id: "bear",
    nameVi: "Con Gấu",
    spellingVi: "C - O - N   G - Ấ - U",
    syllablesVi: ["CON", "GẤU"],
    nameEn: "Teddy Bear",
    soundTextVi: "Gừm gừm! Gấu con chào bé Mỹ!",
    poemVi: [
      "Gấu con tròn trịa",
      "Thích ăn mật ong",
      "Đôi tai hồng hồng",
      "Cười tươi đón bé!",
    ],
    sentenceVi: "Chú gấu bông ôm hũ mật ong vàng óng.",
    accentColor: "#C68B59",
    parts: [
      {
        id: "head",
        nameVi: "Đầu Gấu",
        spellingVi: "Đ - Ầ - U   G - Ấ - U",
        nameEn: "Head",
        sentenceVi: "Cái đầu gấu bông tròn xoe ấm áp.",
        suggestedColorHex: "#C68B59",
        suggestedColorNameVi: "Màu Nâu Mật Ong",
      },
      {
        id: "ears_outer",
        nameVi: "Đôi Tai Tròn",
        spellingVi: "Đ - Ô - I   T - A - I",
        nameEn: "Ears",
        sentenceVi: "Đôi tai gấu tròn xinh trên đỉnh đầu.",
        suggestedColorHex: "#C68B59",
        suggestedColorNameVi: "Màu Nâu Mật Ong",
      },
      {
        id: "ears_inner",
        nameVi: "Lòng Tai",
        spellingVi: "L - Ò - N - G   T - A - I",
        nameEn: "Inner Ears",
        sentenceVi: "Lòng tai hồng phấn mềm mại.",
        suggestedColorHex: "#FF9EBB",
        suggestedColorNameVi: "Màu Hồng Phấn",
      },
      {
        id: "snout",
        nameVi: "Cái Mõm",
        spellingVi: "C - Á - I   M - Õ - M",
        nameEn: "Snout",
        sentenceVi: "Cái mõm gấu màu kem sữa.",
        suggestedColorHex: "#FFE5B4",
        suggestedColorNameVi: "Màu Kem Sữa",
      },
      {
        id: "nose",
        nameVi: "Cái Mũi",
        spellingVi: "C - Á - I   M - Ũ - I",
        nameEn: "Nose",
        sentenceVi: "Cái mũi nhỏ đánh hơi tìm mật ong.",
        suggestedColorHex: "#FF5964",
        suggestedColorNameVi: "Màu Đỏ Hồng",
      },
      {
        id: "body",
        nameVi: "Thân Gấu",
        spellingVi: "T - H - Â - N   G - Ấ - U",
        nameEn: "Body",
        sentenceVi: "Thân gấu mũm mĩm đáng yêu.",
        suggestedColorHex: "#C68B59",
        suggestedColorNameVi: "Màu Nâu Mật Ong",
      },
      {
        id: "belly",
        nameVi: "Bụng Tròn",
        spellingVi: "B - Ụ - N - G   T - R - Ò - N",
        nameEn: "Tummy",
        sentenceVi: "Cái bụng no tròn màu kem sữa.",
        suggestedColorHex: "#FFE5B4",
        suggestedColorNameVi: "Màu Kem Sữa",
      },
      {
        id: "arms",
        nameVi: "Đôi Tay",
        spellingVi: "Đ - Ô - I   T - A - Y",
        nameEn: "Arms",
        sentenceVi: "Đôi tay gấu dang rộng ôm bé Mỹ.",
        suggestedColorHex: "#C68B59",
        suggestedColorNameVi: "Màu Nâu Mật Ong",
      },
      {
        id: "legs",
        nameVi: "Đôi Chân",
        spellingVi: "Đ - Ô - I   C - H - Â - N",
        nameEn: "Legs",
        sentenceVi: "Đôi chân gấu ngồi vững chãi.",
        suggestedColorHex: "#C68B59",
        suggestedColorNameVi: "Màu Nâu Mật Ong",
      },
      {
        id: "honeypot",
        nameVi: "Hũ Mật Ong",
        spellingVi: "M - Ậ - T   O - N - G",
        nameEn: "Honey Pot",
        sentenceVi: "Hũ mật ong vàng tươi ngọt lịm.",
        suggestedColorHex: "#FFD93D",
        suggestedColorNameVi: "Màu Vàng Tươi",
      },
      {
        id: "eyes",
        nameVi: "Đôi Mắt",
        spellingVi: "Đ - Ô - I   M - Ắ - T",
        nameEn: "Eyes",
        sentenceVi: "Đôi mắt gấu hiền lành biết cười.",
        suggestedColorHex: "#353B48",
        suggestedColorNameVi: "Màu Đen Tuyền",
      },
    ],
  },
  {
    id: "rabbit",
    nameVi: "Con Thỏ",
    spellingVi: "C - O - N   T - H - Ỏ",
    syllablesVi: ["CON", "THỎ"],
    nameEn: "Cute Bunny",
    soundTextVi: "Tưng tưng! Thỏ con nhảy nhót!",
    poemVi: [
      "Thỏ con tai dài",
      "Nhảy nhót trong vườn",
      "Ăn củ cà rốt",
      "Mắt sáng dễ thương!",
    ],
    sentenceVi: "Chú thỏ con có đôi tai dài và thích ăn cà rốt.",
    accentColor: "#FF9EBB",
    parts: [
      {
        id: "head",
        nameVi: "Đầu Thỏ",
        spellingVi: "Đ - Ầ - U   T - H - Ỏ",
        nameEn: "Head",
        sentenceVi: "Cái đầu thỏ tròn xinh xắn.",
        suggestedColorHex: "#FAF8F5",
        suggestedColorNameVi: "Màu Trắng Sứ",
      },
      {
        id: "ears_outer",
        nameVi: "Đôi Tai Dài",
        spellingVi: "T - A - I   D - À - I",
        nameEn: "Long Ears",
        sentenceVi: "Đôi tai dài vểnh cao nghe tiếng chim hót.",
        suggestedColorHex: "#FAF8F5",
        suggestedColorNameVi: "Màu Trắng Sứ",
      },
      {
        id: "ears_inner",
        nameVi: "Lòng Tai Hồng",
        spellingVi: "L - Ò - N - G   T - A - I",
        nameEn: "Inner Ears",
        sentenceVi: "Bên trong tai thỏ có màu hồng phấn.",
        suggestedColorHex: "#FF9EBB",
        suggestedColorNameVi: "Màu Hồng Phấn",
      },
      {
        id: "nose",
        nameVi: "Mũi Thỏ",
        spellingVi: "M - Ũ - I   T - H - Ỏ",
        nameEn: "Pink Nose",
        sentenceVi: "Cái mũi hồng nhỏ xinh nhấp nháy.",
        suggestedColorHex: "#FF5964",
        suggestedColorNameVi: "Màu Đỏ Hồng",
      },
      {
        id: "cheeks",
        nameVi: "Đôi Má",
        spellingVi: "Đ - Ô - I   M - Á",
        nameEn: "Cheeks",
        sentenceVi: "Đôi má hồng hào của thỏ con.",
        suggestedColorHex: "#FF9EBB",
        suggestedColorNameVi: "Màu Hồng Phấn",
      },
      {
        id: "body",
        nameVi: "Thân Thỏ",
        spellingVi: "T - H - Â - N   T - H - Ỏ",
        nameEn: "Body",
        sentenceVi: "Thân thỏ mềm mại như bông gòn.",
        suggestedColorHex: "#FAF8F5",
        suggestedColorNameVi: "Màu Trắng Sứ",
      },
      {
        id: "belly",
        nameVi: "Bụng Thỏ",
        spellingVi: "C - Á - I   B - Ụ - N - G",
        nameEn: "Belly",
        sentenceVi: "Cái bụng thỏ hồng phấn xinh xắn.",
        suggestedColorHex: "#FF9EBB",
        suggestedColorNameVi: "Màu Hồng Phấn",
      },
      {
        id: "arms",
        nameVi: "Đôi Tay Nhỏ",
        spellingVi: "Đ - Ô - I   T - A - Y",
        nameEn: "Paws",
        sentenceVi: "Đôi tay nhỏ cầm củ cà rốt tươi.",
        suggestedColorHex: "#FAF8F5",
        suggestedColorNameVi: "Màu Trắng Sứ",
      },
      {
        id: "feet",
        nameVi: "Đôi Chân Nhảy",
        spellingVi: "Đ - Ô - I   C - H - Â - N",
        nameEn: "Feet",
        sentenceVi: "Đôi chân khỏe khoắn nhảy tưng tưng.",
        suggestedColorHex: "#FAF8F5",
        suggestedColorNameVi: "Màu Trắng Sứ",
      },
      {
        id: "tail",
        nameVi: "Đuôi Bông",
        spellingVi: "Đ - U - Ô - I   B - Ô - N - G",
        nameEn: "Fluffy Tail",
        sentenceVi: "Cái đuôi tròn như cục bông nhỏ.",
        suggestedColorHex: "#FFE5B4",
        suggestedColorNameVi: "Màu Kem Sữa",
      },
      {
        id: "carrot",
        nameVi: "Củ Cà Rốt",
        spellingVi: "C - À   R - Ố - T",
        nameEn: "Carrot",
        sentenceVi: "Củ cà rốt màu cam giòn tan bổ dưỡng.",
        suggestedColorHex: "#FF8E3C",
        suggestedColorNameVi: "Màu Cam",
      },
      {
        id: "eyes",
        nameVi: "Đôi Mắt",
        spellingVi: "Đ - Ô - I   M - Ắ - T",
        nameEn: "Eyes",
        sentenceVi: "Đôi mắt thỏ long lanh như hạt ngọc.",
        suggestedColorHex: "#353B48",
        suggestedColorNameVi: "Màu Đen Tuyền",
      },
    ],
  },
  {
    id: "cat",
    nameVi: "Con Mèo",
    spellingVi: "C - O - N   M - È - O",
    syllablesVi: ["CON", "MÈO"],
    nameEn: "Cute Kitten",
    soundTextVi: "Meo meo! Meo meo!",
    poemVi: [
      "Mèo con rửa mặt",
      "Nằm sưởi nắng hồng",
      "Đeo chuông cổ nhỏ",
      "Ngoan ngoãn trong lòng!",
    ],
    sentenceVi: "Chú mèo con đeo lục lạc vàng kêu leng keng.",
    accentColor: "#4ECDC4",
    parts: [
      {
        id: "head",
        nameVi: "Đầu Mèo",
        spellingVi: "Đ - Ầ - U   M - È - O",
        nameEn: "Head",
        sentenceVi: "Cái đầu mèo tròn có ria mép xinh.",
        suggestedColorHex: "#FFE5B4",
        suggestedColorNameVi: "Màu Kem Sữa",
      },
      {
        id: "ears_outer",
        nameVi: "Tai Mèo Nhọn",
        spellingVi: "T - A - I   M - È - O",
        nameEn: "Pointed Ears",
        sentenceVi: "Đôi tai mèo hình tam giác nhỏ nhắn.",
        suggestedColorHex: "#FF8E3C",
        suggestedColorNameVi: "Màu Cam",
      },
      {
        id: "ears_inner",
        nameVi: "Lòng Tai Mèo",
        spellingVi: "L - Ò - N - G   T - A - I",
        nameEn: "Inner Ears",
        sentenceVi: "Lòng tai mèo màu hồng đáng yêu.",
        suggestedColorHex: "#FF9EBB",
        suggestedColorNameVi: "Màu Hồng Phấn",
      },
      {
        id: "nose",
        nameVi: "Mũi Hồng",
        spellingVi: "M - Ũ - I   H - Ồ - N - G",
        nameEn: "Nose",
        sentenceVi: "Chiếc mũi nhỏ xinh kêu meo meo.",
        suggestedColorHex: "#FF5964",
        suggestedColorNameVi: "Màu Đỏ Hồng",
      },
      {
        id: "collar",
        nameVi: "Vòng Cổ",
        spellingVi: "V - Ò - N - G   C - Ổ",
        nameEn: "Collar",
        sentenceVi: "Chiếc vòng cổ màu xanh ngọc nổi bật.",
        suggestedColorHex: "#4ECDC4",
        suggestedColorNameVi: "Màu Xanh Ngọc",
      },
      {
        id: "bell",
        nameVi: "Chuông Nhỏ",
        spellingVi: "C - H - U - Ô - N - G",
        nameEn: "Bell",
        sentenceVi: "Quả chuông vàng kêu leng keng vui tai.",
        suggestedColorHex: "#FFD93D",
        suggestedColorNameVi: "Màu Vàng Tươi",
      },
      {
        id: "body",
        nameVi: "Thân Mèo",
        spellingVi: "T - H - Â - N   M - È - O",
        nameEn: "Body",
        sentenceVi: "Thân mèo uyển chuyển ấm áp.",
        suggestedColorHex: "#FFE5B4",
        suggestedColorNameVi: "Màu Kem Sữa",
      },
      {
        id: "chest",
        nameVi: "Ngực Trắng",
        spellingVi: "N - G - Ự - C",
        nameEn: "Chest",
        sentenceVi: "Lớp lông ngực trắng muốt mềm mịn.",
        suggestedColorHex: "#FAF8F5",
        suggestedColorNameVi: "Màu Trắng Sứ",
      },
      {
        id: "paws_front",
        nameVi: "Chân Trước",
        spellingVi: "C - H - Â - N   T - R - Ư - Ớ - C",
        nameEn: "Front Paws",
        sentenceVi: "Đôi chân trước có đệm thịt êm ái.",
        suggestedColorHex: "#FF8E3C",
        suggestedColorNameVi: "Màu Cam",
      },
      {
        id: "paws_back",
        nameVi: "Chân Sau",
        spellingVi: "C - H - Â - N   S - A - U",
        nameEn: "Back Paws",
        sentenceVi: "Đôi chân sau ngồi ngoan ngoãn.",
        suggestedColorHex: "#FF8E3C",
        suggestedColorNameVi: "Màu Cam",
      },
      {
        id: "tail",
        nameVi: "Đuôi Dài",
        spellingVi: "Đ - U - Ô - I   D - À - I",
        nameEn: "Long Tail",
        sentenceVi: "Cái đuôi mèo cong vút đung đưa.",
        suggestedColorHex: "#FF8E3C",
        suggestedColorNameVi: "Màu Cam",
      },
      {
        id: "eyes",
        nameVi: "Đôi Mắt",
        spellingVi: "Đ - Ô - I   M - Ắ - T",
        nameEn: "Eyes",
        sentenceVi: "Đôi mắt mèo tròn xoe tinh nghịch.",
        suggestedColorHex: "#353B48",
        suggestedColorNameVi: "Màu Đen Tuyền",
      },
    ],
  },
  {
    id: "elephant",
    nameVi: "Con Voi",
    spellingVi: "C - O - N   V - O - I",
    syllablesVi: ["CON", "VOI"],
    nameEn: "Baby Elephant",
    soundTextVi: "Pờ-rơ-oom! Voi con phun nước!",
    poemVi: [
      "Voi con cái vòi",
      "Đôi tai phe phẩy",
      "Thích phun nước mát",
      "Chơi đùa cả ngày!",
    ],
    sentenceVi: "Chú voi con có cái vòi dài và đôi tai to bản.",
    accentColor: "#4D96FF",
    parts: [
      {
        id: "head",
        nameVi: "Đầu Voi",
        spellingVi: "Đ - Ầ - U   V - O - I",
        nameEn: "Head",
        sentenceVi: "Cái đầu voi con tròn trĩnh thông minh.",
        suggestedColorHex: "#4D96FF",
        suggestedColorNameVi: "Màu Xanh Dương",
      },
      {
        id: "trunk",
        nameVi: "Cái Vòi Dài",
        spellingVi: "C - Á - I   V - Ò - I",
        nameEn: "Trunk",
        sentenceVi: "Cái vòi voi uốn cong phun nước mát.",
        suggestedColorHex: "#4D96FF",
        suggestedColorNameVi: "Màu Xanh Dương",
      },
      {
        id: "ears_outer",
        nameVi: "Đôi Tai To",
        spellingVi: "T - A - I   T - O",
        nameEn: "Big Ears",
        sentenceVi: "Đôi tai to phe phẩy như hai chiếc quạt.",
        suggestedColorHex: "#4D96FF",
        suggestedColorNameVi: "Màu Xanh Dương",
      },
      {
        id: "ears_inner",
        nameVi: "Lòng Tai Voi",
        spellingVi: "L - Ò - N - G   T - A - I",
        nameEn: "Inner Ears",
        sentenceVi: "Lòng tai voi màu hồng phấn tươi tắn.",
        suggestedColorHex: "#FF9EBB",
        suggestedColorNameVi: "Màu Hồng Phấn",
      },
      {
        id: "tusks",
        nameVi: "Đôi Ngà Nhỏ",
        spellingVi: "Đ - Ô - I   N - G - À",
        nameEn: "Tusks",
        sentenceVi: "Đôi ngà trắng nhỏ xinh hai bên vòi.",
        suggestedColorHex: "#FAF8F5",
        suggestedColorNameVi: "Màu Trắng Sứ",
      },
      {
        id: "crown",
        nameVi: "Vương Miện Nhỏ",
        spellingVi: "V - Ư - Ơ - N - G   M - I - Ệ - N",
        nameEn: "Mini Crown",
        sentenceVi: "Chiếc vương miện vàng lấp lánh trên đầu voi.",
        suggestedColorHex: "#FFD93D",
        suggestedColorNameVi: "Màu Vàng Tươi",
      },
      {
        id: "body",
        nameVi: "Thân Voi",
        spellingVi: "T - H - Â - N   V - O - I",
        nameEn: "Body",
        sentenceVi: "Thân voi con khỏe mạnh và hiền lành.",
        suggestedColorHex: "#4D96FF",
        suggestedColorNameVi: "Màu Xanh Dương",
      },
      {
        id: "belly",
        nameVi: "Bụng Voi",
        spellingVi: "B - Ụ - N - G   V - O - I",
        nameEn: "Belly",
        sentenceVi: "Bụng voi màu xanh ngọc tươi sáng.",
        suggestedColorHex: "#4ECDC4",
        suggestedColorNameVi: "Màu Xanh Ngọc",
      },
      {
        id: "legs",
        nameVi: "Bốn Chân Trụ",
        spellingVi: "B - Ố - N   C - H - Â - N",
        nameEn: "Four Legs",
        sentenceVi: "Bốn cái chân voi vững chãi bước đi.",
        suggestedColorHex: "#4D96FF",
        suggestedColorNameVi: "Màu Xanh Dương",
      },
      {
        id: "tail",
        nameVi: "Đuôi Nhỏ",
        spellingVi: "Đ - U - Ô - I   N - H - Ỏ",
        nameEn: "Tail",
        sentenceVi: "Chiếc đuôi nhỏ phía sau phe phẩy.",
        suggestedColorHex: "#4D96FF",
        suggestedColorNameVi: "Màu Xanh Dương",
      },
      {
        id: "eyes",
        nameVi: "Đôi Mắt",
        spellingVi: "Đ - Ô - I   M - Ắ - T",
        nameEn: "Eyes",
        sentenceVi: "Đôi mắt voi con hiền từ nhìn bé Mỹ.",
        suggestedColorHex: "#353B48",
        suggestedColorNameVi: "Màu Đen Tuyền",
      },
    ],
  },
];
