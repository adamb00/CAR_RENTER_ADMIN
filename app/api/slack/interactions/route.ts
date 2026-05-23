import { db } from '@/lib/db';
import { sendBookingRequestEmailAction } from '@/actions/sendBookingRequestEmailAction';
import { findAccommodationDailyPrice } from '@/lib/default-accommodation-prices';
import {
  hasSlackSigningSecret,
  parseTaskStatusActionValue,
  verifySlackRequestSignatureDetailed,
} from '@/lib/slack';
import type { TaskStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

type SlackInteractionPayload = {
  type?: string;
  user?: {
    id?: string;
  };
  actions?: Array<{
    action_id?: string;
    value?: string;
  }>;
};

const QUOTE_SEND_EMAIL_PREFIX = 'quote_send_email:';

const computeRentalDays = (
  rentalDays: number | null | undefined,
  rentalStart: Date | null | undefined,
  rentalEnd: Date | null | undefined,
) => {
  if (
    typeof rentalDays === 'number' &&
    Number.isFinite(rentalDays) &&
    rentalDays > 0
  ) {
    return Math.trunc(rentalDays);
  }
  if (!rentalStart || !rentalEnd) return null;
  const diffMs = rentalEnd.getTime() - rentalStart.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return null;
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil(diffMs / dayMs));
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Függőben',
  IN_PROGRESS: 'Folyamatban',
  COMPLETED: 'Elkészült',
  CANCELLED: 'Törölve',
};

export async function POST(request: Request) {
  if (!hasSlackSigningSecret()) {
    return NextResponse.json(
      { error: 'Missing Slack signing secret' },
      { status: 500 },
    );
  }

  const rawBody = await request.text();
  const timestamp = request.headers.get('x-slack-request-timestamp');
  const signature = request.headers.get('x-slack-signature');

  const verification = verifySlackRequestSignatureDetailed({
    rawBody,
    timestamp,
    signature,
  });

  if (!verification.ok) {
    console.error('Slack interaction rejected: invalid signature', {
      hasTimestamp: Boolean(timestamp),
      hasSignature: Boolean(signature),
      reason: verification.reason,
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const formData = new URLSearchParams(rawBody);
  const payloadRaw = formData.get('payload');
  if (!payloadRaw) {
    return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
  }

  let payload: SlackInteractionPayload;
  try {
    payload = JSON.parse(payloadRaw) as SlackInteractionPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (payload.type !== 'block_actions') {
    return NextResponse.json({ ok: true });
  }

  const action = payload.actions?.[0];
  if (!action?.action_id) {
    return NextResponse.json({ ok: true });
  }

  if (action.action_id === 'quote_send_email_auto_offer') {
    const value = action.value?.trim() ?? '';
    if (!value.startsWith(QUOTE_SEND_EMAIL_PREFIX)) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Érvénytelen quote művelet.',
      });
    }

    const quoteId = value.slice(QUOTE_SEND_EMAIL_PREFIX.length).trim();
    if (!quoteId) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Hiányzó quote azonosító.',
      });
    }

    const quote = await db.contactQuotes.findUnique({
      where: { id: quoteId },
      select: {
        id: true,
        name: true,
        email: true,
        locale: true,
        carid: true,
        carname: true,
        rentaldays: true,
        rentalstart: true,
        rentalend: true,
        cars: true,
        accommodationId: true,
      },
    });

    if (!quote) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'A quote nem található.',
      });
    }

    if (!quote.accommodationId) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Ez a quote nem accommodation forrásból érkezett.',
      });
    }

    if (!quote.email?.trim()) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'A quote-hoz nincs e-mail cím.',
      });
    }

    if (!quote.carid?.trim() || !quote.carname?.trim()) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'A quote-hoz nincs autó kiválasztva.',
      });
    }

    const rentalDays = computeRentalDays(
      quote.rentaldays,
      quote.rentalstart,
      quote.rentalend,
    );

    if (!rentalDays || rentalDays <= 0) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'A quote-hoz nincs érvényes bérlési nap szám vagy dátumtartomány.',
      });
    }

    const dailyPrice = findAccommodationDailyPrice(quote.carname, rentalDays);

    if (!dailyPrice) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: `Nincs accommodation árlista ehhez: ${quote.carname} / ${rentalDays} nap.`,
      });
    }

    const actorSlackUserId = payload.user?.id?.trim() ?? '';
    const actor = actorSlackUserId
      ? await db.user.findFirst({
          where: { slackUserId: actorSlackUserId },
          select: { name: true },
        })
      : null;
    const adminName = actor?.name?.trim() || 'Admin';

    const result = await sendBookingRequestEmailAction({
      quoteId: quote.id,
      email: quote.email,
      name: quote.name,
      locale: quote.locale,
      rentalStart: quote.rentalstart?.toISOString().slice(0, 10) ?? null,
      rentalEnd: quote.rentalend?.toISOString().slice(0, 10) ?? null,
      adminName,
      offers: [
        {
          carId: quote.carid,
          carName: quote.carname,
          appliesToCars: Number(quote.cars) > 0 ? Number(quote.cars) : 1,
          rentalFee: String(dailyPrice.priceEur),
          insurance: String(dailyPrice.fullInsuranceEur),
          deliveryFee: '0',
          extrasFee: '0',
        },
      ],
    });

    if (result.error) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: `Az e-mail küldése sikertelen: ${result.error}`,
      });
    }

    return NextResponse.json({
      response_type: 'ephemeral',
      text:
        result.success ??
        `Ajánlat e-mail elküldve (${quote.carname}, ${rentalDays} nap).`,
    });
  }

  if (!action.action_id.startsWith('task_status_')) {
    return NextResponse.json({ ok: true });
  }

  const parsedAction = parseTaskStatusActionValue(action.value);
  if (!parsedAction) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Érvénytelen művelet.',
    });
  }

  const slackUserId = payload.user?.id?.trim();
  if (!slackUserId) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Nincs Slack user azonosító a kérésben.',
    });
  }

  const task = await db.task.findUnique({
    where: { id: parsedAction.taskId },
    select: { id: true, title: true, assignedTo: true, status: true },
  });

  if (!task) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'A feladat nem található.',
    });
  }

  if (!task.assignedTo) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Ehhez a feladathoz nincs kijelölt felelős.',
    });
  }

  const assignedUser = await db.user.findUnique({
    where: { id: task.assignedTo },
    select: { slackUserId: true },
  });

  const normalizedAssignedSlackId = assignedUser?.slackUserId
    ?.trim()
    .toUpperCase();
  const normalizedActorSlackId = slackUserId.toUpperCase();

  if (!normalizedAssignedSlackId || normalizedAssignedSlackId === 'NULL') {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'A feladathoz rendelt usernél nincs Slack user ID beállítva.',
    });
  }

  if (normalizedAssignedSlackId !== normalizedActorSlackId) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Csak a kijelölt felhasználó módosíthatja ezt a feladatot.',
    });
  }

  if (task.status !== parsedAction.status) {
    const nextStatus = parsedAction.status as TaskStatus;
    await db.task.update({
      where: { id: task.id },
      data: {
        status: nextStatus,
        updatedAt: new Date(),
      },
    });
  }

  const responseStatus = parsedAction.status as TaskStatus;

  return NextResponse.json({
    response_type: 'ephemeral',
    text: `A(z) "${task.title}" feladat státusza: ${TASK_STATUS_LABELS[responseStatus]}.`,
  });
}
