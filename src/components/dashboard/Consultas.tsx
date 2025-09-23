import Card from "../ui/Card";
import Button from "../ui/Button";

const Consultas: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Minhas Consultas</h2>
        <Button>Agendar Consulta</Button>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Próximas Consultas
        </h3>
        {/* Conteúdo das consultas */}
      </Card>
    </div>
  );
};
export default Consultas;
