import { verifyCertificate } from '@/lib/actions/certificate';
import { getTranslations } from 'next-intl/server';

interface VerifyPageProps {
  params: { lng: string; code: string };
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { lng, code } = params;
  const t = await getTranslations('pages.certificateVerify');
  const result = await verifyCertificate({ code });

  if (!result.success || !result.certificate) {
    return <div className="p-8 text-center text-red-600">{t('invalid')}</div>;
  }

  const { recipientName, issueDate, expiryDate, quizTitle } =
    result.certificate;
  const date = new Date(issueDate).toLocaleDateString(lng);

  return (
    <div className="p-8 text-center text-green-600">
      {t('valid', { name: recipientName, quiz: quizTitle, date })}
      {expiryDate ? (
        <div className="text-sm text-gray-500">
          {t('expires', { date: new Date(expiryDate).toLocaleDateString(lng) })}
        </div>
      ) : null}
    </div>
  );
}
