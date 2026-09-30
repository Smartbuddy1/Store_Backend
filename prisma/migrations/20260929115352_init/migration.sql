-- CreateEnum
CREATE TYPE "StaffType" AS ENUM ('Staff', 'Helper', 'Supplier', 'Other');

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "prefix" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "type" "StaffType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "item_code" VARCHAR(20) NOT NULL,
    "item_name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "unit" VARCHAR(50) NOT NULL DEFAULT 'Nos',
    "minimum_stock" INTEGER NOT NULL DEFAULT 5,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_in" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" DATE NOT NULL,
    "time" VARCHAR(10) NOT NULL,
    "item_code" VARCHAR(20) NOT NULL,
    "item_name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(100),
    "quantity" INTEGER NOT NULL,
    "source" VARCHAR(150) NOT NULL DEFAULT 'Supplier',
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_in_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_out" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" DATE NOT NULL,
    "time" VARCHAR(10) NOT NULL,
    "item_code" VARCHAR(20) NOT NULL,
    "item_name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(100),
    "quantity" INTEGER NOT NULL,
    "handover_to" VARCHAR(150),
    "staff_id" UUID,
    "purpose" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_out_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_prefix_key" ON "categories"("prefix");

-- CreateIndex
CREATE UNIQUE INDEX "items_item_code_key" ON "items"("item_code");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_category_fkey" FOREIGN KEY ("category") REFERENCES "categories"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_in" ADD CONSTRAINT "stock_in_item_code_fkey" FOREIGN KEY ("item_code") REFERENCES "items"("item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_out" ADD CONSTRAINT "stock_out_item_code_fkey" FOREIGN KEY ("item_code") REFERENCES "items"("item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_out" ADD CONSTRAINT "stock_out_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
