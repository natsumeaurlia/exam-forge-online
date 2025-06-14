import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from '@react-email/components';

interface BaseEmailTemplateProps {
  preview: string;
  heading: string;
  children: React.ReactNode;
  footerText?: string;
  unsubscribeUrl?: string;
}

export const BaseEmailTemplate = ({
  preview,
  heading,
  children,
  footerText = 'このメールは ExamForge から送信されています。',
  unsubscribeUrl,
}: BaseEmailTemplateProps) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto my-auto max-w-2xl px-6 py-12">
            {/* Header */}
            <Section className="mb-8">
              <Img
                src="https://examforge.com/logo.png"
                width="150"
                height="40"
                alt="ExamForge"
                className="mx-auto"
              />
            </Section>

            {/* Main Content */}
            <Section className="mb-8">
              <Heading className="mb-6 text-center text-2xl font-bold text-gray-800">
                {heading}
              </Heading>
              {children}
            </Section>

            {/* Footer */}
            <Section className="mt-8 border-t border-gray-200 pt-6">
              <Text className="mb-4 text-center text-sm text-gray-500">
                {footerText}
              </Text>
              {unsubscribeUrl && (
                <Text className="text-center text-sm text-gray-400">
                  <Link
                    href={unsubscribeUrl}
                    className="text-gray-400 underline"
                  >
                    配信停止
                  </Link>
                </Text>
              )}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
