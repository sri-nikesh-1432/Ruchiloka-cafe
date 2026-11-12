import { BUSINESS_INFO, formatIstDateDisplay } from '@ruchiloka/shared';
import { escapeHtml } from '../../lib/crypto';
import { getConfig } from '../../config/env';

interface BaseTemplateProps {
  preheader: string;
  heading: string;
  statusBadge: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

function wrapBrandedLayout({
  preheader,
  heading,
  statusBadge,
  bodyHtml,
  ctaLabel,
  ctaUrl,
}: BaseTemplateProps): string {
  const config = getConfig();
  const logoUrl = `${config.frontendUrl}/images/brand/ruchiloka-logo.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF6F0;color:#24160E;font-family:Georgia,'Times New Roman',serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF6F0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#FFFDF9;border:1px solid #DECFC0;border-radius:20px;overflow:hidden;">
          <tr>
            <td style="background-color:#24160E;padding:28px 32px;text-align:center;">
              <img src="${escapeHtml(logoUrl)}" alt="Ruchiloka Café" width="60" height="60" style="display:inline-block;border-radius:999px;background-color:#FFF6D5;padding:3px;object-fit:contain;" />
              <div style="margin-top:12px;font-size:24px;font-weight:600;color:#FFFFFF;letter-spacing:0.5px;">
                Ruchiloka Café
              </div>
              <div style="margin-top:4px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:#E9CDBE;">
                ${escapeHtml(BUSINESS_INFO.brandTagline)} · Kukatpally, Hyderabad
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="display:inline-block;padding:6px 14px;border-radius:999px;background-color:#EFE7DA;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#B46233;">
                ${escapeHtml(statusBadge)}
              </div>
              <h1 style="margin:16px 0 12px;font-size:28px;line-height:1.25;color:#24160E;">
                ${escapeHtml(heading)}
              </h1>
              <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#4B2E1E;">
                ${bodyHtml}
              </div>
              ${
                ctaLabel && ctaUrl
                  ? `<div style="margin-top:26px;">
                       <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background-color:#B46233;color:#FFFFFF;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;padding:14px 28px;border-radius:999px;">
                         ${escapeHtml(ctaLabel)}
                       </a>
                     </div>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="background-color:#EFE7DA;padding:22px 32px;border-top:1px solid #DECFC0;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#755746;">
              <strong style="color:#24160E;">${escapeHtml(BUSINESS_INFO.name)}</strong><br/>
              ${escapeHtml(BUSINESS_INFO.address.full)}<br/>
              Phone: ${escapeHtml(BUSINESS_INFO.phone)} · Email: <a href="${escapeHtml(BUSINESS_INFO.emailHref)}" style="color:#B46233;text-decoration:none;">${escapeHtml(BUSINESS_INFO.email)}</a> · Timings in IST (Asia/Kolkata)
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildVerificationEmail(params: { name: string; verifyUrl: string }) {
  return {
    subject: 'Verify your Ruchiloka Café account',
    html: wrapBrandedLayout({
      preheader: 'Confirm your email address for Ruchiloka Café.',
      statusBadge: 'Account Verification',
      heading: `Welcome, ${params.name}`,
      bodyHtml: `<p>Thank you for registering with Ruchiloka Café. Please verify your email address to secure your account and table reservations.</p>
        <p style="font-size:13px;color:#755746;">This verification link expires in 24 hours.</p>`,
      ctaLabel: 'Verify Email Address',
      ctaUrl: params.verifyUrl,
    }),
  };
}

export interface ReservationEmailDetails {
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  specialRequests?: string | null;
  status: string;
  adminNotes?: string | null;
}

function renderReservationSummaryTable(d: ReservationEmailDetails): string {
  const displayDate = formatIstDateDisplay(d.reservationDate);
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;background-color:#FAF6F0;border:1px solid #DECFC0;border-radius:12px;padding:16px;font-family:Arial,sans-serif;font-size:14px;">
    <tr><td style="padding:4px 0;color:#755746;">Booking Reference</td><td style="padding:4px 0;text-align:right;font-weight:700;color:#24160E;">${escapeHtml(d.bookingCode)}</td></tr>
    <tr><td style="padding:4px 0;color:#755746;">Guest</td><td style="padding:4px 0;text-align:right;color:#24160E;">${escapeHtml(d.customerName)}</td></tr>
    <tr><td style="padding:4px 0;color:#755746;">Date (IST)</td><td style="padding:4px 0;text-align:right;color:#24160E;">${escapeHtml(displayDate)}</td></tr>
    <tr><td style="padding:4px 0;color:#755746;">Time Slot</td><td style="padding:4px 0;text-align:right;font-weight:700;color:#24160E;">${escapeHtml(d.reservationTime)} IST</td></tr>
    <tr><td style="padding:4px 0;color:#755746;">Guests</td><td style="padding:4px 0;text-align:right;color:#24160E;">${d.guestCount}</td></tr>
    <tr><td style="padding:4px 0;color:#755746;">Phone</td><td style="padding:4px 0;text-align:right;color:#24160E;">${escapeHtml(d.customerPhone)}</td></tr>
    ${
      d.specialRequests
        ? `<tr><td style="padding:6px 0 0;color:#755746;">Requests</td><td style="padding:6px 0 0;text-align:right;font-style:italic;color:#4B2E1E;">${escapeHtml(d.specialRequests)}</td></tr>`
        : ''
    }
  </table>`;
}

export function buildReservationLifecycleEmail(
  event: 'RECEIVED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REMINDER',
  details: ReservationEmailDetails
) {
  const config = getConfig();
  const bookingsUrl = `${config.frontendUrl}/profile/bookings`;

  const copyMap = {
    RECEIVED: {
      subject: `Reservation ${details.status === 'CONFIRMED' ? 'Confirmed' : 'Received'} — ${details.bookingCode}`,
      badge: `Status: ${details.status}`,
      heading:
        details.status === 'CONFIRMED'
          ? 'Your table at Ruchiloka Café is confirmed'
          : 'We received your reservation request',
      intro:
        details.status === 'CONFIRMED'
          ? `<p>Namaste ${escapeHtml(details.customerName)}, your table is confirmed for the time below.</p>`
          : `<p>Namaste ${escapeHtml(details.customerName)}, thank you for booking with Ruchiloka Café. Our host team is reviewing availability and will confirm shortly.</p>`,
    },
    APPROVED: {
      subject: `Table Confirmed — ${details.bookingCode} | Ruchiloka Café`,
      badge: 'Confirmed',
      heading: 'Your table reservation is confirmed',
      intro: `<p>Namaste ${escapeHtml(details.customerName)}, we are delighted to confirm your table reservation at Ruchiloka Café.</p>`,
    },
    REJECTED: {
      subject: `Reservation Update — ${details.bookingCode} | Ruchiloka Café`,
      badge: 'Unavailable',
      heading: 'Unable to accommodate your requested slot',
      intro: `<p>Namaste ${escapeHtml(details.customerName)}, unfortunately our seating capacity is full for your requested time slot. Please choose another time or call us at ${escapeHtml(BUSINESS_INFO.phone)}.</p>`,
    },
    CANCELLED: {
      subject: `Reservation Cancelled — ${details.bookingCode}`,
      badge: 'Cancelled',
      heading: 'Your reservation has been cancelled',
      intro: `<p>Namaste ${escapeHtml(details.customerName)}, this reservation has been marked as cancelled as requested.</p>`,
    },
    REMINDER: {
      subject: `Upcoming Table Reminder — ${details.bookingCode}`,
      badge: 'Reminder',
      heading: 'We look forward to hosting you soon',
      intro: `<p>Namaste ${escapeHtml(details.customerName)}, here is a friendly reminder of your upcoming reservation at Ruchiloka Café.</p>`,
    },
  }[event];

  const noteHtml = details.adminNotes
    ? `<p style="margin-top:12px;font-size:13px;color:#4B2E1E;"><strong>Note from café team:</strong> ${escapeHtml(details.adminNotes)}</p>`
    : '';

  return {
    subject: copyMap.subject,
    html: wrapBrandedLayout({
      preheader: `${copyMap.heading} (${details.bookingCode})`,
      statusBadge: copyMap.badge,
      heading: copyMap.heading,
      bodyHtml: `${copyMap.intro}${renderReservationSummaryTable(details)}${noteHtml}`,
      ctaLabel: 'Manage Reservations',
      ctaUrl: bookingsUrl,
    }),
  };
}

export function buildAdminReservationNotificationEmail(details: ReservationEmailDetails) {
  const config = getConfig();
  return {
    subject: `[New Reservation · ${details.status}] ${details.customerName} (${details.guestCount} guests) — ${details.reservationDate} ${details.reservationTime} IST`,
    html: wrapBrandedLayout({
      preheader: `Reservation ${details.bookingCode} from ${details.customerName}`,
      statusBadge: `Admin Alert · ${details.status}`,
      heading: 'New Table Reservation',
      bodyHtml: `<p>A guest submitted a table reservation for <strong>${escapeHtml(details.customerEmail)}</strong>.</p>
        ${renderReservationSummaryTable(details)}`,
      ctaLabel: 'Open Admin Dashboard',
      ctaUrl: `${config.frontendUrl}/admin`,
    }),
  };
}

export function buildContactEnquiryEmail(params: {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  enquiryId: string;
}) {
  return {
    subject: `[Café Enquiry] ${params.subject}`,
    html: wrapBrandedLayout({
      preheader: `New message from ${params.name}`,
      statusBadge: 'Customer Enquiry',
      heading: params.subject,
      bodyHtml: `<p><strong>From:</strong> ${escapeHtml(params.name)} (${escapeHtml(params.email)})<br/>
        <strong>Phone:</strong> ${escapeHtml(params.phone || 'Not provided')}<br/>
        <strong>Reference:</strong> ${escapeHtml(params.enquiryId)}</p>
        <div style="margin-top:16px;padding:16px;background-color:#FAF6F0;border:1px solid #DECFC0;border-radius:12px;white-space:pre-wrap;">${escapeHtml(params.message)}</div>`,
    }),
  };
}
