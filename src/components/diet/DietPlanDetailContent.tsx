import React, { useEffect, useState } from "react";
import StructuredDietView from "./StructuredDietView";
import type { StructuredDietData } from "../../types/structuredDiet";
import { exportDietPdf } from "../../utils/structuredDietPdf";
import { API } from "../../config/api";
import { formatDate as fmtDate } from "../../i18n";
import type { Locale } from "../../i18n";
import type { DietPlanDetail, DietPlanVersion } from "../../hooks/useDietPlans";
import type { PdfDietData } from "../../hooks/useDietPlansOptimized";
import { useAuthenticatedFetch } from "../../hooks/useApi";
import { API as Routes } from "../../config/api";

// Componente de Exportação para Versões Específicas
const DietVersionExportControls: React.FC<{
  data: StructuredDietData;
  version: number;
  planName: string;
  notes?: string | null;
}> = ({ data, version, planName, notes }) => {
  const [exporting, setExporting] = useState(false);
  const [phase, setPhase] = useState("");
  const authenticatedFetch = useAuthenticatedFetch();

  const computeAgeFromDob = (dobIso?: string | null): number | undefined => {
    if (!dobIso) return undefined;
    const d = new Date(dobIso);
    if (isNaN(d.getTime())) return undefined;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age >= 0 && age < 130 ? age : undefined;
  };

  const pick = (obj: Record<string, unknown>, ...keys: string[]): unknown => {
    for (const k of keys) {
      const v = obj[k];
      if (v !== undefined && v !== null && v !== "") return v;
    }
    return undefined;
  };

  const pickString = (
    obj: Record<string, unknown>,
    ...keys: string[]
  ): string | undefined => {
    const v = pick(obj, ...keys);
    return typeof v === "string" && v.trim() !== "" ? v : undefined;
  };

  return (
    <div className="flex gap-2 items-center">
      <button
        type="button"
        disabled={exporting}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          exporting
            ? "bg-indigo-400 text-white cursor-wait"
            : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
        }`}
        onClick={async () => {
          if (exporting) return;
          setExporting(true);
          setPhase("preparando");
          try {
            // Coletar dados dinâmicos para clientInfo
            setPhase("coletando dados");
            let qCategory: string | undefined;
            let qAnswers: Record<string, unknown> = {};
            let profileObj: Record<string, unknown> = {};
            let meObj: Record<string, unknown> = {};
            let latestWeight: number | undefined;

            try {
              const [qRes, meRes, pRes] = await Promise.all([
                authenticatedFetch(Routes.QUESTIONNAIRE),
                authenticatedFetch(Routes.ME, { method: "GET" }),
                authenticatedFetch(`${Routes.WEIGHT_SUMMARY}?days=120`),
              ]);
              // Me (preferido para nome)
              try {
                const meJson: unknown = await meRes.json();
                const meData =
                  typeof meJson === "object" && meJson !== null && "data" in meJson
                    ? (meJson as Record<string, unknown>).data
                    : meJson;
                meObj =
                  typeof meData === "object" && meData !== null
                    ? (meData as Record<string, unknown>)
                    : {};
              } catch (err) {
                void err; // no-op
              }
              // Questionnaire
              try {
                const qJson: unknown = await qRes.json();
                const qDataRaw =
                  typeof qJson === "object" && qJson !== null && "data" in qJson
                    ? (qJson as Record<string, unknown>).data
                    : qJson;
                const qDataObj: Record<string, unknown> =
                  typeof qDataRaw === "object" && qDataRaw !== null
                    ? (qDataRaw as Record<string, unknown>)
                    : {};
                qCategory =
                  typeof qDataObj.category === "string"
                    ? (qDataObj.category as string)
                    : undefined;
                qAnswers =
                  typeof qDataObj.answers === "object" && qDataObj.answers !== null
                    ? (qDataObj.answers as Record<string, unknown>)
                    : {};
              } catch (err) {
                void err; // no-op
              }
              // Profile
              try {
                const pJson: unknown = await pRes.json();
                let pData: unknown = pJson;
                if (typeof pJson === "object" && pJson !== null) {
                  const root = pJson as Record<string, unknown>;
                  if (typeof root.data === "object" && root.data !== null) {
                    pData = root.data as Record<string, unknown>;
                  } else if (
                    typeof root.user === "object" && root.user !== null
                  ) {
                    pData = root.user as Record<string, unknown>;
                  } else if (
                    typeof root.profile === "object" && root.profile !== null
                  ) {
                    pData = root.profile as Record<string, unknown>;
                  }
                }
                profileObj =
                  typeof pData === "object" && pData !== null
                    ? (pData as Record<string, unknown>)
                    : {};
              } catch (err) {
                void err; // no-op
              }
            } catch (err) {
              void err; // no-op
            }

            const getNum = (v: unknown): number | undefined => {
              if (v == null || v === "") return undefined;
              const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
              return Number.isFinite(n) ? n : undefined;
            };

            // Idade
            const qAge = getNum(pick(qAnswers, "idade"));
            const profileDob = pickString(
              profileObj,
              "birth_date",
              "birthdate",
              "dob",
              "date_of_birth"
            );
            const profileAge = computeAgeFromDob(typeof profileDob === "string" ? profileDob : undefined);
            const age = qCategory === "infantil" ? qAge : (profileAge ?? qAge);

            // Sexo
            const gender =
              pickString(qAnswers, "sexo") ??
              pickString(profileObj, "gender", "sexo") ??
              undefined;

            // Altura (cm)
            const qHeight = getNum(pick(qAnswers, "altura"));
            const profileHeight = getNum(
              pick(profileObj, "height_cm", "height", "altura", "altura_cm")
            );
            const height = qCategory === "infantil" ? qHeight : (profileHeight ?? qHeight);

            // Peso atual (kg)
            const qPesoAtual = getNum(pick(qAnswers, "peso"));
            const weight = latestWeight ?? qPesoAtual;

            // Objetivo
            const goal =
              pickString(
                qAnswers,
                "objetivo_nutricional"
              ) ??
              undefined;

            await exportDietPdf(data, {
              filename: `${planName}_v${version}.pdf`.replace(
                /[^a-z0-9]/gi,
                "_"
              ),
              title: `${planName} - v${version}`,
              showAlternatives: true,
              headerText: "Plano Nutricional Personalizado",
              footerText:
                "Avante Nutri - Nutrindo hábitos, transformando vidas",
              showPageNumbers: true,
              watermarkText: "Avante Nutri",
              watermarkRepeat: true,
              watermarkOpacity: 0.05,
              cover: {
                title: `${planName}`,
                subtitle: `Versão ${version}`,
                showTotals: true,
                notes:
                  notes ??
                  "Seguir o plano alimentar conforme orientado, com boa hidratação e prática regular de exercícios.",
                date: new Date(),
                clientInfo: {
                  name:
                    // Preferir /me (display_name, depois full_name)
                    pickString(meObj, "display_name", "full_name") ||
                    // Fallback ao profile
                    pickString(
                      profileObj,
                      "display_name",
                      "full_name",
                      "name",
                      "fullName",
                      "displayName"
                    ) ||
                    "Paciente",
                  age,
                  gender,
                  weight,
                  height,
                  goal,
                  nutritionist: "Dra. Andreina Cawanne",
                  crn: "43669/P",
                },
                showMacronutrientChart: true,
                signature: {
                  name: "Avante Nutri",
                  role: "Nutricionista",
                  license: "CRN-PE 43669",
                },
              },
              company: {
                logoUrl: "/logoName.png",
                logoheader: "/logoHeader.png",
                name: "Avante Nutri",
                contact: "souzacawanne@gmail.com",
                address: "Online",
              },
              phaseLabels: {
                prepare: "Preparando",
                render: "Renderizando",
                cover: "Capa",
                paginate: "Paginando",
                finalize: "Finalizando",
                done: "Concluído",
              },
              onProgress: (p: string) => setPhase(p),
            });
          } catch (e) {
            console.error(e);
            alert("Falha ao gerar PDF");
          } finally {
            setExporting(false);
            setPhase("");
          }
        }}
      >
        {exporting ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {phase}...
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Baixar
          </>
        )}
      </button>
    </div>
  );
};

// Componente de Card Nutricional
const NutritionCard: React.FC<{
  label: string;
  value: string | number;
  unit: string;
  color: string;
  icon: string;
}> = ({ label, value, unit, color, icon }) => (
  <div className={`p-4 rounded-2xl border-2 ${color} backdrop-blur-sm`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold uppercase tracking-wide opacity-75">
        {label}
      </span>
      <span className="text-lg">{icon}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-xl font-bold">{value}</span>
      <span className="text-sm opacity-75">{unit}</span>
    </div>
  </div>
);

// Componente de Seletor de Versão Mobile
const VersionSelector: React.FC<{
  versions: DietPlanVersion[];
  selectedVersionId: string | null;
  onSelect: (id: string) => void;
  locale: Locale;
}> = ({ versions, selectedVersionId, onSelect, locale }) => {
  const lastId = versions[versions.length - 1]?.id;

  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        {versions.map((v, idx) => {
          const active = (selectedVersionId ?? lastId) === v.id;
          const isLatest = idx === versions.length - 1;
          const isTemp = String(v.id).startsWith("temp-rev-");

          return (
            <button
              key={v.id}
              onClick={() => onSelect(v.id)}
              className={`flex-none flex flex-col items-center gap-1 p-3 rounded-xl border-2 min-w-[80px] transition-all ${
                active
                  ? "bg-green-50 border-green-200 shadow-sm"
                  : "bg-white border-gray-200 hover:border-gray-300"
              } ${isTemp ? "opacity-70 animate-pulse" : ""}`}
            >
              <span
                className={`text-sm font-bold ${
                  active ? "text-green-700" : "text-gray-700"
                }`}
              >
                v{v.version_number}
              </span>
              <span className="text-xs text-gray-500">
                {fmtDate(v.created_at, locale, { dateStyle: "short" })}
              </span>
              <div className="flex gap-1">
                {isLatest && (
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                )}
                {isTemp && (
                  <span className="text-[10px] text-amber-600 font-medium">
                    sync
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

function isPdfData(d: unknown): d is PdfDietData {
  return (
    typeof d === "object" &&
    d !== null &&
    "format" in d &&
    (d as { format?: unknown }).format === "pdf"
  );
}

function isStructuredDietData(d: unknown): d is StructuredDietData {
  return (
    typeof d === "object" &&
    d !== null &&
    "versao" in d &&
    (d as { versao?: unknown }).versao === 1 &&
    "meals" in d &&
    Array.isArray((d as { meals?: unknown }).meals)
  );
}

export interface DietPlanDetailContentProps {
  detailJson: DietPlanDetail | null;
  canEdit: boolean;
  onRevise: (notes: string) => Promise<void>;
  revising: boolean;
  locale: Locale;
}

const DietPlanDetailContent: React.FC<DietPlanDetailContentProps> = ({
  detailJson,
  locale,
}) => {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"dieta" | "nutrientes">("dieta");

  const cached = detailJson;

  useEffect(() => {
    const lastId =
      detailJson?.versions && detailJson.versions.length > 0
        ? detailJson.versions[detailJson.versions.length - 1]?.id
        : null;
    setSelectedVersionId(lastId ?? null);
  }, [detailJson?.id, detailJson?.versions]);

  if (!cached) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <svg
          className="w-16 h-16 mb-4 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-lg font-medium mb-2">Nenhum dado disponível</p>
        <p className="text-sm text-center">
          Não foi possível carregar os detalhes desta dieta.
        </p>
      </div>
    );
  }

  // Encontrar versão selecionada
  const lastId = cached.versions[cached.versions.length - 1]?.id;
  const selectedVersion =
    cached.versions.find((x) => x.id === (selectedVersionId ?? lastId)) ||
    (lastId
      ? cached.versions.find((x) => x.id === lastId)!
      : cached.versions[0]);

  const isStructured = !!(
    selectedVersion && isStructuredDietData(selectedVersion.data)
  );
  const structuredData: StructuredDietData | null = isStructured
    ? (selectedVersion!.data as StructuredDietData)
    : null;

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="text-center border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{cached.name}</h1>
        <p className="text-gray-600 leading-relaxed">
          {cached.description || "Plano nutricional personalizado"}
        </p>
      </div>

      {/* CTA topo removido: download fica apenas no bloco de cada versão */}

      {/* Resumo Nutricional */}
      {structuredData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Resumo Nutricional
            </h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("dieta")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "dieta"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Refeições
              </button>
              <button
                onClick={() => setActiveTab("nutrientes")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "nutrientes"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Nutrientes
              </button>
            </div>
          </div>

          {activeTab === "nutrientes" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <NutritionCard
                label="Calorias"
                value={structuredData?.total?.calorias ?? "--"}
                unit="kcal"
                color="bg-emerald-50 border-emerald-200 text-emerald-900"
                icon="🔥"
              />
              <NutritionCard
                label="Proteínas"
                value={structuredData?.total?.proteina ?? "--"}
                unit="g"
                color="bg-blue-50 border-blue-200 text-blue-900"
                icon="🥩"
              />
              <NutritionCard
                label="Carboidratos"
                value={structuredData?.total?.carboidratos ?? "--"}
                unit="g"
                color="bg-amber-50 border-amber-200 text-amber-900"
                icon="🍚"
              />
              <NutritionCard
                label="Gorduras"
                value={structuredData?.total?.gordura ?? "--"}
                unit="g"
                color="bg-pink-50 border-pink-200 text-pink-900"
                icon="🥑"
              />
            </div>
          )}

          {activeTab === "dieta" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">
                  Refeições do Dia
                </h4>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {structuredData?.meals?.length || 0} refeições
                </span>
              </div>
              {structuredData && (
                <StructuredDietView data={structuredData} compact />
              )}
            </div>
          )}
        </div>
      )}

      {/* Seletor de Versões */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Versões do Plano
          </h3>
          <span className="text-sm text-gray-500">
            {cached.versions.length} vers
            {cached.versions.length !== 1 ? "ões" : "ão"}
          </span>
        </div>

        <VersionSelector
          versions={cached.versions}
          selectedVersionId={selectedVersionId}
          onSelect={setSelectedVersionId}
          locale={locale}
        />

        {/* Detalhes da Versão Selecionada */}
        {selectedVersion && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    v{selectedVersion.version_number}
                  </span>
                  {selectedVersion.id ===
                    cached.versions[cached.versions.length - 1]?.id && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Mais recente
                    </span>
                  )}
                  {String(selectedVersion.id).startsWith("temp-rev-") && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium animate-pulse">
                      Sincronizando...
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {fmtDate(selectedVersion.created_at, locale, {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isStructured && (
                  <DietVersionExportControls
                    data={selectedVersion.data as StructuredDietData}
                    version={selectedVersion.version_number}
                    planName={cached.name}
                    notes={selectedVersion.notes}
                  />
                )}
                {(() => {
                  const pdf = isPdfData(selectedVersion.data)
                    ? selectedVersion.data
                    : null;
                  if (!pdf || (!pdf.file?.key && !pdf.file?.base64))
                    return null;
                  return (
                    <button
                      type="button"
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                      onClick={async () => {
                        try {
                          if (pdf.file?.key && cached?.id) {
                            const url = `${API.API_AUTH_BASE}/diet/plans/${cached.id}/version/${selectedVersion.id}/file`;
                            const r = await fetch(url, {
                              headers: {
                                authorization: localStorage.getItem(
                                  "access_token"
                                )
                                  ? `Bearer ${localStorage.getItem(
                                      "access_token"
                                    )}`
                                  : "",
                              },
                            });
                            if (!r.ok) throw new Error("Falha no download");
                            const blob = await r.blob();
                            const dlUrl = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = dlUrl;
                            a.download =
                              pdf.file?.name ||
                              `${cached.name}_v${selectedVersion.version_number}.pdf`.replace(
                                /[^a-z0-9]/gi,
                                "_"
                              );
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            setTimeout(() => URL.revokeObjectURL(dlUrl), 1500);
                          } else if (pdf.file?.base64) {
                            const base64 = pdf.file.base64 as string;
                            const byteStr = atob(base64);
                            const bytes = new Uint8Array(byteStr.length);
                            for (let i = 0; i < byteStr.length; i++)
                              bytes[i] = byteStr.charCodeAt(i);
                            const blob = new Blob([bytes], {
                              type: "application/pdf",
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download =
                              pdf.file?.name ||
                              `${cached.name}_v${selectedVersion.version_number}.pdf`.replace(
                                /[^a-z0-9]/gi,
                                "_"
                              );
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            setTimeout(() => URL.revokeObjectURL(url), 1500);
                          }
                        } catch (err) {
                          console.error(err);
                          alert("Falha ao baixar PDF");
                        }
                      }}
                    >
                      Baixar PDF
                    </button>
                  );
                })()}
              </div>
            </div>

            {selectedVersion.notes && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    {selectedVersion.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Visualização da Dieta para esta versão */}
            {isStructured && activeTab === "dieta" && selectedVersion && (
              <div className="border-t border-gray-200 pt-4">
                {isStructured && (
                  <StructuredDietView
                    data={selectedVersion.data as StructuredDietData}
                    compact={false}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DietPlanDetailContent;
