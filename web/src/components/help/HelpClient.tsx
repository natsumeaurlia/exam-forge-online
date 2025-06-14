'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Search,
  Book,
  MessageCircle,
  FileText,
  Video,
  ExternalLink,
} from 'lucide-react';
import { helpData } from '@/data/help';

export interface HelpClientProps {
  lng: string;
}

export const HelpClient = ({ lng }: HelpClientProps) => {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredFAQs = helpData.faq.filter(item => {
    const question = t(item.questionKey).toLowerCase();
    const answer = t(item.answerKey).toLowerCase();
    const categoryMatch =
      selectedCategory === 'all' || item.category === selectedCategory;
    const searchMatch =
      searchQuery === '' ||
      question.includes(searchQuery.toLowerCase()) ||
      answer.includes(searchQuery.toLowerCase());

    return categoryMatch && searchMatch;
  });

  const filteredGuides = helpData.guides.filter(guide => {
    const title = t(guide.titleKey).toLowerCase();
    const description = t(guide.descriptionKey).toLowerCase();
    const categoryMatch =
      selectedCategory === 'all' || guide.category === selectedCategory;
    const searchMatch =
      searchQuery === '' ||
      title.includes(searchQuery.toLowerCase()) ||
      description.includes(searchQuery.toLowerCase());

    return categoryMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold" data-testid="help-title">
            {t('help.title')}
          </h1>
          <p
            className="mb-6 text-lg text-gray-600"
            data-testid="help-description"
          >
            {t('help.description')}
          </p>

          {/* Search Bar */}
          <div className="relative mx-auto mb-6 max-w-2xl">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            <Input
              type="text"
              placeholder={t('help.search.placeholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="py-3 pl-10 text-lg"
              data-testid="help-search"
            />
          </div>

          {/* Category Filter */}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {helpData.categories.map(category => (
              <Badge
                key={category.id}
                variant={
                  selectedCategory === category.id ? 'default' : 'outline'
                }
                className="cursor-pointer px-4 py-2"
                onClick={() => setSelectedCategory(category.id)}
                data-testid={`category-${category.id}`}
              >
                {t(category.nameKey)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="faq" className="mx-auto max-w-6xl">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="faq" data-testid="tab-faq">
              <MessageCircle className="mr-2 h-4 w-4" />
              {t('help.tabs.faq')}
            </TabsTrigger>
            <TabsTrigger value="guides" data-testid="tab-guides">
              <Book className="mr-2 h-4 w-4" />
              {t('help.tabs.guides')}
            </TabsTrigger>
            <TabsTrigger value="tutorials" data-testid="tab-tutorials">
              <Video className="mr-2 h-4 w-4" />
              {t('help.tabs.tutorials')}
            </TabsTrigger>
            <TabsTrigger value="contact" data-testid="tab-contact">
              <FileText className="mr-2 h-4 w-4" />
              {t('help.tabs.contact')}
            </TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('help.faq.title')}</CardTitle>
                <CardDescription>{t('help.faq.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="space-y-4">
                  {filteredFAQs.map((item, index) => (
                    <AccordionItem
                      key={item.id}
                      value={item.id}
                      className="rounded-lg border border-gray-200 bg-white px-6 py-2 shadow-sm"
                      data-testid={`faq-item-${index}`}
                    >
                      <AccordionTrigger
                        className="text-left text-lg font-semibold hover:no-underline"
                        data-testid={`faq-trigger-${index}`}
                      >
                        {t(item.questionKey)}
                      </AccordionTrigger>
                      <AccordionContent
                        className="text-gray-600"
                        data-testid={`faq-content-${index}`}
                      >
                        {t(item.answerKey)}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                {filteredFAQs.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    {t('help.noResults')}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guides Tab */}
          <TabsContent value="guides" className="mt-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredGuides.map(guide => (
                <Card
                  key={guide.id}
                  className="transition-shadow hover:shadow-lg"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {guide.icon && <guide.icon className="mr-2 h-5 w-5" />}
                      {t(guide.titleKey)}
                    </CardTitle>
                    <CardDescription>{t(guide.descriptionKey)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" asChild>
                      <a
                        href={guide.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('help.guides.readMore')}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {filteredGuides.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                {t('help.noResults')}
              </div>
            )}
          </TabsContent>

          {/* Tutorials Tab */}
          <TabsContent value="tutorials" className="mt-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {helpData.tutorials.map(tutorial => (
                <Card
                  key={tutorial.id}
                  className="transition-shadow hover:shadow-lg"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Video className="mr-2 h-5 w-5" />
                      {t(tutorial.titleKey)}
                    </CardTitle>
                    <CardDescription>
                      {t(tutorial.descriptionKey)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex aspect-video items-center justify-center rounded-lg bg-gray-200">
                      <Video className="h-12 w-12 text-gray-400" />
                    </div>
                    <Button variant="outline" className="w-full">
                      {t('help.tutorials.watch')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('help.contact.title')}</CardTitle>
                <CardDescription>
                  {t('help.contact.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {t('help.contact.email.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-gray-600">
                        {t('help.contact.email.description')}
                      </p>
                      <Button asChild>
                        <a href="mailto:support@examforge.jp">
                          {t('help.contact.email.button')}
                        </a>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {t('help.contact.documentation.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-gray-600">
                        {t('help.contact.documentation.description')}
                      </p>
                      <Button variant="outline" asChild>
                        <a href="#" target="_blank" rel="noopener noreferrer">
                          {t('help.contact.documentation.button')}
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {t('help.contact.hours.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-gray-600">
                      <p>{t('help.contact.hours.weekdays')}</p>
                      <p>{t('help.contact.hours.timezone')}</p>
                      <p className="text-sm text-gray-500">
                        {t('help.contact.hours.note')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
