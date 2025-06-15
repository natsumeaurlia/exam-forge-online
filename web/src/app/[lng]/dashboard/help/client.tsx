'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Search,
  BookOpen,
  HelpCircle,
  MessageCircle,
  FileText,
  ChevronRight,
  Star,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { ContactForm } from '@/components/help/ContactForm';
import { VideoGuide } from '@/components/help/VideoGuide';
import { QuickActions } from '@/components/help/QuickActions';

interface HelpCategory {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  descriptionEn?: string;
  icon?: string;
  order: number;
}

interface HelpArticle {
  id: string;
  title: string;
  titleEn: string;
  content: string;
  contentEn: string;
  categoryId: string;
  category: HelpCategory;
  tags: string[];
  isPublished: boolean;
  order: number;
  viewCount: number;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface FAQ {
  id: string;
  question: string;
  questionEn: string;
  answer: string;
  answerEn: string;
  categoryId: string;
  category: HelpCategory;
  tags: string[];
  isPublished: boolean;
  order: number;
  viewCount: number;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface HelpData {
  helpArticles: HelpArticle[];
  faqs: FAQ[];
  categories: HelpCategory[];
}

interface HelpClientProps {
  lng: string;
  helpData: HelpData;
  initialCategory?: string;
  initialSearch?: string;
}

export function HelpClient({
  lng,
  helpData,
  initialCategory,
  initialSearch,
}: HelpClientProps) {
  const t = useTranslations('dashboard.help');
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory || ''
  );
  const [activeTab, setActiveTab] = useState('overview');

  // Filter content based on search and category
  const filteredArticles = useMemo(() => {
    return helpData.helpArticles.filter(article => {
      const matchesSearch =
        !searchQuery ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        !selectedCategory || article.categoryId === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [helpData.helpArticles, searchQuery, selectedCategory]);

  const filteredFaqs = useMemo(() => {
    return helpData.faqs.filter(faq => {
      const matchesSearch =
        !searchQuery ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.tags.some(tag =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        !selectedCategory || faq.categoryId === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [helpData.faqs, searchQuery, selectedCategory]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    updateUrl({ search: query });
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    updateUrl({ category: categoryId });
  };

  const updateUrl = (params: { search?: string; category?: string }) => {
    const newSearchParams = new URLSearchParams(searchParams);

    if (params.search !== undefined) {
      if (params.search) {
        newSearchParams.set('search', params.search);
      } else {
        newSearchParams.delete('search');
      }
    }

    if (params.category !== undefined) {
      if (params.category) {
        newSearchParams.set('category', params.category);
      } else {
        newSearchParams.delete('category');
      }
    }

    router.push(`?${newSearchParams.toString()}`);
  };

  const popularArticles = helpData.helpArticles
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  const popularFaqs = helpData.faqs
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  return (
    <div className="container mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <QuickActions lng={lng} />
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleCategoryChange('')}
        >
          {t('categories.all')}
        </Button>
        {helpData.categories.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleCategoryChange(category.id)}
          >
            {lng === 'en' ? category.nameEn : category.name}
          </Button>
        ))}
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="guides">{t('tabs.guides')}</TabsTrigger>
          <TabsTrigger value="faq">{t('tabs.faq')}</TabsTrigger>
          <TabsTrigger value="contact">{t('tabs.contact')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Popular Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {t('popular.articles')}
                </CardTitle>
                <CardDescription>
                  {t('popular.articlesDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {popularArticles.map(article => (
                  <div
                    key={article.id}
                    className="hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-lg border p-4"
                    onClick={() => setActiveTab('guides')}
                  >
                    <div className="space-y-1">
                      <h4 className="font-medium">
                        {lng === 'en' ? article.titleEn : article.title}
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {t('article.views', { count: article.viewCount })}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Popular FAQs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  {t('popular.faqs')}
                </CardTitle>
                <CardDescription>
                  {t('popular.faqsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {popularFaqs.map(faq => (
                  <div
                    key={faq.id}
                    className="hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-lg border p-4"
                    onClick={() => setActiveTab('faq')}
                  >
                    <div className="space-y-1">
                      <h4 className="font-medium">
                        {lng === 'en' ? faq.questionEn : faq.question}
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {t('faq.views', { count: faq.viewCount })}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Start Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                {t('quickStart.title')}
              </CardTitle>
              <CardDescription>{t('quickStart.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <VideoGuide lng={lng} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides" className="space-y-6">
          {filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <FileText className="text-muted-foreground mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">
                  {t('search.noResults')}
                </h3>
                <p className="text-muted-foreground">
                  {t('search.noResultsDescription')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredArticles.map(article => (
                <Card key={article.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle>
                          {lng === 'en' ? article.titleEn : article.title}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {lng === 'en'
                              ? article.category.nameEn
                              : article.category.name}
                          </Badge>
                          <span className="text-muted-foreground text-sm">
                            {t('article.views', { count: article.viewCount })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{
                        __html:
                          lng === 'en' ? article.contentEn : article.content,
                      }}
                    />
                    <div className="mt-4 flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        {t('feedback.helpful')}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ThumbsDown className="mr-2 h-4 w-4" />
                        {t('feedback.notHelpful')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          {filteredFaqs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <HelpCircle className="text-muted-foreground mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">
                  {t('search.noResults')}
                </h3>
                <p className="text-muted-foreground">
                  {t('search.noResultsDescription')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t('faq.title')}</CardTitle>
                <CardDescription>{t('faq.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem key={faq.id} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {lng === 'en' ? faq.questionEn : faq.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div
                          className="prose max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: lng === 'en' ? faq.answerEn : faq.answer,
                          }}
                        />
                        <div className="mt-4 flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            {t('feedback.helpful')}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ThumbsDown className="mr-2 h-4 w-4" />
                            {t('feedback.notHelpful')}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  {t('contact.title')}
                </CardTitle>
                <CardDescription>{t('contact.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ContactForm lng={lng} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('contact.info.title')}</CardTitle>
                <CardDescription>
                  {t('contact.info.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">{t('contact.info.email')}</h4>
                  <p className="text-muted-foreground text-sm">
                    support@examforge.com
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">{t('contact.info.hours')}</h4>
                  <p className="text-muted-foreground text-sm">
                    {t('contact.info.hoursValue')}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">{t('contact.info.response')}</h4>
                  <p className="text-muted-foreground text-sm">
                    {t('contact.info.responseValue')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
