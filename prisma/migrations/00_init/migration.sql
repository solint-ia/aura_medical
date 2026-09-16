CREATE TABLE "user_profiles" (
  "id" UUID NOT NULL, "user_id" UUID, "cpf_cnpj" VARCHAR(20) NOT NULL,
  "first_name" VARCHAR(100) NOT NULL, "last_name" VARCHAR(100) NOT NULL,
  "birth_date" DATE, "email" VARCHAR(255) NOT NULL, "phone" VARCHAR(20) NOT NULL,
  "password_hash" TEXT, "role" VARCHAR(20) NOT NULL DEFAULT 'USER',
  "email_verified" BOOLEAN NOT NULL DEFAULT false, "verification_code" VARCHAR(10),
  "verification_expires" TIMESTAMPTZ, "reset_password_code" VARCHAR(10),
  "reset_password_expires" TIMESTAMPTZ, "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_addresses" (
  "id" UUID NOT NULL, "user_id" UUID, "recipient_name" VARCHAR(150),
  "cep" VARCHAR(10) NOT NULL, "street" VARCHAR(255) NOT NULL, "number" VARCHAR(20) NOT NULL,
  "complement" VARCHAR(100), "neighborhood" VARCHAR(100) NOT NULL,
  "city" VARCHAR(100) NOT NULL, "uf" VARCHAR(2) NOT NULL,
  "is_default" BOOLEAN DEFAULT false, "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
  "id" UUID NOT NULL, "order_number" VARCHAR(20) NOT NULL, "user_id" UUID, "address_id" UUID,
  "shipping_method" VARCHAR(50) NOT NULL, "shipping_cost" DECIMAL(10,2) NOT NULL,
  "subtotal" DECIMAL(10,2) NOT NULL, "total_price" DECIMAL(10,2) NOT NULL,
  "payment_method" VARCHAR(30) NOT NULL, "status" VARCHAR(30) NOT NULL DEFAULT 'pendente',
  "tracking_code" VARCHAR(100), "invoice_url" VARCHAR(500), "notes" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_items" (
  "id" UUID NOT NULL, "order_id" UUID, "product_id" VARCHAR(100) NOT NULL,
  "product_name" VARCHAR(255) NOT NULL, "quantity" INTEGER NOT NULL,
  "unit_price" DECIMAL(10,2) NOT NULL, "total_price" DECIMAL(10,2) NOT NULL,
  "image_path" VARCHAR(500), CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");
CREATE UNIQUE INDEX "user_profiles_cpf_cnpj_key" ON "user_profiles"("cpf_cnpj");
CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles"("email");
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "user_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
