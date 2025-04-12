
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  HelpCircle, 
  BookOpen, 
  Check, 
  X
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type Question = {
  id: string;
  content: string;
  type: "TRUE_FALSE" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "FREE_TEXT";
  options?: { id: string; content: string; isCorrect: boolean }[];
  correctAnswer?: string;
  points: number;
  hint?: string;
  explanation?: string;
};

interface QuestionFormProps {
  question?: Partial<Question>;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

export function QuestionForm({ question, onSave, onCancel }: QuestionFormProps) {
  const isEditing = !!question?.id;
  
  const [formData, setFormData] = useState<Partial<Question>>({
    content: question?.content || "",
    type: question?.type || "SINGLE_CHOICE",
    options: question?.options || [
      { id: "opt-1", content: "", isCorrect: false },
      { id: "opt-2", content: "", isCorrect: false },
    ],
    correctAnswer: question?.correctAnswer || "",
    points: question?.points || 1,
    hint: question?.hint || "",
    explanation: question?.explanation || "",
  });
  
  const [showHint, setShowHint] = useState(!!question?.hint);
  const [showExplanation, setShowExplanation] = useState(!!question?.explanation);
  
  const handleTypeChange = (type: Question["type"]) => {
    setFormData({ ...formData, type });
    
    if (type === "TRUE_FALSE") {
      setFormData(prev => ({ ...prev, correctAnswer: prev.correctAnswer || "true" }));
    }
  };
  
  const handleOptionChange = (index: number, content: string) => {
    if (!formData.options) return;
    
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], content };
    setFormData({ ...formData, options: newOptions });
  };
  
  const handleOptionCorrectChange = (index: number, isCorrect: boolean) => {
    if (!formData.options) return;
    
    const newOptions = [...formData.options];
    
    // For single choice, only one can be correct
    if (formData.type === "SINGLE_CHOICE") {
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === index ? isCorrect : false;
      });
    } else {
      newOptions[index] = { ...newOptions[index], isCorrect };
    }
    
    setFormData({ ...formData, options: newOptions });
  };
  
  const addOption = () => {
    if (!formData.options) return;
    
    setFormData({
      ...formData,
      options: [
        ...formData.options,
        { id: `opt-${Date.now()}`, content: "", isCorrect: false },
      ],
    });
  };
  
  const removeOption = (index: number) => {
    if (!formData.options || formData.options.length <= 2) return;
    
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };
  
  const handleSave = () => {
    // Basic validation
    if (!formData.content) {
      alert("問題文を入力してください");
      return;
    }
    
    if ((formData.type === "SINGLE_CHOICE" || formData.type === "MULTIPLE_CHOICE") && 
        (!formData.options || formData.options.length < 2)) {
      alert("選択問題には少なくとも2つの選択肢が必要です");
      return;
    }
    
    if (formData.type === "SINGLE_CHOICE" && 
        (!formData.options || !formData.options.some(opt => opt.isCorrect))) {
      alert("正解を選択してください");
      return;
    }
    
    if (formData.type === "FREE_TEXT" && !formData.correctAnswer) {
      alert("正解を入力してください");
      return;
    }
    
    const newQuestion: Question = {
      id: question?.id || `q-${Date.now()}`,
      content: formData.content || "",
      type: formData.type || "SINGLE_CHOICE",
      points: formData.points || 1,
      options: formData.options,
      correctAnswer: formData.correctAnswer,
      hint: showHint ? formData.hint : undefined,
      explanation: showExplanation ? formData.explanation : undefined,
    };
    
    onSave(newQuestion);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {isEditing ? "問題を編集" : "新しい問題を作成"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>問題タイプ</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div
                className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer ${
                  formData.type === "TRUE_FALSE" ? "bg-primary/10 border-primary" : ""
                }`}
                onClick={() => handleTypeChange("TRUE_FALSE")}
              >
                <div className={`rounded-full p-1 ${
                  formData.type === "TRUE_FALSE" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  <span className="text-lg">○/✕</span>
                </div>
                <span>マルバツ</span>
              </div>
              
              <div
                className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer ${
                  formData.type === "SINGLE_CHOICE" ? "bg-primary/10 border-primary" : ""
                }`}
                onClick={() => handleTypeChange("SINGLE_CHOICE")}
              >
                <div className={`rounded-full p-1 ${
                  formData.type === "SINGLE_CHOICE" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  <span className="text-lg">●</span>
                </div>
                <span>択一</span>
              </div>
              
              <div
                className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer ${
                  formData.type === "MULTIPLE_CHOICE" ? "bg-primary/10 border-primary" : ""
                }`}
                onClick={() => handleTypeChange("MULTIPLE_CHOICE")}
              >
                <div className={`rounded-full p-1 ${
                  formData.type === "MULTIPLE_CHOICE" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  <span className="text-lg">☑</span>
                </div>
                <span>複数選択</span>
              </div>
              
              <div
                className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer ${
                  formData.type === "FREE_TEXT" ? "bg-primary/10 border-primary" : ""
                }`}
                onClick={() => handleTypeChange("FREE_TEXT")}
              >
                <div className={`rounded-full p-1 ${
                  formData.type === "FREE_TEXT" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  <span className="text-lg">Aa</span>
                </div>
                <span>自由記述</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">問題文</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[200px]">問題の内容を明確に記述してください。</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="content"
              placeholder="問題文を入力してください"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={3}
            />
            {!formData.content && (
              <p className="text-sm text-destructive">問題文は必須項目です</p>
            )}
          </div>
          
          {/* 問題タイプに応じたフォーム */}
          {(formData.type === "SINGLE_CHOICE" || formData.type === "MULTIPLE_CHOICE") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>選択肢</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  選択肢を追加
                </Button>
              </div>
              
              <div className="space-y-2">
                {formData.options?.map((option, index) => (
                  <div
                    key={option.id}
                    className="flex items-center space-x-2 border rounded-md p-2"
                  >
                    <div className="cursor-move">
                      <GripVertical size={20} />
                    </div>
                    
                    {formData.type === "SINGLE_CHOICE" ? (
                      <RadioGroup
                        value={option.isCorrect ? "true" : "false"}
                        onValueChange={(value) => handleOptionCorrectChange(index, value === "true")}
                      >
                        <RadioGroupItem value="true" id={`radio-${option.id}`} />
                      </RadioGroup>
                    ) : (
                      <Checkbox
                        checked={option.isCorrect}
                        onCheckedChange={(checked) => 
                          handleOptionCorrectChange(index, checked === true)
                        }
                        id={`check-${option.id}`}
                      />
                    )}
                    
                    <Input
                      className="flex-1"
                      placeholder={`選択肢 ${index + 1}`}
                      value={option.content}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                    />
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={formData.options!.length <= 2}
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
              
              {formData.type === "SINGLE_CHOICE" && 
              formData.options?.every(opt => !opt.isCorrect) && (
                <p className="text-sm text-destructive">
                  正解となる選択肢を1つ選択してください
                </p>
              )}
            </div>
          )}
          
          {formData.type === "TRUE_FALSE" && (
            <div className="space-y-2">
              <Label>正解</Label>
              <RadioGroup
                value={formData.correctAnswer || "true"}
                onValueChange={(value) => setFormData({ ...formData, correctAnswer: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true" className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-green-600" /> 正しい
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false" className="flex items-center gap-1">
                    <X className="h-4 w-4 text-red-600" /> 誤り
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
          
          {formData.type === "FREE_TEXT" && (
            <div className="space-y-2">
              <Label htmlFor="correctAnswer">正解（完全一致）</Label>
              <Input
                id="correctAnswer"
                placeholder="正解となる回答を入力"
                value={formData.correctAnswer || ""}
                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                ※ 自動採点では完全一致で判定されます。複数の正解がある場合は手動採点をご利用ください。
              </p>
              {formData.type === "FREE_TEXT" && !formData.correctAnswer && (
                <p className="text-sm text-destructive">正解を入力してください</p>
              )}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="points">配点</Label>
            <Select
              value={String(formData.points)}
              onValueChange={(value) => setFormData({ ...formData, points: parseInt(value) })}
            >
              <SelectTrigger id="points">
                <SelectValue placeholder="配点を選択" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 5, 10].map((point) => (
                  <SelectItem key={point} value={String(point)}>
                    {point}点
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="hint-toggle"
                checked={showHint}
                onCheckedChange={setShowHint}
              />
              <div className="grid gap-1">
                <Label htmlFor="hint-toggle" className="font-medium cursor-pointer">
                  ヒントを追加
                </Label>
                <span className="text-sm text-gray-500">
                  受験者が閲覧可能なヒントを提供します
                </span>
              </div>
            </div>
            
            {showHint && (
              <div className="pl-8 space-y-2">
                <div className="flex items-center">
                  <HelpCircle className="h-4 w-4 text-examforge-blue mr-2" />
                  <Label htmlFor="hint">ヒント</Label>
                </div>
                <Textarea
                  id="hint"
                  placeholder="ヒントを入力してください"
                  value={formData.hint || ""}
                  onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                  rows={2}
                />
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch
                id="explanation-toggle"
                checked={showExplanation}
                onCheckedChange={setShowExplanation}
              />
              <div className="grid gap-1">
                <Label htmlFor="explanation-toggle" className="font-medium cursor-pointer">
                  解説を追加
                </Label>
                <span className="text-sm text-gray-500">
                  問題の回答後に表示される詳細な解説です
                </span>
              </div>
            </div>
            
            {showExplanation && (
              <div className="pl-8 space-y-2">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 text-examforge-blue mr-2" />
                  <Label htmlFor="explanation">解説</Label>
                </div>
                <Textarea
                  id="explanation"
                  placeholder="解説を入力してください"
                  value={formData.explanation || ""}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  rows={3}
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={handleSave}
            >
              保存
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
