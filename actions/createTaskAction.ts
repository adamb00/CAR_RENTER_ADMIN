'use server';

import { TaskFormValues } from '@/components/tasks/new-task';
import { getBookingById } from '@/data-service/bookings';
import { getVehicleById } from '@/data-service/cars';
import { createTaskNotification } from '@/data-service/notifications';
import { createTask } from '@/data-service/tasks';
import { getUserById } from '@/data-service/user';
import { buildBookingInterval } from '@/lib/booking-interval';
import { db } from '@/lib/db';
import { formatAddress } from '@/lib/format/format-address';
import { formatDateTimeDetail } from '@/lib/format/format-date';
import { formatPlaceType } from '@/lib/format/format-place';
import { formatPriceValue } from '@/lib/format/format-price';
import { getTransporter, MAIL_USER } from '@/lib/mailer';
import { normalizePaymentMethod } from '@/lib/normalize-payment-method';
import { getRentDetails } from '@/lib/rent-details';
import { getStatusMeta } from '@/lib/status';
import {
  formatTaskPriorityLabel,
  normalizeTaskPriority,
} from '@/lib/task-priority';
import {
  buildTaskStatusActionValue,
  hasSlackConfig,
  sendSlackDirectMessage,
} from '@/lib/slack';
import { redirect } from 'next/navigation';

export const createTaskAction = async (data: TaskFormValues) => {
  const clampSlackText = (value: string, max = 2800) =>
    value.length <= max ? value : `${value.slice(0, max - 1)}…`;
  const assignedTo = data.assignedTo?.trim();
  const adminBaseUrl = process.env.BASE_URL?.replace(/\/+$/, '') ?? '';

  if (!assignedTo) {
    throw new Error('A címzett kiválasztása kötelező.');
  }

  const baseDescription = data.description?.trim();
  const detailSections: string[] = [];

  if (data.assignedBookingId?.trim()) {
    const booking = await getBookingById(data.assignedBookingId);
    if (booking) {
      const bookingEditPath = `/bookings/${booking.id}/edit`;
      const bookingEditUrl = adminBaseUrl
        ? `${adminBaseUrl}${bookingEditPath}`
        : bookingEditPath;
      const { delivery, consents } = getRentDetails(booking);
      const [handoverOut, handoverIn] = await Promise.all([
        db.vehicleHandover.findFirst({
          where: { bookingId: booking.id, direction: 'out' },
          orderBy: { handoverAt: 'desc' },
          select: { handoverAt: true },
        }),
        db.vehicleHandover.findFirst({
          where: { bookingId: booking.id, direction: 'in' },
          orderBy: { handoverAt: 'desc' },
          select: { handoverAt: true },
        }),
      ]);
      const bookingInterval = buildBookingInterval({
        rentalStart: booking.rentalStart,
        rentalEnd: booking.rentalEnd,
        arrivalHour: delivery?.arrivalHour ?? null,
        arrivalMinute: delivery?.arrivalMinute ?? null,
        handoverOutAt: handoverOut?.handoverAt ?? null,
        handoverInAt: handoverIn?.handoverAt ?? null,
      });
      const pickupAt =
        handoverOut?.handoverAt ?? bookingInterval?.start ?? null;
      const returnAt = handoverIn?.handoverAt ?? bookingInterval?.end ?? null;

      const bookingIdLabel = booking.humanId ?? booking.id;
      const periodLabel =
        booking.rentalStart && booking.rentalEnd
          ? `${booking.rentalStart} - ${booking.rentalEnd}`
          : 'Nincs megadva';
      const bookingStatus = getStatusMeta(booking.status).label;
      const paymentMethodLabel = normalizePaymentMethod(
        consents?.paymentMethod ?? null,
      );
      const pickupPlaceType = formatPlaceType(delivery?.placeType ?? null);
      const pickupLocation =
        delivery?.locationName?.trim() ||
        booking.pricing?.deliveryLocation?.trim() ||
        'Nincs megadva';
      const pickupAddress = formatAddress(delivery?.address);
      const returnPlaceType =
        delivery?.same === true ? pickupPlaceType : 'Nincs megadva';
      const returnLocation =
        delivery?.same === true ? pickupLocation : 'Nincs megadva';
      const returnAddress =
        delivery?.same === true ? pickupAddress : 'Nincs megadva';

      detailSections.push(
        [
          'Foglalás:',
          `- Azonosító: ${bookingIdLabel}`,
          `- Szerkesztés link: ${bookingEditUrl}`,
          `- Ügyfél: ${booking.contactName || 'Nincs megadva'}`,
          `- Időszak: ${periodLabel}`,
          `- Státusz: ${bookingStatus}`,
          '',
          'Fizetés:',
          `- Bérleti díj: ${formatPriceValue(booking.pricing?.rentalFee)}`,
          `- Biztosítás: ${formatPriceValue(booking.pricing?.insurance)}`,
          `- Kaució: ${formatPriceValue(booking.pricing?.deposit)}`,
          `- Kiszállítás díja: ${formatPriceValue(booking.pricing?.deliveryFee)}`,
          `- Extrák díja: ${formatPriceValue(booking.pricing?.extrasFee)}`,
          `- Jatt: ${formatPriceValue(booking.pricing?.tip)}`,
          `- Fizetési mód: ${paymentMethodLabel}`,
          '',
          'Kiadás:',
          `- Pontos időpont: ${pickupAt ? formatDateTimeDetail(pickupAt.toISOString()) : 'Nincs megadva'}${handoverOut?.handoverAt ? ' (rögzített)' : ' (tervezett)'}`,
          `- Hely típusa: ${pickupPlaceType}`,
          `- Hely neve: ${pickupLocation}`,
          `- Cím: ${pickupAddress}`,
          '',
          'Visszavétel:',
          `- Pontos időpont: ${returnAt ? formatDateTimeDetail(returnAt.toISOString()) : 'Nincs megadva'}${handoverIn?.handoverAt ? ' (rögzített)' : ' (tervezett)'}`,
          `- Hely típusa: ${returnPlaceType}`,
          `- Hely neve: ${returnLocation}`,
          `- Cím: ${returnAddress}`,
        ].join('\n'),
      );
    } else {
      detailSections.push(
        ['Foglalás:', `- Azonosító: ${data.assignedBookingId}`].join('\n'),
      );
    }
  }

  if (data.assignedCar?.trim()) {
    const vehicle = await getVehicleById(data.assignedCar);
    detailSections.push(
      [
        'Autó:',
        `- Rendszám: ${vehicle?.plate ?? data.assignedCar}`,
        `- Státusz: ${getStatusMeta(vehicle?.status).label ?? 'Nincs megadva'}`,
      ].join('\n'),
    );
  }

  const composedDescription = [
    baseDescription ? `Leírás:\n${baseDescription}` : '',
    detailSections.length > 0
      ? `\nKapcsolt adatok:\n${detailSections.join('\n\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim();

  const payload: TaskFormValues = {
    ...data,
    assignedTo,
    description: composedDescription,
  };

  const response = await createTask(payload);

  if (!response) {
    throw new Error('Task creation failed');
  }

  const user = await getUserById(assignedTo);

  if (!user) {
    throw new Error('Assigned user not found');
  }

  const createdByUser = await getUserById(data.createdBy!);

  if (!createdByUser) {
    throw new Error('Creator user not found');
  }

  const taskDescription = payload.description?.trim() || 'Nincs megadva.';
  const priority = normalizeTaskPriority(data.priority);
  const priorityLabel = formatTaskPriorityLabel(priority);
  const dueDateLabel = new Date(data.dueDate).toLocaleString('hu-HU');

  if (response.assignedTo) {
    await createTaskNotification({
      taskId: response.id,
      recipientUserId: response.assignedTo,
      title: `Új feladat: ${payload.title}`,
      description: `${taskDescription} | Prioritás: ${priorityLabel}`,
      href: '/tasks',
      metadata: {
        taskId: response.id,
        dueDate: data.dueDate,
        priority,
        assignedCar: data.assignedCar ?? null,
        createdBy: createdByUser.name ?? createdByUser.email,
      },
    });
  }

  const text = `Cím: ${payload.title}\nLeírás: ${taskDescription}\nPrioritás: ${priorityLabel}\nHatáridő: ${dueDateLabel}\nLétrehozta: ${createdByUser.name}`;
  const html = text.replace(/\n/g, '<br>');

  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: MAIL_USER,
      to: user.email,
      subject: `Új feladat: ${payload.title}`,
      text,
      html,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email notification');
  }

  const slackUserId = user.slackUserId?.trim();

  if (slackUserId && slackUserId !== 'NULL' && hasSlackConfig()) {
    try {
      const bookingLinkForSlack = data.assignedBookingId?.trim()
        ? adminBaseUrl
          ? `${adminBaseUrl}/bookings/${data.assignedBookingId}/edit`
          : `/bookings/${data.assignedBookingId}/edit`
        : null;
      const slackBlockText = clampSlackText(
        `*Új feladatot kaptál*\n*Cím:* ${payload.title}\n*Leírás:* ${taskDescription}\n*Prioritás:* ${priorityLabel}\n*Határidő:* ${dueDateLabel}\n*Létrehozta:* ${createdByUser.name}${
          bookingLinkForSlack
            ? `\n*Foglalás szerkesztése:* <${bookingLinkForSlack}|Megnyitás>`
            : ''
        }`,
      );
      await sendSlackDirectMessage({
        slackUserId,
        text: `Új feladatot kaptál.\nCím: ${payload.title}\nLeírás: ${taskDescription}\nPrioritás: ${priorityLabel}\nHatáridő: ${dueDateLabel}\nLétrehozta: ${createdByUser.name}${
          bookingLinkForSlack ? `\nFoglalás szerkesztése: ${bookingLinkForSlack}` : ''
        }`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: slackBlockText,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                action_id: 'task_status_in_progress',
                text: {
                  type: 'plain_text',
                  text: 'Folyamatban',
                },
                style: 'primary',
                value: buildTaskStatusActionValue({
                  taskId: response.id,
                  status: 'IN_PROGRESS',
                }),
              },
              {
                type: 'button',
                action_id: 'task_status_completed',
                text: {
                  type: 'plain_text',
                  text: 'Elvégeztem',
                },
                value: buildTaskStatusActionValue({
                  taskId: response.id,
                  status: 'COMPLETED',
                }),
              },
            ],
          },
        ],
      });
    } catch (error) {
      console.error('Error sending Slack message:', error);
    }
  }
  redirect('/tasks');
};
