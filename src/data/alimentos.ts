// Tipos e categorias
export interface Alimento {
  id: string;
  nome: string;
  categoria: CategoriaAlimento;
  emoji: string;
  calorias: number;       // kcal por 100g
  proteina: number;        // g por 100g
  carboidratos: number;    // g por 100g
  gordura: number;         // g por 100g
  porcaoPadrao: number;    // gramas da porção padrão
  porcaoDescricao: string; // texto da porção (ex: “1 unidade média”)
}

export const CATEGORIAS_ALIMENTOS = [
  "Frutas",
  "Pratos & Preparações",
  "Lanches & Snacks",
  "Doces & Açúcares",
  "Verduras & Legumes",
  "Cereais & Grãos",
  "Bebidas",
  "Leguminosas",
  "Carnes & Peixes",
  "Ovos & Laticínios",
  "Óleos & Gorduras",
  "Sementes & Oleaginosas",
] as const;
export type CategoriaAlimento = (typeof CATEGORIAS_ALIMENTOS)[number];

// Base de dados enriquecida
export const ALIMENTOS: Alimento[] = [
  // FRUTAS 🍎
  { id: "maca", nome: "Maçã", categoria: "Frutas", emoji: "🍎", calorias: 73, proteina: 0.3, carboidratos: 14, gordura: 0.2, porcaoPadrao: 150, porcaoDescricao: "1 unidade média" },
  { id: "banana", nome: "Banana", categoria: "Frutas", emoji: "🍌", calorias: 89, proteina: 1.1, carboidratos: 23, gordura: 0.3, porcaoPadrao: 120, porcaoDescricao: "1 unidade média" },
  { id: "laranja", nome: "Laranja", categoria: "Frutas", emoji: "🍊", calorias: 47, proteina: 0.9, carboidratos: 12, gordura: 0.1, porcaoPadrao: 180, porcaoDescricao: "1 unidade média" },
  { id: "mamao", nome: "Mamão", categoria: "Frutas", emoji: "🧡", calorias: 43, proteina: 0.5, carboidratos: 11, gordura: 0.3, porcaoPadrao: 150, porcaoDescricao: "1 fatia média" },
  { id: "abacaxi", nome: "Abacaxi", categoria: "Frutas", emoji: "🍍", calorias: 50, proteina: 0.5, carboidratos: 13, gordura: 0.1, porcaoPadrao: 100, porcaoDescricao: "2 fatias" },
  { id: "manga", nome: "Manga", categoria: "Frutas", emoji: "🥭", calorias: 60, proteina: 0.8, carboidratos: 15, gordura: 0.4, porcaoPadrao: 150, porcaoDescricao: "1 fatia grande" },
  { id: "uva", nome: "Uva", categoria: "Frutas", emoji: "🍇", calorias: 62, proteina: 0.6, carboidratos: 16, gordura: 0.2, porcaoPadrao: 100, porcaoDescricao: "1 cacho pequeno" },
  { id: "morango", nome: "Morango", categoria: "Frutas", emoji: "🍓", calorias: 32, proteina: 0.7, carboidratos: 8, gordura: 0.3, porcaoPadrao: 100, porcaoDescricao: "8–10 unidades" },
  { id: "abacate", nome: "Abacate", categoria: "Frutas", emoji: "🥑", calorias: 160, proteina: 2, carboidratos: 8.5, gordura: 15, porcaoPadrao: 100, porcaoDescricao: "½ unidade média" },
  { id: "kiwi", nome: "Kiwi", categoria: "Frutas", emoji: "🥝", calorias: 61, proteina: 1.1, carboidratos: 15, gordura: 0.5, porcaoPadrao: 75, porcaoDescricao: "1 unidade média" },
  { id: "pera", nome: "Pera", categoria: "Frutas", emoji: "🍐", calorias: 57, proteina: 0.4, carboidratos: 15, gordura: 0.1, porcaoPadrao: 150, porcaoDescricao: "1 unidade média" },
  { id: "acerola", nome: "Acerola", categoria: "Frutas", emoji: "🫐", calorias: 32, proteina: 0.4, carboidratos: 7, gordura: 0.3, porcaoPadrao: 100, porcaoDescricao: "10–12 unidades" },
  { id: "goiaba", nome: "Goiaba", categoria: "Frutas", emoji: "🟠", calorias: 68, proteina: 2.6, carboidratos: 14, gordura: 0.9, porcaoPadrao: 100, porcaoDescricao: "½ unidade média" },
  { id: "coco", nome: "Coco (polpa)", categoria: "Frutas", emoji: "🥥", calorias: 354, proteina: 3.3, carboidratos: 15, gordura: 33, porcaoPadrao: 100, porcaoDescricao: "½ xícara" },
  { id: 'pessego', nome: 'Pêssego', categoria: 'Frutas', emoji: '🍑', calorias: 39, proteina: 0.9, carboidratos: 10, gordura: 0.3, porcaoPadrao: 150, porcaoDescricao: '1 unidade média' },
  { id: 'nectarina', nome: 'Nectarina', categoria: 'Frutas', emoji: '🍑', calorias: 44, proteina: 1.0, carboidratos: 11, gordura: 0.3, porcaoPadrao: 150, porcaoDescricao: '1 unidade média' },
  { id: 'cereja', nome: 'Cereja', categoria: 'Frutas', emoji: '🍒', calorias: 50, proteina: 1.0, carboidratos: 12, gordura: 0.3, porcaoPadrao: 100, porcaoDescricao: '8–10 unidades' },
  { id: 'framboesa', nome: 'Framboesa', categoria: 'Frutas', emoji: '🫐', calorias: 52, proteina: 1.2, carboidratos: 12, gordura: 0.7, porcaoPadrao: 100, porcaoDescricao: '½ xícara' },
  { id: 'amora', nome: 'Amora', categoria: 'Frutas', emoji: '🫐', calorias: 43, proteina: 1.4, carboidratos: 10, gordura: 0.5, porcaoPadrao: 100, porcaoDescricao: '½ xícara' },
  { id: 'melancia', nome: 'Melancia', categoria: 'Frutas', emoji: '🍉', calorias: 30, proteina: 0.6, carboidratos: 8, gordura: 0.2, porcaoPadrao: 200, porcaoDescricao: '2 fatias' },
  { id: 'melao', nome: 'Melão', categoria: 'Frutas', emoji: '🍈', calorias: 34, proteina: 0.8, carboidratos: 8.5, gordura: 0.2, porcaoPadrao: 150, porcaoDescricao: '1 fatia' },
  { id: 'figo', nome: 'Figo', categoria: 'Frutas', emoji: '🌿', calorias: 74, proteina: 0.8, carboidratos: 19, gordura: 0.3, porcaoPadrao: 50, porcaoDescricao: '2 unidades pequenas' },
  { id: 'caju', nome: 'Caju (fruto)', categoria: 'Frutas', emoji: '🌰', calorias: 43, proteina: 0.6, carboidratos: 11, gordura: 0.2, porcaoPadrao: 100, porcaoDescricao: '1 unidade pequena' },
  { id: 'carambola', nome: 'Carambola (starfruit)', categoria: 'Frutas', emoji: '⭐', calorias: 31, proteina: 1.0, carboidratos: 6.7, gordura: 0.3, porcaoPadrao: 100, porcaoDescricao: '1 unidade média' },
  { id: 'limao', nome: 'Limão', categoria: 'Frutas', emoji: '🍋', calorias: 29, proteina: 1.1, carboidratos: 9.3, gordura: 0.3, porcaoPadrao: 50, porcaoDescricao: '1 unidade média' },
  { id: 'maracuja', nome: 'Maracujá (polpa)', categoria: 'Frutas', emoji: '🥭', calorias: 97, proteina: 2.2, carboidratos: 23, gordura: 0.7, porcaoPadrao: 50, porcaoDescricao: '1 unidade (polpa)' },
  { id: 'jabuticaba', nome: 'Jabuticaba', categoria: 'Frutas', emoji: '🍇', calorias: 58, proteina: 0.9, carboidratos: 14, gordura: 0.3, porcaoPadrao: 100, porcaoDescricao: '10–15 unidades' },
  { id: 'pitanga', nome: 'Pitanga', categoria: 'Frutas', emoji: '🍒', calorias: 44, proteina: 0.4, carboidratos: 11, gordura: 0.2, porcaoPadrao: 100, porcaoDescricao: '10–12 unidades' },
  { id: 'graviola', nome: 'Graviola (pinha)', categoria: 'Frutas', emoji: '🌿', calorias: 66, proteina: 1.0, carboidratos: 17, gordura: 0.3, porcaoPadrao: 100, porcaoDescricao: '1 fatia' },
  { id: 'ameixa', nome: 'Ameixa', categoria: 'Frutas', emoji: '🍑', calorias: 46, proteina: 0.7, carboidratos: 11.4, gordura: 0.3, porcaoPadrao: 66, porcaoDescricao: '1 unidade média' },

  // VERDURAS & LEGUMES 🥦🥕
  { id: "brocolis", nome: "Brócolis", categoria: "Verduras & Legumes", emoji: "🥦", calorias: 34, proteina: 2.8, carboidratos: 7, gordura: 0.4, porcaoPadrao: 100, porcaoDescricao: "1 xícara" },
  { id: "cenoura", nome: "Cenoura", categoria: "Verduras & Legumes", emoji: "🥕", calorias: 41, proteina: 0.9, carboidratos: 10, gordura: 0.2, porcaoPadrao: 80, porcaoDescricao: "1 unidade média" },
  { id: "tomate", nome: "Tomate", categoria: "Verduras & Legumes", emoji: "🍅", calorias: 18, proteina: 0.9, carboidratos: 3.9, gordura: 0.2, porcaoPadrao: 120, porcaoDescricao: "1 unidade média" },
  { id: "alface", nome: "Alface", categoria: "Verduras & Legumes", emoji: "🥬", calorias: 15, proteina: 1.4, carboidratos: 2.9, gordura: 0.1, porcaoPadrao: 50, porcaoDescricao: "2 folhas grandes" },
  { id: "pepino", nome: "Pepino", categoria: "Verduras & Legumes", emoji: "🥒", calorias: 16, proteina: 0.7, carboidratos: 4, gordura: 0.1, porcaoPadrao: 100, porcaoDescricao: "½ unidade" },
  { id: "berinjela", nome: "Berinjela", categoria: "Verduras & Legumes", emoji: "🍆", calorias: 24, proteina: 1.0, carboidratos: 5.7, gordura: 0.2, porcaoPadrao: 100, porcaoDescricao: "½ unidade média" },
  { id: "couve", nome: "Couve (cozida)", categoria: "Verduras & Legumes", emoji: "🥬", calorias: 32, proteina: 3.3, carboidratos: 6, gordura: 0.6, porcaoPadrao: 100, porcaoDescricao: "1 xícara cozida" },
  { id: "espinafre", nome: "Espinafre (cozido)", categoria: "Verduras & Legumes", emoji: "🌿", calorias: 23, proteina: 2.9, carboidratos: 3.8, gordura: 0.4, porcaoPadrao: 100, porcaoDescricao: "1 xícara" },
  { id: "repolho", nome: "Repolho", categoria: "Verduras & Legumes", emoji: "🥬", calorias: 25, proteina: 1.3, carboidratos: 5.8, gordura: 0.1, porcaoPadrao: 100, porcaoDescricao: "1 xícara picada" },
  { id: "abobrinha", nome: "Abobrinha", categoria: "Verduras & Legumes", emoji: "🥒", calorias: 17, proteina: 1.2, carboidratos: 3.1, gordura: 0.3, porcaoPadrao: 100, porcaoDescricao: "½ unidade" },
  { id: "cogumelo", nome: "Cogumelo Paris", categoria: "Verduras & Legumes", emoji: "🍄", calorias: 22, proteina: 3.1, carboidratos: 3.3, gordura: 0.3, porcaoPadrao: 100, porcaoDescricao: "5–6 unidades" },

  // CEREAIS & GRÃOS 🌾
  { id: "arroz_branco", nome: "Arroz Branco (cozido)", categoria: "Cereais & Grãos", emoji: "🍚", calorias: 130, proteina: 2.7, carboidratos: 28, gordura: 0.3, porcaoPadrao: 150, porcaoDescricao: "1 xícara" },
  { id: "arroz_integral", nome: "Arroz Integral (cozido)", categoria: "Cereais & Grãos", emoji: "🍙", calorias: 111, proteina: 2.6, carboidratos: 22, gordura: 0.9, porcaoPadrao: 150, porcaoDescricao: "1 xícara" },
  { id: "quinoa", nome: "Quinoa (cozida)", categoria: "Cereais & Grãos", emoji: "🥣", calorias: 120, proteina: 4.4, carboidratos: 21.3, gordura: 1.9, porcaoPadrao: 100, porcaoDescricao: "½ xícara" },
  { id: "aveia", nome: "Aveia em Flocos", categoria: "Cereais & Grãos", emoji: "🥣", calorias: 389, proteina: 17, carboidratos: 66, gordura: 6.9, porcaoPadrao: 30, porcaoDescricao: "3 colheres de sopa" },
  { id: "pao_integral", nome: "Pão Integral", categoria: "Cereais & Grãos", emoji: "🍞", calorias: 247, proteina: 13, carboidratos: 41, gordura: 4.2, porcaoPadrao: 50, porcaoDescricao: "2 fatias" },
  { id: "macarrao", nome: "Macarrão Integral (cozido)", categoria: "Cereais & Grãos", emoji: "🍝", calorias: 124, proteina: 5.8, carboidratos: 25.5, gordura: 0.9, porcaoPadrao: 100, porcaoDescricao: "1 xícara" },
  { id: "pao_frances", nome: "Pão Francês", categoria: "Cereais & Grãos", emoji: "🥖", calorias: 275, proteina: 8.5, carboidratos: 55, gordura: 1.5, porcaoPadrao: 50, porcaoDescricao: "1 unidade (50g)" },
  { id: "cuscuz", nome: "Cuscuz de Milho (cozido)", categoria: "Cereais & Grãos", emoji: "🌽", calorias: 112, proteina: 2.4, carboidratos: 23.4, gordura: 0.6, porcaoPadrao: 100, porcaoDescricao: "½ xícara" },
  { id: "tapioca", nome: "Tapioca (goma pronta)", categoria: "Cereais & Grãos", emoji: "🫓", calorias: 358, proteina: 0, carboidratos: 88, gordura: 0, porcaoPadrao: 50, porcaoDescricao: "1 receita (50g)" },
  { id: "mandioca", nome: "Mandioca (cozida)", categoria: "Cereais & Grãos", emoji: "🍠", calorias: 160, proteina: 1.4, carboidratos: 38, gordura: 0.3, porcaoPadrao: 100, porcaoDescricao: "1 pedaço (100g)" },
  { id: "milho_cozido", nome: "Milho Verde (cozido)", categoria: "Cereais & Grãos", emoji: "🌽", calorias: 96, proteina: 3.4, carboidratos: 21, gordura: 1.5, porcaoPadrao: 100, porcaoDescricao: "½ espiga" },

  // LEGUMINOSAS 🫘
  { id: "feijao_preto", nome: "Feijão Preto (cozido)", categoria: "Leguminosas", emoji: "🫘", calorias: 132, proteina: 8.9, carboidratos: 24, gordura: 0.5, porcaoPadrao: 100, porcaoDescricao: "½ xícara" },
  { id: "feijao_carioca", nome: "Feijão Carioca (cozido)", categoria: "Leguminosas", emoji: "🟤", calorias: 127, proteina: 8.7, carboidratos: 23, gordura: 0.5, porcaoPadrao: 100, porcaoDescricao: "½ xícara" },
  { id: "lentilha", nome: "Lentilha (cozida)", categoria: "Leguminosas", emoji: "🌱", calorias: 116, proteina: 9.0, carboidratos: 20.1, gordura: 0.4, porcaoPadrao: 100, porcaoDescricao: "½ xícara" },
  { id: "grao_de_bico", nome: "Grão-de-bico (cozido)", categoria: "Leguminosas", emoji: "🧆", calorias: 164, proteina: 8.9, carboidratos: 27.4, gordura: 2.6, porcaoPadrao: 100, porcaoDescricao: "½ xícara" },
  { id: "soja_cozida", nome: "Soja (cozida)", categoria: "Leguminosas", emoji: "🌱", calorias: 173, proteina: 16.6, carboidratos: 9.9, gordura: 9, porcaoPadrao: 100, porcaoDescricao: "½ xícara" },
  { id: "ervilha", nome: "Ervilha (cozida)", categoria: "Leguminosas", emoji: "🟢", calorias: 84, proteina: 5.4, carboidratos: 14.5, gordura: 0.4, porcaoPadrao: 100, porcaoDescricao: "½ xícara" },

  // CARNES & PEIXES 🥩🐟
  { id: "frango_peito", nome: "Peito de Frango (grelhado)", categoria: "Carnes & Peixes", emoji: "🐓", calorias: 165, proteina: 31, carboidratos: 0, gordura: 3.6, porcaoPadrao: 120, porcaoDescricao: "1 filé médio" },
  { id: "carne_bovina", nome: "Carne Bovina Magra (grelhada)", categoria: "Carnes & Peixes", emoji: "🥩", calorias: 250, proteina: 26, carboidratos: 0, gordura: 15, porcaoPadrao: 100, porcaoDescricao: "1 bife médio" },
  { id: "peixe_tilapia", nome: "Tilápia (grelhada)", categoria: "Carnes & Peixes", emoji: "🐟", calorias: 128, proteina: 23, carboidratos: 0, gordura: 2.6, porcaoPadrao: 120, porcaoDescricao: "1 filé" },
  { id: "salmão", nome: "Salmão (grelhado)", categoria: "Carnes & Peixes", emoji: "🐠", calorias: 208, proteina: 20, carboidratos: 0, gordura: 13, porcaoPadrao: 120, porcaoDescricao: "1 filé" },
  { id: "atum_lata", nome: "Atum em lata (em água)", categoria: "Carnes & Peixes", emoji: "🥫", calorias: 116, proteina: 26, carboidratos: 0, gordura: 1, porcaoPadrao: 100, porcaoDescricao: "1/2 lata (100g)" },
  { id: "camarao", nome: "Camarão (cozido)", categoria: "Carnes & Peixes", emoji: "🦐", calorias: 99, proteina: 24, carboidratos: 0.2, gordura: 0.3, porcaoPadrao: 100, porcaoDescricao: "8–10 unidades médias" },
  { id: "porco_lombo", nome: "Lombo de Porco (magro)", categoria: "Carnes & Peixes", emoji: "🐖", calorias: 143, proteina: 21, carboidratos: 0, gordura: 5, porcaoPadrao: 100, porcaoDescricao: "1 fatia" },

  // OVOS & LATICÍNIOS 🍳🥛
  { id: "ovo", nome: "Ovo de Galinha (cozido)", categoria: "Ovos & Laticínios", emoji: "🥚", calorias: 155, proteina: 13, carboidratos: 1.1, gordura: 11, porcaoPadrao: 60, porcaoDescricao: "1 unidade grande" },
  { id: "leite_integral", nome: "Leite Integral", categoria: "Ovos & Laticínios", emoji: "🥛", calorias: 61, proteina: 3.2, carboidratos: 4.8, gordura: 3.3, porcaoPadrao: 200, porcaoDescricao: "1 copo" },
  { id: "leite_desnatado", nome: "Leite Desnatado", categoria: "Ovos & Laticínios", emoji: "🥛", calorias: 34, proteina: 3.4, carboidratos: 5, gordura: 0.2, porcaoPadrao: 200, porcaoDescricao: "1 copo" },
  { id: "iogurte_natural", nome: "Iogurte Natural Integral", categoria: "Ovos & Laticínios", emoji: "🥛", calorias: 61, proteina: 3.5, carboidratos: 4.7, gordura: 3.3, porcaoPadrao: 170, porcaoDescricao: "1 pote" },
  { id: "queijo_minas", nome: "Queijo Minas Frescal", categoria: "Ovos & Laticínios", emoji: "🧀", calorias: 264, proteina: 17, carboidratos: 3, gordura: 20, porcaoPadrao: 30, porcaoDescricao: "1 fatia média" },
  { id: "queijo_prato", nome: "Queijo Prato", categoria: "Ovos & Laticínios", emoji: "🧀", calorias: 356, proteina: 25, carboidratos: 1.3, gordura: 27, porcaoPadrao: 30, porcaoDescricao: "1 fatia" },
  { id: "ricota", nome: "Ricota", categoria: "Ovos & Laticínios", emoji: "🧀", calorias: 138, proteina: 11, carboidratos: 3, gordura: 9, porcaoPadrao: 50, porcaoDescricao: "2 colheres de sopa" },
  { id: "cottage", nome: "Cottage", categoria: "Ovos & Laticínios", emoji: "🥣", calorias: 98, proteina: 11.1, carboidratos: 3.4, gordura: 4.3, porcaoPadrao: 100, porcaoDescricao: "1 pote pequeno" },

  // ÓLEOS & GORDURAS 🫒
  { id: "azeite", nome: "Azeite de Oliva", categoria: "Óleos & Gorduras", emoji: "🫒", calorias: 884, proteina: 0, carboidratos: 0, gordura: 100, porcaoPadrao: 10, porcaoDescricao: "1 colher de sopa" },
  { id: "oleo_coco", nome: "Óleo de Coco", categoria: "Óleos & Gorduras", emoji: "🥥", calorias: 892, proteina: 0, carboidratos: 0, gordura: 100, porcaoPadrao: 10, porcaoDescricao: "1 colher de sopa" },
  { id: "manteiga", nome: "Manteiga", categoria: "Óleos & Gorduras", emoji: "🧈", calorias: 717, proteina: 0.9, carboidratos: 0.1, gordura: 81, porcaoPadrao: 10, porcaoDescricao: "1 colher de sopa" },

  // SEMENTES & OLEAGINOSAS 🌰
  { id: "castanha_para", nome: "Castanha do Pará", categoria: "Sementes & Oleaginosas", emoji: "🌰", calorias: 656, proteina: 14, carboidratos: 12, gordura: 67, porcaoPadrao: 20, porcaoDescricao: "3 unidades" },
  { id: "amendoim", nome: "Amendoim (sem sal)", categoria: "Sementes & Oleaginosas", emoji: "🥜", calorias: 567, proteina: 26, carboidratos: 16, gordura: 49, porcaoPadrao: 30, porcaoDescricao: "1 punhado" },
  { id: "chia", nome: "Sementes de Chia", categoria: "Sementes & Oleaginosas", emoji: "🧂", calorias: 486, proteina: 17, carboidratos: 42, gordura: 31, porcaoPadrao: 10, porcaoDescricao: "1 colher de sopa" },
  { id: "nozes", nome: "Nozes", categoria: "Sementes & Oleaginosas", emoji: "🌰", calorias: 654, proteina: 15, carboidratos: 14, gordura: 65, porcaoPadrao: 30, porcaoDescricao: "4 metades" },
  { id: "macadamia", nome: "Macadâmia", categoria: "Sementes & Oleaginosas", emoji: "🥜", calorias: 718, proteina: 8, carboidratos: 14, gordura: 76, porcaoPadrao: 28, porcaoDescricao: "6–8 unidades" },
  { id: "pistache", nome: "Pistache", categoria: "Sementes & Oleaginosas", emoji: "🥜", calorias: 562, proteina: 21, carboidratos: 28, gordura: 45, porcaoPadrao: 30, porcaoDescricao: "1 punhado" },
  { id: "semente_abobora", nome: "Semente de Abóbora", categoria: "Sementes & Oleaginosas", emoji: "🎃", calorias: 559, proteina: 30, carboidratos: 10, gordura: 49, porcaoPadrao: 20, porcaoDescricao: "1 colher de sopa" },

  // BEBIDAS 🥤
  { id: "agua", nome: "Água", categoria: "Bebidas", emoji: "💧", calorias: 0, proteina: 0, carboidratos: 0, gordura: 0, porcaoPadrao: 200, porcaoDescricao: "1 copo" },
  { id: "suco_laranja", nome: "Suco de Laranja Natural", categoria: "Bebidas", emoji: "🧃", calorias: 45, proteina: 0.7, carboidratos: 10, gordura: 0.2, porcaoPadrao: 200, porcaoDescricao: "1 copo" },
  { id: "cafe_preto", nome: "Café Preto (sem açúcar)", categoria: "Bebidas", emoji: "☕", calorias: 2, proteina: 0.3, carboidratos: 0, gordura: 0, porcaoPadrao: 150, porcaoDescricao: "1 xícara" },
  { id: "cha_verde", nome: "Chá Verde (sem açúcar)", categoria: "Bebidas", emoji: "🍵", calorias: 1, proteina: 0, carboidratos: 0, gordura: 0, porcaoPadrao: 200, porcaoDescricao: "1 xícara" },
  { id: "leite_chocolate", nome: "Leite com Chocolate", categoria: "Bebidas", emoji: "🥛", calorias: 83, proteina: 3.4, carboidratos: 11, gordura: 2.5, porcaoPadrao: 200, porcaoDescricao: "1 copo" },
  { id: "refrigerante", nome: "Refrigerante Cola (com açúcar)", categoria: "Bebidas", emoji: "🥤", calorias: 42, proteina: 0, carboidratos: 10.6, gordura: 0, porcaoPadrao: 100, porcaoDescricao: "100 ml" },
  { id: "suco_uva", nome: "Suco de Uva Integral", categoria: "Bebidas", emoji: "🍷", calorias: 60, proteina: 0.2, carboidratos: 15, gordura: 0, porcaoPadrao: 100, porcaoDescricao: "100 ml" },
  { id: "cerveja", nome: "Cerveja Pilsen", categoria: "Bebidas", emoji: "🍺", calorias: 43, proteina: 0.5, carboidratos: 3.6, gordura: 0, porcaoPadrao: 100, porcaoDescricao: "100 ml" },
  { id: "vinho_tinto", nome: "Vinho Tinto", categoria: "Bebidas", emoji: "🍷", calorias: 85, proteina: 0.1, carboidratos: 2.6, gordura: 0, porcaoPadrao: 100, porcaoDescricao: "100 ml" },

  // DOCES & AÇÚCARES 🍭
  { id: "chocolate_amargo", nome: "Chocolate 70% Cacau", categoria: "Doces & Açúcares", emoji: "🍫", calorias: 546, proteina: 7.8, carboidratos: 46, gordura: 31, porcaoPadrao: 20, porcaoDescricao: "2 quadrados" },
  { id: "mel", nome: "Mel", categoria: "Doces & Açúcares", emoji: "🍯", calorias: 304, proteina: 0.3, carboidratos: 82, gordura: 0, porcaoPadrao: 20, porcaoDescricao: "1 colher de sopa" },
  { id: "acucar", nome: "Açúcar Cristal", categoria: "Doces & Açúcares", emoji: "🍯", calorias: 387, proteina: 0, carboidratos: 100, gordura: 0, porcaoPadrao: 10, porcaoDescricao: "1 colher de sopa" },
  { id: "sorvete_creme", nome: "Sorvete de Creme", categoria: "Doces & Açúcares", emoji: "🍨", calorias: 207, proteina: 3.5, carboidratos: 24, gordura: 11, porcaoPadrao: 60, porcaoDescricao: "1 bola (60g)" },
  { id: "bolo_chocolate", nome: "Bolo de Chocolate (fatia)", categoria: "Doces & Açúcares", emoji: "🍰", calorias: 371, proteina: 4.6, carboidratos: 46, gordura: 18, porcaoPadrao: 80, porcaoDescricao: "1 fatia" },
  { id: "doce_leite", nome: "Doce de Leite", categoria: "Doces & Açúcares", emoji: "🥮", calorias: 321, proteina: 5.2, carboidratos: 62, gordura: 4.1, porcaoPadrao: 20, porcaoDescricao: "1 colher de sopa" },

  // Lanches & Snacks 🍿🥨
  { id: "biscoito_integral", nome: "Biscoito Integral", categoria: "Lanches & Snacks", emoji: "🍪", calorias: 454, proteina: 7, carboidratos: 65, gordura: 18, porcaoPadrao: 30, porcaoDescricao: "4 unidades" },
  { id: "pipoca", nome: "Pipoca (sem óleo)", categoria: "Lanches & Snacks", emoji: "🍿", calorias: 375, proteina: 12, carboidratos: 74, gordura: 4.5, porcaoPadrao: 25, porcaoDescricao: "1 xícara" },
  { id: "granola", nome: "Granola sem açúcar", categoria: "Lanches & Snacks", emoji: "🥣", calorias: 471, proteina: 13, carboidratos: 64, gordura: 20, porcaoPadrao: 30, porcaoDescricao: "2 colheres de sopa" },
  { id: "barra_cereal", nome: "Barra de Cereal", categoria: "Lanches & Snacks", emoji: "🍫", calorias: 380, proteina: 8, carboidratos: 64, gordura: 10, porcaoPadrao: 25, porcaoDescricao: "1 unidade" },
  { id: "batata_frita", nome: "Batata Frita (fast-food)", categoria: "Lanches & Snacks", emoji: "🍟", calorias: 312, proteina: 3.4, carboidratos: 41, gordura: 15, porcaoPadrao: 100, porcaoDescricao: "1 porção média" },
  { id: "pao_de_queijo", nome: "Pão de Queijo", categoria: "Lanches & Snacks", emoji: "🧀", calorias: 350, proteina: 7, carboidratos: 36, gordura: 18, porcaoPadrao: 50, porcaoDescricao: "2 unidades médias" },
  { id: "coxinha", nome: "Coxinha (frita)", categoria: "Lanches & Snacks", emoji: "🍗", calorias: 260, proteina: 9, carboidratos: 25, gordura: 13, porcaoPadrao: 80, porcaoDescricao: "1 unidade média" },

  // PRATOS & PREPARAÇÕES 🍽️
  { id: "salada_mista", nome: "Salada Mista (folhas + tomate + cenoura)", categoria: "Pratos & Preparações", emoji: "🥗", calorias: 35, proteina: 2, carboidratos: 7, gordura: 0.5, porcaoPadrao: 150, porcaoDescricao: "1 prato sobremesa" },
  { id: "sanduiche_natural", nome: "Sanduíche Natural", categoria: "Pratos & Preparações", emoji: "🥪", calorias: 250, proteina: 12, carboidratos: 30, gordura: 8, porcaoPadrao: 150, porcaoDescricao: "1 unidade" },
  { id: "pizza_margherita", nome: "Pizza Margherita", categoria: "Pratos & Preparações", emoji: "🍕", calorias: 266, proteina: 11, carboidratos: 33, gordura: 10, porcaoPadrao: 125, porcaoDescricao: "1 fatia média" },
  { id: "hamburguer_caseiro", nome: "Hambúrguer Caseiro", categoria: "Pratos & Preparações", emoji: "🍔", calorias: 295, proteina: 17, carboidratos: 24, gordura: 15, porcaoPadrao: 200, porcaoDescricao: "1 unidade" },
  { id: "arroz_feijao", nome: "Arroz com Feijão (prato típico)", categoria: "Pratos & Preparações", emoji: "🍛", calorias: 210, proteina: 8.5, carboidratos: 36, gordura: 2.5, porcaoPadrao: 200, porcaoDescricao: "1 prato" },
  { id: "feijoada", nome: "Feijoada", categoria: "Pratos & Preparações", emoji: "🥘", calorias: 360, proteina: 20, carboidratos: 18, gordura: 20, porcaoPadrao: 200, porcaoDescricao: "1 concha" },
  { id: "lasanha", nome: "Lasanha (carne)", categoria: "Pratos & Preparações", emoji: "🍝", calorias: 260, proteina: 13, carboidratos: 20, gordura: 12, porcaoPadrao: 150, porcaoDescricao: "1 fatia média" },
  { id: "strogonoff_frango", nome: "Strogonoff de Frango", categoria: "Pratos & Preparações", emoji: "🍲", calorias: 190, proteina: 12, carboidratos: 8, gordura: 12, porcaoPadrao: 150, porcaoDescricao: "1 porção" },
  { id: 'frango_assado', nome: 'Frango Assado (peça)', categoria: 'Pratos & Preparações', emoji: '🍗', calorias: 240, proteina: 28, carboidratos: 0, gordura: 10, porcaoPadrao: 150, porcaoDescricao: '1 coxa + sobrecoxa (150g)' },
  { id: 'bife_grelhado', nome: 'Bife Grelhado', categoria: 'Pratos & Preparações', emoji: '🥩', calorias: 220, proteina: 26, carboidratos: 0, gordura: 12, porcaoPadrao: 100, porcaoDescricao: '1 bife (100g)' },
  { id: 'peixe_frito', nome: 'Peixe Frito', categoria: 'Pratos & Preparações', emoji: '🐟', calorias: 260, proteina: 22, carboidratos: 8, gordura: 15, porcaoPadrao: 150, porcaoDescricao: '1 filé (150g)' },
  { id: 'escondidinho_carne', nome: 'Escondidinho de Carne', categoria: 'Pratos & Preparações', emoji: '🥧', calorias: 330, proteina: 14, carboidratos: 30, gordura: 18, porcaoPadrao: 200, porcaoDescricao: '1 porção (200g)' },
  { id: 'moqueca', nome: 'Moqueca (peixe)', categoria: 'Pratos & Preparações', emoji: '🍲', calorias: 280, proteina: 20, carboidratos: 6, gordura: 18, porcaoPadrao: 200, porcaoDescricao: '1 porção (200g)' },
  { id: 'bobo_de_camarao', nome: 'Bobó de Camarão', categoria: 'Pratos & Preparações', emoji: '🦐', calorias: 350, proteina: 18, carboidratos: 28, gordura: 18, porcaoPadrao: 200, porcaoDescricao: '1 porção (200g)' },
  { id: 'tutu_de_feijao', nome: 'Tutu de Feijão', categoria: 'Pratos & Preparações', emoji: '🥣', calorias: 260, proteina: 14, carboidratos: 40, gordura: 5, porcaoPadrao: 200, porcaoDescricao: '1 porção (200g)' },
  { id: 'farofa', nome: 'Farofa', categoria: 'Pratos & Preparações', emoji: '🥄', calorias: 150, proteina: 2, carboidratos: 15, gordura: 9, porcaoPadrao: 50, porcaoDescricao: '1 porção (50g)' },
  { id: 'pure_batata', nome: 'Purê de Batata', categoria: 'Pratos & Preparações', emoji: '🥔', calorias: 120, proteina: 2, carboidratos: 22, gordura: 3, porcaoPadrao: 150, porcaoDescricao: '1 porção (150g)' },
  { id: 'omelete', nome: 'Omelete (2 ovos)', categoria: 'Pratos & Preparações', emoji: '🍳', calorias: 180, proteina: 12, carboidratos: 2, gordura: 13, porcaoPadrao: 100, porcaoDescricao: '1 omelete (2 ovos)' },
  { id: 'panqueca_recheada', nome: 'Panqueca Recheada (carne/queijo)', categoria: 'Pratos & Preparações', emoji: '🥞', calorias: 260, proteina: 10, carboidratos: 30, gordura: 10, porcaoPadrao: 150, porcaoDescricao: '1 unidade média' },
  { id: 'crepioca', nome: 'Crepioca', categoria: 'Pratos & Preparações', emoji: '🥞', calorias: 180, proteina: 8, carboidratos: 24, gordura: 4, porcaoPadrao: 100, porcaoDescricao: '1 unidade média' },
  { id: 'ceviche', nome: 'Ceviche', categoria: 'Pratos & Preparações', emoji: '🍋', calorias: 110, proteina: 18, carboidratos: 2, gordura: 2, porcaoPadrao: 100, porcaoDescricao: '1 porção (100g)' },
  { id: 'acaraje', nome: 'Acarajé', categoria: 'Pratos & Preparações', emoji: '🌶️', calorias: 300, proteina: 6, carboidratos: 26, gordura: 18, porcaoPadrao: 120, porcaoDescricao: '1 unidade média' },
  { id: 'risoto_frango', nome: 'Risoto de Frango', categoria: 'Pratos & Preparações', emoji: '🍚', calorias: 320, proteina: 14, carboidratos: 45, gordura: 6, porcaoPadrao: 200, porcaoDescricao: '1 porção (200g)' },
  { id: 'quiche', nome: 'Quiche (fatia)', categoria: 'Pratos & Preparações', emoji: '🥧', calorias: 300, proteina: 8, carboidratos: 22, gordura: 20, porcaoPadrao: 100, porcaoDescricao: '1 fatia (100g)' },
];


// Funções utilitárias (atualizadas)
export function buscarAlimentos(termo: string): Alimento[] {
  const termoLimpo = termo.toLowerCase().trim();
  if (!termoLimpo) return ALIMENTOS;
  return ALIMENTOS.filter(alimento =>
    alimento.nome.toLowerCase().includes(termoLimpo) ||
    alimento.categoria.toLowerCase().includes(termoLimpo) ||
    alimento.id.toLowerCase().includes(termoLimpo) ||
    alimento.emoji.toLowerCase().includes(termoLimpo) ||
    alimento.porcaoDescricao.toLowerCase().includes(termoLimpo)
  );
}

export function calcularNutricao(alimento: Alimento, quantidade: number, porcao: number) {
  const fator = quantidade / porcao;
  return {
    calorias: Math.round(alimento.calorias * fator),
    proteina: +(alimento.proteina * fator).toFixed(1),
    carboidratos: +(alimento.carboidratos * fator).toFixed(1),
    gordura: +(alimento.gordura * fator).toFixed(1)
  };
}
