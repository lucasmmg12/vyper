# 🔧 SOLUCIÓN AL ERROR: "Error al registrar transacción"

## ❌ Problema
La tabla `debt_transactions` no existe en la base de datos Supabase.

## ✅ Solución

### Opción 1: Ejecutar en Supabase Dashboard (RECOMENDADO)

1. **Ir a Supabase Dashboard**
   - Abre tu proyecto en https://supabase.com
   - Ve a la sección **SQL Editor** (ícono de base de datos en el menú lateral)

2. **Ejecutar el Script SQL**
   - Haz click en **"New Query"**
   - Copia y pega el contenido del archivo: `migrations/create_debt_transactions.sql`
   - Haz click en **"Run"** o presiona `Ctrl + Enter`

3. **Verificar**
   - Ve a la sección **Table Editor**
   - Deberías ver la tabla `debt_transactions` en la lista
   - La tabla debe tener estas columnas:
     - `id`
     - `created_at`
     - `client_id`
     - `client_name`
     - `amount`
     - `transaction_type`
     - `balance_after`
     - `date`
     - `notes`

4. **Probar la Aplicación**
   - Recarga la página de Cuenta Corriente
   - Intenta registrar una transacción
   - ¡Debería funcionar! ✨

---

### Opción 2: Usar Supabase CLI (Avanzado)

Si tienes Supabase CLI instalado:

```bash
# Ejecutar migración
supabase db push

# O ejecutar el archivo directamente
psql $DATABASE_URL -f migrations/create_debt_transactions.sql
```

---

## 📋 Verificación Rápida

Después de ejecutar la migración, verifica en Supabase SQL Editor:

```sql
-- Ver estructura de la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'debt_transactions';

-- Ver políticas RLS
SELECT * FROM pg_policies 
WHERE tablename = 'debt_transactions';
```

---

## 🆘 Si Sigue Sin Funcionar

1. **Verifica la consola del navegador** (F12)
   - Busca errores en la pestaña "Console"
   - Busca errores en la pestaña "Network"

2. **Verifica las variables de entorno**
   - Asegúrate de que `.env` o `.env.local` tenga:
     ```
     BUILDERBOT_WEBHOOK_URL=https://app.builderbot.cloud/api/v2/1a3be0ed-27c1-4b67-a2f0-d0a2ac8fe949/messages
     BUILDERBOT_API_KEY=bb-0921a9b4-81a2-4fd2-b45d-680480138bdc
     ```

3. **Reinicia el servidor de desarrollo**
   ```bash
   # Detener el servidor (Ctrl + C)
   # Volver a iniciar
   npm run dev
   ```

---

## 📝 Notas

- La migración es **idempotente** (se puede ejecutar múltiples veces sin problemas)
- Usa `CREATE TABLE IF NOT EXISTS` para evitar errores si ya existe
- Las políticas RLS permiten acceso completo para desarrollo
- Los índices mejoran el rendimiento de las consultas

---

## ✨ Después de la Migración

Una vez que la tabla esté creada, podrás:

- ✅ Registrar compras en cuenta corriente
- ✅ Registrar pagos
- ✅ Ver historial de transacciones
- ✅ Recibir notificaciones automáticas por WhatsApp
- ✅ Ver balance actualizado en tiempo real

¡Listo para usar! 🚀
