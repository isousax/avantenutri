import React from 'react';

interface DietPlanCardInternalProps {
  diet: any; // TODO: replace with proper DietPlan type
  onView?: () => void;
  onRevise?: () => void;
  canEdit?: boolean;
  locale?: string;
}

const DietPlanCardInternal: React.FC<DietPlanCardInternalProps> = ({ diet, onView, onRevise, canEdit }) => {
  return (
    <div className="border rounded-md p-3 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div>
            <h4 className="font-medium text-sm">{diet?.title || 'Plano de dieta'}</h4>
            <p className="text-xs text-gray-500">Status: {diet?.status || 'indefinido'}</p>
        </div>
        <div className="flex gap-2">
          {onView && <button onClick={onView} className="text-xs text-blue-600 hover:underline">Ver</button>}
          {canEdit && onRevise && <button onClick={onRevise} className="text-xs text-amber-600 hover:underline">Revisar</button>}
        </div>
      </div>
    </div>
  );
};

export default DietPlanCardInternal;