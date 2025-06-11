'use server';

import { createSafeActionClient } from 'next-safe-action';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const action = createSafeActionClient();

const verifyCertificateSchema = z.object({
  code: z.string(),
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
    });

    if (!certificate) {
      return { success: false };
    }

    await prisma.certificateVerification.create({
      data: {
        certificateId: certificate.id,
        ipAddress: ip,
        userAgent,
      },
    });

    return { success: true, certificateId: certificate.id };
  });
