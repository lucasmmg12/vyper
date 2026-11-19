-- ============================================================
-- 016: Módulo de Gestión de Cheques (Emitidos y Recibidos)
-- Tablas: cheques_razones_sociales y cheques
-- ============================================================

CREATE TABLE IF NOT EXISTS cheques_razones_sociales (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre          TEXT NOT NULL UNIQUE,
    cuit            TEXT,
    banco_default   TEXT,
    activo          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cheques_razones_sociales ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'cheques_razones_sociales' AND policyname = 'allow_all_cheques_razones_sociales'
    ) THEN
        CREATE POLICY "allow_all_cheques_razones_sociales" ON cheques_razones_sociales FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;

INSERT INTO cheques_razones_sociales (nombre, cuit, banco_default) VALUES
('VYPER LABS', '30-71800000-9', 'Banco San Juan'),
('LUCAS MARINERO', '20-38000000-4', 'Banco Santander'),
('ECAR SAS', '30-71654321-0', 'Banco Santander'),
('CARLOS ADOLFO REGALADO', '20-16543210-3', 'Banco San Juan')
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS cheques (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nro_cheque              TEXT NOT NULL,
    banco                   TEXT NOT NULL DEFAULT 'Banco San Juan',
    direccion               TEXT NOT NULL CHECK (direccion IN ('emitido', 'recibido')) DEFAULT 'emitido',
    tipo                    TEXT NOT NULL CHECK (tipo IN ('fisico', 'echeq')) DEFAULT 'echeq',
    razon_social_emisora    TEXT NOT NULL DEFAULT 'VYPER LABS',
    beneficiario            TEXT,
    factura_asociada        TEXT,
    monto                   NUMERIC(15, 2) NOT NULL DEFAULT 0,
    fecha_emision           DATE DEFAULT CURRENT_DATE,
    fecha_vencimiento       DATE NOT NULL,
    estado                  TEXT NOT NULL CHECK (estado IN ('pendiente', 'pagado', 'rechazado', 'anulado')) DEFAULT 'pendiente',
    scan_url                TEXT,
    notas                   TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cheques_vto ON cheques(fecha_vencimiento ASC);
CREATE INDEX IF NOT EXISTS idx_cheques_direccion ON cheques(direccion);
CREATE INDEX IF NOT EXISTS idx_cheques_estado ON cheques(estado);

ALTER TABLE cheques ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'cheques' AND policyname = 'allow_all_cheques'
    ) THEN
        CREATE POLICY "allow_all_cheques" ON cheques FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;

-- Semilla inicial con los 12 cheques de la hoja manuscrita (Foto 4)
INSERT INTO cheques (nro_cheque, banco, direccion, tipo, razon_social_emisora, beneficiario, monto, fecha_emision, fecha_vencimiento, estado, notas)
SELECT * FROM (VALUES
    ('CHQ-1121-01', 'Banco San Juan', 'emitido', 'echeq', 'VYPER LABS', 'LOTE 21/11', 811422.00, DATE '2026-11-01', DATE '2026-11-21', 'pendiente', 'Lote Noviembre ($811.422 + $856.454,50 = $1.667.876,50)'),
    ('CHQ-1123-02', 'Banco San Juan', 'emitido', 'echeq', 'VYPER LABS', 'LOTE 23/11', 856454.50, DATE '2026-11-01', DATE '2026-11-23', 'pendiente', 'Lote Noviembre ($811.422 + $856.454,50 = $1.667.876,50)'),
    ('CHQ-GEN-1121', 'Banco San Juan', 'emitido', 'echeq', 'VYPER LABS', 'GENETIC', 1688810.00, DATE '2026-11-01', DATE '2026-11-21', 'pendiente', 'Cheque Noviembre - Genetic'),
    ('CHQ-SCI-1202', 'Banco San Juan', 'emitido', 'echeq', 'VYPER LABS', 'SCIMMIA', 1045577.60, DATE '2026-11-15', DATE '2026-12-02', 'pendiente', 'Cheque Diciembre - Scimmia (1/4)'),
    ('CHQ-SCI-1206', 'Banco San Juan', 'emitido', 'echeq', 'VYPER LABS', 'SCIMMIA', 1676444.00, DATE '2026-11-15', DATE '2026-12-06', 'pendiente', 'Cheque Diciembre - Scimmia (2/4)'),
    ('CHQ-SCI-1207', 'Banco San Juan', 'emitido', 'echeq', 'VYPER LABS', 'SCIMMIA', 1481476.55, DATE '2026-11-15', DATE '2026-12-07', 'pendiente', 'Cheque Diciembre - Scimmia (3/4)'),
    ('CHQ-SCI-1209', 'Banco San Juan', 'emitido', 'echeq', 'VYPER LABS', 'SCIMMIA', 1242400.50, DATE '2026-11-15', DATE '2026-12-09', 'pendiente', 'Cheque Diciembre - Scimmia (4/4)'),
    ('CHQ-PAV-1218', 'Banco San Juan', 'emitido', 'echeq', 'VYPER LABS', 'PAVE', 1590242.50, DATE '2026-11-15', DATE '2026-12-18', 'pendiente', 'Cheque Diciembre - Pave (1/2)'),
    ('CHQ-PAV-0118', 'Banco San Juan', 'emitido', 'echeq', 'VYPER LABS', 'PAVE', 1590242.50, DATE '2026-11-15', DATE '2027-01-18', 'pendiente', 'Cheque Enero 2027 - Pave (2/2)'),
    ('CHQ-ANG-0101', 'Banco San Juan', 'emitido', 'echeq', 'VYPER LABS', 'ANGACO', 1500000.00, DATE '2026-11-15', DATE '2027-01-01', 'pendiente', 'Cheque Enero 2027 - Angaco (1/3)'),
    ('CHQ-ANG-0115', 'Banco San Juan', 'emitido', 'echeq', 'VYPER LABS', 'ANGACO', 3152013.00, DATE '2026-11-15', DATE '2027-01-15', 'pendiente', 'Cheque Enero 2027 - Angaco (2/3)'),
    ('CHQ-ANG-0202', 'Banco San Juan', 'emitido', 'echeq', 'VYPER LABS', 'ANGACO', 2180100.00, DATE '2026-11-15', DATE '2027-02-02', 'pendiente', 'Cheque Febrero 2027 - Angaco (3/3)')
) AS v(nro_cheque, banco, direccion, tipo, razon_social_emisora, beneficiario, monto, fecha_emision, fecha_vencimiento, estado, notas)
WHERE NOT EXISTS (SELECT 1 FROM cheques LIMIT 1);
