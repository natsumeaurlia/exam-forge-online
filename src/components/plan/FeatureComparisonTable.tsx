import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, X } from 'lucide-react';

// Feature interface as specified in the requirements
interface Feature {
  id: string;
  name: string;
  category: 'basic' | 'advanced';
  free: boolean | string | number;
  pro: boolean | string | number;
  enterprise: boolean | string | number;
}

export interface FeatureComparisonTableProps {
  features?: Feature[];
  className?: string;
}

// Default features data for demonstration
const defaultFeatures: Feature[] = [
  // Basic features
  {
    id: 'members',
    name: 'チームメンバー数',
    category: 'basic',
    free: '3名まで',
    pro: '50名まで',
    enterprise: '無制限',
  },
  {
    id: 'quizzes',
    name: 'クイズ作成数',
    category: 'basic',
    free: '5個まで',
    pro: '100個まで',
    enterprise: '無制限',
  },
  {
    id: 'questions',
    name: '問題数/クイズ',
    category: 'basic',
    free: '10問まで',
    pro: '100問まで',
    enterprise: '無制限',
  },
  {
    id: 'responses',
    name: '月間回答数',
    category: 'basic',
    free: '100回答',
    pro: '10,000回答',
    enterprise: '無制限',
  },
  {
    id: 'storage',
    name: 'ストレージ',
    category: 'basic',
    free: '100MB',
    pro: '10GB',
    enterprise: '100GB',
  },
  // Advanced features
  {
    id: 'analytics',
    name: '詳細分析レポート',
    category: 'advanced',
    free: false,
    pro: true,
    enterprise: true,
  },
  {
    id: 'customBranding',
    name: 'カスタムブランディング',
    category: 'advanced',
    free: false,
    pro: false,
    enterprise: true,
  },
  {
    id: 'apiAccess',
    name: 'API アクセス',
    category: 'advanced',
    free: false,
    pro: true,
    enterprise: true,
  },
  {
    id: 'ssoIntegration',
    name: 'SSO 統合',
    category: 'advanced',
    free: false,
    pro: false,
    enterprise: true,
  },
  {
    id: 'prioritySupport',
    name: '優先サポート',
    category: 'advanced',
    free: false,
    pro: true,
    enterprise: true,
  },
];

// Helper function to render feature value
const renderFeatureValue = (value: boolean | string | number, testId: string) => {
  if (typeof value === 'boolean') {
    return value ? (
      <Check 
        className="h-5 w-5 text-green-600" 
        data-testid={`${testId}-check`}
        aria-label="利用可能"
      />
    ) : (
      <X 
        className="h-5 w-5 text-red-500" 
        data-testid={`${testId}-x`}
        aria-label="利用不可"
      />
    );
  }
  return (
    <span 
      className="text-sm font-medium" 
      data-testid={`${testId}-value`}
    >
      {value}
    </span>
  );
};

export function FeatureComparisonTable({ 
  features = defaultFeatures, 
  className 
}: FeatureComparisonTableProps) {
  // Separate basic and advanced features
  const basicFeatures = features.filter(f => f.category === 'basic');
  const advancedFeatures = features.filter(f => f.category === 'advanced');

  return (
    <div 
      className={cn('w-full space-y-8', className)}
      data-testid="feature-comparison-table"
    >
      {/* Basic Features Section */}
      <div data-testid="basic-features-section">
        <h3 
          className="mb-4 text-lg font-semibold" 
          data-testid="basic-features-title"
        >
          基本機能
        </h3>
        <div className="relative overflow-x-auto">
          <Table data-testid="basic-features-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4" data-testid="feature-name-header">
                  機能
                </TableHead>
                <TableHead className="text-center" data-testid="free-plan-header">
                  フリープラン
                </TableHead>
                <TableHead className="text-center" data-testid="pro-plan-header">
                  プロプラン
                </TableHead>
                <TableHead className="text-center" data-testid="enterprise-plan-header">
                  エンタープライズ
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {basicFeatures.map((feature, index) => (
                <TableRow 
                  key={feature.id}
                  className={cn(
                    'transition-colors',
                    index % 2 === 0 ? 'bg-muted/25' : 'bg-background'
                  )}
                  data-testid={`basic-feature-row-${feature.id}`}
                >
                  <TableCell 
                    className="font-medium"
                    data-testid={`basic-feature-name-${feature.id}`}
                  >
                    {feature.name}
                  </TableCell>
                  <TableCell 
                    className="text-center"
                    data-testid={`basic-feature-free-${feature.id}`}
                  >
                    {renderFeatureValue(feature.free, `basic-feature-free-${feature.id}`)}
                  </TableCell>
                  <TableCell 
                    className="text-center"
                    data-testid={`basic-feature-pro-${feature.id}`}
                  >
                    {renderFeatureValue(feature.pro, `basic-feature-pro-${feature.id}`)}
                  </TableCell>
                  <TableCell 
                    className="text-center"
                    data-testid={`basic-feature-enterprise-${feature.id}`}
                  >
                    {renderFeatureValue(feature.enterprise, `basic-feature-enterprise-${feature.id}`)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Advanced Features Section */}
      <div data-testid="advanced-features-section">
        <h3 
          className="mb-4 text-lg font-semibold" 
          data-testid="advanced-features-title"
        >
          高度な機能
        </h3>
        <div className="relative overflow-x-auto">
          <Table data-testid="advanced-features-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4" data-testid="advanced-feature-name-header">
                  機能
                </TableHead>
                <TableHead className="text-center" data-testid="advanced-free-plan-header">
                  フリープラン
                </TableHead>
                <TableHead className="text-center" data-testid="advanced-pro-plan-header">
                  プロプラン
                </TableHead>
                <TableHead className="text-center" data-testid="advanced-enterprise-plan-header">
                  エンタープライズ
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advancedFeatures.map((feature, index) => (
                <TableRow 
                  key={feature.id}
                  className={cn(
                    'transition-colors',
                    index % 2 === 0 ? 'bg-muted/25' : 'bg-background'
                  )}
                  data-testid={`advanced-feature-row-${feature.id}`}
                >
                  <TableCell 
                    className="font-medium"
                    data-testid={`advanced-feature-name-${feature.id}`}
                  >
                    {feature.name}
                  </TableCell>
                  <TableCell 
                    className="text-center"
                    data-testid={`advanced-feature-free-${feature.id}`}
                  >
                    {renderFeatureValue(feature.free, `advanced-feature-free-${feature.id}`)}
                  </TableCell>
                  <TableCell 
                    className="text-center"
                    data-testid={`advanced-feature-pro-${feature.id}`}
                  >
                    {renderFeatureValue(feature.pro, `advanced-feature-pro-${feature.id}`)}
                  </TableCell>
                  <TableCell 
                    className="text-center"
                    data-testid={`advanced-feature-enterprise-${feature.id}`}
                  >
                    {renderFeatureValue(feature.enterprise, `advanced-feature-enterprise-${feature.id}`)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}