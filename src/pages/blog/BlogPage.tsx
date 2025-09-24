import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

// Tipos e dados mock
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishDate: string;
  readTime: number;
  category: string;
  tags: string[];
  imageUrl: string;
  featured?: boolean;
  views?: number;
  likes?: number;
}

const BlogPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Dados mockados melhorados
  const blogPosts: BlogPost[] = [
    {
      id: '1',
      title: '10 Alimentos que Aumentam a Imunidade Naturalmente',
      excerpt: 'Descubra como fortalecer seu sistema imunológico através da alimentação com ingredientes simples do dia a dia.',
      content: '',
      author: 'Dra. Andreina Cawanne',
      publishDate: '2025-09-15',
      readTime: 5,
      category: 'saude',
      tags: ['imunidade', 'alimentação saudável', 'prevenção', 'vitaminas'],
      imageUrl: '/blog/imunidade.jpg',
      featured: true,
      views: 1247,
      likes: 89
    },
    {
      id: '2',
      title: 'Mitose e Meiose: Entenda a Diferença na Prática',
      excerpt: 'Aprenda a distinguir esses dois processos celulares fundamentais de forma simples e prática.',
      content: '',
      author: 'Dra. Andreina Cawanne',
      publishDate: '2025-09-10',
      readTime: 7,
      category: 'ciencia',
      tags: ['mitose', 'meiose', 'biologia celular', 'genética'],
      imageUrl: '/blog/mitose-meiose.jpg',
      featured: true,
      views: 892,
      likes: 67
    },
    {
      id: '3',
      title: 'Plano Alimentar para Gestantes: Guia Completo',
      excerpt: 'Tudo o que você precisa saber sobre nutrição durante a gravidez para mãe e bebê saudáveis.',
      content: '',
      author: 'Dra. Andreina Cawanne',
      publishDate: '2025-09-05',
      readTime: 8,
      category: 'gestacao',
      tags: ['gestação', 'nutrição materna', 'gravidez saudável', 'suplementação'],
      imageUrl: '/blog/gestantes.jpg',
      views: 1563,
      likes: 124
    },
    {
      id: '4',
      title: 'Como Montar uma Marmita Saudável para a Semana',
      excerpt: 'Dicas práticas para preparar refeições nutritivas e economizar tempo durante a semana.',
      content: '',
      author: 'Dra. Andreina Cawanne',
      publishDate: '2025-08-28',
      readTime: 6,
      category: 'dicas',
      tags: ['meal prep', 'marmita', 'organização', 'receitas práticas'],
      imageUrl: '/blog/marmita.jpg',
      views: 2105,
      likes: 156
    },
    {
      id: '5',
      title: 'Os Benefícios da Dieta Mediterrânea para o Coração',
      excerpt: 'Conheça os princípios dessa dieta que é campeã em saúde cardiovascular.',
      content: '',
      author: 'Dra. Andreina Cawanne',
      publishDate: '2025-08-20',
      readTime: 7,
      category: 'dietas',
      tags: ['dieta mediterrânea', 'saúde cardíaca', 'alimentação', 'omega-3'],
      imageUrl: '/blog/dieta-mediterranea.jpg',
      views: 1789,
      likes: 98
    },
    {
      id: '6',
      title: 'Suplementação Esportiva: O que Realmente Funciona',
      excerpt: 'Guia completo sobre suplementos para atletas e praticantes de atividade física.',
      content: '',
      author: 'Dra. Andreina Cawanne',
      publishDate: '2025-08-15',
      readTime: 10,
      category: 'esporte',
      tags: ['suplementos', 'esporte', 'performance', 'whey protein'],
      imageUrl: '/blog/suplementacao.jpg',
      views: 2450,
      likes: 187
    },
    {
      id: '7',
      title: 'Intolerância à Lactose: Guia Prático para uma Dieta Segura',
      excerpt: 'Como identificar, tratar e adaptar sua alimentação quando há intolerância à lactose.',
      content: '',
      author: 'Dra. Andreina Cawanne',
      publishDate: '2025-08-10',
      readTime: 8,
      category: 'saude',
      tags: ['intolerância alimentar', 'lactose', 'dieta', 'saúde digestiva'],
      imageUrl: '/blog/lactose.jpg',
      views: 1320,
      likes: 76
    },
    {
      id: '8',
      title: 'Alimentação Infantil: Como Criar Hábitos Saudáveis desde Cedo',
      excerpt: 'Estratégias práticas para introduzir alimentos saudáveis na rotina das crianças.',
      content: '',
      author: 'Dra. Andreina Cawanne',
      publishDate: '2025-08-05',
      readTime: 9,
      category: 'infantil',
      tags: ['alimentação infantil', 'crianças', 'hábitos saudáveis', 'nutrição'],
      imageUrl: '/blog/infantil.jpg',
      views: 1987,
      likes: 143
    }
  ];

  const categories = [
    { id: 'todos', name: 'Todos os Artigos', count: blogPosts.length, icon: '📚' },
    { id: 'saude', name: 'Saúde & Bem-estar', count: blogPosts.filter(p => p.category === 'saude').length, icon: '💚' },
    { id: 'dietas', name: 'Dietas Específicas', count: blogPosts.filter(p => p.category === 'dietas').length, icon: '🥗' },
    { id: 'gestacao', name: 'Nutrição na Gestação', count: blogPosts.filter(p => p.category === 'gestacao').length, icon: '🤰' },
    { id: 'esporte', name: 'Nutrição Esportiva', count: blogPosts.filter(p => p.category === 'esporte').length, icon: '🏃‍♀️' },
    { id: 'dicas', name: 'Dicas Práticas', count: blogPosts.filter(p => p.category === 'dicas').length, icon: '💡' },
    { id: 'ciencia', name: 'Ciência da Nutrição', count: blogPosts.filter(p => p.category === 'ciencia').length, icon: '🔬' },
    { id: 'infantil', name: 'Nutrição Infantil', count: blogPosts.filter(p => p.category === 'infantil').length, icon: '👶' }
  ];

  // Tags populares extraídas de todos os posts
  const popularTags = useMemo(() => {
    const allTags = blogPosts.flatMap(post => post.tags);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [blogPosts]);

  // Filtrar e ordenar posts
  const filteredPosts = useMemo(() => {
    let filtered = blogPosts.filter(post => {
      const matchesCategory = selectedCategory === 'todos' || post.category === selectedCategory;
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });

    // Ordenação
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'trending':
        // Combina views e likes para um score de tendência
        filtered.sort((a, b) => {
          const scoreA = (a.views || 0) + (a.likes || 0) * 10;
          const scoreB = (b.views || 0) + (b.likes || 0) * 10;
          return scoreB - scoreA;
        });
        break;
    }

    return filtered;
  }, [blogPosts, selectedCategory, searchTerm, sortBy]);

  const featuredPosts = blogPosts.filter(post => post.featured);
  const recentPosts = blogPosts.slice(0, 4);
  const mostPopularPosts = [...blogPosts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      // Simular cadastro na newsletter
      setIsSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  const BlogPostCard: React.FC<{ post: BlogPost; variant?: 'default' | 'featured' | 'compact' }> = ({ 
    post, 
    variant = 'default' 
  }) => {
    const category = categories.find(cat => cat.id === post.category);
    
    if (variant === 'compact') {
      return (
        <Link to={`/blog/${post.id}`} className="flex items-center gap-3 group p-3 rounded-lg hover:bg-green-50 transition-colors">
          <img 
            src={post.imageUrl} 
            alt={post.title}
            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2 text-sm leading-tight">
              {post.title}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(post.publishDate).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </Link>
      );
    }

    if (variant === 'featured') {
      return (
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-white to-green-25">
          <Link to={`/blog/${post.id}`} className="block">
            <div className="relative">
              <img 
                src={post.imageUrl} 
                alt={post.title}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-full">
                  {category?.icon} {category?.name}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
                <span className="bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                  ⏱️ {post.readTime} min
                </span>
                {post.views && (
                  <span className="bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                    👁️ {post.views.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors line-clamp-2">
                {post.title}
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                    AC
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{post.author}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(post.publishDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                  Ler Artigo
                </Button>
              </div>
            </div>
          </Link>
        </Card>
      );
    }

    // Variante padrão
    return (
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group h-full flex flex-col">
        <Link to={`/blog/${post.id}`} className="flex flex-col h-full">
          <div className="relative overflow-hidden">
            <img 
              src={post.imageUrl} 
              alt={post.title}
              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3">
              <span className="px-2 py-1 bg-white bg-opacity-90 text-green-800 text-xs font-medium rounded">
                {category?.icon} {category?.name}
              </span>
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-500 text-sm flex items-center gap-1">
                ⏱️ {post.readTime} min
              </span>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {post.views && (
                  <span className="flex items-center gap-1">
                    👁️ {(post.views / 1000).toFixed(1)}k
                  </span>
                )}
                {post.likes && (
                  <span className="flex items-center gap-1">
                    ❤️ {post.likes}
                  </span>
                )}
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors line-clamp-2 flex-1">
              {post.title}
            </h3>
            <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
            
            <div className="flex flex-wrap gap-1 mb-4">
              {post.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  #{tag}
                </span>
              ))}
            </div>
            
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                  AC
                </div>
                <span className="text-sm text-gray-600">{post.author}</span>
              </div>
              <Button variant="secondary" className="text-sm">
                Ler Mais
              </Button>
            </div>
          </div>
        </Link>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-25 via-white to-emerald-25">
      {/* Header Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <span className="inline-block px-4 py-2 bg-white bg-opacity-20 rounded-full text-sm font-medium mb-4">
              📚 Blog de Nutrição Científica
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Conhecimento que 
              <span className="text-yellow-300"> Transforma</span> Vidas
            </h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto leading-relaxed">
              Artigos baseados em evidências científicas, dicas práticas e orientações 
              especializadas para sua jornada de saúde e bem-estar.
            </p>
            
            {/* Search Bar Melhorada */}
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Buscar artigos, dicas, receitas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-lg"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <Button className="bg-green-600 hover:bg-green-700">
                    Buscar
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {popularTags.slice(0, 5).map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSearchTerm(tag)}
                    className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-sm transition-all"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Featured Posts Carousel */}
        {featuredPosts.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">🌟 Artigos em Destaque</h2>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Ordenar por:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="recent">Mais Recentes</option>
                  <option value="popular">Mais Populares</option>
                  <option value="trending">Em Alta</option>
                </select>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              {featuredPosts.map(post => (
                <BlogPostCard key={post.id} post={post} variant="featured" />
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Conteúdo Principal */}
          <main className="lg:w-3/4">
            {/* Filtros de Categoria */}
            <section className="mb-8">
              <div className="flex flex-wrap gap-3">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-green-50 border border-gray-200 hover:border-green-200'
                    }`}
                  >
                    <span className="text-lg">{category.icon}</span>
                    {category.name}
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedCategory === category.id 
                        ? 'bg-white bg-opacity-20' 
                        : 'bg-gray-100'
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Grid de Artigos */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCategory === 'todos' ? 'Todos os Artigos' : 
                   categories.find(cat => cat.id === selectedCategory)?.name}
                  <span className="text-green-600 ml-2">({filteredPosts.length})</span>
                </h2>
                <span className="text-gray-500 text-sm">
                  Mostrando {Math.min(filteredPosts.length, 6)} de {filteredPosts.length} artigos
                </span>
              </div>
              
              {filteredPosts.length === 0 ? (
                <Card className="text-center py-16">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🔍</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum artigo encontrado</h3>
                  <p className="text-gray-600 mb-6">Tente ajustar os filtros ou termos de busca</p>
                  <Button onClick={() => { setSelectedCategory('todos'); setSearchTerm(''); }}>
                    Ver Todos os Artigos
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPosts.map(post => (
                    <BlogPostCard key={post.id} post={post} />
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {filteredPosts.length > 6 && (
                <div className="text-center mt-12">
                  <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                    Carregar Mais Artigos
                  </Button>
                </div>
              )}
            </section>
          </main>

          {/* Sidebar Melhorada */}
          <aside className="lg:w-1/4 space-y-8">
            {/* Autor Profile */}
            <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                AC
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dra. Andreina Cawanne</h3>
              <p className="text-green-600 font-medium mb-3">Nutricionista CRP-XXXXX</p>
              <p className="text-gray-600 text-sm mb-4">
                Especialista em nutrição clínica e esportiva com 10+ anos de experiência 
                transformando vidas através da alimentação consciente.
              </p>
              <Button className="w-full bg-green-500 hover:bg-green-600">
                📞 Agendar Consulta
              </Button>
            </Card>

            {/* Posts Populares */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🔥 Mais Populares
              </h3>
              <div className="space-y-4">
                {mostPopularPosts.map(post => (
                  <BlogPostCard key={post.id} post={post} variant="compact" />
                ))}
              </div>
            </Card>

            {/* Categorias */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📂 Categorias</h3>
              <div className="space-y-3">
                {categories.filter(cat => cat.id !== 'todos').map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex justify-between items-center w-full text-left p-3 rounded-lg hover:bg-green-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{category.icon}</span>
                      <span className={`font-medium group-hover:text-green-600 ${
                        selectedCategory === category.id ? 'text-green-600' : 'text-gray-700'
                      }`}>
                        {category.name}
                      </span>
                    </div>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Tags Populares */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏷️ Tags Populares</h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSearchTerm(tag)}
                    className="px-3 py-2 bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 rounded-lg text-sm transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </Card>

            {/* Newsletter */}
            <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              {isSubscribed ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Inscrição Confirmada!</h3>
                  <p className="text-green-100 text-sm">
                    Obrigado por se inscrever. Em breve você receberá conteúdos exclusivos.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-2">📧 Newsletter Exclusiva</h3>
                  <p className="text-green-100 text-sm mb-4">
                    Receba artigos científicos, receitas saudáveis e dicas práticas 
                    antes de todo mundo.
                  </p>
                  <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                    <input
                      type="email"
                      placeholder="Seu melhor e-mail"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                      required
                    />
                    <Button type="submit" className="w-full bg-white text-green-600 hover:bg-green-50 font-semibold">
                      Quero Receber Conteúdos
                    </Button>
                  </form>
                  <p className="text-green-100 text-xs mt-3 text-center">
                    📍 Sem spam, apenas conteúdo de qualidade
                  </p>
                </>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;