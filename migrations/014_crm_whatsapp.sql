-- ============================================================
-- 014: CRM WhatsApp (Contact Center Vyper Labs)
-- Tablas: whatsapp_messages y whatsapp_shortcuts
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    phone               TEXT NOT NULL,
    direction           TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    content             TEXT,
    media_url           TEXT,
    media_type          TEXT DEFAULT 'text',
    sender_name         TEXT,
    is_read             BOOLEAN DEFAULT FALSE,
    original_media_url  TEXT,
    raw_payload         JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vyper_wam_phone ON whatsapp_messages(phone);
CREATE INDEX IF NOT EXISTS idx_vyper_wam_phone_created ON whatsapp_messages(phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vyper_wam_unread ON whatsapp_messages(phone, is_read) WHERE direction = 'incoming' AND is_read = FALSE;

ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_messages' AND policyname = 'allow_all_whatsapp_messages'
    ) THEN
        CREATE POLICY "allow_all_whatsapp_messages" ON whatsapp_messages FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;

-- Habilitar Realtime para whatsapp_messages
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_messages;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN NULL;
END
$$;

-- Tabla de Atajos / Respuestas Rápidas (se activan con "/" en el chat)
CREATE TABLE IF NOT EXISTS whatsapp_shortcuts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shortcut    TEXT NOT NULL UNIQUE,
    label       TEXT NOT NULL,
    message     TEXT NOT NULL,
    category    TEXT DEFAULT 'general',
    sort_order  INT DEFAULT 0,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vyper_shortcuts_active ON whatsapp_shortcuts(is_active) WHERE is_active = TRUE;

ALTER TABLE whatsapp_shortcuts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_shortcuts' AND policyname = 'allow_all_whatsapp_shortcuts'
    ) THEN
        CREATE POLICY "allow_all_whatsapp_shortcuts" ON whatsapp_shortcuts FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;

-- Atajos iniciales adaptados a Vyper Suplementos
INSERT INTO whatsapp_shortcuts (shortcut, label, message, category, sort_order) VALUES
('/saludo', 'Saludo de bienvenida', E'¡Hola! 👋 Te escribimos de *Vyper Suplementos* 🦾\n¿En qué podemos asesorarte hoy?', 'saludo', 1),
('/mayorista', 'Catálogo Mayorista Online', E'🛒 *Catálogo Mayorista Vyper*\nPodés ver todos los productos con precios exclusivos para gimnasios, dietéticas y revendedores y armar tu pedido acá:\n👉 https://vyper.com/tienda\n\nTambién podés usar el *Modo Planilla Rápida* para cargar todo en segundos.', 'ventas', 2),
('/minorista', 'Tienda Minorista Oficial', E'🛍️ *Tienda Oficial Vyper Suplementos*\nMirá todo nuestro catálogo actualizado, ofertas y combos acá:\n👉 https://vyper.com/minorista', 'ventas', 3),
('/transferencia', 'Datos Bancarios / Transferencia', E'💳 *Datos para Transferencia Bancaria*\n\n• *Alias:* VYPER.SUPLEMENTOS\n• *Titular:* Vyper Labs\n\nPor favor envianos el comprobante por este medio apenas realices el pago para acreditar tu pedido 🙌', 'pagos', 4),
('/ubicacion', 'Dirección y Horarios de Sucursal', E'📍 *Nuestra Sucursal:*\nAv. Libertador 4858 Oeste, Rivadavia, San Juan\n🗺️ Maps: https://www.google.com/maps/search/?api=1&query=Av.+Libertador+4858+Oeste,+Rivadavia,+San+Juan\n\n🕒 *Horarios:*\nLunes a Viernes de 9:00 a 18:00 hs · Sábados de 9:00 a 13:00 hs.', 'info', 5),
('/envios', 'Información de Envíos', E'🚚 *Envíos Vyper:*\n• *San Juan:* Envíos en el día con cadetería propia.\n• *Interior del país:* Despachamos por transporte o correo a elección.\n\n¡Avisanos tu dirección y coordinamos la entrega!', 'info', 6),
('/listo', 'Pedido listo para retirar', E'✅ *¡Tu pedido ya está listo!*\nPodés pasar a retirarlo por nuestra sucursal en Av. Libertador 4858 Oeste (Rivadavia) en nuestro horario habitual, o avisanos si preferís que coordinemos el envío por cadetería 🚀', 'pedidos', 7),
('/coins', 'Programa Vyper Coins', E'🪙 *Programa VIP Vyper Coins*\nCon cada compra sumás monedas (1 Coin cada $1.000) que podés canjear por descuentos directos en tus próximos pedidos.\nConsultá tu saldo y nivel en: https://vyper.com/client', 'fidelizacion', 8)
ON CONFLICT (shortcut) DO UPDATE SET
    label = EXCLUDED.label,
    message = EXCLUDED.message,
    category = EXCLUDED.category,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
