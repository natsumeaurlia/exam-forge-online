import { redirect } from 'next/navigation';
import { fallbackLng } from '../i18n/settings';

export default function Home() {
  // Redirect to the default language
  redirect(`/${fallbackLng}`);
}
