import { db } from '@/lib/db';
import {
  hasSlackSigningSecret,
  parseTaskStatusActionValue,
  verifySlackRequestSignature,
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

  const verified = verifySlackRequestSignature({
    rawBody,
    timestamp,
    signature,
  });

  if (!verified) {
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
  if (!action || action.action_id !== 'task_status_update') {
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

  const actingUser = await db.user.findFirst({
    where: { slackUserId },
    select: { id: true },
  });

  if (!actingUser) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Ehhez a Slack fiókhoz nincs társított app user.',
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

  if (task.assignedTo !== actingUser.id) {
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
