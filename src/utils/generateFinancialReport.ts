
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export const generateFinancialReport = async (data: any) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- BRAND COLORS (White & Black) ---
    const primaryColor = [0, 0, 0]; // Black
    const accentColor = [60, 60, 60]; // Dark Gray
    const backgroundColor = [255, 255, 255]; // White

    // Helper to add centered title
    const addSectionTitle = (text: string, y: number) => {
        doc.setFillColor(0, 0, 0);
        doc.rect(15, y - 5, 5, 5, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(text, 25, y);
    };

    // --- PAGE 1: COVER & EXECUTIVE SUMMARY ---
    // Dark Header
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, 50, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.text('VYPER', 15, 30);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('FINANCIAL REPORT & BUSINESS INTELLIGENCE', 15, 40);

    const dateStr = new Date().toLocaleDateString();
    doc.text(`DATE: ${dateStr}`, pageWidth - 60, 35);

    // Initial Stats Table
    const totalSales = data.timeline.reduce((acc: number, curr: any) => acc + curr.sales, 0);
    const totalExpenses = data.timeline.reduce((acc: number, curr: any) => acc + curr.expenses, 0);
    const avgSales = totalSales / (data.timeline.length || 1);
    const avgExpenses = totalExpenses / (data.timeline.length || 1);

    addSectionTitle('RESUMEN EJECUTIVO', 65);

    autoTable(doc, {
        startY: 75,
        head: [['Métrica Clave', 'Valor Actual', 'Estado']],
        body: [
            ['Ventas Totales', `$${totalSales.toLocaleString()}`, 'ACTIVO'],
            ['Gastos Totales', `$${totalExpenses.toLocaleString()}`, 'CONTROLADO'],
            ['Margen Operativo', `${(((totalSales - totalExpenses) / totalSales) * 100).toFixed(1)}%`, 'ÓPTIMO'],
            ['Promedio Ventas Mensual', `$${avgSales.toLocaleString()}`, 'ESTABLE'],
            ['Promedio Gastos Mensual', `$${avgExpenses.toLocaleString()}`, 'ESTABLE']
        ],
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0] },
        styles: { fontSize: 10 }
    });

    // --- CAPTURING CHARTS FROM DOM ---
    // We expect certain IDs in the Analytics page to capture them
    const chartIds = ['chart-timeline', 'chart-forecast', 'chart-branch'];
    let currentY = (doc as any).lastAutoTable.finalY + 20;

    for (const id of chartIds) {
        const element = document.getElementById(id);
        if (element) {
            try {
                const canvas = await html2canvas(element, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');

                if (currentY + 80 > 280) {
                    doc.addPage();
                    currentY = 20;
                }

                const label = id === 'chart-timeline' ? 'TENDENCIA MENSUAL (VENTAS vs GASTOS)' :
                    id === 'chart-forecast' ? 'PROYECCIÓN DE ESCALABILIDAD' :
                        'COMPARATIVA DE SUCURSALES';

                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(label, 15, currentY - 5);

                doc.addImage(imgData, 'PNG', 15, currentY, pageWidth - 30, 70);
                currentY += 90;
            } catch (e) {
                console.error(`Error capturing ${id}`, e);
            }
        }
    }

    // --- PAGE 2: DETAILED ANALYSIS ---
    doc.addPage();
    addSectionTitle('ANÁLISIS DE DIAGNÓSTICO Y SITUACIÓN', 25);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    const diagnostic = `El diagnóstico financiero de Vyper indica una correlación directa entre la inversión operativa y el retorno de ventas. El índice de Ventas Promedio por mes se sitúa en $${avgSales.toLocaleString()}, mientras que el Índice de Gasto Promedio es de $${avgExpenses.toLocaleString()}.`;
    doc.text(doc.splitTextToSize(diagnostic, pageWidth - 30), 15, 35);

    addSectionTitle('INDICADORES POR SUCURSAL', 60);

    // Process branch averages
    const branchAverages = data.branchComparison.reduce((acc: any, curr: any) => {
        ['Rawson', 'Rivadavia'].forEach(b => {
            if (!acc[b]) acc[b] = { sales: 0, count: 0 };
            acc[b].sales += curr[`${b}_sales`] || 0;
            acc[b].count++;
        });
        return acc;
    }, {});

    autoTable(doc, {
        startY: 70,
        head: [['Sucursal', 'Venta Promedio Mensual', 'Cuota de Mercado Est.']],
        body: Object.entries(branchAverages).map(([name, stats]: any) => [
            name.toUpperCase(),
            `$${(stats.sales / stats.count).toLocaleString()}`,
            `${((stats.sales / totalSales) * 100).toFixed(1)}%`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40] }
    });

    addSectionTitle('ANÁLISIS PREDICTIVO', (doc as any).lastAutoTable.finalY + 20);
    const forecastTotal = data.forecast.slice(0, 3).reduce((acc: number, f: any) => acc + f.amount, 0);
    const predictionText = `Se proyecta un volumen de negocios de $${forecastTotal.toLocaleString()} para el próximo trimestre. La tendencia alcista sugiere que Vyper mantendrá su posicionamiento premium, siempre que el ratio Gasto/Venta no supere el 0.45.`;
    doc.text(doc.splitTextToSize(predictionText, pageWidth - 30), 15, (doc as any).lastAutoTable.finalY + 30);

    // Final Footer Logic
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`BY VYPER LABS - CONFIDENTIAL REPORT - PAGE ${i}/${pageCount}`, pageWidth / 2, 287, { align: 'center' });
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(15, 282, pageWidth - 15, 282);
    }

    doc.save(`VYPER_STRATEGIC_REPORT_${dateStr.replace(/\//g, '_')}.pdf`);
};
