import {
  WHATSAPP_API_TOKEN,
  WHATSAPP_GRAPH_API_VERSION,
  WHATSAPP_PHONE_NUMBER_ID,
} from '@/lib/constants';

type GraphApiErrorPayload = {
  error?: {
    message?: string;
    error_user_msg?: string;
    type?: string;
    code?: number;
  };
};

type GraphApiSuccessPayload = {
  messages?: Array<{
    id?: string;
  }>;
};

export type SendWhatsappTextInput = {
  to: string;
  body: string;
};

export type SendWhatsappTextResult =
  | {
      sent: true;
      messageId?: string;
    }
  | {
      sent: false;
      errorMessage: string;
    };

export const hasWhatsappApiConfig = () =>
  Boolean(
    WHATSAPP_API_TOKEN?.trim() &&
      WHATSAPP_PHONE_NUMBER_ID?.trim(),
  );

const resolveGraphApiVersion = () => {
  const raw = WHATSAPP_GRAPH_API_VERSION?.trim();
  return raw && raw.length > 0 ? raw : 'v20.0';
};

const resolveGraphApiUrl = () => {
  const version = resolveGraphApiVersion();
  const phoneNumberId = WHATSAPP_PHONE_NUMBER_ID?.trim();
  return `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
};

const extractGraphErrorMessage = (payload: GraphApiErrorPayload | null) => {
  if (!payload?.error) return 'Ismeretlen WhatsApp API hiba.';
  const userMessage = payload.error.error_user_msg?.trim();
  if (userMessage) return userMessage;
  const message = payload.error.message?.trim();
  if (message) return message;
  return 'Ismeretlen WhatsApp API hiba.';
};

export const sendWhatsappTextMessage = async ({
  to,
  body,
}: SendWhatsappTextInput): Promise<SendWhatsappTextResult> => {
  const token = WHATSAPP_API_TOKEN?.trim();
  if (!token || !hasWhatsappApiConfig()) {
    return {
      sent: false,
      errorMessage: 'WhatsApp API konfiguráció hiányzik.',
    };
  }

  const url = resolveGraphApiUrl();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          preview_url: false,
          body,
        },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const payload = (await response
        .json()
        .catch(() => null)) as GraphApiErrorPayload | null;
      return {
        sent: false,
        errorMessage: extractGraphErrorMessage(payload),
      };
    }

    const payload = (await response
      .json()
      .catch(() => null)) as GraphApiSuccessPayload | null;
    const messageId = payload?.messages?.[0]?.id;

    return {
      sent: true,
      messageId,
    };
  } catch (error) {
    console.error('sendWhatsappTextMessage', error);
    return {
      sent: false,
      errorMessage: 'Nem sikerült kapcsolódni a WhatsApp API-hoz.',
    };
  }
};
