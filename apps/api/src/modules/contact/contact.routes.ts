import { Router } from 'express';
import { ContactFormSchema } from '@ruchiloka/shared';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/errors';
import { validateBody } from '../../middleware/validate';
import { dispatchContactEnquiryNotifications } from '../email/email.service';
import { recordAuditLog } from '../audit/audit.service';

export const contactRouter = Router();

contactRouter.post(
  '/',
  validateBody(ContactFormSchema),
  asyncHandler(async (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    const saved = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
        status: 'NEW',
      },
    });

    await recordAuditLog({
      actorUserId: req.currentUser?.id ?? null,
      actorEmail: saved.email,
      action: 'CONTACT_ENQUIRY_SUBMITTED',
      entityType: 'ContactMessage',
      entityId: saved.id,
      metadata: { subject: saved.subject },
      ipAddress: req.ip,
    });

    try {
      await dispatchContactEnquiryNotifications({
        enquiryId: saved.id,
        name: saved.name,
        email: saved.email,
        phone: saved.phone,
        subject: saved.subject,
        message: saved.message,
      });
    } catch (err) {
      console.error('[Contact] Admin email notification error:', err);
    }

    res.status(201).json({
      success: true,
      data: {
        id: saved.id,
        submittedAt: saved.createdAt.toISOString(),
      },
    });
  })
);
