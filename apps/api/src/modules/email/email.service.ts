import { Resend } from 'resend';
import { EmailDeliveryStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { getConfig } from '../../config/env';
import { getEffectiveNotificationRecipients } from '../settings/settings.service';
import {
  buildAdminReservationNotificationEmail,
  buildContactEnquiryEmail,
  buildReservationLifecycleEmail,
  buildVerificationEmail,
  type ReservationEmailDetails,
} from './email.templates';

const MAX_SEND_ATTEMPTS = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SendEmailResult {
  recipient: string;
  status: EmailDeliveryStatus;
  messageId: string | null;
  error?: string;
}

export async function sendTransactionalEmail(params: {
  eventType: string;
  to: string;
  subject: string;
  html: string;
  metadata?: unknown;
  replyTo?: string;
}): Promise<SendEmailResult> {
  const config = getConfig();

  if (!config.resend.enabled || !config.resend.apiKey || !config.resend.fromEmail) {
    await prisma.emailLog.create({
      data: {
        eventType: params.eventType,
        recipientEmail: params.to,
        subject: params.subject,
        status: EmailDeliveryStatus.SKIPPED,
        errorMessage: 'Resend API key or verified RESEND_FROM_EMAIL is not configured.',
        attempts: 0,
        metadataJson: params.metadata ? (params.metadata as object) : undefined,
      },
    });
    return { recipient: params.to, status: EmailDeliveryStatus.SKIPPED, messageId: null };
  }

  const resend = new Resend(config.resend.apiKey);
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
    try {
      const result = await resend.emails.send({
        from: config.resend.fromEmail,
        to: params.to,
        subject: params.subject,
        html: params.html,
        ...(params.replyTo ? { replyTo: params.replyTo } : {}),
      });

      if (result.error) {
        throw new Error(result.error.message || 'Resend API returned an error.');
      }

      const messageId = result.data?.id ?? null;
      await prisma.emailLog.create({
        data: {
          eventType: params.eventType,
          recipientEmail: params.to,
          subject: params.subject,
          status: EmailDeliveryStatus.SENT,
          providerMessageId: messageId,
          attempts: attempt,
          metadataJson: params.metadata ? (params.metadata as object) : undefined,
        },
      });

      return { recipient: params.to, status: EmailDeliveryStatus.SENT, messageId };
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown email dispatch error';
      if (attempt < MAX_SEND_ATTEMPTS) {
        await sleep(250 * attempt);
      }
    }
  }

  await prisma.emailLog.create({
    data: {
      eventType: params.eventType,
      recipientEmail: params.to,
      subject: params.subject,
      status: EmailDeliveryStatus.FAILED,
      errorMessage: lastError ?? 'Failed after retries',
      attempts: MAX_SEND_ATTEMPTS,
      metadataJson: params.metadata ? (params.metadata as object) : undefined,
    },
  });

  return {
    recipient: params.to,
    status: EmailDeliveryStatus.FAILED,
    messageId: null,
    error: lastError,
  };
}

export async function dispatchVerificationEmail(params: {
  name: string;
  email: string;
  rawToken: string;
}) {
  const config = getConfig();
  const verifyUrl = `${config.backendUrl}/api/v1/auth/verify-email?token=${encodeURIComponent(params.rawToken)}`;
  const tpl = buildVerificationEmail({ name: params.name, verifyUrl });

  return sendTransactionalEmail({
    eventType: 'ACCOUNT_VERIFICATION',
    to: params.email,
    subject: tpl.subject,
    html: tpl.html,
  });
}

export async function dispatchReservationNotifications(
  event: 'RECEIVED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REMINDER',
  details: ReservationEmailDetails
): Promise<{ customerResult: SendEmailResult; adminResults: SendEmailResult[] }> {
  const customerTpl = buildReservationLifecycleEmail(event, details);
  const customerResult = await sendTransactionalEmail({
    eventType: `RESERVATION_${event}_CUSTOMER`,
    to: details.customerEmail,
    subject: customerTpl.subject,
    html: customerTpl.html,
    metadata: { bookingCode: details.bookingCode, status: details.status },
  });

  let adminResults: SendEmailResult[] = [];
  if (event === 'RECEIVED' || event === 'CANCELLED') {
    const recipients = await getEffectiveNotificationRecipients();
    const adminTpl =
      event === 'RECEIVED'
        ? buildAdminReservationNotificationEmail(details)
        : {
            subject: `[Booking Cancelled] ${details.bookingCode} — ${details.customerName}`,
            html: buildReservationLifecycleEmail('CANCELLED', details).html,
          };

    adminResults = await Promise.all(
      recipients.map((recipient) =>
        sendTransactionalEmail({
          eventType: `RESERVATION_${event}_ADMIN`,
          to: recipient,
          subject: adminTpl.subject,
          html: adminTpl.html,
          replyTo: details.customerEmail,
          metadata: { bookingCode: details.bookingCode },
        })
      )
    );
  }

  return { customerResult, adminResults };
}

export async function dispatchContactEnquiryNotifications(params: {
  enquiryId: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
}): Promise<SendEmailResult[]> {
  const recipients = await getEffectiveNotificationRecipients();
  if (recipients.length === 0) return [];

  const tpl = buildContactEnquiryEmail(params);
  return Promise.all(
    recipients.map((recipient) =>
      sendTransactionalEmail({
        eventType: 'CONTACT_ENQUIRY_ADMIN',
        to: recipient,
        subject: tpl.subject,
        html: tpl.html,
        replyTo: params.email,
        metadata: { enquiryId: params.enquiryId },
      })
    )
  );
}
