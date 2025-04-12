
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Mail, Phone, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/use-toast";

interface ContactFormData {
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
}

function ContactView({
  formData,
  setFormData,
  handleSubmit,
  isSubmitting,
  contactInfo,
  faqs
}: {
  formData: ContactFormData;
  setFormData: (formData: ContactFormData) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  contactInfo: {
    title: string;
    email: string;
    phone: string;
    address: string;
  };
  faqs: {
    title: string;
    questions: {
      question: string;
      answer: string;
    }[];
  }
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-2">{contactInfo.title}</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    {formData.name}
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    {formData.email}
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="company" className="block text-sm font-medium mb-1">
                    {formData.company}
                  </label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-1">
                    {formData.subject}
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-1">
                    {formData.message}
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2">◌</span>
                      Sending...
                    </span>
                  ) : (
                    formData.submit
                  )}
                </Button>
              </form>
            </div>
            
            {/* Contact Information and FAQs */}
            <div className="space-y-8">
              {/* Contact Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">{contactInfo.title}</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-examforge-blue mr-3 mt-0.5" />
                    <span>{contactInfo.email}</span>
                  </div>
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-examforge-blue mr-3 mt-0.5" />
                    <span>{contactInfo.phone}</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-examforge-blue mr-3 mt-0.5" />
                    <span>{contactInfo.address}</span>
                  </div>
                </div>
              </div>
              
              {/* FAQs */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{faqs.title}</h3>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.questions.map((faq, index) => (
                    <AccordionItem key={index} value={`faq-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Contact() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: t('pages.contact.form.name'),
    email: t('pages.contact.form.email'),
    company: t('pages.contact.form.company'),
    subject: t('pages.contact.form.subject'),
    message: t('pages.contact.form.message'),
    submit: t('pages.contact.form.submit')
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: t('pages.contact.form.success'),
      });
      setIsSubmitting(false);
    }, 1500);
  };
  
  const contactInfo = {
    title: t('pages.contact.contact.title'),
    email: t('pages.contact.contact.email'),
    phone: t('pages.contact.contact.phone'),
    address: t('pages.contact.contact.address')
  };
  
  const faqs = {
    title: t('pages.contact.faq.title'),
    questions: t('pages.contact.faq.questions', { returnObjects: true })
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <ContactView
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          contactInfo={contactInfo}
          faqs={faqs}
        />
      </main>
    </div>
  );
}
