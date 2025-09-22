import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';

const categorias = [
  { label: 'Infantil', value: 'infantil' },
  { label: 'Gestante', value: 'gestante' },
  { label: 'Adulto/Idoso', value: 'adulto' },
];

const perguntasPorCategoria: Record<string, string[]> = {
  infantil: [
    'Nome da criança',
    'Idade',
    'Possui restrições alimentares?',
    'Objetivo nutricional',
  ],
  gestante: [
    'Nome',
    'Idade',
    'Tempo de gestação',
    'Possui restrições alimentares?',
    'Objetivo nutricional',
  ],
  adulto: [
    'Nome',
    'Idade',
    'Profissão',
    'Possui restrições alimentares?',
    'Objetivo nutricional',
  ],
};

const etapas = ['Contato', 'Categoria', 'Perguntas', 'Pagamento', 'Resumo'];

const QuestionarioPage: React.FC = () => {
  const [step, setStep] = useState(0);
  const [categoria, setCategoria] = useState('');
  const [respostas, setRespostas] = useState<Record<string, string>>({});

  const handleNext = () => setStep((s) => Math.min(s + 1, etapas.length - 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  // Renderização condicional por etapa
  let conteudo;
  if (step === 0) {
    conteudo = (
      <>
        <h2 className="text-xl font-bold mb-4 text-green-700">Dados de Contato</h2>
        <input className="mb-2 border rounded px-4 py-2 w-full" placeholder="Nome completo" onChange={e => setRespostas(r => ({...r, nome: e.target.value}))} />
        <input className="mb-2 border rounded px-4 py-2 w-full" placeholder="E-mail" onChange={e => setRespostas(r => ({...r, email: e.target.value}))} />
        <Button onClick={handleNext} className="w-full mt-2">Próxima etapa</Button>
      </>
    );
  } else if (step === 1) {
    conteudo = (
      <>
        <h2 className="text-xl font-bold mb-4 text-green-700">Selecione a categoria</h2>
        <div className="flex flex-col gap-2 mb-4">
          {categorias.map(cat => (
            <Button key={cat.value} variant={categoria === cat.value ? 'primary' : 'secondary'} className="w-full" onClick={() => setCategoria(cat.value)}>{cat.label}</Button>
          ))}
        </div>
        <Button onClick={handleNext} className="w-full" disabled={!categoria}>Próxima etapa</Button>
        <Button onClick={handleBack} className="w-full mt-2" variant="secondary">Voltar</Button>
      </>
    );
  } else if (step === 2 && categoria) {
    conteudo = (
      <>
        <h2 className="text-xl font-bold mb-4 text-green-700">Perguntas</h2>
        <div className="flex flex-col gap-2 mb-4">
          {perguntasPorCategoria[categoria].map((pergunta, idx) => (
            <input
              key={idx}
              className="border rounded px-4 py-2 w-full"
              placeholder={pergunta}
              onChange={e => setRespostas(r => ({...r, [pergunta]: e.target.value}))}
            />
          ))}
        </div>
        <Button onClick={handleNext} className="w-full">Próxima etapa</Button>
        <Button onClick={handleBack} className="w-full mt-2" variant="secondary">Voltar</Button>
      </>
    );
  } else if (step === 3) {
    conteudo = (
      <>
        <h2 className="text-xl font-bold mb-4 text-green-700">Pagamento</h2>
        <div className="mb-4 text-gray-600">(Simulação de pagamento. Integração real pode ser feita depois.)</div>
        <Button onClick={handleNext} className="w-full">Finalizar</Button>
        <Button onClick={handleBack} className="w-full mt-2" variant="secondary">Voltar</Button>
      </>
    );
  } else if (step === 4) {
    conteudo = (
      <>
        <h2 className="text-xl font-bold mb-4 text-green-700">Resumo</h2>
        <div className="mb-4 text-gray-700">
          <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(respostas, null, 2)}</pre>
        </div>
        <Button className="w-full" onClick={() => alert('Enviado!')}>Enviar</Button>
      </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <Card className="w-full max-w-xl">
        <ProgressBar value={step + 1} max={etapas.length} />
        <div className="mt-6">{conteudo}</div>
      </Card>
    </div>
  );
};

export default QuestionarioPage;
