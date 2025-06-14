'use client';

import React, { useState } from 'react';
import { FeatureType, FeatureCategory } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Plus,
  Edit,
  BarChart3,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Crown,
  Infinity,
} from 'lucide-react';

interface Feature {
  id: string;
  type: FeatureType;
  name: string;
  nameEn: string;
  description?: string;
  descriptionEn?: string;
  category: FeatureCategory;
  displayOrder: number;
  isActive: boolean;
  planFeatures: Array<{
    id: string;
    planId: string;
    isEnabled: boolean;
    limit?: number;
    plan: {
      id: string;
      name: string;
      type: string;
    };
  }>;
}

interface Plan {
  id: string;
  name: string;
  type: string;
  features: Array<{
    id: string;
    featureId: string;
    isEnabled: boolean;
    limit?: number;
    feature: {
      id: string;
      type: FeatureType;
      name: string;
    };
  }>;
}

interface FeatureManagementDashboardProps {
  features: Feature[];
  plans: Plan[];
  className?: string;
}

export function FeatureManagementDashboard({
  features,
  plans,
  className,
}: FeatureManagementDashboardProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>(plans[0]?.id || '');
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleFeatureToggle = async (
    planId: string,
    featureId: string,
    enabled: boolean
  ) => {
    try {
      // Call server action to update plan feature
      toast({
        title: 'Feature Updated',
        description: `Feature ${enabled ? 'enabled' : 'disabled'} for plan.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update feature.',
        variant: 'destructive',
      });
    }
  };

  const handleLimitChange = async (
    planId: string,
    featureId: string,
    limit: number
  ) => {
    try {
      // Call server action to update limit
      toast({
        title: 'Limit Updated',
        description: `Feature limit updated to ${limit === -1 ? 'unlimited' : limit}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update feature limit.',
        variant: 'destructive',
      });
    }
  };

  const getFeatureStatus = (feature: Feature, planId: string) => {
    const planFeature = feature.planFeatures.find(pf => pf.planId === planId);
    return {
      enabled: planFeature?.isEnabled || false,
      limit: planFeature?.limit,
    };
  };

  const getCategoryColor = (category: FeatureCategory) => {
    switch (category) {
      case 'BASIC':
        return 'bg-green-100 text-green-800';
      case 'PRO':
        return 'bg-blue-100 text-blue-800';
      case 'PREMIUM':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Feature Management
          </h2>
          <p className="text-muted-foreground">
            Configure feature access and limits for each plan
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Feature
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Feature</DialogTitle>
            </DialogHeader>
            <CreateFeatureForm onSuccess={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="features" className="space-y-4">
        <TabsList>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-4">
          <div className="grid gap-4">
            {Object.values(FeatureCategory).map(category => {
              const categoryFeatures = features.filter(
                f => f.category === category
              );

              return (
                <Card key={category}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {category === 'BASIC' && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {category === 'PRO' && (
                          <Crown className="h-5 w-5 text-blue-600" />
                        )}
                        {category === 'PREMIUM' && (
                          <Crown className="h-5 w-5 text-purple-600" />
                        )}
                        {category} Features
                      </CardTitle>
                      <Badge className={getCategoryColor(category)}>
                        {categoryFeatures.length} features
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoryFeatures.map(feature => (
                        <FeatureRow
                          key={feature.id}
                          feature={feature}
                          plans={plans}
                          onToggle={handleFeatureToggle}
                          onLimitChange={handleLimitChange}
                          onEdit={setEditingFeature}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="mb-6 flex items-center gap-4">
            <Label htmlFor="plan-select">Select Plan:</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlanData && (
            <PlanFeatureMatrix
              plan={selectedPlanData}
              features={features}
              onToggle={handleFeatureToggle}
              onLimitChange={handleLimitChange}
            />
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <UsageAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FeatureRow({
  feature,
  plans,
  onToggle,
  onLimitChange,
  onEdit,
}: {
  feature: Feature;
  plans: Plan[];
  onToggle: (planId: string, featureId: string, enabled: boolean) => void;
  onLimitChange: (planId: string, featureId: string, limit: number) => void;
  onEdit: (feature: Feature) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h4 className="font-medium">{feature.name}</h4>
          <Badge variant={feature.isActive ? 'default' : 'secondary'}>
            {feature.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">{feature.description}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Type: {feature.type}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {plans.map(plan => {
          const planFeature = feature.planFeatures.find(
            pf => pf.planId === plan.id
          );
          const enabled = planFeature?.isEnabled || false;
          const limit = planFeature?.limit;

          return (
            <div key={plan.id} className="min-w-[100px] text-center">
              <div className="mb-1 text-xs font-medium">{plan.name}</div>
              <div className="flex flex-col items-center gap-1">
                <Switch
                  checked={enabled}
                  onCheckedChange={checked =>
                    onToggle(plan.id, feature.id, checked)
                  }
                />
                {enabled && (
                  <Input
                    type="number"
                    value={limit || ''}
                    onChange={e => {
                      const value =
                        e.target.value === '' ? -1 : parseInt(e.target.value);
                      onLimitChange(plan.id, feature.id, value);
                    }}
                    placeholder="∞"
                    className="h-6 w-16 text-center text-xs"
                  />
                )}
              </div>
            </div>
          );
        })}

        <Button variant="outline" size="sm" onClick={() => onEdit(feature)}>
          <Edit className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function PlanFeatureMatrix({ plan, features, onToggle, onLimitChange }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{plan.name} Feature Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.values(FeatureCategory).map(category => {
            const categoryFeatures = features.filter(
              f => f.category === category
            );

            return (
              <div key={category}>
                <h4 className="mb-3 flex items-center gap-2 font-medium">
                  {category} Features
                  <Badge variant="outline">{categoryFeatures.length}</Badge>
                </h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {categoryFeatures.map(feature => {
                    const planFeature = feature.planFeatures.find(
                      pf => pf.planId === plan.id
                    );
                    const enabled = planFeature?.isEnabled || false;
                    const limit = planFeature?.limit;

                    return (
                      <div
                        key={feature.id}
                        className="flex items-center justify-between rounded border p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={enabled}
                            onCheckedChange={checked =>
                              onToggle(plan.id, feature.id, checked)
                            }
                          />
                          <span className="text-sm">{feature.name}</span>
                        </div>
                        {enabled && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">
                              Limit:
                            </span>
                            <Input
                              type="number"
                              value={limit === -1 ? '' : limit || ''}
                              onChange={e => {
                                const value =
                                  e.target.value === ''
                                    ? -1
                                    : parseInt(e.target.value);
                                onLimitChange(plan.id, feature.id, value);
                              }}
                              placeholder="∞"
                              className="h-6 w-16 text-center text-xs"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateFeatureForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    type: '' as FeatureType,
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    category: 'BASIC' as FeatureCategory,
    displayOrder: 0,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Call server action to create feature
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="name">Name (Japanese)</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="nameEn">Name (English)</Label>
          <Input
            id="nameEn"
            value={formData.nameEn}
            onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="type">Feature Type</Label>
        <Select
          value={formData.type}
          onValueChange={value =>
            setFormData({ ...formData, type: value as FeatureType })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select feature type" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(FeatureType).map(type => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.category}
          onValueChange={value =>
            setFormData({ ...formData, category: value as FeatureCategory })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(FeatureCategory).map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={checked =>
            setFormData({ ...formData, isActive: checked })
          }
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <Button type="submit" className="w-full">
        Create Feature
      </Button>
    </form>
  );
}

function UsageAnalytics() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Feature Usage Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground p-8 text-center">
            Usage analytics component would go here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
