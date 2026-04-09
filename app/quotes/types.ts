import { User } from '@prisma/client';

export type QuoteOption = {
  id: string;
  humanId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  preferredChannel?: 'email' | 'phone' | 'whatsapp' | 'viber' | null;
  locale?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  carId?: string | null;
  cars?: string | null;
};

export type CarOption = {
  id: string;
  label: string;
  monthlyPrices: number[];
  images: string[];
};

export type SendQuoteButtonProps = {
  quotes: QuoteOption[];
  carOptions: CarOption[];
  users: Pick<User, 'id' | 'name'>[];
};
