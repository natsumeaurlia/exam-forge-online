import { useTranslation } from '../../i18n';

export interface FooterProps {
  lng: string;
}

export async function Footer({ lng }: FooterProps) {
  const { t } = await useTranslation(lng);

  return (
    <footer className="border-t bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col justify-between md:flex-row">
          <div className="mb-8 md:mb-0">
            <div className="mb-4 flex items-center gap-2">
              <div className="from-examforge-blue to-examforge-blue-dark flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br font-bold text-white">
                E
              </div>
              <span className="text-lg font-bold">ExamForge</span>
            </div>
            <p className="max-w-md text-gray-600">
              {t('common.footer.description')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
            <div>
              <h3 className="mb-4 font-medium">
                {t('common.footer.products')}
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="hover:text-examforge-blue text-sm text-gray-600"
                  >
                    {t('common.features')}
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-examforge-blue text-sm text-gray-600"
                  >
                    {t('common.pricing')}
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="hover:text-examforge-blue text-sm text-gray-600"
                  >
                    {t('common.faq')}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-medium">{t('common.footer.company')}</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="hover:text-examforge-blue text-sm text-gray-600"
                  >
                    {t('common.footer.about')}
                  </a>
                </li>
                <li>
                  <a
                    href={`/${lng}/contact`}
                    className="hover:text-examforge-blue text-sm text-gray-600"
                  >
                    {t('common.footer.contact')}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-examforge-blue text-sm text-gray-600"
                  >
                    {t('common.footer.careers')}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-medium">
                {t('common.footer.resources')}
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="hover:text-examforge-blue text-sm text-gray-600"
                  >
                    {t('common.footer.support')}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-examforge-blue text-sm text-gray-600"
                  >
                    {t('common.footer.blog')}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-examforge-blue text-sm text-gray-600"
                  >
                    {t('common.footer.developers')}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <p className="mb-4 text-sm text-gray-500 md:mb-0">
              {t('common.footer.copyright')}
            </p>
            <div className="flex gap-4">
              <a
                href={`/${lng}/terms`}
                className="hover:text-examforge-blue text-gray-500"
              >
                {t('common.footer.termsOfService')}
              </a>
              <a
                href={`/${lng}/privacy`}
                className="hover:text-examforge-blue text-gray-500"
              >
                {t('common.footer.privacyPolicy')}
              </a>
              <a
                href={`/${lng}/legal`}
                className="hover:text-examforge-blue text-gray-500"
              >
                {t('common.footer.commercialTransactions')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
