import { verifyCertificate } from '@/lib/actions/certificate';

interface VerifyPageProps {
  params: { code: string };
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const result = await verifyCertificate({ code: params.code });

  if (!result.success) {
    return (
      <div className="p-8 text-center text-red-600">Certificate not found</div>
    );
  }

  return (
    <div className="p-8 text-center text-green-600">
      Certificate verified: {result.certificateId}
    </div>
  );
}
