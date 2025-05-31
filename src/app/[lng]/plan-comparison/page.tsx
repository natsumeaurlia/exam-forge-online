import { PlanToggle } from '@/components/plan';

export interface PlanComparisonPageProps {
  params: {
    lng: string;
  };
}

export default async function PlanComparisonPage({ params }: PlanComparisonPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const lng = resolvedParams.lng;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            料金プラン
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            あなたのニーズに合ったプランをお選びください
          </p>
          
          <div className="mt-8 flex justify-center">
            <PlanToggle />
          </div>
          
          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Placeholder for plan cards */}
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold">フリープラン</h3>
                <p className="mt-2 text-sm text-muted-foreground">基本的な機能を無料で</p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold">プロプラン</h3>
                <p className="mt-2 text-sm text-muted-foreground">ビジネス利用に最適</p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold">エンタープライズプラン</h3>
                <p className="mt-2 text-sm text-muted-foreground">大規模チーム向け</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}