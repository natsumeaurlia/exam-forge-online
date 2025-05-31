'use client';

import * as React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Star } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { testimonials } from '@/data/testimonials';
import { TestimonialCarouselProps } from '@/types/testimonial';
import { cn } from '@/lib/utils';

export function TestimonialCarousel({ lng }: TestimonialCarouselProps) {
  const t = useTranslations();
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  // Auto-play functionality
  React.useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });

    // Auto-play every 5 seconds
    const interval = setInterval(() => {
      if (!isHovered) {
        if (api.canScrollNext()) {
          api.scrollNext();
        } else {
          api.scrollTo(0); // Loop back to start
        }
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      api?.off('select', () => {
        setCurrent(api.selectedScrollSnap() + 1);
      });
    };
  }, [api, isHovered]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          'h-4 w-4',
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        )}
      />
    ));
  };

  const renderDotIndicators = () => {
    return (
      <div className="mt-6 flex justify-center space-x-2">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            className={cn(
              'h-3 w-3 rounded-full transition-colors',
              i === current - 1 ? 'bg-primary' : 'bg-gray-300'
            )}
            onClick={() => api?.scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            data-testid={`testimonial-dot-${i}`}
          />
        ))}
      </div>
    );
  };

  return (
    <section
      className="bg-gradient-to-b from-white to-gray-50 py-24"
      data-testid="testimonials-section"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-16 text-center" data-testid="testimonials-header">
          <h2
            className="mb-4 text-3xl font-bold md:text-4xl"
            data-testid="testimonials-title"
          >
            {t('testimonials.title')}
          </h2>
          <p
            className="mx-auto max-w-2xl text-lg text-gray-600"
            data-testid="testimonials-description"
          >
            {t('testimonials.description')}
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          <Carousel
            setApi={setApi}
            className="w-full"
            opts={{
              align: 'start',
              loop: true,
            }}
            data-testid="testimonials-carousel"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem
                  key={testimonial.id}
                  className="pl-2 md:basis-1/2 md:pl-4 lg:basis-1/3"
                  data-testid={`testimonial-item-${index}`}
                >
                  <Card className="h-full">
                    <CardContent className="p-6">
                      {/* Rating */}
                      <div
                        className="mb-4 flex"
                        data-testid={`testimonial-rating-${index}`}
                      >
                        {renderStars(testimonial.rating)}
                      </div>

                      {/* Testimonial Content */}
                      <blockquote
                        className="mb-6 leading-relaxed text-gray-700 italic"
                        data-testid={`testimonial-content-${index}`}
                      >
                        "{t(testimonial.content)}"
                      </blockquote>

                      {/* User Info */}
                      <div className="flex items-center">
                        <Avatar
                          className="mr-4 h-12 w-12"
                          data-testid={`testimonial-avatar-${index}`}
                        >
                          <AvatarImage
                            src={testimonial.avatar}
                            alt={t(testimonial.name)}
                          />
                          <AvatarFallback>
                            {t(testimonial.name)
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <h4
                            className="font-semibold text-gray-900"
                            data-testid={`testimonial-name-${index}`}
                          >
                            {t(testimonial.name)}
                          </h4>
                          <p
                            className="text-sm text-gray-600"
                            data-testid={`testimonial-position-${index}`}
                          >
                            {t(testimonial.position)}
                          </p>
                          <p
                            className="text-sm text-gray-500"
                            data-testid={`testimonial-company-${index}`}
                          >
                            {t(testimonial.company)}
                          </p>
                        </div>

                        {/* Company Logo */}
                        {testimonial.companyLogo && (
                          <div
                            className="ml-4"
                            data-testid={`testimonial-logo-${index}`}
                          >
                            <Image
                              src={testimonial.companyLogo}
                              alt={`${t(testimonial.company)} logo`}
                              width={32}
                              height={32}
                              className="h-8 w-auto opacity-70"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation Buttons */}
            <CarouselPrevious
              className="left-4 md:left-8"
              data-testid="testimonials-prev-button"
            />
            <CarouselNext
              className="right-4 md:right-8"
              data-testid="testimonials-next-button"
            />
          </Carousel>

          {/* Dot Indicators */}
          {renderDotIndicators()}
        </div>
      </div>
    </section>
  );
}
