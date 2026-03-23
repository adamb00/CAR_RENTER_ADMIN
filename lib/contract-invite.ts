import { createHash, randomBytes } from 'node:crypto';

import { PUBLIC_CONTRACT_BASE_URL } from '@/lib/constants';

const DAY_MS = 24 * 60 * 60 * 1000;

export const CONTRACT_INVITE_TTL_DAYS = 7;

export const createContractInviteToken = () => randomBytes(32).toString('hex');

export const hashContractInviteToken = (token: string) =>
  createHash('sha256').update(token.trim()).digest('hex');

export const resolveContractInviteExpiry = (now = new Date()) =>
  new Date(now.getTime() + CONTRACT_INVITE_TTL_DAYS * DAY_MS);

export const isContractInviteExpired = (
  expiresAt?: Date | null,
  completedAt?: Date | null,
) => Boolean(expiresAt && !completedAt && expiresAt.getTime() < Date.now());

export const buildContractInviteUrl = (token: string) =>
  buildLocalizedContractInviteUrl(token, null);

export const buildLocalizedContractInviteUrl = (
  token: string,
  locale?: string | null,
) => {
  const normalizedLocale = locale?.trim() || 'en';
  return `${PUBLIC_CONTRACT_BASE_URL.replace(/\/+$/, '')}/${encodeURIComponent(normalizedLocale)}/rent/contract/${encodeURIComponent(token)}`;
};

export const stripContractTitle = (contractText: string) => {
  const lines = contractText.split('\n');
  if (lines.length >= 3 && lines[1]?.trim() === '') {
    return lines.slice(2).join('\n');
  }
  return contractText;
};
