export interface Testimonial {
  id: string;
  name: string;
  position: string;
  company: string;
  companyLogo?: string;
  avatar: string;
  content: string;
  rating: number; // 1-5 stars
}

export interface TestimonialCarouselProps {
  lng: string;
}
