import React, { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Footer from "../../components/layout/Footer";

// Tipos e dados mock (depois pode vir de uma API)
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
}

const BlogPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");

  // Dados mockados do blog
  const blogPosts: BlogPost[] = [
    {
      id: "1",
      title: "10 Alimentos que Aumentam a Imunidade Naturalmente",
      excerpt:
        "Descubra como fortalecer seu sistema imunológico através da alimentação com ingredientes simples do dia a dia.",
      content: "",
      author: "Dra. Andreina Cawanne",
      publishDate: "2025-09-15",
      readTime: 5,
      category: "saude",
      tags: ["imunidade", "alimentação saudável", "prevenção"],
      imageUrl: "/blog/imunidade.jpg",
      featured: true,
    },
    {
      id: "2",
      title: "Mitose e Mitose: Entenda a Diferença na Prática",
      excerpt:
        "Aprenda a distinguir esses dois processos celulares fundamentais de forma simples e prática.",
      content: "",
      author: "Dra. Andreina Cawanne",
      publishDate: "2025-09-10",
      readTime: 7,
      category: "ciencia",
      tags: ["mitose", "mitose", "biologia celular"],
      imageUrl: "/blog/mitose-mitose.jpg",
      featured: true,
    },
    {
      id: "3",
      title: "Plano Alimentar para Gestantes: Guia Completo",
      excerpt:
        "Tudo o que você precisa saber sobre nutrição durante a gravidez para mãe e bebê saudáveis.",
      content: "",
      author: "Dra. Andreina Cawanne",
      publishDate: "2025-09-05",
      readTime: 8,
      category: "gestacao",
      tags: ["gestação", "nutrição materna", "gravidez saudável"],
      imageUrl: "/blog/gestantes.jpg",
    },
    {
      id: "4",
      title: "Como Montar uma Marmita Saudável para a Semana",
      excerpt:
        "Dicas práticas para preparar refeições nutritivas e economizar tempo durante a semana.",
      content: "",
      author: "Dra. Andreina Cawanne",
      publishDate: "2025-08-28",
      readTime: 6,
      category: "dicas",
      tags: ["meal prep", "marmita", "organização"],
      imageUrl: "/blog/marmita.jpg",
    },
    {
      id: "5",
      title: "Os Benefícios da Dieta Mediterrânea para o Coração",
      excerpt:
        "Conheça os princípios dessa dieta que é campeã em saúde cardiovascular.",
      content: "",
      author: "Dra. Andreina Cawanne",
      publishDate: "2025-08-20",
      readTime: 7,
      category: "dietas",
      tags: ["dieta mediterrânea", "saúde cardíaca", "alimentação"],
      imageUrl: "/blog/dieta-mediterranea.jpg",
    },
    {
      id: "6",
      title: "Suplementação Esportiva: O que Realmente Funciona",
      excerpt:
        "Guia completo sobre suplementos para atletas e praticantes de atividade física.",
      content: "",
      author: "Dra. Andreina Cawanne",
      publishDate: "2025-08-15",
      readTime: 10,
      category: "esporte",
      tags: ["suplementos", "esporte", "performance"],
      imageUrl: "/blog/suplementacao.jpg",
    },
  ];

  const categories = [
    { id: "todos", name: "Todos os Artigos", count: blogPosts.length },
    {
      id: "saude",
      name: "Saúde & Bem-estar",
      count: blogPosts.filter((p) => p.category === "saude").length,
    },
    {
      id: "dietas",
      name: "Dietas Específicas",
      count: blogPosts.filter((p) => p.category === "dietas").length,
    },
    {
      id: "gestacao",
      name: "Nutrição na Gestação",
      count: blogPosts.filter((p) => p.category === "gestacao").length,
    },
    {
      id: "esporte",
      name: "Nutrição Esportiva",
      count: blogPosts.filter((p) => p.category === "esporte").length,
    },
    {
      id: "dicas",
      name: "Dicas Práticas",
      count: blogPosts.filter((p) => p.category === "dicas").length,
    },
    {
      id: "ciencia",
      name: "Ciência da Nutrição",
      count: blogPosts.filter((p) => p.category === "ciencia").length,
    },
  ];

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory =
      selectedCategory === "todos" || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  const featuredPost = blogPosts.find((post) => post.featured);
  const recentPosts = blogPosts.slice(0, 3);

  const BlogPostCard: React.FC<{ post: BlogPost }> = ({ post }) => (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <Link to={`/blog/${post.id}`}>
        <div className="aspect-w-16 aspect-h-9 bg-gray-200 overflow-hidden">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
              {categories.find((cat) => cat.id === post.category)?.name}
            </span>
            <span className="text-gray-500 text-sm">
              {post.readTime} min de leitura
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-green-600 font-bold text-sm">DA</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {post.author}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(post.publishDate).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            <Button variant="secondary" className="text-sm">
              Ler Mais
            </Button>
          </div>
        </div>
      </Link>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-25">
      {/* Header do Blog */}
      <section className="bg-green-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Blog de Nutrição
          </h1>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Artigos, dicas e informações baseadas em ciência para ajudar você na
            jornada de uma alimentação mais saudável e consciente.
          </p>
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar artigos, dicas, receitas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <svg
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Conteúdo Principal */}
          <main className="lg:w-3/4">
            {/* Post em Destaque */}
            {featuredPost && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Em Destaque
                </h2>
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300">
                  <Link
                    to={`/blog/${featuredPost.id}`}
                    className="flex flex-col md:flex-row"
                  >
                    <div className="md:w-1/2">
                      <img
                        src={featuredPost.imageUrl}
                        alt={featuredPost.title}
                        className="w-full h-64 md:h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="md:w-1/2 p-8">
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full mb-4 inline-block">
                        {
                          categories.find(
                            (cat) => cat.id === featuredPost.category
                          )?.name
                        }
                      </span>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 hover:text-green-600 transition-colors">
                        {featuredPost.title}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-green-600 font-bold">DA</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {featuredPost.author}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(
                                featuredPost.publishDate
                              ).toLocaleDateString("pt-BR")}{" "}
                              • {featuredPost.readTime} min de leitura
                            </p>
                          </div>
                        </div>
                        <Button>Ler Artigo Completo</Button>
                      </div>
                    </div>
                  </Link>
                </Card>
              </section>
            )}

            {/* Filtros de Categoria */}
            <section className="mb-8">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === category.id
                        ? "bg-green-600 text-white"
                        : "bg-white text-gray-700 hover:bg-green-50 border border-gray-200"
                    }`}
                  >
                    {category.name} ({category.count})
                  </button>
                ))}
              </div>
            </section>

            {/* Grid de Artigos */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {selectedCategory === "todos"
                  ? "Todos os Artigos"
                  : categories.find((cat) => cat.id === selectedCategory)?.name}
                <span className="text-green-600 ml-2">
                  ({filteredPosts.length})
                </span>
              </h2>

              {filteredPosts.length === 0 ? (
                <Card className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhum artigo encontrado
                  </h3>
                  <p className="text-gray-600">
                    Tente ajustar os filtros ou termos de busca
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPosts.map((post) => (
                    <BlogPostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </section>
          </main>

          {/* Sidebar */}
          <aside className="lg:w-1/4 space-y-8">
            {/* Sobre o Blog */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sobre o Blog
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Espaço dedicado à compartilhar conhecimento científico sobre
                nutrição, saúde e bem-estar de forma acessível e prática.
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">DA</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Dra. Andreina Cawanne
                  </p>
                  <p className="text-sm text-gray-500">
                    Nutricionista CRP-XXXXX
                  </p>
                </div>
              </div>
            </Card>

            {/* Categorias */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Categorias
              </h3>
              <div className="space-y-2">
                {categories
                  .filter((cat) => cat.id !== "todos")
                  .map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className="flex justify-between items-center w-full text-left p-2 rounded hover:bg-green-50 transition-colors"
                    >
                      <span
                        className={`${
                          selectedCategory === category.id
                            ? "text-green-600 font-medium"
                            : "text-gray-600"
                        }`}
                      >
                        {category.name}
                      </span>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                        {category.count}
                      </span>
                    </button>
                  ))}
              </div>
            </Card>

            {/* Posts Recentes */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Posts Recentes
              </h3>
              <div className="space-y-4">
                {recentPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.id}`}
                    className="flex items-center group"
                  >
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-12 h-12 object-cover rounded mr-3"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2">
                        {post.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(post.publishDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Newsletter */}
            <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
              <h3 className="text-lg font-semibold mb-2">Newsletter</h3>
              <p className="text-green-100 text-sm mb-4">
                Receba artigos exclusivos e dicas de nutrição no seu e-mail.
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Seu melhor e-mail"
                  className="w-full px-4 py-2 rounded text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                />
                <Button className="w-full bg-white text-green-600 hover:bg-green-50">
                  Inscrever-se
                </Button>
              </div>
            </Card>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPage;
