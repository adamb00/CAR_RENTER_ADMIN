-- Add monthly prices for each car (12 months)
ALTER TABLE "Cars"
  ADD COLUMN "monthlyPrices" INTEGER[] NOT NULL DEFAULT array_fill(0, ARRAY[12]);

-- Ensure existing rows have 12 entries
UPDATE "Cars"
SET "monthlyPrices" = array_fill(0, ARRAY[12])
WHERE coalesce(array_length("monthlyPrices", 1), 0) <> 12;
