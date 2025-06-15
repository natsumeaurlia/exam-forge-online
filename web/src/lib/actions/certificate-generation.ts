'use server';

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { authAction } from './auth-action';
import {
  CertificateData,
  CertificateGenerationOptions,
} from '@/types/certificate';

// Certificate generation schema
const generateCertificateSchema = z.object({
  templateId: z.string().cuid(),
  quizResponseId: z.string().cuid(),
  data: z.object({
    recipientName: z.string().min(1),
    recipientEmail: z.string().email(),
    quizTitle: z.string().min(1),
    score: z.number().min(0).max(100),
    completionDate: z.string().datetime(),
    validUntil: z.string().datetime().optional(),
    issuerName: z.string().min(1),
    issuerTitle: z.string().optional(),
    customFields: z.record(z.string()).optional(),
  }),
  options: z
    .object({
      generateQR: z.boolean().default(true),
      generatePDF: z.boolean().default(true),
      emailRecipient: z.boolean().default(false),
    })
    .optional(),
});

// Manual certificate generation schema
const generateManualCertificateSchema = z.object({
  templateId: z.string().cuid(),
  recipients: z.array(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      customFields: z.record(z.string()).optional(),
    })
  ),
  certificateData: z.object({
    title: z.string().min(1),
    issuerName: z.string().min(1),
    issuerTitle: z.string().optional(),
    completionDate: z.string().datetime(),
    validUntil: z.string().datetime().optional(),
  }),
  options: z
    .object({
      generateQR: z.boolean().default(true),
      generatePDF: z.boolean().default(true),
      emailRecipient: z.boolean().default(false),
    })
    .optional(),
});

/**
 * Generate a unique validation code for certificate
 */
function generateValidationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3 || i === 7) result += '-';
  }
  return result;
}

/**
 * Generate QR code URL for certificate verification
 */
function generateQRCode(validationCode: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/certificates/verify/${validationCode}`;

  // Using a QR code generation service (in production, you might want to use a library)
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationUrl)}`;
}

/**
 * Generate PDF from certificate template and data
 */
async function generateCertificatePDF(
  template: any,
  data: CertificateData,
  validationCode: string,
  qrCodeUrl?: string
): Promise<string> {
  // This is a simplified implementation
  // In production, you would use a proper PDF generation library like Puppeteer, jsPDF, or PDFKit

  try {
    // For now, return a placeholder PDF URL
    // In production, this would:
    // 1. Render the certificate template with the provided data
    // 2. Replace variables like {{recipient_name}} with actual values
    // 3. Add QR code if provided
    // 4. Generate PDF and upload to storage (S3, etc.)
    // 5. Return the PDF URL

    const pdfUrl = `https://example.com/certificates/${validationCode}.pdf`;
    return pdfUrl;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('PDF生成に失敗しました');
  }
}

/**
 * Replace template variables with actual data
 */
function replaceTemplateVariables(
  template: string,
  data: CertificateData
): string {
  return template
    .replace(/\{\{recipient_name\}\}/g, data.recipientName)
    .replace(/\{\{quiz_title\}\}/g, data.quizTitle)
    .replace(/\{\{score\}\}/g, data.score.toString())
    .replace(
      /\{\{completion_date\}\}/g,
      data.completionDate.toLocaleDateString('ja-JP')
    )
    .replace(/\{\{issuer_name\}\}/g, data.issuerName)
    .replace(/\{\{issuer_title\}\}/g, data.issuerTitle || '');
}

/**
 * Send certificate email to recipient
 */
async function sendCertificateEmail(
  recipientEmail: string,
  recipientName: string,
  certificateData: any
): Promise<void> {
  // TODO: Implement email sending
  // This would integrate with your email service (SendGrid, AWS SES, etc.)
  console.log(`Sending certificate email to ${recipientEmail}`);
}

// Generate certificate from quiz response
export const generateCertificate = authAction
  .schema(generateCertificateSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    try {
      const { userId } = ctx;

      // Verify quiz response and template access
      const [quizResponse, template] = await Promise.all([
        prisma.quizResponse.findFirst({
          where: {
            id: data.quizResponseId,
            OR: [
              { userId }, // User's own response
              {
                quiz: {
                  team: {
                    members: {
                      some: {
                        userId,
                        status: 'ACTIVE',
                        role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
                      },
                    },
                  },
                },
              },
            ],
          },
          include: {
            quiz: {
              include: {
                team: true,
              },
            },
          },
        }),
        prisma.certificateTemplate.findFirst({
          where: {
            id: data.templateId,
            OR: [
              {
                team: {
                  members: {
                    some: {
                      userId,
                      status: 'ACTIVE',
                    },
                  },
                },
              },
              { isPublic: true },
            ],
          },
        }),
      ]);

      if (!quizResponse) {
        throw new Error('クイズ回答が見つかりません');
      }

      if (!template) {
        throw new Error('証明書テンプレートが見つかりません');
      }

      // Check if certificate already exists
      const existingCertificate = await prisma.certificate.findFirst({
        where: {
          quizResponseId: data.quizResponseId,
          templateId: data.templateId,
        },
      });

      if (existingCertificate) {
        throw new Error('この回答に対する証明書は既に発行済みです');
      }

      // Generate validation code and QR code
      const validationCode = generateValidationCode();
      const qrCodeUrl = data.options?.generateQR
        ? generateQRCode(validationCode)
        : undefined;

      // Generate PDF if requested
      let pdfUrl: string | undefined;
      if (data.options?.generatePDF) {
        pdfUrl = await generateCertificatePDF(
          template,
          data.data,
          validationCode,
          qrCodeUrl
        );
      }

      // Calculate validity date
      const validUntil = data.data.validUntil
        ? new Date(data.data.validUntil)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

      // Create certificate record
      const certificate = await prisma.certificate.create({
        data: {
          templateId: data.templateId,
          quizResponseId: data.quizResponseId,
          recipientName: data.data.recipientName,
          recipientEmail: data.data.recipientEmail,
          validationCode,
          qrCode: qrCodeUrl,
          pdfUrl,
          issuedAt: new Date(),
          validUntil,
          status: 'ACTIVE',
          metadata: {
            score: data.data.score,
            quizTitle: data.data.quizTitle,
            issuerName: data.data.issuerName,
            issuerTitle: data.data.issuerTitle,
            customFields: data.data.customFields,
          },
        },
        include: {
          template: {
            select: { name: true },
          },
        },
      });

      // Send email if requested
      if (data.options?.emailRecipient) {
        await sendCertificateEmail(
          data.data.recipientEmail,
          data.data.recipientName,
          certificate
        );
      }

      revalidatePath('/dashboard/certificates');
      return { success: true, data: certificate };
    } catch (error) {
      console.error('Certificate generation error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : '証明書の生成に失敗しました',
      };
    }
  });

// Generate multiple certificates manually
export const generateManualCertificates = authAction
  .schema(generateManualCertificateSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    try {
      const { userId } = ctx;

      // Verify template access
      const template = await prisma.certificateTemplate.findFirst({
        where: {
          id: data.templateId,
          team: {
            members: {
              some: {
                userId,
                status: 'ACTIVE',
                role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
              },
            },
          },
        },
      });

      if (!template) {
        throw new Error('証明書テンプレートが見つかりません');
      }

      const certificates = [];
      const errors = [];

      // Generate certificates for each recipient
      for (const recipient of data.recipients) {
        try {
          const validationCode = generateValidationCode();
          const qrCodeUrl = data.options?.generateQR
            ? generateQRCode(validationCode)
            : undefined;

          const certificateData: CertificateData = {
            recipientName: recipient.name,
            recipientEmail: recipient.email,
            quizTitle: data.certificateData.title,
            score: 100, // Manual certificates default to 100%
            completionDate: new Date(data.certificateData.completionDate),
            validUntil: data.certificateData.validUntil
              ? new Date(data.certificateData.validUntil)
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            issuerName: data.certificateData.issuerName,
            issuerTitle: data.certificateData.issuerTitle,
            customFields: recipient.customFields,
          };

          let pdfUrl: string | undefined;
          if (data.options?.generatePDF) {
            pdfUrl = await generateCertificatePDF(
              template,
              certificateData,
              validationCode,
              qrCodeUrl
            );
          }

          const certificate = await prisma.certificate.create({
            data: {
              templateId: data.templateId,
              recipientName: recipient.name,
              recipientEmail: recipient.email,
              validationCode,
              qrCode: qrCodeUrl,
              pdfUrl,
              issuedAt: new Date(),
              validUntil: certificateData.validUntil,
              status: 'ACTIVE',
              metadata: {
                title: data.certificateData.title,
                issuerName: data.certificateData.issuerName,
                issuerTitle: data.certificateData.issuerTitle,
                customFields: recipient.customFields,
                manuallyGenerated: true,
              },
            },
          });

          certificates.push(certificate);

          // Send email if requested
          if (data.options?.emailRecipient) {
            await sendCertificateEmail(
              recipient.email,
              recipient.name,
              certificate
            );
          }
        } catch (error) {
          errors.push({
            recipient: recipient.name,
            error:
              error instanceof Error
                ? error.message
                : '証明書の生成に失敗しました',
          });
        }
      }

      revalidatePath('/dashboard/certificates');
      return {
        success: true,
        data: {
          certificates,
          errors,
          totalGenerated: certificates.length,
          totalErrors: errors.length,
        },
      };
    } catch (error) {
      console.error('Manual certificate generation error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '証明書の一括生成に失敗しました',
      };
    }
  });

// Revoke certificate
export const revokeCertificate = authAction
  .schema(z.object({ id: z.string().cuid(), reason: z.string().optional() }))
  .action(async ({ parsedInput: { id, reason }, ctx }) => {
    try {
      const { userId } = ctx;

      // Verify certificate access
      const certificate = await prisma.certificate.findFirst({
        where: {
          id,
          template: {
            team: {
              members: {
                some: {
                  userId,
                  status: 'ACTIVE',
                  role: { in: ['OWNER', 'ADMIN'] },
                },
              },
            },
          },
        },
      });

      if (!certificate) {
        throw new Error('証明書が見つからないか、取り消し権限がありません');
      }

      if (certificate.status === 'REVOKED') {
        throw new Error('この証明書は既に取り消し済みです');
      }

      // Update certificate status
      const updatedCertificate = await prisma.certificate.update({
        where: { id },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revocationReason: reason,
        },
      });

      revalidatePath('/dashboard/certificates');
      return { success: true, data: updatedCertificate };
    } catch (error) {
      console.error('Certificate revocation error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '証明書の取り消しに失敗しました',
      };
    }
  });

// Get certificate analytics
export const getCertificateAnalytics = authAction
  .schema(
    z.object({
      templateId: z.string().cuid().optional(),
      timeRange: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
    })
  )
  .action(async ({ parsedInput: { templateId, timeRange }, ctx }) => {
    try {
      const { userId } = ctx;

      // Calculate date range
      const now = new Date();
      const daysBack = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
      }[timeRange];

      const startDate = new Date(
        now.getTime() - daysBack * 24 * 60 * 60 * 1000
      );

      // Build where clause
      const where: any = {
        issuedAt: {
          gte: startDate,
        },
        template: {
          team: {
            members: {
              some: {
                userId,
                status: 'ACTIVE',
              },
            },
          },
        },
      };

      if (templateId) {
        where.templateId = templateId;
      }

      // Get analytics data
      const [
        totalCertificates,
        activeCertificates,
        revokedCertificates,
        verificationCount,
        recentCertificates,
      ] = await Promise.all([
        prisma.certificate.count({ where }),
        prisma.certificate.count({ where: { ...where, status: 'ACTIVE' } }),
        prisma.certificate.count({ where: { ...where, status: 'REVOKED' } }),
        prisma.certificateVerification.count({
          where: {
            verifiedAt: {
              gte: startDate,
            },
            certificate: {
              template: {
                team: {
                  members: {
                    some: {
                      userId,
                      status: 'ACTIVE',
                    },
                  },
                },
              },
            },
          },
        }),
        prisma.certificate.findMany({
          where,
          include: {
            template: {
              select: { name: true },
            },
          },
          orderBy: { issuedAt: 'desc' },
          take: 10,
        }),
      ]);

      return {
        success: true,
        data: {
          totalCertificates,
          activeCertificates,
          revokedCertificates,
          verificationCount,
          recentCertificates,
          timeRange,
        },
      };
    } catch (error) {
      console.error('Certificate analytics error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '分析データの取得に失敗しました',
      };
    }
  });
