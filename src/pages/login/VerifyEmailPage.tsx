import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import { API } from "../../config/api";
import Card from "../../components/ui/Card";
import LogoCroped from "../../components/ui/LogoCroped";
import { SEO } from "../../components/comum/SEO";
import { useI18n } from "../../i18n/utils";

const CheckEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  useEffect(() => {
    // Recuperar o e-mail do sessionStorage
    const prefillEmail = sessionStorage.getItem("prefill_email");
    if (prefillEmail) {
      setEmail(prefillEmail);
    } else {
      navigate("/register");
    }
  }, [navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const API_VERIFY_EMAIL = API.RESEND_VERIFICATION;

  const handleResendEmail = async () => {
    if (!canResend) return;

    try {
      const res = await fetch(API_VERIFY_EMAIL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.status === 200) {
        setCountdown(60);
        setCanResend(false);
        setFeedbackMsg(t('auth.verify.resend.success'));
        return;
      }

      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        const retrySeconds = Number(retryAfter) || 60;

        setCountdown(retrySeconds);
        return;
      }

      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      console.error("[CheckEmailPage] submit error", err);
    }
  };

  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  const handleLogout = () => {
    try { console.info('[VerifyEmailPage] use another email clicked (clearing prefill)'); } catch { /* noop */ }
    sessionStorage.removeItem("prefill_email");
    setTimeout(() => navigate("/login"), 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-25 py-8 px-4">
      <SEO
        title={t('verifyEmail.seo.title')}
        description={t('verifyEmail.seo.desc')}
      />

      <div className="w-full max-w-md">
        {/* Logo e Cabeçalho */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <LogoCroped />
          </Link>
          <h1 className="text-3xl font-bold text-green-800 mb-2">
            {t('auth.verify.title')}
          </h1>
          <p className="text-gray-600 text-sm">
            {t('auth.verify.subtitle')}
          </p>
        </div>

        <Card className="p-6 shadow-xl border border-green-100">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('auth.verify.card.title')}
            </h2>
            <p className="text-gray-600 mb-4 text-xs">
              {t('auth.verify.card.desc')}
            </p>
            <p className="font-semibold text-green-700 text-lg break-all">
              {email}
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 text-sm mb-2 flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
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
                {t('auth.verify.card.whatNow')}
              </h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• {t('auth.verify.card.step1')}</li>
                <li>• {t('auth.verify.card.step2')}</li>
                <li>• {t('auth.verify.card.step3')}</li>
              </ul>
            </div>

            <Button
              onClick={handleResendEmail}
              disabled={!canResend}
              variant={canResend ? "primary" : "secondary"}
              className="w-full flex items-center justify-center"
            >
              {canResend ? (
                <>
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
                  {t('auth.verify.resend')}
                </>
              ) : (
                t('auth.verify.resend.in', { seconds: String(countdown) })
              )}
            </Button>

            <div className="text-center">
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {t('auth.verify.useAnother')}
              </button>
            </div>
            {feedbackMsg && (
              <p className="text-sm text-green-600 text-center">
                {feedbackMsg}
              </p>
            )}
          </div>
        </Card>

        {/* Informações Adicionais */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center text-xs text-gray-500">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              ></path>
            </svg>
            Seus dados estão protegidos e criptografados
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckEmailPage;
