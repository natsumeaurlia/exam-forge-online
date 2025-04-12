
import { Button } from "@/components/ui/button";

export function CallToAction() {
  return (
    <div className="bg-gradient-to-br from-examforge-blue to-examforge-blue-dark py-16 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">プロフェッショナルなクイズを今すぐ作成</h2>
          <p className="text-lg opacity-90 mb-8">
            ExamForgeの使いやすいインターフェースで、数分でクイズや試験を作成して配布できます。
            <br />無料プランでお試しいただけます。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-examforge-blue-dark">
              デモを見る
            </Button>
            <Button size="lg" className="bg-white text-examforge-blue-dark hover:bg-white/90">
              無料でアカウント作成
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
