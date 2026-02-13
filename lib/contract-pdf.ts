import { readFile } from 'node:fs/promises';
import path from 'node:path';

import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import type { ContractTemplate } from '@/lib/contract-template';

type ContractPdfInput = {
  template: ContractTemplate;
  contractText: string;
  signerName: string;
  signedAt: Date;
  renterSignatureDataUrl: string;
  lessorSignatureDataUrl: string;
};

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
}: ContractPdfInput) => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const [regularFontBytes, boldFontBytes] = await Promise.all([
    loadFontBytes(FONT_REGULAR_PATH),
    loadFontBytes(FONT_BOLD_PATH),
  ]);

  const requiresUnicode =
    hasNonAnsiChars(template.title) ||
    hasNonAnsiChars(contractText) ||
    hasNonAnsiChars(signerName);

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
  page.drawText('Aláírások', {
    x: margin,
    y: cursorY,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
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
      page.drawText('Nincs aláírás.', {
        x: margin,
        y: cursorY,
        size: fontSize,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });
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

  await drawSignatureBlock('Bérlő aláírása', renterSignatureDataUrl);
  await drawSignatureBlock('Bérbeadó aláírása', lessorSignatureDataUrl);

  const signedAtLabel = signedAt.toLocaleString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  ensureSpace(lineHeight * 3);
  page.drawText(`Aláírta: ${signerName}`, {
    x: margin,
    y: cursorY - lineHeight,
    size: fontSize,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText(`Aláírás ideje: ${signedAtLabel}`, {
    x: margin,
    y: cursorY - lineHeight * 2,
    size: fontSize,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
};
