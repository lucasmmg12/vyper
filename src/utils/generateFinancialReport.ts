
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export const generateFinancialReport = async (data: any) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- ESTILOS DE MARCA (VYPER: Black & White) ---
    const primaryColor = [0, 0, 0];
    const secondaryColor = [40, 40, 40];
    const footerColor = [160, 160, 160];

    // Helper para encabezados de sección profesionales
    const drawSectionHeader = (title: string, y: number) => {
        doc.setFillColor(...primaryColor as [number, number, number]);
        doc.rect(0, y - 8, pageWidth, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(title.toUpperCase(), 15, y);
    };

    // Helper para subtítulos
    const drawSubHeader = (text: string, y: number) => {
        doc.setTextColor(...primaryColor as [number, number, number]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(text.toUpperCase(), 15, y);
        doc.setDrawColor(200, 200, 200);
        doc.line(15, y + 2, pageWidth - 15, y + 2);
    };

    // --- PORTADA ---
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, 70, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(40);
    doc.text('VYPER', 15, 35);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('INFORME ESTRATÉGICO DE INTELIGENCIA FINANCIERA', 15, 45);

    doc.setFontSize(9);
    doc.text('ANÁLISIS DIAGNÓSTICO | EXPLICATIVO | PREDICTIVO | PRESCRIPTIVO', 15, 50);

    const dateStr = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`EMISIÓN: ${dateStr.toUpperCase()}`, pageWidth - 15, 50, { align: 'right' });

    // --- SECCIÓN 1: ANÁLISIS DESCRIPTIVO / DIAGNÓSTICO (¿QUÉ PASÓ?) ---
    drawSectionHeader('1. ANÁLISIS DESCRIPTIVO (DIAGNÓSTICO)', 85);

    const totalSales = data.timeline.reduce((acc: number, curr: any) => acc + curr.sales, 0);
    const totalExpenses = data.timeline.reduce((acc: number, curr: any) => acc + curr.expenses, 0);
    const netBalance = totalSales - totalExpenses;

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    const descriptiveInfo = "Esta sección resume el estado histórico de la operación. Se analizan los volúmenes de facturación y egresos acumulados para establecer una línea base de rendimiento.";
    doc.text(doc.splitTextToSize(descriptiveInfo, pageWidth - 30), 15, 95);

    autoTable(doc, {
        startY: 105,
        head: [['INDICADOR CLAVE', 'VALOR ACUMULADO', 'CONTEXTO']],
        body: [
            ['VENTAS TOTALES', `$${totalSales.toLocaleString('es-AR')}`, 'Ingresos brutos del período'],
            ['GASTOS TOTALES', `$${totalExpenses.toLocaleString('es-AR')}`, 'Egresos operativos y administrativos'],
            ['BALANCE NETO', `$${netBalance.toLocaleString('es-AR')}`, netBalance > 0 ? 'Resultado Superavitario' : 'Resultado Deficitario']
        ],
        theme: 'grid',
        headStyles: { fillColor: primaryColor as [number, number, number] },
        styles: { fontSize: 9 }
    });

    // Gráfico de Tendencia
    const timelineChart = document.getElementById('chart-timeline');
    if (timelineChart) {
        const canvas = await html2canvas(timelineChart, { scale: 3, backgroundColor: '#ffffff' });
        doc.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 15, 140, pageWidth - 30, 60);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text('Fig. 1: Evolución histórica de Ingresos vs Egresos', pageWidth / 2, 205, { align: 'center' });
    }

    // --- SECCIÓN 2: ANÁLISIS EXPLICATIVO (¿POR QUÉ PASÓ?) ---
    doc.addPage();
    drawSectionHeader('2. ANÁLISIS EXPLICATIVO (CAUSALIDAD)', 25);

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    const explanatoryInfo = "Análisis de los factores que impulsan los resultados. Se evalúa la eficiencia por sucursal y la distribución de costos para identificar áreas de alto impacto.";
    doc.text(doc.splitTextToSize(explanatoryInfo, pageWidth - 30), 15, 35);

    drawSubHeader('Rendimiento por Unidad de Negocio (Sucursales)', 50);

    const branchStats = data.branchComparison.reduce((acc: any, curr: any) => {
        Object.keys(curr).forEach(key => {
            if (key.endsWith('_sales') || key.endsWith('_expenses')) {
                const parts = key.split('_');
                const branchName = parts[0];
                const type = parts[1];
                if (!acc[branchName]) acc[branchName] = { sales: 0, expenses: 0, count: 0 };
                acc[branchName][type] += curr[key] || 0;
                if (type === 'sales') acc[branchName].count++;
            }
        });
        return acc;
    }, {});

    autoTable(doc, {
        startY: 55,
        head: [['SUCURSAL', 'VENTA PROMEDIO', 'EFICIENCIA (%)', 'DESEMPEÑO']],
        body: Object.entries(branchStats).map(([name, stats]: any) => {
            const vProm = stats.sales / stats.count;
            const efficiency = ((1 - (stats.expenses / stats.sales)) * 100).toFixed(1);
            return [
                name.toUpperCase(),
                `$${vProm.toLocaleString('es-AR')}`,
                `${efficiency}%`,
                Number(efficiency) > 50 ? 'EXCELENTE' : 'OPTIMIZABLE'
            ];
        }),
        theme: 'striped',
        headStyles: { fillColor: secondaryColor as [number, number, number] },
        styles: { fontSize: 9 }
    });

    // Gráfico de Sucursales
    const branchChart = document.getElementById('chart-branch');
    if (branchChart) {
        const canvas = await html2canvas(branchChart, { scale: 3, backgroundColor: '#ffffff' });
        doc.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 15, 95, pageWidth - 30, 60);
    }

    // --- SECCIÓN 3: ANÁLISIS PREDICTIVO (¿QUÉ PASARÁ?) ---
    const nextY = 165;
    drawSectionHeader('3. ANÁLISIS PREDICTIVO (PROYECCIÓN)', nextY);

    const forecastLast3 = data.forecast.slice(0, 3);
    const projectedTotal = forecastLast3.reduce((sum: number, f: any) => sum + f.amount, 0);

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    const predictiveInfo = `Basado en modelos de regresión lineal sobre el histórico de Vyper, se proyecta un volumen de facturación de $${projectedTotal.toLocaleString('es-AR')} para el próximo trimestre operativo.`;
    doc.text(doc.splitTextToSize(predictiveInfo, pageWidth - 30), 15, nextY + 10);

    const forecastChart = document.getElementById('chart-forecast');
    if (forecastChart) {
        const canvas = await html2canvas(forecastChart, { scale: 3, backgroundColor: '#ffffff' });
        doc.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 15, nextY + 25, pageWidth - 30, 60);
    }

    // --- SECCIÓN 4: ANÁLISIS PRESCRIPTIVO (¿QUÉ HACEMOS?) ---
    doc.addPage();
    drawSectionHeader('4. ANÁLISIS PRESCRIPTIVO (RECOMENDACIONES)', 25);

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    const prescriptiveInfo = "A partir de los hallazgos previos, se definen las acciones estratégicas necesarias para maximizar la rentabilidad y asegurar el crecimiento sostenible de Vyper Labs.";
    doc.text(doc.splitTextToSize(prescriptiveInfo, pageWidth - 30), 15, 35);

    drawSubHeader('Hoja de Ruta Estratégica', 50);

    const recommendationBody = [
        ['Rendimiento', 'Concentrar esfuerzos en la sucursal de mayor eficiencia detectada en el punto 2 para escalar el modelo.', 'ALTA'],
        ['Gastos', 'Auditar las 3 categorías principales de egresos que representen más del 15% del total facturado.', 'CRÍTICA'],
        ['Proyección', 'Ajustar los presupuestos trimestrales con un margen de seguridad del 10% sobre la predicción del punto 3.', 'MEDIA'],
        ['Operación', 'Incentivar planes de fidelización en los días de menor facturación según el análisis semanal.', 'ESTRATÉGICA']
    ];

    autoTable(doc, {
        startY: 55,
        head: [['EJE', 'ACCIÓN RECOMENDADA', 'PRIORIDAD']],
        body: recommendationBody,
        theme: 'grid',
        headStyles: { fillColor: primaryColor as [number, number, number] },
        styles: { fontSize: 9, cellPadding: 5 }
    });

    // --- CIERRE ---
    const finalNote = "Este reporte consolidado provee la visibilidad necesaria para la toma de decisiones basada en datos. Vyper Labs recomienda una revisión periódica mensual de estos indicadores.";
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'italic');
    doc.text(doc.splitTextToSize(finalNote, pageWidth - 40), 20, (doc as any).lastAutoTable.finalY + 20);

    // PIE DE PÁGINA GLOBAL
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

        doc.setFontSize(8);
        doc.setTextColor(...footerColor as [number, number, number]);
        doc.text(`CONFIDENCIAL - VYPER LABS BUSINESS INTELLIGENCE`, 15, pageHeight - 10);
        doc.text(`PÁGINA ${i} DE ${totalPages}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
    }

    doc.save(`VYPER_STRATEGIC_REPORT_${new Date().getTime()}.pdf`);
};
