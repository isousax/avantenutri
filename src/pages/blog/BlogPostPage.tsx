import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const BlogPostPage: React.FC = () => {
  //const { id } = useParams();
  
  const post = {
    id: '1',
    title: '10 Alimentos que Aumentam a Imunidade Naturalmente',
    content: `
      <h2>Introdução</h2>
      <p>Manter o sistema imunológico fortalecido é essencial para prevenir doenças e garantir qualidade de vida. A alimentação desempenha um papel fundamental nesse processo.</p>
      
      <h2>1. Frutas Cítricas</h2>
      <p>Laranja, limão, acerola e kiwi são ricos em vitamina C, que aumenta a produção de glóbulos brancos.</p>
      
      <h2>2. Alho</h2>
      <p>Contém alicina, composto com propriedades antibacterianas e antivirais.</p>
      
      <!-- Mais conteúdo... -->
    `,
    author: 'Dra. Andreina Cawanne',
    publishDate: '2025-09-15',
    readTime: 5,
    category: 'saude',
    tags: ['imunidade', 'alimentação saudável', 'prevenção'],
    imageUrl: '/blog/imunidade.jpg'
  };

  const relatedPosts = [
    { id: '2', title: 'Mitose e Mitose: Entenda a Diferença', category: 'ciencia' },
    { id: '3', title: 'Plano Alimentar para Gestantes', category: 'gestacao' },
    { id: '4', title: 'Como Montar uma Marmita Saudável', category: 'dicas' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-25 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Cabeçalho do Artigo */}
        <article className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <img 
            src={post.imageUrl} 
            alt={post.title}
            className="w-full h-64 object-cover"
          />
          
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                {post.category}
              </span>
              <span className="text-gray-500 text-sm">{post.readTime} min de leitura</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
            
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold">DA</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{post.author}</p>
                <p className="text-sm text-gray-500">
                  Publicado em {new Date(post.publishDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Conteúdo do Artigo */}
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </article>

        {/* Compartilhamento */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compartilhe este artigo</h3>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </Button>
            <Button variant="secondary" className="flex-1">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Twitter
            </Button>
            <Button variant="secondary" className="flex-1">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </Button>
          </div>
        </Card>

        {/* Artigos Relacionados */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Artigos Relacionados</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map(relatedPost => (
              <Card key={relatedPost.id} className="p-4 hover:shadow-lg transition-shadow">
                <Link to={`/blog/${relatedPost.id}`} className="block">
                  <h3 className="font-semibold text-gray-900 mb-2 hover:text-green-600 transition-colors">
                    {relatedPost.title}
                  </h3>
                  <span className="text-green-600 text-sm">{relatedPost.category}</span>
                </Link>
              </Card>
            ))}
          </div>
        </section>

        {/* Call-to-Action */}
        <Card className="p-8 text-center bg-gradient-to-r from-green-500 to-green-600 text-white">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">Pronto para Transformar sua Saúde?</h3>
          <p className="text-green-100 mb-6">
            Comece hoje mesmo sua jornada para uma vida mais saudável
          </p>
          <Link to="/questionario">
            <Button className="bg-white/30 text-green-600 hover:bg-green-50 px-8">
              Começar 
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default BlogPostPage;