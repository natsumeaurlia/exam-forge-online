'use server';

import { createSafeActionClient } from 'next-safe-action';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const action = createSafeActionClient();

const verifyCertificateSchema = z.object({
  code: z.string().regex(/^[A-Z0-9]{10,30}$/),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
});

export const verifyCertificate = action
  .schema(verifyCertificateSchema)
  .action(async ({ parsedInput }) => {
    const { code, ip, userAgent } = parsedInput;

    const certificate = await prisma.certificate.findFirst({
      where: {
        validationCode: code,
        status: {
          not: 'REVOKED',
        },
      },
      include: {
        quizResponse: {
          select: {
            quiz: {
              select: { title: true },
            },
          },
        },
      },
    });

    if (!certificate) {
      return { success: false };
    }

    if (
      certificate.expiryDate &&
      certificate.expiryDate.getTime() < Date.now()
    ) {
      return { success: false };
    }

    await prisma.certificateVerification.create({
      data: {
        certificateId: certificate.id,
        ipAddress: ip,
        userAgent,
      },
    });

    return {
      success: true,
      certificate: {
        recipientName: certificate.recipientName,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        quizTitle: certificate.quizResponse.quiz.title,
      },
    };
  });
