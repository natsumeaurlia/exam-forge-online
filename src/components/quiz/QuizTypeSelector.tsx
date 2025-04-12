
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { getQuizTypes } from "@/constants/quizTypes";
import { QuizTypeProps } from "@/types/quiz";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface QuizTypeSelectorProps {
  onSelect: (type: string) => void;
}

export function QuizTypeSelector({ onSelect }: QuizTypeSelectorProps) {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    onSelect(typeId);
  };
  
  // Get freshly translated quiz types
  const quizTypes = getQuizTypes();
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">{t('quiz.selector.title')}</h2>
        <p className="text-gray-600">
          {t('quiz.selector.description')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizTypes.map((type) => (
          <Card 
            key={type.id}
            className={`cursor-pointer transition-all hover:border-examforge-blue ${
              selectedType === type.id ? "border-2 border-examforge-blue shadow-md" : ""
            } ${type.proOnly ? "opacity-70" : ""}`}
            onClick={() => !type.proOnly && handleTypeSelect(type.id)}
          >
            <CardHeader className="pb-2">
              {type.proOnly && (
                <div className="absolute top-2 right-2">
                  <div className="bg-examforge-orange text-white text-xs font-bold px-2 py-1 rounded">
                    {t('common.proLabel')}
                  </div>
                </div>
              )}
              <div className="feature-icon-container">
                {type.icon}
              </div>
              <CardTitle className="text-lg">{t(`quiz.types.${type.id}.title`)}</CardTitle>
              <CardDescription>{t(`quiz.types.${type.id}.description`)}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {type.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <Check className="h-4 w-4 text-examforge-blue mr-2 shrink-0 mt-0.5" />
                    <span className="flex items-center gap-2">
                      {t(`quiz.types.${type.id}.features.${feature}`)}
                      {type.featureInfo && type.featureInfo[feature] && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            {t(`quiz.types.${type.id}.featureInfo.${feature}`)}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant={selectedType === type.id ? "default" : "outline"}
                className="w-full"
                disabled={type.proOnly}
              >
                {type.proOnly ? t('quiz.selector.proOnlyButton') : t('quiz.selector.selectButton')}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
