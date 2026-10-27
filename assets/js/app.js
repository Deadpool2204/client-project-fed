/**
 * LOGIXPRESS ENTERPRISE SHIPPING RATE CALCULATOR
 * Master Application Coordinator
 * 
 * Handles service selector tabs, hash routing, educational tooltips,
 * sample demo data prefilling, and event dispatching.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // 1. Initialize Bootstrap Tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(el => new bootstrap.Tooltip(el, { boundary: document.body }));

  // 2. Initialize Core Modules
  LogiCalculator.init();
  LogiResults.initControls();
  LogiStorage.triggerQuoteCountUpdate();

  // 3. Service Selector Tab Switching & Hash Navigation
  initServiceTabs();

  // 4. Sample Scenario Loaders (for swift enterprise evaluation & testing)
  initSampleScenarios();

  // 5. Contact / Support Modal Trigger
  initSupportModal();
});

/**
 * Service Selector Tab Switching and Deep-Linking
 */
function initServiceTabs() {
  const tabButtons = document.querySelectorAll('.service-selector-btn');
  const serviceSections = {
    domestic: document.getElementById('section-domestic'),
    international: document.getElementById('section-international'),
    cargo: document.getElementById('section-cargo'),
    quick: document.getElementById('section-quick')
  };

  function switchTab(targetService, updateHash = true) {
    if (!serviceSections[targetService]) return;

    // Update active button state
    tabButtons.forEach(btn => {
      const isTarget = btn.getAttribute('data-service') === targetService;
      btn.classList.toggle('active', isTarget);
      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    // Toggle active section visibility
    Object.keys(serviceSections).forEach(key => {
      if (serviceSections[key]) {
        if (key === targetService) {
          serviceSections[key].classList.remove('d-none');
        } else {
          serviceSections[key].classList.add('d-none');
        }
      }
    });

    // Update live previews
    if (targetService === 'domestic') LogiCalculator.updateDomesticLivePreview();
    if (targetService === 'international') LogiCalculator.updateIntlLivePreview();
    if (targetService === 'cargo') LogiCalculator.updateCargoSummaryPreview();

    // Hide previous results when switching main mode
    const resultsContainer = document.getElementById('shipping-results-container');
    if (resultsContainer) resultsContainer.classList.add('d-none');

    // Update URL hash
    if (updateHash && window.history && window.history.replaceState) {
      window.history.replaceState(null, null, `#${targetService}`);
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const service = btn.getAttribute('data-service');
      switchTab(service);
    });
  });

  // Handle URL Hash navigation on load (e.g. #international or #cargo)
  const currentHash = window.location.hash.replace('#', '').toLowerCase();
  if (currentHash && serviceSections[currentHash]) {
    switchTab(currentHash, false);
  } else {
    switchTab('domestic', false);
  }

  // Handle cross-navigation from header links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const hash = this.getAttribute('href').replace('#', '').toLowerCase();
      if (serviceSections[hash]) {
        e.preventDefault();
        switchTab(hash);
        document.getElementById('calculator-main')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/**
 * Enterprise Sample Scenario Loaders for quick demo testing
 */
function initSampleScenarios() {
  // Scenario 1: Domestic Metro to Metro (Mumbai to Delhi)
  document.getElementById('demo-scenario-metro')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('dom-pickup-pin').value = '400001';
    document.getElementById('dom-delivery-pin').value = '110001';
    document.getElementById('dom-weight').value = '2.5';
    document.getElementById('dom-length').value = '30';
    document.getElementById('dom-width').value = '20';
    document.getElementById('dom-height').value = '15';
    document.getElementById('dom-packages-count').value = '1';
    document.getElementById('dom-declared-value').value = '4500';
    document.getElementById('dom-pay-prepaid').checked = true;
    document.getElementById('dom-cod-container').classList.add('d-none');
    document.getElementById('dom-transport-mode').value = 'any';

    const pickupPin = document.getElementById('dom-pickup-pin');
    const deliveryPin = document.getElementById('dom-delivery-pin');
    pickupPin.dispatchEvent(new Event('input'));
    deliveryPin.dispatchEvent(new Event('input'));
    LogiCalculator.updateDomesticLivePreview();

    // Trigger auto-calculation
    document.getElementById('btn-calculate-domestic').click();
  });

  // Scenario 2: Domestic COD E-Commerce Shipment (Bengaluru to Pune)
  document.getElementById('demo-scenario-cod')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('dom-pickup-pin').value = '560001';
    document.getElementById('dom-delivery-pin').value = '411001';
    document.getElementById('dom-weight').value = '1.2';
    document.getElementById('dom-length').value = '25';
    document.getElementById('dom-width').value = '18';
    document.getElementById('dom-height').value = '10';
    document.getElementById('dom-packages-count').value = '1';
    document.getElementById('dom-declared-value').value = '2800';
    document.getElementById('dom-pay-cod').checked = true;
    document.getElementById('dom-cod-container').classList.remove('d-none');
    document.getElementById('dom-cod-amount').value = '2800';
    document.getElementById('dom-transport-mode').value = 'any';

    const pickupPin = document.getElementById('dom-pickup-pin');
    const deliveryPin = document.getElementById('dom-delivery-pin');
    pickupPin.dispatchEvent(new Event('input'));
    deliveryPin.dispatchEvent(new Event('input'));
    LogiCalculator.updateDomesticLivePreview();

    document.getElementById('btn-calculate-domestic').click();
  });

  // Scenario 3: International Express Export (Mumbai to United States)
  document.getElementById('demo-scenario-intl')?.addEventListener('click', (e) => {
    e.preventDefault();
    const intlTab = document.querySelector('.service-selector-btn[data-service="international"]');
    if (intlTab) intlTab.click();

    setTimeout(() => {
      document.getElementById('intl-origin-postal').value = '400099';
      document.getElementById('intl-dest-country').value = 'US';
      document.getElementById('intl-dest-country').dispatchEvent(new Event('change'));
      document.getElementById('intl-dest-postal').value = '90210';
      document.getElementById('intl-weight').value = '4.5';
      document.getElementById('intl-length').value = '35';
      document.getElementById('intl-width').value = '28';
      document.getElementById('intl-height').value = '20';
      document.getElementById('intl-currency').value = 'USD';
      document.getElementById('intl-declared-value').value = '350';

      LogiCalculator.updateIntlLivePreview();
      document.getElementById('btn-calculate-intl').click();
    }, 150);
  });
}

/**
 * Contact Modal Handler
 */
function initSupportModal() {
  document.getElementById('form-support-contact')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Thank you! Your enterprise inquiry has been submitted to the LogiXpress commercial team. A logistics specialist will contact you within 2 business hours.');
    const modal = bootstrap.Modal.getInstance(document.getElementById('supportModal'));
    if (modal) modal.hide();
  });
}
