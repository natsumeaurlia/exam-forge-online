import { Check, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getTranslations } from 'next-intl/server';

export interface FeatureComparisonTableProps {
  lng: string;
}

interface Feature {
  id: string;
  name: string;
  category: 'basic' | 'advanced';
  free: boolean | string | number;
  pro: boolean | string | number;
  enterprise: boolean | string | number;
}

function renderValue(value: boolean | string | number, label: { available: string; notAvailable: string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check
        className="mx-auto h-5 w-5 text-green-600"
        aria-label={label.available}
        data-testid="check-icon"
      />
    ) : (
      <X className="mx-auto h-5 w-5 text-red-600" aria-label={label.notAvailable} data-testid="x-icon" />
    );
  }
  return <span>{value}</span>;
}

export async function FeatureComparisonTable({ lng }: FeatureComparisonTableProps) {
  const t = await getTranslations();

  const parse = (key: string) => {
    const text = t(key);
    const [name, value] = text.split(':').map(part => part.trim());
    return { name, value } as { name: string; value: string };
  };

  const f = {
    quizzes: parse('pricing.plans.features.quizzes.free'),
    members: parse('pricing.plans.features.members.free'),
    questions: parse('pricing.plans.features.questions.free'),
    responses: parse('pricing.plans.features.responses.free'),
    storage: parse('pricing.plans.features.storage.free'),
  };

  const features: Feature[] = [
    {
      id: 'quizzes',
      name: f.quizzes.name,
      category: 'basic',
      free: f.quizzes.value,
      pro: parse('pricing.plans.features.quizzes.pro').value,
      enterprise: parse('pricing.plans.features.quizzes.enterprise').value,
    },
    {
      id: 'members',
      name: f.members.name,
      category: 'basic',
      free: f.members.value,
      pro: parse('pricing.plans.features.members.pro').value,
      enterprise: parse('pricing.plans.features.members.enterprise').value,
    },
    {
      id: 'questions',
      name: f.questions.name,
      category: 'basic',
      free: f.questions.value,
      pro: parse('pricing.plans.features.questions.pro').value,
      enterprise: parse('pricing.plans.features.questions.enterprise').value,
    },
    {
      id: 'responses',
      name: f.responses.name,
      category: 'basic',
      free: f.responses.value,
      pro: parse('pricing.plans.features.responses.pro').value,
      enterprise: parse('pricing.plans.features.responses.enterprise').value,
    },
    {
      id: 'storage',
      name: f.storage.name,
      category: 'basic',
      free: f.storage.value,
      pro: parse('pricing.plans.features.storage.pro').value,
      enterprise: parse('pricing.plans.features.storage.enterprise').value,
    },
    {
      id: 'truefalse',
      name: t('pricing.plans.features.truefalse'),
      category: 'basic',
      free: true,
      pro: true,
      enterprise: true,
    },
    {
      id: 'singlechoice',
      name: t('pricing.plans.features.singlechoice'),
      category: 'basic',
      free: true,
      pro: true,
      enterprise: true,
    },
    {
      id: 'multiplechoice',
      name: t('pricing.plans.features.multiplechoice'),
      category: 'basic',
      free: true,
      pro: true,
      enterprise: true,
    },
    {
      id: 'freetext',
      name: t('pricing.plans.features.freetext'),
      category: 'basic',
      free: true,
      pro: true,
      enterprise: true,
    },
    {
      id: 'autograding',
      name: t('pricing.plans.features.autograding'),
      category: 'basic',
      free: true,
      pro: true,
      enterprise: true,
    },
    {
      id: 'manualgrading',
      name: t('pricing.plans.features.manualgrading'),
      category: 'basic',
      free: true,
      pro: true,
      enterprise: true,
    },
    {
      id: 'password',
      name: t('pricing.plans.features.password'),
      category: 'basic',
      free: true,
      pro: true,
      enterprise: true,
    },
    {
      id: 'subdomain',
      name: t('pricing.plans.features.subdomain'),
      category: 'advanced',
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      id: 'media',
      name: t('pricing.plans.features.media'),
      category: 'advanced',
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      id: 'questionbank',
      name: t('pricing.plans.features.questionbank'),
      category: 'advanced',
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      id: 'advancedtypes',
      name: t('pricing.plans.features.advancedtypes'),
      category: 'advanced',
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      id: 'analytics',
      name: t('pricing.plans.features.analytics'),
      category: 'advanced',
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      id: 'sections',
      name: t('pricing.plans.features.sections'),
      category: 'advanced',
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      id: 'certificates',
      name: t('pricing.plans.features.certificates'),
      category: 'advanced',
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      id: 'excel',
      name: t('pricing.plans.features.excel'),
      category: 'advanced',
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      id: 'teams',
      name: t('pricing.plans.features.teams'),
      category: 'advanced',
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      id: 'customdesign',
      name: t('pricing.plans.features.customdesign'),
      category: 'advanced',
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      id: 'permissions',
      name: t('pricing.plans.features.permissions'),
      category: 'advanced',
      free: false,
      pro: false,
      enterprise: true,
    },
    {
      id: 'audit',
      name: t('pricing.plans.features.audit'),
      category: 'advanced',
      free: false,
      pro: false,
      enterprise: true,
    },
    {
      id: 'sla',
      name: t('pricing.plans.features.sla'),
      category: 'advanced',
      free: false,
      pro: false,
      enterprise: true,
    },
    {
      id: 'customdev',
      name: t('pricing.plans.features.customdev'),
      category: 'advanced',
      free: false,
      pro: false,
      enterprise: true,
    },
    {
      id: 'onpremise',
      name: t('pricing.plans.features.onpremise'),
      category: 'advanced',
      free: false,
      pro: false,
      enterprise: true,
    },
    {
      id: 'support',
      name: t('pricing.plans.features.support'),
      category: 'advanced',
      free: false,
      pro: false,
      enterprise: true,
    },
  ];

  const availableLabel = t('pricing.comparison.available');
  const notAvailableLabel = t('pricing.comparison.notAvailable');

  const basicFeatures = features.filter(f => f.category === 'basic');
  const advancedFeatures = features.filter(f => f.category === 'advanced');

  return (
    <div className="overflow-x-auto" data-testid="feature-comparison-container">
      <Table className="min-w-[600px]" data-testid="feature-comparison-table">
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>{t('pricing.plans.free.name')}</TableHead>
            <TableHead>{t('pricing.plans.pro.name')}</TableHead>
            <TableHead>{t('pricing.plans.enterprise.name')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={4}
              className="bg-muted font-semibold"
              data-testid="basic-features-header"
            >
              {t('pricing.comparison.basic')}
            </TableCell>
          </TableRow>
          {basicFeatures.map(feature => (
            <TableRow key={feature.id} className="even:bg-muted/50" data-testid={`feature-row-${feature.id}`}>
              <TableCell>{feature.name}</TableCell>
              <TableCell data-testid={`feature-${feature.id}-free`} className="text-center">
                {renderValue(feature.free, { available: availableLabel, notAvailable: notAvailableLabel })}
              </TableCell>
              <TableCell data-testid={`feature-${feature.id}-pro`} className="text-center">
                {renderValue(feature.pro, { available: availableLabel, notAvailable: notAvailableLabel })}
              </TableCell>
              <TableCell data-testid={`feature-${feature.id}-enterprise`} className="text-center">
                {renderValue(feature.enterprise, { available: availableLabel, notAvailable: notAvailableLabel })}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell
              colSpan={4}
              className="bg-muted font-semibold"
              data-testid="advanced-features-header"
            >
              {t('pricing.comparison.advanced')}
            </TableCell>
          </TableRow>
          {advancedFeatures.map(feature => (
            <TableRow key={feature.id} className="even:bg-muted/50" data-testid={`feature-row-${feature.id}`}>
              <TableCell>{feature.name}</TableCell>
              <TableCell data-testid={`feature-${feature.id}-free`} className="text-center">
                {renderValue(feature.free, { available: availableLabel, notAvailable: notAvailableLabel })}
              </TableCell>
              <TableCell data-testid={`feature-${feature.id}-pro`} className="text-center">
                {renderValue(feature.pro, { available: availableLabel, notAvailable: notAvailableLabel })}
              </TableCell>
              <TableCell data-testid={`feature-${feature.id}-enterprise`} className="text-center">
                {renderValue(feature.enterprise, { available: availableLabel, notAvailable: notAvailableLabel })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
