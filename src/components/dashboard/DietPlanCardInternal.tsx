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
    <div className={`border rounded-md p-3 bg-white shadow-sm relative ${String(diet.id).startsWith('temp-') ? 'opacity-70' : ''}`}> 
      {String(diet.id).startsWith('temp-') && (
        <div className="absolute top-1 right-2 text-[10px] uppercase tracking-wide text-amber-600 font-semibold">Sincronizando...</div>
      )}
      <div className="flex items-center justify-between">
        <div>
            <h4 className="font-medium text-sm flex items-center gap-2">
              {diet?.title || diet?.name || 'Plano de dieta'}
              {diet.current_version_id && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">Atual</span>}
            </h4>
            <p className="text-xs text-gray-500 flex items-center gap-2">Status: {diet?.status || 'indefinido'}</p>
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