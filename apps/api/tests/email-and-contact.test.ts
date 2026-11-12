import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailDeliveryStatus } from '@prisma/client';
import { applyTestEnvDefaults, createMockPrisma, DEFAULT_TEST_SETTINGS } from './helpers/mockPrisma';
import { invokeApp } from './helpers/httpInvoke';

const prismaMock = vi.hoisted(() => ({
  client: null as unknown as ReturnType<typeof createMockPrisma>,
}));

const resendSendMock = vi.hoisted(() => vi.fn());

vi.mock('../src/lib/prisma', async () => {
  const helper = await import('./helpers/mockPrisma');
  prismaMock.client = helper.createMockPrisma();
  return { prisma: prismaMock.client };
});

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: resendSendMock,
    },
  })),
}));

import { resetConfigCacheForTests } from '../src/config/env';
import {
  dispatchReservationNotifications,
  sendTransactionalEmail,
} from '../src/modules/email/email.service';
import { createApp } from '../src/app';

describe('Transactional email retries, multi-recipient alerts, contact form & health endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetConfigCacheForTests();
    applyTestEnvDefaults();
    prismaMock.client.adminSetting.findUnique.mockResolvedValue({
      ...DEFAULT_TEST_SETTINGS,
      notificationEmails: ['owner@ruchilokacafe.com', 'manager@ruchilokacafe.com'],
    });
  });

  it('retries transient Resend errors and logs SENT on recovery', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM_EMAIL = 'Ruchiloka <bookings@ruchilokacafe.com>';
    resetConfigCacheForTests();

    resendSendMock
      .mockResolvedValueOnce({ data: null, error: { message: 'Temporary rate limit' } })
      .mockResolvedValueOnce({ data: { id: 'msg-123' }, error: null });

    const res = await sendTransactionalEmail({
      eventType: 'TEST_RETRY',
      to: 'guest@example.com',
      subject: 'Hello',
      html: '<p>Test</p>',
    });

    expect(res.status).toBe(EmailDeliveryStatus.SENT);
    expect(res.messageId).toBe('msg-123');
    expect(resendSendMock).toHaveBeenCalledTimes(2);
    expect(prismaMock.client.emailLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: EmailDeliveryStatus.SENT,
          attempts: 2,
          providerMessageId: 'msg-123',
        }),
      })
    );
  });

  it('dispatches reservation notifications to customer + multiple unique admin recipients with partial-failure resilience', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM_EMAIL = 'Ruchiloka <bookings@ruchilokacafe.com>';
    process.env.ADMIN_NOTIFICATION_EMAIL = 'manager@ruchilokacafe.com,alerts@ruchilokacafe.com';
    resetConfigCacheForTests();

    resendSendMock.mockImplementation(async (payload: { to: string }) => {
      if (payload.to === 'manager@ruchilokacafe.com') {
        return { data: null, error: { message: 'Mailbox bounced' } };
      }
      return { data: { id: `id-${payload.to}` }, error: null };
    });

    const outcome = await dispatchReservationNotifications('RECEIVED', {
      bookingCode: 'RC-20261120-AA11',
      customerName: 'Aarav Kulkarni',
      customerEmail: 'aarav@example.com',
      customerPhone: '+91 9876543210',
      reservationDate: '2026-11-20',
      reservationTime: '7:00 PM',
      guestCount: 4,
      status: 'PENDING',
    });

    expect(outcome.customerResult.status).toBe(EmailDeliveryStatus.SENT);
    expect(outcome.adminResults).toHaveLength(3);
    expect(outcome.adminResults.find((r) => r.recipient === 'owner@ruchilokacafe.com')?.status).toBe(
      EmailDeliveryStatus.SENT
    );
    expect(outcome.adminResults.find((r) => r.recipient === 'alerts@ruchilokacafe.com')?.status).toBe(
      EmailDeliveryStatus.SENT
    );
    expect(outcome.adminResults.find((r) => r.recipient === 'manager@ruchilokacafe.com')?.status).toBe(
      EmailDeliveryStatus.FAILED
    );
  });

  it('persists contact enquiries cleanly and exposes healthy/degraded /health probe', async () => {
    const app = createApp();
    prismaMock.client.contactMessage.create.mockResolvedValueOnce({
      id: 'msg-uuid-1',
      name: 'Meera Nair',
      email: 'meera@example.com',
      phone: null,
      subject: 'Private coffee tasting enquiry',
      message: 'We would love to host a team coffee morning next Friday.',
      createdAt: new Date('2026-11-11T12:00:00Z'),
    });

    const contactRes = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/contact',
      body: {
        name: 'Meera Nair',
        email: 'MEERA@example.com',
        subject: 'Private coffee tasting enquiry',
        message: 'We would love to host a team coffee morning next Friday.',
      },
    });
    expect(contactRes.status).toBe(201);
    expect(contactRes.body.data.id).toBe('msg-uuid-1');

    const healthyRes = await invokeApp(app, {
      method: 'GET',
      path: '/api/v1/health',
    });
    expect(healthyRes.status).toBe(200);
    expect(healthyRes.body.data.database).toBe('ok');

    prismaMock.client.$queryRaw.mockRejectedValueOnce(new Error('DB connection refused'));
    const degradedRes = await invokeApp(app, {
      method: 'GET',
      path: '/api/v1/health',
    });
    expect(degradedRes.status).toBe(503);
    expect(degradedRes.body.data.database).toBe('unreachable');
  });
});
