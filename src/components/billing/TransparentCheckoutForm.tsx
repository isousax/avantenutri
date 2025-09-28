import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { API } from '../../config/api';

interface Props {
  publicKey: string;
  paymentId: string;
  amountCents: number;
  onPaid: (status: string) => void;
  getAccessToken: () => Promise<string | null>;
}

declare global {
  interface Window { MercadoPago?: any }
}

export function TransparentCheckoutForm({ publicKey, paymentId, amountCents, onPaid, getAccessToken }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installments, setInstallments] = useState(1);
  const formRef = useRef<HTMLFormElement | null>(null);
  const mpRef = useRef<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const { t, locale } = useI18n();

  useEffect(() => {
    if (window.MercadoPago) {
      mpRef.current = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
      setLoading(false);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => {
      mpRef.current = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
      setLoading(false);
    };
    script.onerror = () => setError(t('billing.checkout.sdk.load.error'));
    document.head.appendChild(script);
  }, [publicKey, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mpRef.current) return;
    setSubmitting(true);
    setError(null);
    try {
      const form = formRef.current;
      if (!form) return;
      const formData = new FormData(form);
      const cardNumber = String(formData.get('cardNumber')||'').replace(/\s+/g,'');
      const cardholderName = String(formData.get('cardholderName')||'');
      const expMonth = String(formData.get('expMonth')||'');
      const expYear = String(formData.get('expYear')||'');
      const securityCode = String(formData.get('securityCode')||'');
      const identification = String(formData.get('docNumber')||'');
      const email = String(formData.get('email')||'');
      if (!cardNumber || !cardholderName || !expMonth || !expYear || !securityCode || !email) {
        setError(t('billing.checkout.required.missing')); setSubmitting(false); return;
      }
      const tokenResult = await mpRef.current.createCardToken({
        cardNumber,
        cardholderName,
        cardExpirationMonth: expMonth,
        cardExpirationYear: expYear,
        securityCode,
        identificationType: 'CPF',
        identificationNumber: identification || '00000000000'
      });
      if (tokenResult?.error) {
        setError(t('billing.checkout.token.error')); setSubmitting(false); return;
      }
      const token = tokenResult.id;
      const access = await getAccessToken();
      if (!access) { setError(t('billing.checkout.session.expired')); setSubmitting(false); return; }
      const payRes = await fetch(API.BILLING_PAY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer '+access },
        body: JSON.stringify({ payment_id: paymentId, token, installments, payer_email: email })
      });
      const data = await payRes.json();
      if (!payRes.ok) { setError(data.error || t('billing.checkout.pay.error')); setSubmitting(false); return; }
      onPaid(data.status || 'pending');
    } catch (e:any) {
      setError(t('billing.checkout.unexpected'));
    } finally { setSubmitting(false); }
  }

  if (loading) return <div className='p-4 text-sm'>{t('billing.checkout.form.loading')}</div>;
  if (error) return <div className='p-4 text-sm text-red-600'>{error}</div>;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className='space-y-3'>
      <div>
        <label className='block text-xs font-medium'>{t('billing.checkout.card.number')}</label>
        <input name='cardNumber' placeholder='•••• •••• •••• ••••' className='w-full border px-2 py-1 rounded' />
      </div>
      <div className='flex gap-2'>
        <div className='flex-1'>
          <label className='block text-xs font-medium'>{t('billing.checkout.card.expMonth')}</label>
          <input name='expMonth' placeholder='MM' className='w-full border px-2 py-1 rounded' />
        </div>
        <div className='flex-1'>
          <label className='block text-xs font-medium'>{t('billing.checkout.card.expYear')}</label>
          <input name='expYear' placeholder='YYYY' className='w-full border px-2 py-1 rounded' />
        </div>
        <div className='flex-1'>
          <label className='block text-xs font-medium'>{t('billing.checkout.card.cvv')}</label>
          <input name='securityCode' placeholder='CVV' className='w-full border px-2 py-1 rounded' />
        </div>
      </div>
      <div>
        <label className='block text-xs font-medium'>{t('billing.checkout.card.holder')}</label>
        <input name='cardholderName' className='w-full border px-2 py-1 rounded' />
      </div>
      <div>
        <label className='block text-xs font-medium'>{t('billing.checkout.card.cpf')}</label>
        <input name='docNumber' className='w-full border px-2 py-1 rounded' />
      </div>
      <div>
        <label className='block text-xs font-medium'>{t('billing.checkout.card.email')}</label>
        <input name='email' type='email' className='w-full border px-2 py-1 rounded' />
      </div>
      <div>
        <label className='block text-xs font-medium'>{t('billing.checkout.installments')}</label>
        <select value={installments} onChange={e=>setInstallments(Number(e.target.value))} className='border px-2 py-1 rounded'>
          {[1,2,3,4,5,6,10,12].map(i=> <option key={i} value={i}>{i}x</option>)}
        </select>
      </div>
      <div className='pt-2'>
        <button disabled={submitting} className='bg-green-600 text-white px-4 py-2 rounded w-full disabled:opacity-50'>
          {submitting ? t('billing.checkout.processing') : t('billing.checkout.pay', { amount: new Intl.NumberFormat(locale==='pt'?'pt-BR':'en-US',{style:'currency',currency:'BRL'}).format(amountCents/100) })}
        </button>
      </div>
    </form>
  );
}
