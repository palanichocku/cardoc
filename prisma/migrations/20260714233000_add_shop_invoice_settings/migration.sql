ALTER TABLE "shops"
ADD COLUMN "default_tax_rate" DECIMAL(6,3) NOT NULL DEFAULT 0,
ADD COLUMN "parts_taxable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "labor_taxable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "invoice_footer_message" TEXT,
ADD COLUMN "warranty_text" TEXT;
