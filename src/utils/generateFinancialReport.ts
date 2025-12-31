
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export const generateFinancialReport = async (data: any) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Helper para títulos con mejor estética
    const addSectionHeader = (text: string, y: number) => {
        doc.setFillColor(30, 30, 30);
        doc.rect(15, y - 6, pageWidth - 30, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(text.toUpperCase(), 20, y);
    };

    // --- PORTADA ---
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, 60, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.text('VYPER', 15, 35);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('ESTRATEGIA FINANCIERA & BUSINESS INTELLIGENCE', 15, 45);

    const dateStr = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`EMITIDO: ${dateStr.toUpperCase()}`, pageWidth - 15, 45, { align: 'right' });

    // --- RESUMEN EJECUTIVO ---
    const totalSales = data.timeline.reduce((acc: number, curr: any) => acc + curr.sales, 0);
    const totalExpenses = data.timeline.reduce((acc: number, curr: any) => acc + curr.expenses, 0);
    const netProfit = totalSales - totalExpenses;
    const profitMargin = ((netProfit / totalSales) * 100).toFixed(1);
    const avgSales = totalSales / (data.timeline.length || 1);
    const avgExpenses = totalExpenses / (data.timeline.length || 1);

    addSectionHeader('RESUMEN DE RENDIMIENTO', 75);

    autoTable(doc, {
        startY: 85,
        head: [['KPI', 'VALOR', 'ANÁLISIS']],
        body: [
            ['VENTAS TOTALES', `$${totalSales.toLocaleString('es-AR')}`, 'Volumen de facturación acumulado'],
            ['GASTOS TOTALES', `$${totalExpenses.toLocaleString('es-AR')}`, 'Egresos operativos totales'],
            ['BALANCE NETO', `$${netProfit.toLocaleString('es-AR')}`, `Margen de rentabilidad: ${profitMargin}%`],
            ['PROMEDIO VENTAS/MES', `$${avgSales.toLocaleString('es-AR')}`, 'Rendimiento mensual medio'],
            ['PROMEDIO GASTOS/MES', `$${avgExpenses.toLocaleString('es-AR')}`, 'Carga operativa media']
        ],
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 }
    });

    // --- GRÁFICOS (CAPTURA MEJORADA) ---
    // Agregamos una página nueva para gráficos para que no se vea amontonado
    doc.addPage();
    addSectionHeader('ANÁLISIS VISUAL DE TENDENCIAS', 25);

    const chartConfigs = [
        { id: 'chart-timeline', label: 'TENDENCIA DE FLUJO: INGRESOS VS EGRESOS' },
        { id: 'chart-branch', label: 'ESTADÍSTICA COMPARATIVA POR SUCURSAL' },
        { id: 'chart-forecast', label: 'PROYECCIÓN FINANCIERA (ALGORITMO PREDICTIVO)' }
    ];

    let currentY = 40;

    for (const config of chartConfigs) {
        const element = document.getElementById(config.id);
        if (element) {
            try {
                // Captura con alta calidad y fondo blanco para el PDF
                const canvas = await html2canvas(element, {
                    scale: 3,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                const imgData = canvas.toDataURL('image/jpeg', 1.0);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(80, 80, 80);
                doc.text(config.label, 15, currentY);

                // Marco fino para el gráfico
                doc.setDrawColor(240, 240, 240);
                doc.rect(15, currentY + 2, pageWidth - 30, 60);

                doc.addImage(imgData, 'JPEG', 15.5, currentY + 2.5, pageWidth - 31, 59);
                currentY += 75;

                if (currentY > 240 && config !== chartConfigs[chartConfigs.length - 1]) {
                    doc.addPage();
                    currentY = 25;
                }
            } catch (e) {
                console.error(`Error al capturar ${config.id}`, e);
            }
        }
    }

    // --- ANÁLISIS POR SUCURSAL ---
    if (currentY + 60 > 280) { doc.addPage(); currentY = 25; } else { currentY += 10; }

    addSectionHeader('RENDIMIENTO POR SUCURSAL', currentY);

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
        startY: currentY + 10,
        head: [['SUCURSAL', 'VENTA PROM/MES', 'GASTO PROM/MES', 'RATIO EFICIENCIA']],
        body: Object.entries(branchStats).map(([name, stats]: any) => {
            const vProm = stats.sales / stats.count;
            const gProm = stats.expenses / stats.count;
            const ratio = (stats.expenses / stats.sales).toFixed(2);
            return [
                name.toUpperCase(),
                `$${vProm.toLocaleString('es-AR')}`,
                `$${gProm.toLocaleString('es-AR')}`,
                `${(1 - Number(ratio)).toFixed(2)}`
            ];
        }),
        theme: 'striped',
        headStyles: { fillColor: [60, 60, 60] },
        styles: { fontSize: 9 }
    });

    // --- CONCLUSIÓN ---
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    if (finalY < 260) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const conclusion = "Este informe ha sido generado automáticamente por el motor de Vyper Labs. Los datos reflejan la actividad transaccional real y las proyecciones se basan en tendencias históricas. Este documento es confidencial.";
        doc.text(doc.splitTextToSize(conclusion, pageWidth - 40), 20, finalY);
    }

    // --- PIE DE PÁGINA ---
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(15, 285, pageWidth - 15, 285);

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`VYPER LABS - INTELIGENCIA FINANCIERA`, 15, 290);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - 15, 290, { align: 'right' });
    }

    doc.save(`INFORME_ESTRATEGICO_VYPER_${new Date().getTime()}.pdf`);
};
