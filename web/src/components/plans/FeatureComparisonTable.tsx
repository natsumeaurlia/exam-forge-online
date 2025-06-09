'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface FeatureComparisonTableProps {
  isAnnual: boolean;
  lng: string;
}

export function FeatureComparisonTable({
  isAnnual,
  lng,
}: FeatureComparisonTableProps) {
  const t = useTranslations();
  const currentLanguage = lng;

  const plans = {
    free: {
      name: t('pricing.plans.free.name'),
      priceMonthly: currentLanguage === 'en' ? '$0' : '¥0',
      priceAnnual: currentLanguage === 'en' ? '$0' : '¥0',
      cta: t('pricing.plans.free.cta'),
    },
    pro: {
      name: t('pricing.plans.pro.name'),
      priceMonthly: currentLanguage === 'en' ? '$29' : '¥2,980',
      priceAnnual: currentLanguage === 'en' ? '$24' : '¥2,480',
      cta: t('pricing.plans.pro.cta'),
    },
    enterprise: {
      name: t('pricing.plans.enterprise.name'),
      price: t('pricing.plans.enterprise.price'),
      cta: t('pricing.plans.enterprise.cta'),
    },
  };

  const features = [
    {
      category: t('plans.features.basic'),
      items: [
        {
          name: t('pricing.plans.features.quizzes.label'),
          free: t('pricing.plans.features.quizzes.free'),
          pro: t('pricing.plans.features.quizzes.pro'),
          enterprise: t('pricing.plans.features.quizzes.enterprise'),
        },
        {
          name: t('pricing.plans.features.members.label'),
          free: t('pricing.plans.features.members.free'),
          pro: t('pricing.plans.features.members.pro'),
          enterprise: t('pricing.plans.features.members.enterprise'),
        },
        {
          name: t('pricing.plans.features.questions.label'),
          free: t('pricing.plans.features.questions.free'),
          pro: t('pricing.plans.features.questions.pro'),
          enterprise: t('pricing.plans.features.questions.enterprise'),
        },
        {
          name: t('pricing.plans.features.responses.label'),
          free: t('pricing.plans.features.responses.free'),
          pro: t('pricing.plans.features.responses.pro'),
          enterprise: t('pricing.plans.features.responses.enterprise'),
        },
        {
          name: t('pricing.plans.features.storage.label'),
          free: t('pricing.plans.features.storage.free'),
          pro: t('pricing.plans.features.storage.pro'),
          enterprise: t('pricing.plans.features.storage.enterprise'),
        },
      ],
    },
    {
      category: t('plans.features.question_types'),
      items: [
        {
          name: t('pricing.plans.features.truefalse'),
          free: true,
          pro: true,
          enterprise: true,
        },
        {
          name: t('pricing.plans.features.singlechoice'),
          free: true,
          pro: true,
          enterprise: true,
        },
        {
          name: t('pricing.plans.features.multiplechoice'),
          free: true,
          pro: true,
          enterprise: true,
        },
        {
          name: t('pricing.plans.features.freetext'),
          free: true,
          pro: true,
          enterprise: true,
        },
        {
          name: t('pricing.plans.features.advancedtypes'),
          free: false,
          pro: true,
          enterprise: true,
        },
      ],
    },
    {
      category: t('plans.features.advanced'),
      items: [
        {
          name: t('pricing.plans.features.subdomain'),
          free: false,
          pro: true,
          enterprise: true,
        },
        {
          name: t('pricing.plans.features.media'),
          free: false,
          pro: true,
          enterprise: true,
        },
        {
          name: t('pricing.plans.features.questionbank'),
          free: false,
          pro: true,
          enterprise: true,
        },
        {
          name: t('pricing.plans.features.analytics'),
          free: false,
          pro: true,
          enterprise: true,
        },
        {
          name: t('pricing.plans.features.sections'),
          free: false,
          pro: true,
          enterprise: true,
        },
        {
          name: t('pricing.plans.features.certificates'),
          free: false,
          pro: true,
          enterprise: true,
        },
        {
          name: t('pricing.plans.features.excel'),
          free: false,
          pro: true,
          enterprise: true,
        },
      ],
    },
    {
      category: t('plans.features.enterprise_only'),
      items: [
        {
          name: t('pricing.plans.features.permissions'),
          free: false,
          pro: false,
          enterprise: true,
        },
        {
          name: t('pricing.plans.features.audit'),
          free: false,
          pro: false,
          enterprise: true,
        },
        {
          name: t('pricing.plans.features.sla'),
          free: false,
          pro: false,
          enterprise: true,
        },
        {
          name: t('pricing.plans.features.customdev'),
          free: false,
          pro: false,
          enterprise: true,
        },
        {
          name: t('pricing.plans.features.onpremise'),
          free: false,
          pro: false,
          enterprise: true,
        },
        {
          name: t('pricing.plans.features.support'),
          free: false,
          pro: false,
          enterprise: true,
        },
      ],
    },
  ];

  const renderValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="mx-auto h-5 w-5 text-green-500" />
      ) : (
        <X className="mx-auto h-5 w-5 text-gray-400" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-2/5 min-w-[300px]">
              {t('plans.features.feature')}
            </TableHead>
            <TableHead className="w-1/5 min-w-[200px] py-6 text-center">
              <div className="space-y-2">
                <div className="mb-3 font-semibold">{plans.free.name}</div>
                <div className="text-2xl font-bold">
                  {isAnnual ? plans.free.priceAnnual : plans.free.priceMonthly}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => (window.location.href = `/${lng}/auth/signin`)}
                >
                  {plans.free.cta}
                </Button>
              </div>
            </TableHead>
            <TableHead className="w-1/5 min-w-[200px] py-6 text-center">
              <div className="space-y-2">
                <div className="mb-3 font-semibold">{plans.pro.name}</div>
                <div className="text-examforge-orange text-2xl font-bold">
                  {isAnnual ? plans.pro.priceAnnual : plans.pro.priceMonthly}
                  <span className="text-sm font-normal text-gray-500">
                    /
                    {isAnnual
                      ? t('pricing.toggle.annually')
                      : t('pricing.toggle.monthly')}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="bg-examforge-orange hover:bg-examforge-orange/90 w-full text-white"
                  onClick={() => (window.location.href = `/${lng}/auth/signin`)}
                >
                  {plans.pro.cta}
                </Button>
              </div>
            </TableHead>
            <TableHead className="w-1/5 min-w-[200px] py-6 text-center">
              <div className="space-y-2">
                <div className="mb-3 font-semibold">
                  {plans.enterprise.name}
                </div>
                <div className="text-2xl font-bold">
                  {plans.enterprise.price}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-examforge-blue-dark text-examforge-blue-dark hover:bg-examforge-blue-dark w-full hover:text-white"
                >
                  {plans.enterprise.cta}
                </Button>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {features.map((category, categoryIndex) => (
            <React.Fragment key={`category-${categoryIndex}`}>
              <TableRow className="bg-gray-50">
                <TableCell colSpan={4} className="font-semibold">
                  {category.category}
                </TableCell>
              </TableRow>
              {category.items.map((feature, featureIndex) => (
                <TableRow key={`feature-${categoryIndex}-${featureIndex}`}>
                  <TableCell>{feature.name}</TableCell>
                  <TableCell className="text-center">
                    {renderValue(feature.free)}
                  </TableCell>
                  <TableCell className="text-center">
                    {renderValue(feature.pro)}
                  </TableCell>
                  <TableCell className="text-center">
                    {renderValue(feature.enterprise)}
                  </TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
