'use server';

import { TaskFormValues } from '@/components/tasks/new-task';
import { createTaskNotification } from '@/data-service/notifications';
import { createTask } from '@/data-service/tasks';
import { getUserById } from '@/data-service/user';
import { getTransporter, MAIL_USER } from '@/lib/mailer';
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

  const response = await createTask(data);

  if (!response) {
    throw new Error('Task creation failed');
  }

  const user = await getUserById(data.assignedTo);

  if (!user) {
    throw new Error('Assigned user not found');
  }

  const createdByUser = await getUserById(data.createdBy!);

  if (!createdByUser) {
    throw new Error('Creator user not found');
  }

  const taskDescription = data.description?.trim() || 'Nincs megadva.';
  const priority = normalizeTaskPriority(data.priority);
  const priorityLabel = formatTaskPriorityLabel(priority);
  const dueDateLabel = new Date(data.dueDate).toLocaleString('hu-HU');

  if (response.assignedTo) {
    await createTaskNotification({
      taskId: response.id,
      recipientUserId: response.assignedTo,
      title: `Új feladat: ${data.title}`,
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

  const text = `Cím: ${data.title}\nLeírás: ${taskDescription}\nPrioritás: ${priorityLabel}\nHatáridő: ${dueDateLabel}\nLétrehozta: ${createdByUser.name}`;
  const html = text.replace(/\n/g, '<br>');

  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: MAIL_USER,
      to: user.email,
      subject: `Új feladat: ${data.title}`,
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
      const slackBlockText = clampSlackText(
        `*Új feladatot kaptál*\n*Cím:* ${data.title}\n*Leírás:* ${taskDescription}\n*Prioritás:* ${priorityLabel}\n*Határidő:* ${dueDateLabel}\n*Létrehozta:* ${createdByUser.name}`,
      );
      await sendSlackDirectMessage({
        slackUserId,
        text: `Új feladatot kaptál.\nCím: ${data.title}\nLeírás: ${taskDescription}\nPrioritás: ${priorityLabel}\nHatáridő: ${dueDateLabel}\nLétrehozta: ${createdByUser.name}`,
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
