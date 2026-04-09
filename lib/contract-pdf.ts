import { readFile } from 'node:fs/promises';
import path from 'node:path';

import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import {
  DATE_LOCALE_MAP,
  type ContractLocale,
  resolveContractLocale,
} from '@/lib/contract-copy';
import type { ContractTemplate } from '@/lib/contract-template';

type ContractPdfInput = {
  template: ContractTemplate;
  contractText: string;
  signerName?: string | null;
  signedAt?: Date | null;
  renterSignatureDataUrl?: string | null;
  lessorSignatureDataUrl?: string | null;
  locale?: string | null;
};

type PdfSignatureCopy = {
  signaturesHeading: string;
  renterSignature: string;
  lessorSignature: string;
  missingSignature: string;
  signedBy: string;
  signedAt: string;
  status: string;
  pendingStatus: string;
};

const PDF_SIGNATURE_COPY: Record<ContractLocale, PdfSignatureCopy> = {
  en: {
    signaturesHeading: 'Signatures',
    renterSignature: 'Renter signature',
    lessorSignature: 'Lessor signature',
    missingSignature: 'No signature provided.',
    signedBy: 'Signed by',
    signedAt: 'Signed at',
    status: 'Status',
    pendingStatus: 'Waiting for renter signature',
  },
  hu: {
    signaturesHeading: 'Aláírások',
    renterSignature: 'Bérlő aláírása',
    lessorSignature: 'Bérbeadó aláírása',
    missingSignature: 'Nincs aláírás.',
    signedBy: 'Aláírta',
    signedAt: 'Aláírás ideje',
    status: 'Állapot',
    pendingStatus: 'Bérlői aláírásra vár',
  },
};

const bilingualLabel = (
  locale: ContractLocale,
  english: string,
  localized: string,
) => (locale === 'en' ? english : `${english} / ${localized}`);

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const FONT_REGULAR_PATH = path.join(
  process.cwd(),
  'public',
  'fonts',
  'DejaVuSans.ttf',
);
const FONT_BOLD_PATH = path.join(
  process.cwd(),
  'public',
  'fonts',
  'DejaVuSans-Bold.ttf',
);

const hasNonAnsiChars = (value: string) => /[^\u0000-\u00FF]/.test(value);

const loadFontBytes = async (filePath: string) => {
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
};

const parseDataUrl = (dataUrl: string) => {
  const match = dataUrl.match(/^data:(image\/png|image\/jpeg);base64,(.+)$/);
  if (!match) {
    return null;
  }
  return {
    mime: match[1],
    data: Buffer.from(match[2], 'base64'),
  };
};

const wrapText = (
  text: string,
  maxWidth: number,
  font: { widthOfTextAtSize: (text: string, size: number) => number },
  fontSize: number,
) => {
  const lines: string[] = [];
  const paragraphs = text.split('\n');
  paragraphs.forEach((paragraph) => {
    if (!paragraph.trim()) {
      lines.push('');
      return;
    }
    const words = paragraph.split(/\s+/);
    let current = '';
    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
        current = next;
        return;
      }
      if (current) {
        lines.push(current);
      }
      current = word;
    });
    if (current) lines.push(current);
  });
  return lines;
};

export const buildContractPdf = async ({
  template,
  contractText,
  signerName,
  signedAt,
  renterSignatureDataUrl,
  lessorSignatureDataUrl,
  locale,
}: ContractPdfInput) => {
  const resolvedLocale = resolveContractLocale(locale);
  const localizedCopy = PDF_SIGNATURE_COPY[resolvedLocale];
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const [regularFontBytes, boldFontBytes] = await Promise.all([
    loadFontBytes(FONT_REGULAR_PATH),
    loadFontBytes(FONT_BOLD_PATH),
  ]);

  const requiresUnicode =
    hasNonAnsiChars(template.title) ||
    hasNonAnsiChars(contractText) ||
    hasNonAnsiChars(signerName ?? '');

  if (!regularFontBytes && requiresUnicode) {
    throw new Error(
      'Hiányzik a PDF betűkészlet (public/fonts/DejaVuSans.ttf). ' +
        'Tedd be a font fájlt, hogy a magyar karakterek (pl. Ő/ő) megjelenjenek.',
    );
  }

  const font = regularFontBytes
    ? await pdfDoc.embedFont(regularFontBytes)
    : await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = boldFontBytes
    ? await pdfDoc.embedFont(boldFontBytes)
    : regularFontBytes
      ? font
      : await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  let { height } = page.getSize();
  const margin = 48;
  const fontSize = 11;
  const lineHeight = fontSize * 1.4;
  const textWidth = A4_WIDTH - margin * 2;
  let cursorY = height - margin;

  page.drawText(template.title, {
    x: margin,
    y: cursorY,
    size: 18,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  cursorY -= 26;

  const lines = wrapText(contractText, textWidth, font, fontSize);
  for (const line of lines) {
    if (cursorY < margin + lineHeight * 6) {
      page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      height = page.getSize().height;
      cursorY = height - margin;
    }
    page.drawText(line, {
      x: margin,
      y: cursorY,
      size: fontSize,
      font,
      color: rgb(0.15, 0.15, 0.15),
    });
    cursorY -= lineHeight;
  }

  if (cursorY < margin + 120) {
    page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    height = page.getSize().height;
    cursorY = height - margin;
  }

  cursorY -= 8;
  page.drawText(
    bilingualLabel(
      resolvedLocale,
      PDF_SIGNATURE_COPY.en.signaturesHeading,
      localizedCopy.signaturesHeading,
    ),
    {
      x: margin,
      y: cursorY,
      size: 12,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    },
  );
  cursorY -= 12;

  const ensureSpace = (heightNeeded: number) => {
    if (cursorY < margin + heightNeeded) {
      page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      height = page.getSize().height;
      cursorY = height - margin;
    }
  };

  const drawSignatureBlock = async (label: string, dataUrl: string) => {
    ensureSpace(120);
    page.drawText(label, {
      x: margin,
      y: cursorY,
      size: 11,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    cursorY -= 12;

    const signature = parseDataUrl(dataUrl);
    if (!signature) {
      page.drawText(
        bilingualLabel(
          resolvedLocale,
          PDF_SIGNATURE_COPY.en.missingSignature,
          localizedCopy.missingSignature,
        ),
        {
          x: margin,
          y: cursorY,
          size: fontSize,
          font,
          color: rgb(0.35, 0.35, 0.35),
        },
      );
      cursorY -= lineHeight;
      return;
    }

    const signatureImage =
      signature.mime === 'image/png'
        ? await pdfDoc.embedPng(signature.data)
        : await pdfDoc.embedJpg(signature.data);
    const maxSignatureWidth = 220;
    const maxSignatureHeight = 90;
    const scale = Math.min(
      maxSignatureWidth / signatureImage.width,
      maxSignatureHeight / signatureImage.height,
    );
    const signatureWidth = signatureImage.width * scale;
    const signatureHeight = signatureImage.height * scale;
    page.drawImage(signatureImage, {
      x: margin,
      y: cursorY - signatureHeight,
      width: signatureWidth,
      height: signatureHeight,
    });
    cursorY -= signatureHeight + 10;
  };

  await drawSignatureBlock(
    bilingualLabel(
      resolvedLocale,
      PDF_SIGNATURE_COPY.en.renterSignature,
      localizedCopy.renterSignature,
    ),
    renterSignatureDataUrl ?? '',
  );
  await drawSignatureBlock(
    bilingualLabel(
      resolvedLocale,
      PDF_SIGNATURE_COPY.en.lessorSignature,
      localizedCopy.lessorSignature,
    ),
    lessorSignatureDataUrl ?? '',
  );

  ensureSpace(lineHeight * 3);
  if (signerName && signedAt) {
    const signedAtEnglish = signedAt.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const signedAtLocalized = signedAt.toLocaleString(
      DATE_LOCALE_MAP[resolvedLocale],
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    );
    const signedAtValue =
      resolvedLocale === 'en'
        ? signedAtEnglish
        : `${signedAtEnglish} / ${signedAtLocalized}`;
    page.drawText(
      `${bilingualLabel(
        resolvedLocale,
        PDF_SIGNATURE_COPY.en.signedBy,
        localizedCopy.signedBy,
      )}: ${signerName}`,
      {
        x: margin,
        y: cursorY - lineHeight,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      },
    );
    page.drawText(
      `${bilingualLabel(
        resolvedLocale,
        PDF_SIGNATURE_COPY.en.signedAt,
        localizedCopy.signedAt,
      )}: ${signedAtValue}`,
      {
        x: margin,
        y: cursorY - lineHeight * 2,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      },
    );
  } else {
    page.drawText(
      `${bilingualLabel(
        resolvedLocale,
        PDF_SIGNATURE_COPY.en.status,
        localizedCopy.status,
      )}: ${bilingualLabel(
        resolvedLocale,
        PDF_SIGNATURE_COPY.en.pendingStatus,
        localizedCopy.pendingStatus,
      )}`,
      {
        x: margin,
        y: cursorY - lineHeight,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      },
    );
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
};
