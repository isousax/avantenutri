import { ExerciciosInteligentes } from '../../components/dashboard/ExerciciosInteligentes';
import { SEO } from '../../components/comum/SEO';

export function ExerciciosPage() {
  return (
    <>
      <SEO
        title="Exercícios Inteligentes - AvanteNutri"
        description="Plano de exercícios personalizado e inteligente baseado no seu perfil, objetivos e dados de saúde"
      />
      <div className="min-h-screen bg-gray-50">
        <ExerciciosInteligentes />
      </div>
    </>
  );
}