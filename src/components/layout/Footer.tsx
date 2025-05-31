import { getTranslations } from 'next-intl/server';

export interface FooterProps {
  lng: string;
}

export const Footer = async ({ lng }: FooterProps) => {
  const t = await getTranslations();

  return (
    <footer className="border-t bg-gray-50 py-12" data-testid="footer">
      <div className="container mx-auto px-4" data-testid="footer-container">
        <div
          className="flex flex-col justify-between md:flex-row"
          data-testid="footer-main"
        >
          <div className="mb-8 md:mb-0" data-testid="footer-brand">
            <div
              className="mb-4 flex items-center gap-2"
              data-testid="footer-logo"
            >
              <div className="from-examforge-blue to-examforge-blue-dark flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br font-bold text-white">
                E
              </div>
              <span className="text-lg font-bold">ExamForge</span>
            </div>
            <p
              className="max-w-md text-gray-600"
              data-testid="footer-description"
            >
              {t('common.footer.description')}
            </p>
          </div>

          <div
            className="grid grid-cols-2 gap-8 md:grid-cols-3"
            data-testid="footer-links"
          >
            <div data-testid="footer-products">
              <h3
                className="mb-4 font-medium"
                data-testid="footer-products-title"
              >
                {t('common.footer.products')}
              </h3>
              <ul className="space-y-2" data-testid="footer-products-list">
                <li>
                  <a
                    href="#features"
                    className="hover:text-examforge-blue text-sm text-gray-600"
                    data-testid="footer-features-link"
                  >
                    {t('common.features')}
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-examforge-blue text-sm text-gray-600"
                    data-testid="footer-pricing-link"
                  >
                    {t('common.pricing')}
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="hover:text-examforge-blue text-sm text-gray-600"
                    data-testid="footer-faq-link"
                  >
                    {t('common.faq')}
                  </a>
                </li>
              </ul>
            </div>

            <div data-testid="footer-company">
              <h3
                className="mb-4 font-medium"
                data-testid="footer-company-title"
              >
                {t('common.footer.company')}
              </h3>
              <ul className="space-y-2" data-testid="footer-company-list">
                <li>
                  <a
                    href="#"
                    className="hover:text-examforge-blue text-sm text-gray-600"
                    data-testid="footer-about-link"
                  >
                    {t('common.footer.about')}
                  </a>
                </li>
                <li>
                  <a
                    href={`/${lng}/contact`}
                    className="hover:text-examforge-blue text-sm text-gray-600"
                    data-testid="footer-contact-link"
                  >
                    {t('common.footer.contact')}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-examforge-blue text-sm text-gray-600"
                    data-testid="footer-careers-link"
                  >
                    {t('common.footer.careers')}
                  </a>
                </li>
              </ul>
            </div>

            <div data-testid="footer-resources">
              <h3
                className="mb-4 font-medium"
                data-testid="footer-resources-title"
              >
                {t('common.footer.resources')}
              </h3>
              <ul className="space-y-2" data-testid="footer-resources-list">
                <li>
                  <a
                    href="#"
                    className="hover:text-examforge-blue text-sm text-gray-600"
                    data-testid="footer-support-link"
                  >
                    {t('common.footer.support')}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-examforge-blue text-sm text-gray-600"
                    data-testid="footer-blog-link"
                  >
                    {t('common.footer.blog')}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-examforge-blue text-sm text-gray-600"
                    data-testid="footer-developers-link"
                  >
                    {t('common.footer.developers')}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div
          className="mt-12 border-t border-gray-200 pt-8"
          data-testid="footer-bottom"
        >
          <div
            className="flex flex-col items-center justify-between md:flex-row"
            data-testid="footer-bottom-content"
          >
            <p
              className="mb-4 text-sm text-gray-500 md:mb-0"
              data-testid="footer-copyright"
            >
              {t('common.footer.copyright')}
            </p>
            <div className="flex gap-4" data-testid="footer-legal-links">
              <a
                href={`/${lng}/terms`}
                className="hover:text-examforge-blue text-gray-500"
                data-testid="footer-terms-link"
              >
                {t('common.footer.termsOfService')}
              </a>
              <a
                href={`/${lng}/privacy`}
                className="hover:text-examforge-blue text-gray-500"
                data-testid="footer-privacy-link"
              >
                {t('common.footer.privacyPolicy')}
              </a>
              <a
                href={`/${lng}/legal`}
                className="hover:text-examforge-blue text-gray-500"
                data-testid="footer-legal-link"
              >
                {t('common.footer.commercialTransactions')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
