import React, { useState } from "react";
import { useSendNotification } from "../../hooks/useNotifications";
import { useToast } from "../ui/ToastProvider";
import Card from "../ui/Card";
import Button from "../ui/Button";

const AdminNotificationSender: React.FC = () => {
  const { mutate: sendNotification, isPending } = useSendNotification();
  const { push } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "success" | "error",
    target_type: "all" as "all" | "specific" | "group",
    target_users: "",
    target_group: "active" as
      | "active"
      | "incomplete_questionnaire"
      | "recent_signups",
    expires_days: 30,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      push({ type: "error", message: "Título e mensagem são obrigatórios" });
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + formData.expires_days);

    const notificationData: any = {
      title: formData.title.trim(),
      message: formData.message.trim(),
      type: formData.type,
      target_type: formData.target_type,
      expires_at: expiresAt.toISOString(),
    };

    if (formData.target_type === "specific") {
      const userIds = formData.target_users
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);

      if (userIds.length === 0) {
        push({
          type: "error",
          message: "IDs de usuários são obrigatórios para envio específico",
        });
        return;
      }

      notificationData.target_users = userIds;
    } else if (formData.target_type === "group") {
      notificationData.target_group = formData.target_group;
    }

    sendNotification(notificationData, {
      onSuccess: (response) => {
        push({
          type: "success",
          message: `Notificação enviada com sucesso para ${response.target_count} usuário(s)`,
        });
        setFormData({
          title: "",
          message: "",
          type: "info",
          target_type: "all",
          target_users: "",
          target_group: "active",
          expires_days: 30,
        });
      },
      onError: (error) => {
        push({
          type: "error",
          message: `Erro ao enviar notificação: ${error.message}`,
        });
      },
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "success":
        return "bg-green-50 border-green-200 text-green-700";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-700";
      case "error":
        return "bg-red-50 border-red-200 text-red-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Enviar Notificação
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Digite o título da notificação"
            maxLength={100}
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mensagem
          </label>
          <textarea
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Digite a mensagem da notificação"
            maxLength={500}
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(["info", "success", "warning", "error"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, type })}
                className={`p-3 rounded-lg border-2 text-sm font-medium capitalize transition-all ${
                  formData.type === type
                    ? getTypeColor(type)
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {type === "info" && "📄 Info"}
                {type === "success" && "✅ Sucesso"}
                {type === "warning" && "⚠️ Aviso"}
                {type === "error" && "❌ Erro"}
              </button>
            ))}
          </div>
        </div>

        {/* Target Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destinatários
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="target_type"
                value="all"
                checked={formData.target_type === "all"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    target_type: e.target.value as any,
                  })
                }
                className="mr-2"
              />
              <span className="text-sm">Todos os usuários</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="target_type"
                value="group"
                checked={formData.target_type === "group"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    target_type: e.target.value as any,
                  })
                }
                className="mr-2"
              />
              <span className="text-sm">Grupo específico</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="target_type"
                value="specific"
                checked={formData.target_type === "specific"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    target_type: e.target.value as any,
                  })
                }
                className="mr-2"
              />
              <span className="text-sm">Usuários específicos</span>
            </label>
          </div>
        </div>

        {/* Group Selection */}
        {formData.target_type === "group" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grupo
            </label>
            <select
              value={formData.target_group}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  target_group: e.target.value as any,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Usuários ativos (últimos 30 dias)</option>
              <option value="incomplete_questionnaire">
                Usuários sem questionário
              </option>
              <option value="recent_signups">
                Novos usuários (últimos 7 dias)
              </option>
            </select>
          </div>
        )}

        {/* Specific Users */}
        {formData.target_type === "specific" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IDs dos Usuários
            </label>
            <textarea
              value={formData.target_users}
              onChange={(e) =>
                setFormData({ ...formData, target_users: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Cole os IDs dos usuários separados por vírgula"
            />
            <p className="text-xs text-gray-500 mt-1">
              Exemplo: user1, user2, user3
            </p>
          </div>
        )}

        {/* Expiration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiração (dias)
          </label>
          <input
            type="number"
            value={formData.expires_days}
            onChange={(e) =>
              setFormData({
                ...formData,
                expires_days: parseInt(e.target.value) || 30,
              })
            }
            min={1}
            max={365}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
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
                Enviando...
              </div>
            ) : (
              "Enviar Notificação"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AdminNotificationSender;
