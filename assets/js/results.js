/**
 * LOGIXPRESS ENTERPRISE SHIPPING RATE CALCULATOR
 * Results Renderer, Sorters, Filters & Data Visualizer
 * 
 * Simple, user-friendly results presentation featuring Courier Cards,
 * clean Comparison Table, clear plain-English cost breakdown,
 * and visual weight guidance.
 */

const LogiResults = (function() {
  'use strict';

  let currentResults = [];
  let filteredResults = [];
  let currentContext = {};
  let currentSort = 'price-asc'; // 'price-asc', 'time-asc', 'name-asc', 'price-desc'
  let currentModeFilter = 'all';
  let currentTimeFilter = 'all';
  let currentViewMode = 'cards'; // 'cards' (default friendly) or 'table'
  let costChartInstance = null;
  let weightChartInstance = null;

  /**
   * Initializes and renders results with the provided dataset and shipment context.
   */
  function render(results, context) {
    currentResults = Array.isArray(results) ? [...results] : [];
    currentContext = context || {};
    currentModeFilter = 'all';
    currentTimeFilter = 'all';
    currentSort = 'price-asc';

    const resultsContainer = document.getElementById('shipping-results-container');
    if (!resultsContainer) return;

    // Reveal container
    resultsContainer.classList.remove('d-none');
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Render friendly shipment overview journey card
    renderSummaryBar(currentContext);

    // Apply sorting & filtering, then render cards and table
    applyFiltersAndSort();

    // Render charts
    renderCharts();
  }

  /**
   * Renders the friendly journey summary bar
   */
  function renderSummaryBar(ctx) {
    const bar = document.getElementById('results-summary-bar');
    if (!bar) return;

    const actual = (ctx.actualWeight || 0).toFixed(2);
    const vol = (ctx.volumetricWeight || 0).toFixed(2);
    const billed = (ctx.chargeableWeight || 0).toFixed(2);
    const isVolBilled = (ctx.volumetricWeight || 0) > (ctx.actualWeight || 0);

    bar.innerHTML = `
      <div class="journey-summary-card">
        <div class="journey-route-display">
          <div class="journey-location-tag">
            <i class="bi bi-geo-alt-fill text-primary"></i>
            <span>${ctx.origin || 'Origin'}</span>
          </div>
          <div class="journey-arrow-divider">
            <i class="bi bi-arrow-right"></i>
          </div>
          <div class="journey-location-tag">
            <i class="bi bi-geo-fill text-success"></i>
            <span>${ctx.destination || 'Destination'}</span>
          </div>
        </div>

        <div class="row g-2 justify-content-center text-center mt-2">
          <div class="col-6 col-md-3">
            <div class="journey-meta-badge">
              <span>Service Type</span>
              <strong>${ctx.serviceType || 'Domestic'}</strong>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="journey-meta-badge">
              <span>Scale Weight</span>
              <strong>${actual} kg</strong>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="journey-meta-badge">
              <span>Box Space Weight</span>
              <strong>${vol} kg</strong>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="journey-meta-badge highlight" style="background-color: #eff6ff; border-color: #93c5fd;">
              <span class="text-primary fw-semibold">Billed Weight</span>
              <strong class="text-primary">${billed} kg</strong>
            </div>
          </div>
        </div>

        <div class="text-center mt-2 extra-small text-muted">
          ${isVolBilled 
            ? '💡 <strong>Billed by box volume:</strong> Your package is light but takes up cargo space, so couriers bill for ' + billed + ' kg.'
            : '💡 <strong>Billed by scale weight:</strong> Your package weighs ' + billed + ' kg, which is heavier than the box dimensions.'}
        </div>
      </div>
    `;
  }

  /**
   * Applies active filter and sort controls
   */
  function applyFiltersAndSort() {
    let list = [...currentResults];

    // Mode filter
    if (currentModeFilter !== 'all') {
      list = list.filter(item => {
        const mode = (item.transportMode || '').toLowerCase();
        return mode.includes(currentModeFilter.toLowerCase());
      });
    }

    // Transit time filter
    if (currentTimeFilter !== 'all') {
      list = list.filter(item => {
        const days = item.transitMaxDays || 5;
        if (currentTimeFilter === 'fast') return days <= 2;
        if (currentTimeFilter === 'standard') return days >= 3 && days <= 5;
        if (currentTimeFilter === 'economy') return days > 5;
        return true;
      });
    }

    // Sort order
    if (currentSort === 'price-asc') {
      list.sort((a, b) => (a.costBreakdown.grandTotal || 0) - (b.costBreakdown.grandTotal || 0));
    } else if (currentSort === 'price-desc') {
      list.sort((a, b) => (b.costBreakdown.grandTotal || 0) - (a.costBreakdown.grandTotal || 0));
    } else if (currentSort === 'time-asc') {
      list.sort((a, b) => (a.transitMinDays || 1) - (b.transitMinDays || 1));
    } else if (currentSort === 'name-asc') {
      list.sort((a, b) => a.serviceName.localeCompare(b.serviceName));
    }

    filteredResults = list;

    // Render both views
    renderCardsView(filteredResults);
    renderResultsTable(filteredResults);
    renderMobileCards(filteredResults);
    updateViewModeDisplay();
    updateResultCount(filteredResults.length, currentResults.length);
  }

  /**
   * Toggles display between Cards View and Table View
   */
  function updateViewModeDisplay() {
    const cardsContainer = document.getElementById('results-cards-container');
    const tableContainer = document.getElementById('results-table-container');
    const btnCards = document.getElementById('btn-view-cards');
    const btnTable = document.getElementById('btn-view-table');

    if (btnCards && btnTable) {
      btnCards.classList.toggle('active', currentViewMode === 'cards');
      btnTable.classList.toggle('active', currentViewMode === 'table');
    }

    if (currentViewMode === 'cards') {
      if (cardsContainer) cardsContainer.classList.remove('d-none');
      if (tableContainer) tableContainer.classList.add('d-none');
    } else {
      if (cardsContainer) cardsContainer.classList.add('d-none');
      if (tableContainer) tableContainer.classList.remove('d-none');
    }
  }

  /**
   * Updates result count badge
   */
  function updateResultCount(filteredCount, totalCount) {
    const countBadge = document.getElementById('results-count-badge');
    if (countBadge) {
      countBadge.textContent = `${filteredCount} courier options available`;
    }
  }

  /**
   * Identifies the cheapest and fastest services in the current list
   */
  function getServiceHighlights(list) {
    if (!list || list.length === 0) return { cheapestId: null, fastestId: null };

    let cheapest = list[0];
    let fastest = list[0];

    list.forEach(item => {
      const price = item.costBreakdown ? item.costBreakdown.grandTotal : 0;
      const cheapestPrice = cheapest.costBreakdown ? cheapest.costBreakdown.grandTotal : 0;
      if (price < cheapestPrice) {
        cheapest = item;
      }

      const days = item.transitMinDays || 99;
      const fastestDays = fastest.transitMinDays || 99;
      if (days < fastestDays) {
        fastest = item;
      }
    });

    return {
      cheapestId: cheapest.tariffId || cheapest.vehicleId,
      fastestId: fastest.tariffId || fastest.vehicleId
    };
  }

  /**
   * Renders User-Friendly Courier Cards View
   */
  function renderCardsView(list) {
    const container = document.getElementById('results-cards-container');
    const emptyState = document.getElementById('results-empty-state');
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = '';
      if (emptyState) {
        emptyState.classList.remove('d-none');
        emptyState.innerHTML = `
          <div class="py-5 text-center text-muted">
            <i class="bi bi-search text-warning fs-1 mb-3 d-block"></i>
            <h5 class="fw-semibold text-dark">No Shipping Options Found</h5>
            <p class="small text-secondary mb-3">No courier services match your current filters. Try resetting your filter preferences.</p>
            <button class="btn btn-sm btn-outline-primary" id="btn-reset-filters-inline">
              <i class="bi bi-arrow-counterclockwise me-1"></i> Reset Filters
            </button>
          </div>
        `;
        document.getElementById('btn-reset-filters-inline')?.addEventListener('click', resetFilters);
      }
      return;
    }

    if (emptyState) emptyState.classList.add('d-none');

    const { cheapestId, fastestId } = getServiceHighlights(list);

    let html = '<div class="courier-cards-grid p-3">';
    list.forEach((item, index) => {
      const b = item.costBreakdown || {};
      const id = item.tariffId || item.vehicleId;
      const isCheapest = id === cheapestId;
      const isFastest = id === fastestId;
      const currency = b.currency || 'INR';
      const formattedTotal = LogiPricingEngine.formatCurrency(b.grandTotal, currency);
      const billable = (item.billableWeight || currentContext.chargeableWeight || 0).toFixed(2);

      let highlightBadge = '';
      if (isCheapest) {
        highlightBadge = `<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-tag-fill me-1"></i>Lowest Price</span>`;
      } else if (isFastest) {
        highlightBadge = `<span class="badge bg-primary-subtle text-primary border border-primary-subtle"><i class="bi bi-lightning-charge-fill me-1"></i>Fastest Delivery</span>`;
      } else if (item.badge) {
        highlightBadge = `<span class="badge bg-light text-secondary border">${item.badge}</span>`;
      }

      html += `
        <div class="courier-card ${isCheapest ? 'is-cheapest' : isFastest ? 'is-fastest' : ''}">
          <div>
            <div class="courier-card-header">
              <div>
                <div class="courier-name">${item.serviceName}</div>
                <div class="courier-mode-badge">
                  <i class="bi ${getTransportIcon(item.transportMode || item.serviceName)} text-primary"></i>
                  <span>${item.transportMode || 'Standard'} Mode</span>
                </div>
              </div>
              <div>${highlightBadge}</div>
            </div>

            <div class="courier-delivery-time">
              <div class="courier-delivery-days">
                <i class="bi bi-clock-history text-secondary"></i>
                <span>${item.transitTime}</span>
              </div>
              ${item.estimatedDeliveryDate ? `
                <div class="courier-delivery-date">
                  <i class="bi bi-calendar-check me-1 text-success"></i> Expected: <strong>${item.estimatedDeliveryDate}</strong>
                </div>
              ` : ''}
              <div class="extra-small text-muted mt-1">
                Billed weight: <strong>${billable} kg</strong>
              </div>
            </div>
          </div>

          <div>
            <div class="courier-price-area">
              <div class="courier-price-label">Total Shipping Price</div>
              <div class="courier-price-amount">${formattedTotal}</div>
              <div class="courier-price-subtext">
                <i class="bi bi-check-circle-fill"></i>
                <span>All taxes & GST included • No extra fees</span>
              </div>
            </div>

            <div class="courier-card-actions">
              <button type="button" class="btn btn-sm btn-outline-secondary flex-grow-1 btn-breakdown" data-index="${index}">
                <i class="bi bi-receipt me-1"></i> Price Breakdown
              </button>
              <button type="button" class="btn btn-sm btn-outline-primary btn-save-single px-3" data-index="${index}" title="Save Quote">
                <i class="bi bi-bookmark-plus me-1"></i> Save
              </button>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;

    // Attach card action listeners
    container.querySelectorAll('.btn-breakdown').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        showBreakdownModal(filteredResults[idx]);
      });
    });

    container.querySelectorAll('.btn-save-single').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        saveSelectedQuote(filteredResults[idx]);
      });
    });
  }

  /**
   * Renders the comparison table (for users who prefer spreadsheet view)
   */
  function renderResultsTable(list) {
    const tbody = document.getElementById('results-table-body');
    const tableContainer = document.getElementById('results-table-container');

    if (!tbody || !tableContainer) return;

    if (!list || list.length === 0) {
      tbody.innerHTML = '';
      return;
    }

    const { cheapestId, fastestId } = getServiceHighlights(list);

    let html = '';
    list.forEach((item, index) => {
      const b = item.costBreakdown || {};
      const id = item.tariffId || item.vehicleId;
      const isCheapest = id === cheapestId;
      const isFastest = id === fastestId;

      const currency = b.currency || 'INR';
      const formattedTotal = LogiPricingEngine.formatCurrency(b.grandTotal, currency);

      let badgesHtml = '';
      if (isCheapest) {
        badgesHtml += `<span class="badge bg-success-subtle text-success border border-success-subtle me-1"><i class="bi bi-tag-fill me-1"></i>Lowest Price</span>`;
      }
      if (isFastest && !isCheapest) {
        badgesHtml += `<span class="badge bg-primary-subtle text-primary border border-primary-subtle me-1"><i class="bi bi-lightning-charge-fill me-1"></i>Fastest</span>`;
      }

      html += `
        <tr class="align-middle ${isCheapest ? 'table-highlight-row' : ''}">
          <td>
            <div class="fw-bold text-dark service-name-title">${item.serviceName}</div>
            <div class="text-muted small">${item.description || item.suitableFor || ''}</div>
            <div class="mt-1">${badgesHtml}</div>
          </td>
          <td>
            <div class="fw-semibold text-dark">${item.transitTime}</div>
            ${item.estimatedDeliveryDate ? `<div class="text-muted extra-small"><i class="bi bi-calendar3 me-1"></i>${item.estimatedDeliveryDate}</div>` : ''}
          </td>
          <td>
            <span class="badge text-bg-light border font-monospace">
              <i class="bi ${getTransportIcon(item.transportMode || item.serviceName)} me-1 text-primary"></i>
              ${item.transportMode || 'Surface'}
            </span>
          </td>
          <td class="font-monospace text-center">
            ${(item.billableWeight || item.chargeableWeight || currentContext.chargeableWeight || 0).toFixed(2)} kg
          </td>
          <td class="text-end">
            <div class="fw-bold fs-6 text-dark font-monospace">${formattedTotal}</div>
            <div class="text-success extra-small"><i class="bi bi-check-circle me-1"></i>All taxes included</div>
          </td>
          <td class="text-center">
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-secondary btn-breakdown" data-index="${index}" title="View price breakdown">
                <i class="bi bi-receipt me-1"></i> Details
              </button>
              <button type="button" class="btn btn-outline-primary btn-save-single" data-index="${index}" title="Save Quote">
                <i class="bi bi-bookmark-plus"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;

    // Attach row button listeners
    tbody.querySelectorAll('.btn-breakdown').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        showBreakdownModal(filteredResults[idx]);
      });
    });

    tbody.querySelectorAll('.btn-save-single').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        saveSelectedQuote(filteredResults[idx]);
      });
    });
  }

  /**
   * Fallback for mobile card rendering
   */
  function renderMobileCards(list) {
    const cardContainer = document.getElementById('results-cards-mobile');
    if (!cardContainer) return;
    cardContainer.innerHTML = ''; // Replaced by universal cards view
  }

  /**
   * Returns appropriate icon for transport mode
   */
  function getTransportIcon(modeStr) {
    const s = String(modeStr).toLowerCase();
    if (s.includes('air') || s.includes('flight')) return 'bi-airplane';
    if (s.includes('surface') || s.includes('road') || s.includes('ltl') || s.includes('truck')) return 'bi-truck';
    if (s.includes('rail') || s.includes('train')) return 'bi-train-front';
    if (s.includes('bike') || s.includes('cycle')) return 'bi-bicycle';
    if (s.includes('sea') || s.includes('ocean')) return 'bi-water';
    return 'bi-box-seam';
  }

  /**
   * Opens the plain-English itemized cost breakdown modal
   */
  function showBreakdownModal(serviceItem) {
    if (!serviceItem) return;
    const b = serviceItem.costBreakdown || {};
    const currency = b.currency || 'INR';

    const modalEl = document.getElementById('priceBreakdownModal');
    if (!modalEl) return;

    document.getElementById('modal-service-title').textContent = serviceItem.serviceName;
    document.getElementById('modal-service-subtitle').textContent = `${serviceItem.transportMode || 'Surface'} Delivery | Estimated Speed: ${serviceItem.transitTime}`;

    let breakdownHtml = `
      <div class="mb-3 p-3 bg-light rounded border">
        <table class="table table-sm table-borderless mb-0">
          <tbody>
            <tr>
              <td class="text-secondary py-1">Standard Courier Delivery</td>
              <td class="text-end font-monospace py-1 fw-semibold">${LogiPricingEngine.formatCurrency(b.baseFreight || b.baseFare, currency)}</td>
            </tr>
            ${b.additionalWeightCharge ? `
              <tr>
                <td class="text-secondary py-1">Extra Weight Charge</td>
                <td class="text-end font-monospace py-1">${LogiPricingEngine.formatCurrency(b.additionalWeightCharge, currency)}</td>
              </tr>
            ` : ''}
            ${b.distanceFare ? `
              <tr>
                <td class="text-secondary py-1">Distance Fare</td>
                <td class="text-end font-monospace py-1">${LogiPricingEngine.formatCurrency(b.distanceFare, currency)}</td>
              </tr>
            ` : ''}
            ${b.urgencyFee ? `
              <tr>
                <td class="text-secondary py-1">Express Speed Priority</td>
                <td class="text-end font-monospace py-1">${LogiPricingEngine.formatCurrency(b.urgencyFee, currency)}</td>
              </tr>
            ` : ''}
            ${b.fuelSurcharge ? `
              <tr>
                <td class="text-secondary py-1">Fuel &amp; Network Handling</td>
                <td class="text-end font-monospace py-1">${LogiPricingEngine.formatCurrency(b.fuelSurcharge, currency)}</td>
              </tr>
            ` : ''}
            ${b.codFee ? `
              <tr>
                <td class="text-secondary py-1">Cash on Delivery (COD) Handling</td>
                <td class="text-end font-monospace py-1">${LogiPricingEngine.formatCurrency(b.codFee, currency)}</td>
              </tr>
            ` : ''}
            ${b.insuranceFee ? `
              <tr>
                <td class="text-secondary py-1">Package Protection (Insurance)</td>
                <td class="text-end font-monospace py-1">${LogiPricingEngine.formatCurrency(b.insuranceFee, currency)}</td>
              </tr>
            ` : ''}
            ${b.docketCharge ? `
              <tr>
                <td class="text-secondary py-1">Booking &amp; Documentation</td>
                <td class="text-end font-monospace py-1">${LogiPricingEngine.formatCurrency(b.docketCharge, currency)}</td>
              </tr>
            ` : ''}
            ${b.handlingFee ? `
              <tr>
                <td class="text-secondary py-1">Special Handling Add-ons</td>
                <td class="text-end font-monospace py-1">${LogiPricingEngine.formatCurrency(b.handlingFee, currency)}</td>
              </tr>
            ` : ''}
            <tr class="border-top">
              <td class="fw-semibold text-dark py-2">Subtotal (before tax)</td>
              <td class="text-end font-monospace fw-semibold py-2">${LogiPricingEngine.formatCurrency(b.subtotal, currency)}</td>
            </tr>
            <tr>
              <td class="text-secondary py-1">GST Government Tax (18%)</td>
              <td class="text-end font-monospace py-1">${LogiPricingEngine.formatCurrency(b.totalTax || b.gst || b.tax || 0, currency)}</td>
            </tr>
            <tr class="border-top border-dark border-2">
              <td class="fw-bold fs-6 text-dark py-2">Total Amount You Pay</td>
              <td class="text-end font-monospace fw-bold fs-5 text-primary py-2">${LogiPricingEngine.formatCurrency(b.grandTotal, currency)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="alert alert-success d-flex align-items-center gap-2 mb-0 py-2 small">
        <i class="bi bi-shield-check fs-5"></i>
        <div><strong>Clear &amp; Transparent:</strong> All taxes and surcharges are included. What you see is what you pay.</div>
      </div>
    `;

    document.getElementById('modal-breakdown-content').innerHTML = breakdownHtml;

    // Show modal
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  }

  /**
   * Saves a selected quote to storage
   */
  function saveSelectedQuote(serviceItem) {
    if (!serviceItem) return;
    const b = serviceItem.costBreakdown || {};
    const quoteData = {
      serviceType: currentContext.serviceType || 'Domestic',
      route: `${currentContext.origin || 'N/A'} -> ${currentContext.destination || 'N/A'}`,
      chargeableWeight: serviceItem.billableWeight || currentContext.chargeableWeight || 0,
      carrierService: serviceItem.serviceName,
      transportMode: serviceItem.transportMode,
      estimatedTotal: b.grandTotal,
      currency: b.currency || 'INR',
      transitTime: serviceItem.transitTime,
      details: {
        item: serviceItem,
        context: currentContext
      }
    };

    const saved = LogiStorage.saveQuote(quoteData);
    if (saved) {
      LogiExport.showToast(`Saved quote for ${serviceItem.serviceName}`);
    }
  }

  /**
   * Renders Chart.js diagrams
   */
  function renderCharts() {
    if (typeof Chart === 'undefined') return;

    renderCostChart();
    renderWeightChart();
  }

  /**
   * Chart 1: Simple cost component breakdown
   */
  function renderCostChart() {
    const canvas = document.getElementById('chart-cost-breakdown');
    if (!canvas) return;

    if (costChartInstance) {
      costChartInstance.destroy();
    }

    if (!filteredResults || filteredResults.length === 0) return;

    const labels = filteredResults.map(r => r.serviceName.length > 18 ? r.serviceName.substring(0, 16) + '...' : r.serviceName);
    const baseFreights = filteredResults.map(r => (r.costBreakdown && (r.costBreakdown.baseFreight || r.costBreakdown.baseFare)) || 0);
    const fuelCharges = filteredResults.map(r => (r.costBreakdown && r.costBreakdown.fuelSurcharge) || 0);
    const extraCharges = filteredResults.map(r => {
      const b = r.costBreakdown || {};
      return (b.codFee || 0) + (b.insuranceFee || 0) + (b.handlingFee || 0) + (b.docketCharge || 0) + (b.urgencyFee || 0);
    });
    const taxes = filteredResults.map(r => (r.costBreakdown && (r.costBreakdown.totalTax || r.costBreakdown.gst || r.costBreakdown.tax)) || 0);

    const ctx = canvas.getContext('2d');
    costChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Base Delivery', data: baseFreights, backgroundColor: '#1e40af' },
          { label: 'Fuel Surcharge', data: fuelCharges, backgroundColor: '#0284c7' },
          { label: 'Add-ons & Options', data: extraCharges, backgroundColor: '#d97706' },
          { label: 'GST Tax (18%)', data: taxes, backgroundColor: '#64748b' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Inter', size: 11 } } },
          tooltip: {
            callbacks: {
              label: function(context) {
                const val = context.raw || 0;
                return `${context.dataset.label}: ${LogiPricingEngine.formatCurrency(val, currentContext.currency || 'INR')}`;
              }
            }
          }
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Inter', size: 10 } } },
          y: { stacked: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Inter', size: 10 } } }
        }
      }
    });
  }

  /**
   * Chart 2: Simple Actual vs Box Space Weight Comparison
   */
  function renderWeightChart() {
    const canvas = document.getElementById('chart-weight-comparison');
    if (!canvas) return;

    if (weightChartInstance) {
      weightChartInstance.destroy();
    }

    const actual = currentContext.actualWeight || 0;
    const volumetric = currentContext.volumetricWeight || 0;
    const chargeable = currentContext.chargeableWeight || Math.max(actual, volumetric);

    const ctx = canvas.getContext('2d');
    weightChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Scale Weight (kg)', 'Box Space Weight (kg)'],
        datasets: [{
          data: [actual, volumetric],
          backgroundColor: ['#2563eb', '#93c5fd'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Inter', size: 11 } } },
          tooltip: {
            callbacks: {
              afterLabel: function() {
                return `Billed for: ${chargeable.toFixed(2)} kg`;
              }
            }
          }
        },
        cutout: '68%'
      }
    });
  }

  /**
   * Resets active filter state
   */
  function resetFilters() {
    currentSort = 'price-asc';
    currentModeFilter = 'all';
    currentTimeFilter = 'all';

    const sortSelect = document.getElementById('select-sort-results');
    const modeSelect = document.getElementById('select-filter-mode');
    const timeSelect = document.getElementById('select-filter-time');

    if (sortSelect) sortSelect.value = 'price-asc';
    if (modeSelect) modeSelect.value = 'all';
    if (timeSelect) timeSelect.value = 'all';

    applyFiltersAndSort();
  }

  /**
   * Attaches control listeners for sort, filters, and view mode toggle
   */
  function initControls() {
    document.getElementById('select-sort-results')?.addEventListener('change', (e) => {
      currentSort = e.target.value;
      applyFiltersAndSort();
    });

    document.getElementById('select-filter-mode')?.addEventListener('change', (e) => {
      currentModeFilter = e.target.value;
      applyFiltersAndSort();
    });

    document.getElementById('select-filter-time')?.addEventListener('change', (e) => {
      currentTimeFilter = e.target.value;
      applyFiltersAndSort();
    });

    document.getElementById('btn-reset-filters')?.addEventListener('click', resetFilters);

    // View mode toggle listeners (Cards vs Table)
    document.getElementById('btn-view-cards')?.addEventListener('click', () => {
      currentViewMode = 'cards';
      updateViewModeDisplay();
    });

    document.getElementById('btn-view-table')?.addEventListener('click', () => {
      currentViewMode = 'table';
      updateViewModeDisplay();
    });

    // Export buttons
    document.getElementById('btn-export-csv')?.addEventListener('click', () => {
      LogiExport.exportRatesToCSV(currentContext, filteredResults);
    });

    document.getElementById('btn-copy-quote')?.addEventListener('click', () => {
      if (filteredResults.length > 0) {
        LogiExport.copyQuoteSummary(currentContext, filteredResults[0]);
      } else {
        alert('No calculated results to copy.');
      }
    });

    document.getElementById('btn-print-quote')?.addEventListener('click', () => {
      LogiExport.printQuotation();
    });
  }

  return {
    render,
    initControls,
    resetFilters,
    getCurrentResults: () => filteredResults,
    getCurrentContext: () => currentContext
  };
})();

// Export for tests/module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LogiResults;
}
