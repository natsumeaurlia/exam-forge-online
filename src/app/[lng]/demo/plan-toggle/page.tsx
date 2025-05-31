import { PlanToggle } from '@/components/plan/PlanToggle';

export default function PlanToggleDemo() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Plan Toggle Component Demo
        </h1>
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold mb-6 text-center">
            月額/年額切り替えトグル
          </h2>
          <PlanToggle />
          <div className="mt-8 p-4 bg-gray-100 rounded-md">
            <p className="text-sm text-gray-600 text-center">
              このコンポーネントは月額と年額の表示を切り替えます。
              年額選択時に「約17%割引」バッジが表示されます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}