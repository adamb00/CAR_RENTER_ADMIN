const PUBLIC_SITE_REVALIDATE_URL = process.env.PUBLIC_SITE_REVALIDATE_URL;
const PUBLIC_SITE_REVALIDATE_SECRET = process.env.PUBLIC_SITE_REVALIDATE_SECRET;

type RevalidatePayload = {
  carId?: string;
  locales?: string[];
};

export const triggerPublicRevalidate = async (payload: RevalidatePayload = {}) => {
  if (!PUBLIC_SITE_REVALIDATE_URL || !PUBLIC_SITE_REVALIDATE_SECRET) return;

  try {
    const response = await fetch(PUBLIC_SITE_REVALIDATE_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidate-token': PUBLIC_SITE_REVALIDATE_SECRET,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      console.error('Public revalidate failed', response.status, await response.text());
    }
  } catch (error) {
    console.error('Public revalidate request error', error);
  }
};
