import React, { useEffect, useState } from "react";
import { formatDate as fmtDate } from "../../../i18n";
import StructuredDietView from "../../../components/diet/StructuredDietView";
import { copyDietJson } from "../../../utils/structuredDietExport";
import type { StructuredDietData } from "../../../types/structuredDiet";

export interface PlanVersion {
  id: string | number;
  version_number: number;
  created_at: string;
  notes?: string;
  data?: unknown; // StructuredDietData ou outro formato arbitrário
}

export interface PlanDetail {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  versions: PlanVersion[];
  created_at: string;
}

function isStructuredDietData(x: unknown): x is StructuredDietData {
  if (!x || typeof x !== "object") return false;
  const d = x as { versao?: unknown; meals?: unknown };
  return d.versao === 1 && Array.isArray(d.meals);
}

const AdminVersionsSelector: React.FC<{ detail: PlanDetail }> = ({ detail }) => {
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    detail.versions.length ? String(detail.versions[detail.versions.length - 1].id) : null
  );

  useEffect(() => {
  setSelectedId(detail.versions.length ? String(detail.versions[detail.versions.length - 1].id) : null);
  }, [detail.id, detail.versions]);

  const sel = detail.versions.find((v) => String(v.id) === String(selectedId)) || detail.versions[detail.versions.length - 1];

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {detail.versions.map((v, idx: number) => {
          const lastId = detail.versions[detail.versions.length - 1]?.id;
          const active = String(selectedId ?? lastId) === String(v.id);
          const isTemp = String(v.id).startsWith("temp-rev-");
          return (
            <button
              key={v.id}
              onClick={() => setSelectedId(String(v.id))}
              className={`flex-none px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
                active ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
              }`}
              title={fmtDate(v.created_at, "pt", { dateStyle: "short" })}
            >
              v{v.version_number}
              {idx === detail.versions.length - 1 && (
                <span className="ml-2 text-[10px] font-bold">•</span>
              )}
              {isTemp && <span className="ml-2 text-[10px]">(sync)</span>}
            </button>
          );
        })}
      </div>
      {sel && (
        <div className="mt-2 p-3 border rounded-lg bg-white/70">
          <div className="flex items-center justify-between text-xs mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">v{sel.version_number}</span>
              {String(sel.id).startsWith("temp-rev-") && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded">Sincronizando...</span>
              )}
            </div>
            <span>{fmtDate(sel.created_at, "pt", { dateStyle: "short" })}</span>
          </div>
          {sel.notes && <div className="italic text-gray-600 text-xs mb-2">{sel.notes}</div>}
          {isStructuredDietData(sel.data) && (
            <div className="space-y-1">
              <StructuredDietView data={sel.data} compact />
              <div className="flex gap-2 flex-wrap text-[10px] items-center">
                <button type="button" className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => console.log("Baixar PDF", { alert: "Função desabilitada temporariamente" })}>
                  Baixar PDF
                </button>
                <button type="button" className="px-2 py-1 bg-amber-600 text-white rounded" onClick={() => copyDietJson(sel.data as StructuredDietData)}>
                  Copiar JSON
                </button>
              </div>
            </div>
          )}
          {Boolean(sel.data) && !isStructuredDietData(sel.data) && (
            <pre className="bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto text-[10px] max-h-40">{`${JSON.stringify(sel.data, null, 2)}`}</pre>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminVersionsSelector;
