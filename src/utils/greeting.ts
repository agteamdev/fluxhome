import { t } from '@/lib/i18n';

/** Greeting that depends on the time of day (texts come from the language files). */
export function getGreeting(date: Date, userName: string, byTime: boolean): string {
  let base = t('greet.hello');
  if (byTime) {
    const h = date.getHours();
    if (h < 5) base = t('greet.night');
    else if (h < 12) base = t('greet.morning');
    else if (h < 18) base = t('greet.afternoon');
    else base = t('greet.evening');
  }
  const name = userName.trim();
  return name ? `${base}, ${name}!` : `${base}!`;
}
