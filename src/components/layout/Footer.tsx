
import { useTranslation } from "react-i18next";
import Link from "next/link";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-50 py-12 border-t">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-8 md:mb-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-examforge-blue to-examforge-blue-dark flex items-center justify-center text-white font-bold">
                E
              </div>
              <span className="text-lg font-bold">ExamForge</span>
            </div>
            <p className="text-gray-600 max-w-md">
              {t('common.footer.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-medium mb-4">{t('common.footer.products')}</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-600 hover:text-examforge-blue text-sm">{t('common.features')}</a></li>
                <li><a href="#pricing" className="text-gray-600 hover:text-examforge-blue text-sm">{t('common.pricing')}</a></li>
                <li><a href="#faq" className="text-gray-600 hover:text-examforge-blue text-sm">{t('common.faq')}</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">{t('common.footer.company')}</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-examforge-blue text-sm">{t('common.footer.about')}</a></li>
                <li><Link href="/contact" className="text-gray-600 hover:text-examforge-blue text-sm">{t('common.footer.contact')}</Link></li>
                <li><a href="#" className="text-gray-600 hover:text-examforge-blue text-sm">{t('common.footer.careers')}</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">{t('common.footer.resources')}</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-examforge-blue text-sm">{t('common.footer.support')}</a></li>
                <li><a href="#" className="text-gray-600 hover:text-examforge-blue text-sm">{t('common.footer.blog')}</a></li>
                <li><a href="#" className="text-gray-600 hover:text-examforge-blue text-sm">{t('common.footer.developers')}</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              {t('common.footer.copyright')}
            </p>
            <div className="flex gap-4">
              <Link href="/terms" className="text-gray-500 hover:text-examforge-blue">{t('common.footer.termsOfService')}</Link>
              <Link href="/privacy" className="text-gray-500 hover:text-examforge-blue">{t('common.footer.privacyPolicy')}</Link>
              <Link href="/legal" className="text-gray-500 hover:text-examforge-blue">{t('common.footer.commercialTransactions')}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
