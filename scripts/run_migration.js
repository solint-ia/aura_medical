const { Client } = require("pg");

const connectionString = "postgresql://postgres:%40Auraregenera%401%40@db.pwqnrdnjgemglpfgetii.supabase.co:5432/postgres";

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

const sql = `
-- 1. Tabela de Perfil de Clientes
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  cpf_cnpj VARCHAR(20) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  birth_date DATE,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Endereços do Cliente (Múltiplos Endereços)
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  recipient_name VARCHAR(150),
  cep VARCHAR(10) NOT NULL,
  street VARCHAR(255) NOT NULL,
  number VARCHAR(20) NOT NULL,
  complement VARCHAR(100),
  neighborhood VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  uf VARCHAR(2) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Compras / Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  address_id UUID REFERENCES public.user_addresses(id),
  shipping_method VARCHAR(50) NOT NULL,
  shipping_cost DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pendente',
  tracking_code VARCHAR(100),
  invoice_url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id VARCHAR(100) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  image_path VARCHAR(500)
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
`;

async function run() {
  try {
    console.log("Conectando ao banco PostgreSQL do Supabase...");
    await client.connect();
    console.log("Conectado com sucesso! Executando SQL DDL de criação de tabelas...");
    await client.query(sql);
    console.log("=================================================");
    console.log("✅ MIGRATIONS EXECUTADAS COM SUCESSO NO SUPABASE!");
    console.log("Tabelas criadas: user_profiles, user_addresses, orders, order_items");
    console.log("=================================================");
  } catch (err) {
    console.error("❌ Erro ao executar migrations no Supabase:", err);
  } finally {
    await client.end();
  }
}

run();
