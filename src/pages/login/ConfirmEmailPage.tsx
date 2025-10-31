import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import LogoCroped from "../../components/ui/LogoCroped";
import { SEO } from "../../components/comum/SEO";
import { useI18n } from "../../i18n/utils";
import { API } from "../../config/api";

const ConfirmEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const { t } = useI18n();

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage(t('auth.register.error.generic'));
        return;
      } else if (
        typeof token !== "string" ||
        token.length < 10 ||
        token.length > 500
      ) {
        setStatus("error");
        setMessage(t('auth.password.reset.invalidLink.desc'));
      }

      try {
        const API_VERIFY_EMAIL = API.CONFIRM_EMAIL;

        const response = await fetch(API_VERIFY_EMAIL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setStatus("success");
          setMessage(t('auth.confirm.success.desc'));

          // Redirecionar após 3 segundos
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        } else {
          const errorData = await response.json();
          setStatus("error");
          setMessage(
            errorData.message || t('auth.confirm.error.title')
          );
        }
      } catch {
        setStatus("error");
        setMessage(t('auth.register.error.network'));
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    window.location.reload();
  };

  const getStatusContent = () => {
    switch (status) {
      case "loading":
        return {
          icon: (
            <svg
              className="w-16 h-16 text-green-600 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 2a10 10 0 100 20 10 10 0 000-20z"
              />
            </svg>
          ),
          title: t('auth.confirm.loading.title'),
          description: t('auth.confirm.loading.desc'),
          color: "text-green-600",
          bgColor: "bg-green-100",
        };

      case "success":
        return {
          icon: (
            <svg
              className="w-16 h-16 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          title: t('auth.confirm.success.title'),
          description: message,
          color: "text-green-600",
          bgColor: "bg-green-100",
        };

      case "error":
        return {
          icon: (
            <svg
              className="w-16 h-16 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          ),
          title: t('auth.confirm.error.title'),
          description: message,
          color: "text-red-600",
          bgColor: "bg-red-100",
        };

      default:
        return {
          icon: null,
          title: "",
          description: "",
          color: "",
          bgColor: "",
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-25 py-8 px-4">
      <SEO
        title={t('confirmEmail.seo.title')}
        description={t('confirmEmail.seo.desc')}
      />

      <div className="w-full max-w-md">
        {/* Logo e Cabeçalho */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <LogoCroped />
          </Link>
        </div>

        <Card className="p-8 shadow-xl border border-green-100 text-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${statusContent.bgColor}`}
          >
            {statusContent.icon}
          </div>

          <h1 className={`text-2xl font-bold mb-4 ${statusContent.color}`}>
            {statusContent.title}
          </h1>

          <p className="text-gray-600 mb-6 leading-relaxed text-sm">
            {statusContent.description}
          </p>

          {status === "success" && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div className="bg-green-500 h-2 rounded-full animate-pulse"></div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <Button
                onClick={handleRetry}
                className="w-full flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {t('auth.confirm.retry')}
              </Button>

              <Link to="/login" className="block">
                <Button variant="secondary" className="w-full">
                  {t('auth.confirm.goLogin')}
                </Button>
              </Link>

              <Link to="/register" className="block">
                <Button variant="secondary" className="w-full">
                  {t('auth.confirm.createAccount')}
                </Button>
              </Link>
            </div>
          )}

          {status === "loading" && (
            <div className="text-sm text-gray-500">
              <p>{t('auth.confirm.wait')}</p>
            </div>
          )}
        </Card>

        {/* Ajuda */}
        {status === "error" && (
          <Card className="mt-6 p-4 bg-blue-50 border border-blue-100">
            <div className="flex justify-center">
              <svg
                className="w-5 h-5 text-blue-500 mr-2 mt-1 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm text-blue-700 mt-1">
                  {t('auth.confirm.help')}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmailPage;
