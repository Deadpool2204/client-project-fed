/**
 * LOGIXPRESS ENTERPRISE SHIPPING RATE CALCULATOR
 * Quotation Export and Document Generator
 * 
 * Provides features for:
 * - CSV rate comparison export
 * - Formatted quotation print memo
 * - Clipboard summary copy with toast feedback
 */

const LogiExport = (function() {
  'use strict';

  /**
   * Generates and downloads a CSV file containing calculated rates.
   */
  function exportRatesToCSV(currentQuoteContext, resultsList) {
    if (!resultsList || resultsList.length === 0) {
      alert('No rate calculation results available to export.');
      return;
    }

    const rows = [];
    // Metadata Header
    rows.push(['"LogiXpress Enterprise Shipping Rate Estimate"']);
    rows.push([`"Generated At"`, `"${new Date().toLocaleString('en-IN')}"`]);
    rows.push([`"Service Scope"`, `"${currentQuoteContext.serviceType || 'Domestic'}"`]);
    rows.push([`"Origin / Pickup"`, `"${currentQuoteContext.origin || 'N/A'}"`]);
    rows.push([`"Destination / Delivery"`, `"${currentQuoteContext.destination || 'N/A'}"`]);
    rows.push([`"Actual Weight (kg)"`, currentQuoteContext.actualWeight || 0]);
    rows.push([`"Volumetric Weight (kg)"`, currentQuoteContext.volumetricWeight || 0]);
    rows.push([`"Chargeable Weight (kg)"`, currentQuoteContext.chargeableWeight || 0]);
    rows.push([`"Payment Mode"`, `"${currentQuoteContext.paymentMode || 'Prepaid'}"`]);
    rows.push([]); // blank separator

    // Column Headers
    rows.push([
      '"Service Name"',
      '"Transport Mode"',
      '"Billable Weight (kg)"',
      '"Transit Time"',
      '"Base Freight"',
      '"Fuel Surcharge"',
      '"COD Fee"',
      '"Insurance Fee"',
      '"Handling / Extras"',
      '"Taxes (GST)"',
      '"Final Estimated Total"',
      '"Currency"'
    ]);

    // Data Rows
    resultsList.forEach(item => {
      const b = item.costBreakdown || {};
      rows.push([
        `"${item.serviceName}"`,
        `"${item.transportMode}"`,
        item.billableWeight || item.chargeableWeight || 0,
        `"${item.transitTime}"`,
        b.baseFreight || b.baseFare || 0,
        b.fuelSurcharge || 0,
        b.codFee || 0,
        b.insuranceFee || 0,
        b.handlingFee || b.docketCharge || b.distanceFare || b.urgencyFee || 0,
        b.totalTax || b.gst || b.tax || 0,
        b.grandTotal || 0,
        `"${b.currency || 'INR'}"`
      ]);
    });

    // Disclaimer
    rows.push([]);
    rows.push(['"Notice: Rates are preliminary estimates based on configured demonstration pricing. Subject to carrier volumetric verification, surcharges, and actual weight."']);

    // Construct CSV text
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = `LogiXpress_Quote_${Date.now()}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Copies a clean plain-text summary of the estimate to the user's clipboard.
   */
  function copyQuoteSummary(quoteContext, primaryService) {
    if (!primaryService) {
      alert('Please calculate rates first.');
      return;
    }

    const b = primaryService.costBreakdown || {};
    const text = [
      `=========================================`,
      ` LOGIXPRESS FREIGHT ESTIMATE SUMMARY`,
      `=========================================`,
      `Service: ${primaryService.serviceName} (${primaryService.transportMode})`,
      `Scope: ${quoteContext.serviceType || 'Domestic'} Shipment`,
      `Route: ${quoteContext.origin} -> ${quoteContext.destination}`,
      `Actual Weight: ${quoteContext.actualWeight} kg`,
      `Volumetric Weight: ${quoteContext.volumetricWeight} kg`,
      `Chargeable Weight: ${primaryService.billableWeight || quoteContext.chargeableWeight} kg`,
      `Estimated Transit: ${primaryService.transitTime}`,
      `Estimated Delivery: ${primaryService.estimatedDeliveryDate || 'Standard Transit'}`,
      `-----------------------------------------`,
      `Base Freight: ${b.currency || 'INR'} ${b.baseFreight || b.baseFare}`,
      b.fuelSurcharge ? `Fuel Surcharge: ${b.currency || 'INR'} ${b.fuelSurcharge}` : '',
      b.codFee ? `COD Fee: ${b.currency || 'INR'} ${b.codFee}` : '',
      b.insuranceFee ? `Insurance: ${b.currency || 'INR'} ${b.insuranceFee}` : '',
      `Taxes (GST 18%): ${b.currency || 'INR'} ${b.totalTax || b.gst || b.tax || 0}`,
      `-----------------------------------------`,
      `FINAL ESTIMATE: ${b.currency || 'INR'} ${b.grandTotal}`,
      `=========================================`,
      `Estimate Date: ${new Date().toLocaleDateString('en-IN')}`,
      `* Rates are subject to physical weight verification upon pickup.`
    ].filter(Boolean).join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Estimate summary copied to clipboard!');
      }).catch(err => {
        console.error('Clipboard copy error', err);
        fallbackCopyTextToClipboard(text);
      });
    } else {
      fallbackCopyTextToClipboard(text);
    }
  }

  /**
   * Fallback for older browsers
   */
  function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Estimate summary copied to clipboard!');
    } catch (err) {
      prompt('Copy estimate summary:', text);
    }
    document.body.removeChild(textArea);
  }

  /**
   * Shows a clean toast message
   */
  function showToast(message) {
    let container = document.getElementById('logixpress-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'logixpress-toast-container';
      container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }

    const toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center text-white bg-dark border-0 shadow';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi bi-check-circle-fill text-success"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    container.appendChild(toastEl);
    const bsToast = new bootstrap.Toast(toastEl, { delay: 3500 });
    bsToast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  }

  /**
   * Formats the page for print / quotation memo and triggers window.print()
   */
  function printQuotation() {
    window.print();
  }

  return {
    exportRatesToCSV,
    copyQuoteSummary,
    printQuotation,
    showToast
  };
})();

// Export for tests/module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LogiExport;
}
