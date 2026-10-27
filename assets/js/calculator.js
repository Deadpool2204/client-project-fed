/**
 * LOGIXPRESS ENTERPRISE SHIPPING RATE CALCULATOR
 * Form Management & Workflow Controller
 * 
 * Manages form state, live volumetric calculations, dynamic package rows,
 * location swapping, COD toggling, and rate dispatching.
 */

const LogiCalculator = (function() {
  'use strict';

  // State management
  let activeServiceTab = 'domestic'; // 'domestic', 'international', 'cargo', 'quick'
  let cargoPackages = [
    { type: 'Master Carton', quantity: 4, length: 60, width: 40, height: 40, weight: 18 }
  ];

  /**
   * Initializes all form controllers and event listeners
   */
  function init() {
    initDomesticForm();
    initInternationalForm();
    initCargoForm();
    initQuickDeliveryForm();
    initSavedQuotesDrawer();
  }

  /* =========================================================================
   * DOMESTIC SHIPPING CALCULATOR WORKFLOW
   * ========================================================================= */
  function initDomesticForm() {
    const form = document.getElementById('form-domestic');
    if (!form) return;

    const pickupPin = document.getElementById('dom-pickup-pin');
    const deliveryPin = document.getElementById('dom-delivery-pin');
    const swapBtn = document.getElementById('btn-swap-locations');
    const paymentModeRadios = document.querySelectorAll('input[name="dom-payment-mode"]');
    const codContainer = document.getElementById('dom-cod-container');
    const codAmountInput = document.getElementById('dom-cod-amount');
    const weightInput = document.getElementById('dom-weight');
    const lengthInput = document.getElementById('dom-length');
    const widthInput = document.getElementById('dom-width');
    const heightInput = document.getElementById('dom-height');
    const packagesCount = document.getElementById('dom-packages-count');
    const resetBtn = document.getElementById('btn-reset-domestic');

    // PIN code real-time city auto-detection
    pickupPin?.addEventListener('input', () => {
      handlePinAutoDetect(pickupPin, 'dom-pickup-city-info');
      updateDomesticLivePreview();
    });

    deliveryPin?.addEventListener('input', () => {
      handlePinAutoDetect(deliveryPin, 'dom-delivery-city-info');
      updateDomesticLivePreview();
    });

    // Swap Origin and Destination PINs
    swapBtn?.addEventListener('click', () => {
      if (!pickupPin || !deliveryPin) return;
      const tempVal = pickupPin.value;
      pickupPin.value = deliveryPin.value;
      deliveryPin.value = tempVal;

      handlePinAutoDetect(pickupPin, 'dom-pickup-city-info');
      handlePinAutoDetect(deliveryPin, 'dom-delivery-city-info');
      updateDomesticLivePreview();

      // Quick visual rotation animation
      swapBtn.classList.add('rotate-180');
      setTimeout(() => swapBtn.classList.remove('rotate-180'), 350);
    });

    // Payment Mode: Toggle COD Amount container
    paymentModeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const isCod = radio.value === 'cod';
        if (codContainer) {
          if (isCod) {
            codContainer.classList.remove('d-none');
            // Auto-fill COD amount from declared value if empty
            const declaredVal = document.getElementById('dom-declared-value')?.value;
            if (declaredVal && !codAmountInput.value) {
              codAmountInput.value = declaredVal;
            }
          } else {
            codContainer.classList.add('d-none');
          }
        }
      });
    });

    // Live Volumetric Preview on dimension/weight input
    [weightInput, lengthInput, widthInput, heightInput, packagesCount].forEach(input => {
      input?.addEventListener('input', () => {
        updateDomesticLivePreview();
      });
    });

    // Package size & weight presets
    document.querySelectorAll('.dom-preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.dom-preset-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const preset = chip.getAttribute('data-preset');
        if (preset === 'envelope') {
          if (weightInput) weightInput.value = '0.2';
          if (lengthInput) lengthInput.value = '25';
          if (widthInput) widthInput.value = '20';
          if (heightInput) heightInput.value = '2';
        } else if (preset === 'small') {
          if (weightInput) weightInput.value = '1.0';
          if (lengthInput) lengthInput.value = '20';
          if (widthInput) widthInput.value = '15';
          if (heightInput) heightInput.value = '10';
        } else if (preset === 'medium') {
          if (weightInput) weightInput.value = '3.0';
          if (lengthInput) lengthInput.value = '35';
          if (widthInput) widthInput.value = '25';
          if (heightInput) heightInput.value = '15';
        } else if (preset === 'large') {
          if (weightInput) weightInput.value = '10.0';
          if (lengthInput) lengthInput.value = '50';
          if (widthInput) widthInput.value = '40';
          if (heightInput) heightInput.value = '30';
        } else if (preset === 'custom') {
          lengthInput?.focus();
        }

        updateDomesticLivePreview();
      });
    });

    // Quick city suggestion buttons
    document.querySelectorAll('.city-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const pin = btn.getAttribute('data-pin');
        const inputEl = document.getElementById(targetId);
        if (inputEl && pin) {
          inputEl.value = pin;
          inputEl.dispatchEvent(new Event('input'));
          updateDomesticLivePreview();
        }
      });
    });

    // Form Submit: Calculate Rates
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleDomesticCalculate();
    });

    // Form Reset
    resetBtn?.addEventListener('click', () => {
      form.reset();
      LogiValidator.clearValidation(form);
      document.getElementById('dom-pickup-city-info').textContent = '';
      document.getElementById('dom-delivery-city-info').textContent = '';
      document.querySelectorAll('.dom-preset-chip').forEach(c => c.classList.remove('active'));
      document.querySelector('.dom-preset-chip[data-preset="custom"]')?.classList.add('active');
      if (codContainer) codContainer.classList.add('d-none');
      updateDomesticLivePreview();
      hideResults();
    });
  }

  /**
   * Auto-detects city/state from Indian PIN code directory
   */
  function handlePinAutoDetect(inputEl, labelId) {
    const label = document.getElementById(labelId);
    if (!label || !inputEl) return;

    const pin = inputEl.value.trim();
    if (pin.length === 6 && /^\d{6}$/.test(pin)) {
      const info = LOGIXPRESS_CONFIG.pincodeDirectory[pin];
      if (info) {
        label.innerHTML = `<span class="badge text-bg-light border text-primary"><i class="bi bi-geo-alt-fill me-1"></i>${info.city}, ${info.state}</span>`;
        LogiValidator.setFieldFeedback(inputEl, true);
        return;
      } else {
        label.innerHTML = `<span class="badge text-bg-light border text-muted">PIN: Circle ${pin.charAt(0)}</span>`;
        LogiValidator.setFieldFeedback(inputEl, true);
        return;
      }
    } else if (pin.length > 0 && pin.length < 6) {
      label.textContent = '';
    } else {
      label.textContent = '';
    }
  }

  /**
   * Updates Domestic live preview pills & friendly explanation
   */
  function updateDomesticLivePreview() {
    const length = parseFloat(document.getElementById('dom-length')?.value) || 0;
    const width = parseFloat(document.getElementById('dom-width')?.value) || 0;
    const height = parseFloat(document.getElementById('dom-height')?.value) || 0;
    const actualWt = parseFloat(document.getElementById('dom-weight')?.value) || 0;
    const qty = parseInt(document.getElementById('dom-packages-count')?.value, 10) || 1;

    const singleVol = LogiPricingEngine.calculateVolumetricWeight(length, width, height, 5000);
    const totalVol = singleVol * qty;
    const totalActual = actualWt * qty;
    const chargeable = LogiPricingEngine.calculateChargeableWeight(totalActual, totalVol);

    const actualBadge = document.getElementById('dom-live-actual');
    const volBadge = document.getElementById('dom-live-volumetric');
    const charBadge = document.getElementById('dom-live-chargeable');
    const explEl = document.getElementById('dom-live-explanation');

    if (actualBadge) actualBadge.textContent = `${totalActual.toFixed(2)} kg`;
    if (volBadge) volBadge.textContent = `${totalVol.toFixed(2)} kg`;
    if (charBadge) charBadge.textContent = `${chargeable.toFixed(2)} kg`;

    if (explEl) {
      if (chargeable <= 0) {
        explEl.innerHTML = '<i class="bi bi-info-circle me-1 text-primary"></i> Enter package weight and dimensions or pick a quick preset above.';
      } else if (totalVol > totalActual) {
        explEl.innerHTML = `<i class="bi bi-box-seam me-1 text-primary"></i> <strong>Billed by box size (${chargeable.toFixed(2)} kg):</strong> Box space is larger than scale weight (${totalActual.toFixed(2)} kg). Couriers bill for whichever is greater.`;
      } else {
        explEl.innerHTML = `<i class="bi bi-check-circle me-1 text-success"></i> <strong>Billed by scale weight (${chargeable.toFixed(2)} kg):</strong> Package is dense, so you are billed for actual scale weight.`;
      }
    }
  }

  /**
   * Validates and executes domestic rate calculation
   */
  function handleDomesticCalculate() {
    const form = document.getElementById('form-domestic');
    LogiValidator.clearValidation(form);

    const pickupPin = document.getElementById('dom-pickup-pin');
    const deliveryPin = document.getElementById('dom-delivery-pin');
    const weight = document.getElementById('dom-weight');
    const length = document.getElementById('dom-length');
    const width = document.getElementById('dom-width');
    const height = document.getElementById('dom-height');
    const packagesCount = document.getElementById('dom-packages-count');
    const declaredValue = document.getElementById('dom-declared-value');
    const paymentMode = document.querySelector('input[name="dom-payment-mode"]:checked')?.value || 'prepaid';
    const codAmount = document.getElementById('dom-cod-amount');
    const transportMode = document.getElementById('dom-transport-mode')?.value || 'any';
    const shipmentType = document.getElementById('dom-shipment-type')?.value || 'forward';
    const insuranceCheck = document.getElementById('dom-insurance-check')?.checked || false;

    let hasErrors = false;

    // Validate PINs
    const pickupVal = LogiValidator.validateDomesticPin(pickupPin?.value);
    if (!pickupVal.valid) {
      LogiValidator.setFieldFeedback(pickupPin, false, pickupVal.message);
      hasErrors = true;
    } else {
      LogiValidator.setFieldFeedback(pickupPin, true);
    }

    const deliveryVal = LogiValidator.validateDomesticPin(deliveryPin?.value);
    if (!deliveryVal.valid) {
      LogiValidator.setFieldFeedback(deliveryPin, false, deliveryVal.message);
      hasErrors = true;
    } else {
      LogiValidator.setFieldFeedback(deliveryPin, true);
    }

    // Validate Weight
    const weightVal = LogiValidator.validateWeight(weight?.value);
    if (!weightVal.valid) {
      LogiValidator.setFieldFeedback(weight, false, weightVal.message);
      hasErrors = true;
    } else {
      LogiValidator.setFieldFeedback(weight, true);
    }

    // Validate Dimensions
    const dimVal = LogiValidator.validateDimensions(length?.value, width?.value, height?.value);
    if (!dimVal.valid) {
      const errField = dimVal.field === 'length' ? length : dimVal.field === 'width' ? width : height;
      LogiValidator.setFieldFeedback(errField, false, dimVal.message);
      hasErrors = true;
    } else {
      LogiValidator.setFieldFeedback(length, true);
      LogiValidator.setFieldFeedback(width, true);
      LogiValidator.setFieldFeedback(height, true);
    }

    // Validate COD
    if (paymentMode === 'cod') {
      const codVal = LogiValidator.validateCodAmount(true, codAmount?.value, declaredValue?.value);
      if (!codVal.valid) {
        LogiValidator.setFieldFeedback(codAmount, false, codVal.message);
        hasErrors = true;
      } else {
        LogiValidator.setFieldFeedback(codAmount, true);
      }
    }

    if (hasErrors) return;

    // Show button loading state
    const submitBtn = document.getElementById('btn-calculate-domestic');
    setLoadingState(submitBtn, true);

    setTimeout(() => {
      try {
        const qty = parseInt(packagesCount?.value, 10) || 1;
        const pPinInfo = LOGIXPRESS_CONFIG.pincodeDirectory[pickupPin.value.trim()];
        const dPinInfo = LOGIXPRESS_CONFIG.pincodeDirectory[deliveryPin.value.trim()];

        const originText = pPinInfo ? `${pickupPin.value.trim()} (${pPinInfo.city})` : pickupPin.value.trim();
        const destText = dPinInfo ? `${deliveryPin.value.trim()} (${dPinInfo.city})` : deliveryPin.value.trim();

        const rates = LogiPricingEngine.calculateDomesticRates({
          pickupPin: pickupPin.value.trim(),
          deliveryPin: deliveryPin.value.trim(),
          actualWeightKg: parseFloat(weight.value),
          lengthCm: parseFloat(length.value),
          widthCm: parseFloat(width.value),
          heightCm: parseFloat(height.value),
          numberOfPackages: qty,
          declaredValue: parseFloat(declaredValue.value) || 0,
          paymentMode: paymentMode,
          codAmount: parseFloat(codAmount?.value) || 0,
          transportMode: transportMode,
          shipmentType: shipmentType,
          hasInsurance: insuranceCheck
        });

        const singleVol = LogiPricingEngine.calculateVolumetricWeight(length.value, width.value, height.value, 5000);
        const context = {
          serviceType: 'Domestic',
          origin: originText,
          destination: destText,
          actualWeight: parseFloat(weight.value) * qty,
          volumetricWeight: singleVol * qty,
          chargeableWeight: LogiPricingEngine.calculateChargeableWeight(parseFloat(weight.value) * qty, singleVol * qty),
          paymentMode: paymentMode.toUpperCase(),
          currency: 'INR'
        };

        LogiResults.render(rates, context);
      } catch (err) {
        console.error('Domestic calculation error', err);
        alert('An unexpected error occurred during rate calculation. Please check your inputs.');
      } finally {
        setLoadingState(submitBtn, false);
      }
    }, 300);
  }

  /* =========================================================================
   * INTERNATIONAL SHIPPING CALCULATOR WORKFLOW
   * ========================================================================= */
  function initInternationalForm() {
    const form = document.getElementById('form-international');
    if (!form) return;

    const countrySelect = document.getElementById('intl-dest-country');
    const postalCodeInput = document.getElementById('intl-dest-postal');
    const postalHelp = document.getElementById('intl-postal-help');
    const currencySelect = document.getElementById('intl-currency');
    const weightInput = document.getElementById('intl-weight');
    const lengthInput = document.getElementById('intl-length');
    const widthInput = document.getElementById('intl-width');
    const heightInput = document.getElementById('intl-height');
    const dimUnitSelect = document.getElementById('intl-dim-unit');
    const weightUnitSelect = document.getElementById('intl-weight-unit');
    const resetBtn = document.getElementById('btn-reset-intl');

    // Populate country dropdown from Master Data
    if (countrySelect && countrySelect.options.length <= 1) {
      LOGIXPRESS_CONFIG.countries.forEach(c => {
        if (c.code === 'IN') return; // Exclude origin from destination list
        const opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = `${c.name} (${c.code}) - ${c.region}`;
        countrySelect.appendChild(opt);
      });
    }

    // Dynamic postal code requirements upon country selection
    countrySelect?.addEventListener('change', () => {
      const code = countrySelect.value;
      const spec = LOGIXPRESS_CONFIG.countries.find(c => c.code === code);
      if (spec) {
        if (postalCodeInput) {
          postalCodeInput.placeholder = spec.postalCodePlaceholder || 'Enter postal code';
          if (!spec.postalCodeRequired) {
            postalCodeInput.removeAttribute('required');
            if (postalHelp) postalHelp.textContent = 'Postal code is optional for this country.';
          } else {
            postalCodeInput.setAttribute('required', 'required');
            if (postalHelp) postalHelp.textContent = `Format requirement: ${spec.postalCodePlaceholder}`;
          }
        }
        // Auto-select typical currency if user hasn't explicitly set one
        if (currencySelect && spec.currency && LOGIXPRESS_CONFIG.exchangeRates[spec.currency]) {
          currencySelect.value = spec.currency;
        }
      }
      updateIntlLivePreview();
    });

    [weightInput, lengthInput, widthInput, heightInput, dimUnitSelect, weightUnitSelect].forEach(el => {
      el?.addEventListener('input', updateIntlLivePreview);
      el?.addEventListener('change', updateIntlLivePreview);
    });

    // International package presets
    document.querySelectorAll('.intl-preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.intl-preset-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const preset = chip.getAttribute('data-preset');
        const shipTypeSelect = document.getElementById('intl-shipment-type');
        if (preset === 'document') {
          if (weightInput) weightInput.value = '0.3';
          if (lengthInput) lengthInput.value = '30';
          if (widthInput) widthInput.value = '22';
          if (heightInput) heightInput.value = '2';
          if (shipTypeSelect) shipTypeSelect.value = 'document';
        } else if (preset === 'small') {
          if (weightInput) weightInput.value = '1.5';
          if (lengthInput) lengthInput.value = '25';
          if (widthInput) widthInput.value = '20';
          if (heightInput) heightInput.value = '12';
          if (shipTypeSelect) shipTypeSelect.value = 'parcel';
        } else if (preset === 'parcel') {
          if (weightInput) weightInput.value = '4.5';
          if (lengthInput) lengthInput.value = '40';
          if (widthInput) widthInput.value = '30';
          if (heightInput) heightInput.value = '20';
          if (shipTypeSelect) shipTypeSelect.value = 'parcel';
        } else if (preset === 'custom') {
          lengthInput?.focus();
        }

        updateIntlLivePreview();
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleInternationalCalculate();
    });

    resetBtn?.addEventListener('click', () => {
      form.reset();
      LogiValidator.clearValidation(form);
      document.querySelectorAll('.intl-preset-chip').forEach(c => c.classList.remove('active'));
      document.querySelector('.intl-preset-chip[data-preset="custom"]')?.classList.add('active');
      updateIntlLivePreview();
      hideResults();
    });
  }

  function updateIntlLivePreview() {
    const dimUnit = document.getElementById('intl-dim-unit')?.value || 'cm';
    const weightUnit = document.getElementById('intl-weight-unit')?.value || 'kg';

    let length = parseFloat(document.getElementById('intl-length')?.value) || 0;
    let width = parseFloat(document.getElementById('intl-width')?.value) || 0;
    let height = parseFloat(document.getElementById('intl-height')?.value) || 0;
    let weight = parseFloat(document.getElementById('intl-weight')?.value) || 0;

    // Convert inches to cm
    if (dimUnit === 'in') {
      length = length * 2.54;
      width = width * 2.54;
      height = height * 2.54;
    }

    // Convert lbs to kg
    if (weightUnit === 'lbs') {
      weight = weight * 0.453592;
    }

    const volWeight = LogiPricingEngine.calculateVolumetricWeight(length, width, height, 5000);
    const chargeable = LogiPricingEngine.calculateChargeableWeight(weight, volWeight);

    const volBadge = document.getElementById('intl-live-volumetric');
    const charBadge = document.getElementById('intl-live-chargeable');

    if (volBadge) volBadge.textContent = `${volWeight.toFixed(2)} kg`;
    if (charBadge) charBadge.textContent = `${chargeable.toFixed(2)} kg`;
  }

  function handleInternationalCalculate() {
    const form = document.getElementById('form-international');
    LogiValidator.clearValidation(form);

    const originCountry = document.getElementById('intl-origin-country')?.value || 'IN';
    const originPostal = document.getElementById('intl-origin-postal');
    const destCountry = document.getElementById('intl-dest-country');
    const destPostal = document.getElementById('intl-dest-postal');
    const weight = document.getElementById('intl-weight');
    const length = document.getElementById('intl-length');
    const width = document.getElementById('intl-width');
    const height = document.getElementById('intl-height');
    const dimUnit = document.getElementById('intl-dim-unit')?.value || 'cm';
    const weightUnit = document.getElementById('intl-weight-unit')?.value || 'kg';
    const currency = document.getElementById('intl-currency')?.value || 'USD';
    const declaredValue = document.getElementById('intl-declared-value');
    const commodityType = document.getElementById('intl-shipment-type')?.value || 'parcel';

    let hasErrors = false;

    // Validate origin PIN
    const originVal = LogiValidator.validateDomesticPin(originPostal?.value);
    if (!originVal.valid) {
      LogiValidator.setFieldFeedback(originPostal, false, originVal.message);
      hasErrors = true;
    } else {
      LogiValidator.setFieldFeedback(originPostal, true);
    }

    // Validate Destination Country
    if (!destCountry.value) {
      LogiValidator.setFieldFeedback(destCountry, false, 'Select destination country.');
      hasErrors = true;
    } else {
      LogiValidator.setFieldFeedback(destCountry, true);
    }

    // Validate Destination Postal Code
    const countrySpec = LOGIXPRESS_CONFIG.countries.find(c => c.code === destCountry.value);
    const postalVal = LogiValidator.validateInternationalPostalCode(destPostal?.value, countrySpec);
    if (!postalVal.valid) {
      LogiValidator.setFieldFeedback(destPostal, false, postalVal.message);
      hasErrors = true;
    } else {
      LogiValidator.setFieldFeedback(destPostal, true);
    }

    // Validate Weight
    let actualKg = parseFloat(weight?.value) || 0;
    if (weightUnit === 'lbs') actualKg *= 0.453592;
    const weightVal = LogiValidator.validateWeight(actualKg);
    if (!weightVal.valid) {
      LogiValidator.setFieldFeedback(weight, false, weightVal.message);
      hasErrors = true;
    } else {
      LogiValidator.setFieldFeedback(weight, true);
    }

    // Validate Dimensions
    let lCm = parseFloat(length?.value) || 0;
    let wCm = parseFloat(width?.value) || 0;
    let hCm = parseFloat(height?.value) || 0;
    if (dimUnit === 'in') {
      lCm *= 2.54;
      wCm *= 2.54;
      hCm *= 2.54;
    }
    const dimVal = LogiValidator.validateDimensions(lCm, wCm, hCm);
    if (!dimVal.valid) {
      const errEl = dimVal.field === 'length' ? length : dimVal.field === 'width' ? width : height;
      LogiValidator.setFieldFeedback(errEl, false, dimVal.message);
      hasErrors = true;
    } else {
      LogiValidator.setFieldFeedback(length, true);
      LogiValidator.setFieldFeedback(width, true);
      LogiValidator.setFieldFeedback(height, true);
    }

    if (hasErrors) return;

    const submitBtn = document.getElementById('btn-calculate-intl');
    setLoadingState(submitBtn, true);

    setTimeout(() => {
      try {
        const rates = LogiPricingEngine.calculateInternationalRates({
          originCountry: originCountry,
          destinationCountry: destCountry.value,
          actualWeightKg: actualKg,
          lengthCm: lCm,
          widthCm: wCm,
          heightCm: hCm,
          declaredValue: parseFloat(declaredValue?.value) || 0,
          currency: currency,
          commodityType: commodityType
        });

        const volKg = LogiPricingEngine.calculateVolumetricWeight(lCm, wCm, hCm, 5000);
        const context = {
          serviceType: 'International',
          origin: `India (${originPostal.value.trim()})`,
          destination: `${countrySpec.name} (${destPostal.value.trim() || 'General'})`,
          actualWeight: actualKg,
          volumetricWeight: volKg,
          chargeableWeight: LogiPricingEngine.calculateChargeableWeight(actualKg, volKg),
          paymentMode: 'PREPAID',
          currency: currency
        };

        LogiResults.render(rates, context);
      } catch (err) {
        console.error('International calculation error', err);
        alert(err.message || 'Failed to calculate international rates.');
      } finally {
        setLoadingState(submitBtn, false);
      }
    }, 350);
  }

  /* =========================================================================
   * CARGO & BULK LOGISTICS WORKFLOW
   * ========================================================================= */
  function initCargoForm() {
    const form = document.getElementById('form-cargo');
    if (!form) return;

    renderCargoPackageRows();

    document.getElementById('btn-add-cargo-row')?.addEventListener('click', () => {
      cargoPackages.push({ type: 'Standard Pallet', quantity: 1, length: 120, width: 80, height: 100, weight: 150 });
      renderCargoPackageRows();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleCargoCalculate();
    });

    document.getElementById('btn-reset-cargo')?.addEventListener('click', () => {
      form.reset();
      cargoPackages = [{ type: 'Master Carton', quantity: 4, length: 60, width: 40, height: 40, weight: 18 }];
      renderCargoPackageRows();
      LogiValidator.clearValidation(form);
      hideResults();
    });
  }

  function renderCargoPackageRows() {
    const container = document.getElementById('cargo-packages-tbody');
    if (!container) return;

    let html = '';
    cargoPackages.forEach((pkg, index) => {
      html += `
        <tr>
          <td>
            <select class="form-select form-select-sm cargo-pkg-type" data-index="${index}">
              <option value="Master Carton" ${pkg.type === 'Master Carton' ? 'selected' : ''}>Master Carton</option>
              <option value="Standard Pallet" ${pkg.type === 'Standard Pallet' ? 'selected' : ''}>Standard Pallet (120x80)</option>
              <option value="Euro Pallet" ${pkg.type === 'Euro Pallet' ? 'selected' : ''}>Euro Pallet (120x100)</option>
              <option value="Heavy Wooden Crate" ${pkg.type === 'Heavy Wooden Crate' ? 'selected' : ''}>Heavy Wooden Crate</option>
              <option value="Drum / Barrel" ${pkg.type === 'Drum / Barrel' ? 'selected' : ''}>Drum / Barrel</option>
              <option value="Custom Box" ${pkg.type === 'Custom Box' ? 'selected' : ''}>Custom Box</option>
            </select>
          </td>
          <td>
            <input type="number" min="1" max="500" class="form-control form-control-sm text-center cargo-pkg-qty" data-index="${index}" value="${pkg.quantity}" required>
          </td>
          <td>
            <div class="input-group input-group-sm">
              <input type="number" min="1" step="0.5" class="form-control cargo-pkg-l" data-index="${index}" value="${pkg.length}" placeholder="L" required>
              <input type="number" min="1" step="0.5" class="form-control cargo-pkg-w" data-index="${index}" value="${pkg.width}" placeholder="W" required>
              <input type="number" min="1" step="0.5" class="form-control cargo-pkg-h" data-index="${index}" value="${pkg.height}" placeholder="H" required>
            </div>
          </td>
          <td>
            <div class="input-group input-group-sm">
              <input type="number" min="0.5" step="0.5" class="form-control text-end cargo-pkg-wt" data-index="${index}" value="${pkg.weight}" required>
              <span class="input-group-text">kg</span>
            </div>
          </td>
          <td class="text-center">
            ${cargoPackages.length > 1 ? `
              <button type="button" class="btn btn-sm btn-outline-danger btn-remove-cargo-row" data-index="${index}" title="Remove package">
                <i class="bi bi-trash"></i>
              </button>
            ` : '<span class="text-muted small">&mdash;</span>'}
          </td>
        </tr>
      `;
    });

    container.innerHTML = html;

    // Attach row change listeners
    container.querySelectorAll('.cargo-pkg-type').forEach(el => {
      el.addEventListener('change', (e) => {
        const idx = e.target.getAttribute('data-index');
        cargoPackages[idx].type = e.target.value;
      });
    });

    container.querySelectorAll('.cargo-pkg-qty').forEach(el => {
      el.addEventListener('input', (e) => {
        const idx = e.target.getAttribute('data-index');
        cargoPackages[idx].quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
        updateCargoSummaryPreview();
      });
    });

    ['l', 'w', 'h', 'wt'].forEach(field => {
      container.querySelectorAll(`.cargo-pkg-${field}`).forEach(el => {
        el.addEventListener('input', (e) => {
          const idx = e.target.getAttribute('data-index');
          const prop = field === 'l' ? 'length' : field === 'w' ? 'width' : field === 'h' ? 'height' : 'weight';
          cargoPackages[idx][prop] = Math.max(0, parseFloat(e.target.value) || 0);
          updateCargoSummaryPreview();
        });
      });
    });

    container.querySelectorAll('.btn-remove-cargo-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        cargoPackages.splice(idx, 1);
        renderCargoPackageRows();
        updateCargoSummaryPreview();
      });
    });

    updateCargoSummaryPreview();
  }

  function updateCargoSummaryPreview() {
    const summary = LogiPricingEngine.calculateMultiPackageTotals(cargoPackages, 4000);

    const piecesEl = document.getElementById('cargo-preview-pieces');
    const actualEl = document.getElementById('cargo-preview-actual');
    const cbmEl = document.getElementById('cargo-preview-cbm');
    const chargeableEl = document.getElementById('cargo-preview-chargeable');

    if (piecesEl) piecesEl.textContent = summary.totalPieces;
    if (actualEl) actualEl.textContent = `${summary.totalActual.toFixed(2)} kg`;
    if (cbmEl) cbmEl.textContent = `${summary.totalCbm.toFixed(3)} m³`;
    if (chargeableEl) chargeableEl.textContent = `${summary.chargeableWeight.toFixed(2)} kg`;
  }

  function handleCargoCalculate() {
    const form = document.getElementById('form-cargo');
    LogiValidator.clearValidation(form);

    const pickupPin = document.getElementById('cargo-pickup-pin');
    const deliveryPin = document.getElementById('cargo-delivery-pin');
    const declaredValue = document.getElementById('cargo-declared-value');

    let hasErrors = false;

    const pVal = LogiValidator.validateDomesticPin(pickupPin?.value);
    if (!pVal.valid) {
      LogiValidator.setFieldFeedback(pickupPin, false, pVal.message);
      hasErrors = true;
    } else {
      LogiValidator.setFieldFeedback(pickupPin, true);
    }

    const dVal = LogiValidator.validateDomesticPin(deliveryPin?.value);
    if (!dVal.valid) {
      LogiValidator.setFieldFeedback(deliveryPin, false, dVal.message);
      hasErrors = true;
    } else {
      LogiValidator.setFieldFeedback(deliveryPin, true);
    }

    // Validate package items
    for (const pkg of cargoPackages) {
      if (pkg.length <= 0 || pkg.width <= 0 || pkg.height <= 0 || pkg.weight <= 0) {
        alert('All cargo packages must have positive dimensions and weight greater than 0.');
        hasErrors = true;
        break;
      }
    }

    if (hasErrors) return;

    const submitBtn = document.getElementById('btn-calculate-cargo');
    setLoadingState(submitBtn, true);

    setTimeout(() => {
      try {
        const handling = {
          tailLift: document.getElementById('cargo-tail-lift')?.checked || false,
          insideDelivery: document.getElementById('cargo-inside-delivery')?.checked || false,
          forklift: document.getElementById('cargo-forklift')?.checked || false,
          dockAppointment: document.getElementById('cargo-dock-appointment')?.checked || false
        };

        const resultData = LogiPricingEngine.calculateCargoRates({
          packagesList: cargoPackages,
          pickupPin: pickupPin.value.trim(),
          deliveryPin: deliveryPin.value.trim(),
          declaredValue: parseFloat(declaredValue?.value) || 0,
          handlingOptions: handling
        });

        const context = {
          serviceType: 'Cargo & Bulk Freight',
          origin: pickupPin.value.trim(),
          destination: deliveryPin.value.trim(),
          actualWeight: resultData.summary.totalActual,
          volumetricWeight: resultData.summary.totalVolumetric,
          chargeableWeight: resultData.summary.chargeableWeight,
          paymentMode: 'PREPAID',
          currency: 'INR'
        };

        LogiResults.render(resultData.results, context);
      } catch (err) {
        console.error('Cargo calculation error', err);
        alert('Failed to calculate cargo rates.');
      } finally {
        setLoadingState(submitBtn, false);
      }
    }, 350);
  }

  /* =========================================================================
   * QUICK / LOCAL DELIVERY WORKFLOW
   * ========================================================================= */
  function initQuickDeliveryForm() {
    const form = document.getElementById('form-quick');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleQuickCalculate();
    });

    document.getElementById('btn-reset-quick')?.addEventListener('click', () => {
      form.reset();
      LogiValidator.clearValidation(form);
      hideResults();
    });
  }

  function handleQuickCalculate() {
    const form = document.getElementById('form-quick');
    LogiValidator.clearValidation(form);

    const pickup = document.getElementById('quick-pickup-addr');
    const delivery = document.getElementById('quick-delivery-addr');
    const weight = document.getElementById('quick-weight');
    const urgency = document.querySelector('input[name="quick-urgency"]:checked')?.value || 'instant';

    let hasErrors = false;

    if (!pickup?.value.trim()) {
      LogiValidator.setFieldFeedback(pickup, false, 'Enter local pickup area or address.');
      hasErrors = true;
    } else {
      LogiValidator.setFieldFeedback(pickup, true);
    }

    if (!delivery?.value.trim()) {
      LogiValidator.setFieldFeedback(delivery, false, 'Enter local delivery area or address.');
      hasErrors = true;
    } else {
      LogiValidator.setFieldFeedback(delivery, true);
    }

    const wVal = LogiValidator.validateWeight(weight?.value);
    if (!wVal.valid) {
      LogiValidator.setFieldFeedback(weight, false, wVal.message);
      hasErrors = true;
    } else {
      LogiValidator.setFieldFeedback(weight, true);
    }

    if (hasErrors) return;

    const submitBtn = document.getElementById('btn-calculate-quick');
    setLoadingState(submitBtn, true);

    setTimeout(() => {
      try {
        const rates = LogiPricingEngine.calculateQuickDeliveryRates({
          pickupLocation: pickup.value.trim(),
          deliveryLocation: delivery.value.trim(),
          packageWeightKg: parseFloat(weight.value),
          urgency: urgency
        });

        const context = {
          serviceType: 'Quick / Local Delivery',
          origin: pickup.value.trim(),
          destination: delivery.value.trim(),
          actualWeight: parseFloat(weight.value),
          volumetricWeight: parseFloat(weight.value),
          chargeableWeight: parseFloat(weight.value),
          paymentMode: 'PREPAID',
          currency: 'INR'
        };

        LogiResults.render(rates, context);
      } catch (err) {
        console.error('Quick delivery calculation error', err);
        alert('Failed to calculate quick delivery rates.');
      } finally {
        setLoadingState(submitBtn, false);
      }
    }, 300);
  }

  /* =========================================================================
   * SAVED QUOTES OFF-CANVAS DRAWER
   * ========================================================================= */
  function initSavedQuotesDrawer() {
    const drawerEl = document.getElementById('savedQuotesOffcanvas');
    if (!drawerEl) return;

    drawerEl.addEventListener('show.bs.offcanvas', () => {
      renderSavedQuotesList();
    });

    document.getElementById('btn-clear-saved-quotes')?.addEventListener('click', () => {
      const cleared = LogiStorage.clearAllQuotes(true);
      if (cleared) {
        renderSavedQuotesList();
        LogiExport.showToast('All saved quotes cleared.');
      }
    });

    LogiStorage.triggerQuoteCountUpdate();
  }

  function renderSavedQuotesList() {
    const listContainer = document.getElementById('saved-quotes-list');
    if (!listContainer) return;

    const quotes = LogiStorage.getSavedQuotes();
    if (!quotes || quotes.length === 0) {
      listContainer.innerHTML = `
        <div class="text-center py-5 text-muted">
          <i class="bi bi-bookmark text-secondary fs-1 mb-3 d-block"></i>
          <h6 class="fw-semibold">No Saved Quotes</h6>
          <p class="small text-secondary">Calculate shipping rates and click the bookmark button to save estimates for comparison.</p>
        </div>
      `;
      return;
    }

    let html = '';
    quotes.forEach(q => {
      html += `
        <div class="card border mb-3 shadow-sm saved-quote-item">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-start mb-1">
              <div>
                <span class="badge text-bg-light border text-muted extra-small">${q.id}</span>
                <h6 class="fw-bold mb-0 text-dark mt-1">${q.carrierService}</h6>
              </div>
              <div class="text-end">
                <span class="fw-bold fs-6 font-monospace text-primary">
                  ${LogiPricingEngine.formatCurrency(q.estimatedTotal, q.currency)}
                </span>
              </div>
            </div>
            <div class="text-secondary small mb-2 font-monospace">
              <i class="bi bi-arrow-right-short text-primary"></i> ${q.route}
            </div>
            <div class="d-flex justify-content-between align-items-center extra-small text-muted border-top pt-2">
              <span><i class="bi bi-box-seam me-1"></i>${(q.chargeableWeight || 0).toFixed(2)} kg</span>
              <span><i class="bi bi-clock me-1"></i>${q.transitTime}</span>
              <button class="btn btn-link btn-sm text-danger p-0 text-decoration-none btn-delete-saved" data-id="${q.id}">
                <i class="bi bi-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;

    listContainer.querySelectorAll('.btn-delete-saved').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        LogiStorage.deleteQuote(id);
        renderSavedQuotesList();
      });
    });
  }

  function setLoadingState(buttonEl, isLoading) {
    if (!buttonEl) return;
    if (isLoading) {
      buttonEl.disabled = true;
      buttonEl.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Evaluating Rate Cards...
      `;
    } else {
      buttonEl.disabled = false;
      buttonEl.innerHTML = `
        <i class="bi bi-calculator me-1"></i> Calculate Rates
      `;
    }
  }

  function hideResults() {
    const resultsContainer = document.getElementById('shipping-results-container');
    if (resultsContainer) {
      resultsContainer.classList.add('d-none');
    }
  }

  return {
    init,
    updateDomesticLivePreview,
    updateIntlLivePreview,
    updateCargoSummaryPreview
  };
})();

// Export for tests/module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LogiCalculator;
}
