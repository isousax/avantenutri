// Base de dados de alimentos com informações nutricionais (por 100g)
export interface Alimento {
  id: string;
  nome: string;
  categoria: string;
  emoji: string;
  calorias: number; // kcal por 100g
  proteina: number; // g por 100g
  carboidratos: number; // g por 100g
  gordura: number; // g por 100g
  porcaoPadrao: number; // gramas da porção padrão
  porcaoDescricao: string; // ex: "1 unidade média", "1 fatia"
}

export const CATEGORIAS_ALIMENTOS = [
  'Frutas',
  'Vegetais',
  'Grãos e Cereais',
  'Proteínas',
  'Laticínios',
  'Gorduras',
  'Bebidas',
  'Doces',
  'Lanches',
  'Pratos Prontos'
] as const;

export const ALIMENTOS: Alimento[] = [
  // FRUTAS 🍎
  { id: 'maca', nome: 'Maçã', categoria: 'Frutas', emoji: '🍎', calorias: 52, proteina: 0.3, carboidratos: 14, gordura: 0.2, porcaoPadrao: 150, porcaoDescricao: '1 unidade média' },
  { id: 'banana', nome: 'Banana', categoria: 'Frutas', emoji: '🍌', calorias: 89, proteina: 1.1, carboidratos: 23, gordura: 0.3, porcaoPadrao: 120, porcaoDescricao: '1 unidade média' },
  { id: 'laranja', nome: 'Laranja', categoria: 'Frutas', emoji: '🍊', calorias: 47, proteina: 0.9, carboidratos: 12, gordura: 0.1, porcaoPadrao: 180, porcaoDescricao: '1 unidade média' },
  { id: 'mamao', nome: 'Mamão', categoria: 'Frutas', emoji: '🧡', calorias: 43, proteina: 0.5, carboidratos: 11, gordura: 0.3, porcaoPadrao: 150, porcaoDescricao: '1 fatia média' },
  { id: 'abacaxi', nome: 'Abacaxi', categoria: 'Frutas', emoji: '🍍', calorias: 50, proteina: 0.5, carboidratos: 13, gordura: 0.1, porcaoPadrao: 100, porcaoDescricao: '2 fatias' },
  { id: 'manga', nome: 'Manga', categoria: 'Frutas', emoji: '🥭', calorias: 60, proteina: 0.8, carboidratos: 15, gordura: 0.4, porcaoPadrao: 150, porcaoDescricao: '1 fatia grande' },
  { id: 'uva', nome: 'Uva', categoria: 'Frutas', emoji: '🍇', calorias: 62, proteina: 0.6, carboidratos: 16, gordura: 0.2, porcaoPadrao: 100, porcaoDescricao: '1 cacho pequeno' },
  { id: 'morango', nome: 'Morango', categoria: 'Frutas', emoji: '🍓', calorias: 32, proteina: 0.7, carboidratos: 8, gordura: 0.3, porcaoPadrao: 100, porcaoDescricao: '8-10 unidades' },

  // VEGETAIS 🥬
  { id: 'brocolis', nome: 'Brócolis', categoria: 'Vegetais', emoji: '🥦', calorias: 34, proteina: 2.8, carboidratos: 7, gordura: 0.4, porcaoPadrao: 100, porcaoDescricao: '1 xícara' },
  { id: 'cenoura', nome: 'Cenoura', categoria: 'Vegetais', emoji: '🥕', calorias: 41, proteina: 0.9, carboidratos: 10, gordura: 0.2, porcaoPadrao: 80, porcaoDescricao: '1 unidade média' },
  { id: 'tomate', nome: 'Tomate', categoria: 'Vegetais', emoji: '🍅', calorias: 18, proteina: 0.9, carboidratos: 3.9, gordura: 0.2, porcaoPadrao: 120, porcaoDescricao: '1 unidade média' },
  { id: 'alface', nome: 'Alface', categoria: 'Vegetais', emoji: '🥬', calorias: 15, proteina: 1.4, carboidratos: 2.9, gordura: 0.1, porcaoPadrao: 50, porcaoDescricao: '2 folhas grandes' },
  { id: 'pepino', nome: 'Pepino', categoria: 'Vegetais', emoji: '🥒', calorias: 16, proteina: 0.7, carboidratos: 4, gordura: 0.1, porcaoPadrao: 100, porcaoDescricao: '1/2 unidade' },
  { id: 'cebola', nome: 'Cebola', categoria: 'Vegetais', emoji: '🧅', calorias: 40, proteina: 1.1, carboidratos: 9, gordura: 0.1, porcaoPadrao: 80, porcaoDescricao: '1/2 unidade média' },

  // GRÃOS E CEREAIS 🌾
  { id: 'arroz_branco', nome: 'Arroz Branco (cozido)', categoria: 'Grãos e Cereais', emoji: '🍚', calorias: 130, proteina: 2.7, carboidratos: 28, gordura: 0.3, porcaoPadrao: 150, porcaoDescricao: '1 xícara' },
  { id: 'arroz_integral', nome: 'Arroz Integral (cozido)', categoria: 'Grãos e Cereais', emoji: '🍙', calorias: 111, proteina: 2.6, carboidratos: 22, gordura: 0.9, porcaoPadrao: 150, porcaoDescricao: '1 xícara' },
  { id: 'feijao_preto', nome: 'Feijão Preto (cozido)', categoria: 'Grãos e Cereais', emoji: '🫘', calorias: 132, proteina: 8.9, carboidratos: 24, gordura: 0.5, porcaoPadrao: 100, porcaoDescricao: '1/2 xícara' },
  { id: 'feijao_carioca', nome: 'Feijão Carioca (cozido)', categoria: 'Grãos e Cereais', emoji: '🟤', calorias: 127, proteina: 8.7, carboidratos: 23, gordura: 0.5, porcaoPadrao: 100, porcaoDescricao: '1/2 xícara' },
  { id: 'macarrao', nome: 'Macarrão (cozido)', categoria: 'Grãos e Cereais', emoji: '🍝', calorias: 131, proteina: 5, carboidratos: 25, gordura: 1.1, porcaoPadrao: 100, porcaoDescricao: '1 xícara' },
  { id: 'pao_integral', nome: 'Pão Integral', categoria: 'Grãos e Cereais', emoji: '🍞', calorias: 247, proteina: 13, carboidratos: 41, gordura: 4.2, porcaoPadrao: 50, porcaoDescricao: '2 fatias' },
  { id: 'aveia', nome: 'Aveia em Flocos', categoria: 'Grãos e Cereais', emoji: '🥣', calorias: 389, proteina: 17, carboidratos: 66, gordura: 6.9, porcaoPadrao: 30, porcaoDescricao: '3 colheres sopa' },

  // PROTEÍNAS 🥩
  { id: 'frango_peito', nome: 'Peito de Frango (grelhado)', categoria: 'Proteínas', emoji: '🐔', calorias: 165, proteina: 31, carboidratos: 0, gordura: 3.6, porcaoPadrao: 120, porcaoDescricao: '1 filé médio' },
  { id: 'carne_bovina', nome: 'Carne Bovina Magra', categoria: 'Proteínas', emoji: '🥩', calorias: 250, proteina: 26, carboidratos: 0, gordura: 15, porcaoPadrao: 100, porcaoDescricao: '1 bife médio' },
  { id: 'peixe_tilapia', nome: 'Tilápia (grelhada)', categoria: 'Proteínas', emoji: '🐟', calorias: 128, proteina: 23, carboidratos: 0, gordura: 2.6, porcaoPadrao: 120, porcaoDescricao: '1 filé' },
  { id: 'ovo', nome: 'Ovo de Galinha', categoria: 'Proteínas', emoji: '🥚', calorias: 155, proteina: 13, carboidratos: 1.1, gordura: 11, porcaoPadrao: 60, porcaoDescricao: '1 unidade grande' },
  { id: 'atum_lata', nome: 'Atum em Lata (água)', categoria: 'Proteínas', emoji: '🐟', calorias: 116, proteina: 25, carboidratos: 0, gordura: 1, porcaoPadrao: 80, porcaoDescricao: '1 lata pequena' },

  // LATICÍNIOS 🥛
  { id: 'leite_integral', nome: 'Leite Integral', categoria: 'Laticínios', emoji: '🥛', calorias: 61, proteina: 3.2, carboidratos: 4.8, gordura: 3.3, porcaoPadrao: 200, porcaoDescricao: '1 copo' },
  { id: 'leite_desnatado', nome: 'Leite Desnatado', categoria: 'Laticínios', emoji: '🥛', calorias: 34, proteina: 3.4, carboidratos: 5, gordura: 0.2, porcaoPadrao: 200, porcaoDescricao: '1 copo' },
  { id: 'iogurte_natural', nome: 'Iogurte Natural', categoria: 'Laticínios', emoji: '🥛', calorias: 61, proteina: 3.5, carboidratos: 4.7, gordura: 3.3, porcaoPadrao: 170, porcaoDescricao: '1 pote' },
  { id: 'queijo_minas', nome: 'Queijo Minas', categoria: 'Laticínios', emoji: '🧀', calorias: 264, proteina: 17, carboidratos: 3, gordura: 20, porcaoPadrao: 30, porcaoDescricao: '1 fatia média' },
  { id: 'requeijao', nome: 'Requeijão', categoria: 'Laticínios', emoji: '🧀', calorias: 362, proteina: 11, carboidratos: 3, gordura: 35, porcaoPadrao: 15, porcaoDescricao: '1 colher sopa' },

  // GORDURAS 🥑
  { id: 'abacate', nome: 'Abacate', categoria: 'Gorduras', emoji: '🥑', calorias: 160, proteina: 2, carboidratos: 8.5, gordura: 15, porcaoPadrao: 100, porcaoDescricao: '1/2 unidade' },
  { id: 'azeite', nome: 'Azeite de Oliva', categoria: 'Gorduras', emoji: '🫒', calorias: 884, proteina: 0, carboidratos: 0, gordura: 100, porcaoPadrao: 10, porcaoDescricao: '1 colher sopa' },
  { id: 'castanha_para', nome: 'Castanha do Pará', categoria: 'Gorduras', emoji: '🌰', calorias: 656, proteina: 14, carboidratos: 12, gordura: 67, porcaoPadrao: 20, porcaoDescricao: '3 unidades' },
  { id: 'amendoim', nome: 'Amendoim', categoria: 'Gorduras', emoji: '🥜', calorias: 567, proteina: 26, carboidratos: 16, gordura: 49, porcaoPadrao: 30, porcaoDescricao: '1 punhado' },

  // BEBIDAS 🥤
  { id: 'agua', nome: 'Água', categoria: 'Bebidas', emoji: '💧', calorias: 0, proteina: 0, carboidratos: 0, gordura: 0, porcaoPadrao: 200, porcaoDescricao: '1 copo' },
  { id: 'suco_laranja', nome: 'Suco de Laranja Natural', categoria: 'Bebidas', emoji: '🧃', calorias: 45, proteina: 0.7, carboidratos: 10, gordura: 0.2, porcaoPadrao: 200, porcaoDescricao: '1 copo' },
  { id: 'cafe_preto', nome: 'Café Preto', categoria: 'Bebidas', emoji: '☕', calorias: 2, proteina: 0.3, carboidratos: 0, gordura: 0, porcaoPadrao: 150, porcaoDescricao: '1 xícara' },
  { id: 'cha_verde', nome: 'Chá Verde', categoria: 'Bebidas', emoji: '🍵', calorias: 1, proteina: 0, carboidratos: 0, gordura: 0, porcaoPadrao: 200, porcaoDescricao: '1 xícara' },

  // DOCES 🍰
  { id: 'chocolate_amargo', nome: 'Chocolate 70% Cacau', categoria: 'Doces', emoji: '🍫', calorias: 546, proteina: 7.8, carboidratos: 46, gordura: 31, porcaoPadrao: 20, porcaoDescricao: '2 quadrados' },
  { id: 'mel', nome: 'Mel', categoria: 'Doces', emoji: '🍯', calorias: 304, proteina: 0.3, carboidratos: 82, gordura: 0, porcaoPadrao: 20, porcaoDescricao: '1 colher sopa' },
  { id: 'acucar', nome: 'Açúcar Cristal', categoria: 'Doces', emoji: '🍯', calorias: 387, proteina: 0, carboidratos: 100, gordura: 0, porcaoPadrao: 10, porcaoDescricao: '1 colher sopa' },

  // LANCHES 🍿
  { id: 'biscoito_integral', nome: 'Biscoito Integral', categoria: 'Lanches', emoji: '🍪', calorias: 454, proteina: 7, carboidratos: 65, gordura: 18, porcaoPadrao: 30, porcaoDescricao: '4 unidades' },
  { id: 'pipoca', nome: 'Pipoca (sem óleo)', categoria: 'Lanches', emoji: '🍿', calorias: 375, proteina: 12, carboidratos: 74, gordura: 4.5, porcaoPadrao: 25, porcaoDescricao: '1 xícara' },
  { id: 'granola', nome: 'Granola', categoria: 'Lanches', emoji: '🥣', calorias: 471, proteina: 13, carboidratos: 64, gordura: 20, porcaoPadrao: 30, porcaoDescricao: '2 colheres sopa' },

  // PRATOS PRONTOS 🍽️
  { id: 'salada_mista', nome: 'Salada Mista', categoria: 'Pratos Prontos', emoji: '🥗', calorias: 35, proteina: 2, carboidratos: 7, gordura: 0.5, porcaoPadrao: 150, porcaoDescricao: '1 prato sobremesa' },
  { id: 'sanduiche_natural', nome: 'Sanduíche Natural', categoria: 'Pratos Prontos', emoji: '🥪', calorias: 250, proteina: 12, carboidratos: 30, gordura: 8, porcaoPadrao: 150, porcaoDescricao: '1 unidade' },
  { id: 'pizza_margherita', nome: 'Pizza Margherita', categoria: 'Pratos Prontos', emoji: '🍕', calorias: 266, proteina: 11, carboidratos: 33, gordura: 10, porcaoPadrao: 125, porcaoDescricao: '1 fatia média' },
  { id: 'hamburguer_caseiro', nome: 'Hambúrguer Caseiro', categoria: 'Pratos Prontos', emoji: '🍔', calorias: 295, proteina: 17, carboidratos: 24, gordura: 15, porcaoPadrao: 200, porcaoDescricao: '1 unidade' }
];

// Função para buscar alimentos
export function buscarAlimentos(termo: string): Alimento[] {
  const termoLimpo = termo.toLowerCase().trim();
  if (!termoLimpo) return ALIMENTOS;
  
  return ALIMENTOS.filter(alimento => 
    alimento.nome.toLowerCase().includes(termoLimpo) ||
    alimento.categoria.toLowerCase().includes(termoLimpo)
  );
}

// Função para calcular valores nutricionais baseado na quantidade
export function calcularNutricao(alimento: Alimento, quantidade: number) {
  const fator = quantidade / 100; // quantidade em gramas / 100g
  return {
    calorias: Math.round(alimento.calorias * fator),
    proteina: +(alimento.proteina * fator).toFixed(1),
    carboidratos: +(alimento.carboidratos * fator).toFixed(1),
    gordura: +(alimento.gordura * fator).toFixed(1)
  };
}