import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { insights, bills, inventory, projects, spendingTrends } = await req.json();

    // Create PDF
    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.text('AI Report - Family Management', 105, yPosition, { align: 'center' });
    yPosition += 15;

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('he-IL')}`, 105, yPosition, { align: 'center' });
    yPosition += 15;

    // Summary Section
    doc.setFontSize(14);
    doc.text('Summary', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(`Total Insights: ${insights.length}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Expiring Items: ${inventory.length}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Active Projects: ${projects.length}`, 20, yPosition);
    yPosition += 15;

    // Insights by Type
    doc.setFontSize(14);
    doc.text('Insights Distribution', 20, yPosition);
    yPosition += 10;

    const insightsByType = insights.reduce((acc, insight) => {
      acc[insight.type] = (acc[insight.type] || 0) + 1;
      return acc;
    }, {});

    doc.setFontSize(10);
    Object.entries(insightsByType).forEach(([type, count]) => {
      doc.text(`${type}: ${count}`, 25, yPosition);
      yPosition += 6;
    });
    yPosition += 10;

    // Spending Trends
    if (spendingTrends && spendingTrends.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Spending Trends (Last 6 Months)', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      spendingTrends.forEach(trend => {
        doc.text(
          `${trend.month}: Budget ${trend.תקציב} | Spent ${trend.הוצאות} | Balance ${trend.יתרה}`,
          25,
          yPosition
        );
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Expiring Inventory
    if (inventory && inventory.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Expiring Inventory Items', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      inventory.slice(0, 15).forEach(item => {
        const expiryDate = new Date(item.expiry_date);
        const daysUntil = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        doc.text(`${item.name} (${item.quantity} ${item.unit || 'units'}) - ${daysUntil} days`, 25, yPosition);
        yPosition += 6;
        
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
      });
      yPosition += 10;
    }

    // Project Budget Status
    if (projects && projects.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Project Budget Status', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      projects.forEach(project => {
        doc.text(
          `${project.name}: Budget ${project.תקציב} | Spent ${project.הוצאות} | Balance ${project.יתרה}`,
          25,
          yPosition
        );
        yPosition += 6;

        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }

    // Generate PDF as ArrayBuffer
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=ai-report-${new Date().toISOString().split('T')[0]}.pdf`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});