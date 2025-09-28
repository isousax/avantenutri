import type { TranslationKey } from '../types/i18n';

export interface TestimonialItem {
  id: string;
  nameKey: TranslationKey; // translation key for name (fallback if not provided)
  subtitleKey: TranslationKey;
  textKey: TranslationKey;
  initials: string;
}

export const testimonials: TestimonialItem[] = [
  { id: 't1', nameKey: 'landing.testimonials.name.maria', subtitleKey: 'landing.testimonials.t1.subtitle', textKey: 'landing.testimonials.t1.text', initials: 'MC' },
  { id: 't2', nameKey: 'landing.testimonials.name.joao', subtitleKey: 'landing.testimonials.t2.subtitle', textKey: 'landing.testimonials.t2.text', initials: 'JP' },
  { id: 't3', nameKey: 'landing.testimonials.name.ana', subtitleKey: 'landing.testimonials.t3.subtitle', textKey: 'landing.testimonials.t3.text', initials: 'AS' },
];
