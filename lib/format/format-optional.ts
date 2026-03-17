import z from 'zod';

export const optionalPrice = z
  .string()
  .transform((val): string | undefined =>
    val && val.trim().length > 0 ? val.trim() : undefined,
  );

export const optionalText = z
  .string()
  .transform((val): string | undefined =>
    val && val.trim().length > 0 ? val.trim() : undefined,
  );
