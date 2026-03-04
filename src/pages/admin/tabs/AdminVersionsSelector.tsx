import React, { useEffect, useState } from "react";
import { formatDate as fmtDate } from "../../../i18n/utils";
import StructuredDietView from "../../../components/diet/StructuredDietView";
import { copyDietJson } from "../../../utils/structuredDietExport";
import type { StructuredDietData } from "../../../types/structuredDiet";
import StructuredDietBuilder from "../../../components/diet/StructuredDietBuilder";
import { exportDietPdf } from "../../../utils/structuredDietPdf";

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

interface Props {
  detail: PlanDetail;
  showAlternatives?: boolean;
  onToggleAlternatives?: React.Dispatch<React.SetStateAction<boolean>>;
}

const AdminVersionsSelector: React.FC<Props> = ({ detail, showAlternatives = true, onToggleAlternatives }) => {
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
                <button
                  type="button"
                  className="px-2 py-1 bg-blue-600 text-white rounded"
                  onClick={async () => {
                    try {
                      await exportDietPdf(sel.data as StructuredDietData, {
                        filename: `${detail.name}_v${sel.version_number}.pdf`.replace(/[^a-z0-9]/gi, "_"),
                        title: `${detail.name} - v${sel.version_number}`,
                        showAlternatives: true,
                        showPageNumbers: true,
                        headerText: "Plano Nutricional Personalizado",
                        footerText: "Avante Nutri - Nutrindo hábitos, transformando vidas",
                        watermarkText: "Avante Nutri",
                        watermarkRepeat: true,
                        watermarkOpacity: 0.05,
                        cover: {
                          title: `${detail.name}`,
                          subtitle: `Versão ${sel.version_number}`,
                          showTotals: true,
                          notes: "Seguir o plano alimentar conforme orientado, com boa hidratação e prática regular de exercícios.",
                          date: new Date(),
                          clientInfo: {
                            name: "Paciente",
                            age: 1,
                            gender: "Sexo",
                            weight: 1,
                            height: 1,
                            goal: "Objetivo",
                            nutritionist: "Dra. Andreina Cawanne",
                            crn: "43669",
                          },
                          showMacronutrientChart: true,
                          signature: {
                            name: "Dra. Andreina Cawanne",
                            role: "Nutricionista",
                            license: "CRN-PE 43669",
                          },
                        },
                        company: {
                          logoUrl: "/logoName.png",
                          logoheader: "/logoHeader.png",
                          name: "Souza Cawanne Nutrição",
                          contact: "souzacawanne@gmail.com",
                          address: "Online",
                        },
                      });
                    } catch (err) {
                      // eslint-disable-next-line no-console
                      console.error("Erro ao gerar PDF:", err);
                      alert("Falha ao gerar PDF");
                    }
                  }}
                >
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
          {showAlternatives && isStructuredDietData(sel.data) && (
            <div className="mt-4">
              <StructuredDietBuilder
                value={sel.data}
                onChange={() => { /* no-op in history view */ }}
                compact={true}
                showAlternatives={showAlternatives}
                onToggleAlternatives={onToggleAlternatives ?? (() => {})}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminVersionsSelector;
