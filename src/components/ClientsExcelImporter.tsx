
'use client';

import ExcelImporter from './ExcelImporter';

export default function ClientsExcelImporter({ onSuccess }: { onSuccess: () => void }) {
    return <ExcelImporter type="CLIENTS" onSuccess={onSuccess} />;
}
