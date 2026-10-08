-- DropForeignKey
ALTER TABLE "stock_in" DROP CONSTRAINT "stock_in_item_code_fkey";

-- DropForeignKey
ALTER TABLE "stock_out" DROP CONSTRAINT "stock_out_item_code_fkey";

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "photo_url" TEXT;

-- CreateTable
CREATE TABLE "tools" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tool_code" VARCHAR(50) NOT NULL,
    "tool_name" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tool_code" VARCHAR(50) NOT NULL,
    "helper_name" VARCHAR(150) NOT NULL,
    "issue_time" VARCHAR(10) NOT NULL,
    "return_time" VARCHAR(10),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ISSUED',
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kit_name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kit_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kit_id" UUID NOT NULL,
    "item_code" VARCHAR(20) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kit_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "mobile" VARCHAR(15) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'Store_Incharge',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" VARCHAR(50) NOT NULL,
    "kit_name" VARCHAR(200),
    "kit_multiplier" DOUBLE PRECISION,
    "export_format" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisition_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requisition_id" UUID NOT NULL,
    "item_code" VARCHAR(20) NOT NULL,
    "item_name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(100),
    "current_qty" DOUBLE PRECISION NOT NULL,
    "req_qty" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "requisition_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tools_tool_code_key" ON "tools"("tool_code");

-- CreateIndex
CREATE UNIQUE INDEX "kits_kit_name_key" ON "kits"("kit_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");

-- CreateIndex
CREATE INDEX "stock_in_item_code_idx" ON "stock_in"("item_code");

-- CreateIndex
CREATE INDEX "stock_in_date_idx" ON "stock_in"("date");

-- CreateIndex
CREATE INDEX "stock_out_item_code_idx" ON "stock_out"("item_code");

-- CreateIndex
CREATE INDEX "stock_out_date_idx" ON "stock_out"("date");

-- AddForeignKey
ALTER TABLE "stock_in" ADD CONSTRAINT "stock_in_item_code_fkey" FOREIGN KEY ("item_code") REFERENCES "items"("item_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_out" ADD CONSTRAINT "stock_out_item_code_fkey" FOREIGN KEY ("item_code") REFERENCES "items"("item_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_logs" ADD CONSTRAINT "tool_logs_tool_code_fkey" FOREIGN KEY ("tool_code") REFERENCES "tools"("tool_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kit_items" ADD CONSTRAINT "kit_items_kit_id_fkey" FOREIGN KEY ("kit_id") REFERENCES "kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kit_items" ADD CONSTRAINT "kit_items_item_code_fkey" FOREIGN KEY ("item_code") REFERENCES "items"("item_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisition_items" ADD CONSTRAINT "requisition_items_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
