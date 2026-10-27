/**
 * LOGIXPRESS ENTERPRISE SHIPPING RATE CALCULATOR
 * Validation and Data Sanitization Module
 * 
 * Provides field-level validation, format verification, and numerical sanitization
 * for domestic and international logistics workflows.
 */

const LogiValidator = (function() {
  'use strict';

  /**
   * Sanitizes a string or numeric value into a non-negative float.
   * Returns null if invalid or NaN.
   */
  function sanitizePositiveFloat(val, fallback = null) {
    if (val === null || val === undefined) return fallback;
    const num = parseFloat(String(val).trim());
    if (isNaN(num) || !isFinite(num) || num < 0) return fallback;
    return num;
  }

  /**
   * Sanitizes a string or numeric value into a positive integer (>= 1).
   */
  function sanitizePositiveInteger(val, fallback = 1) {
    if (val === null || val === undefined) return fallback;
    const num = parseInt(String(val).trim(), 10);
    if (isNaN(num) || !isFinite(num) || num < 1) return fallback;
    return num;
  }

  /**
   * Validates a 6-digit Indian PIN code.
   * Indian postal codes must be exactly 6 digits, starting with 1-9.
   */
  function validateDomesticPin(pin) {
    if (!pin) return { valid: false, message: 'Pickup and Delivery PIN codes are required.' };
    const clean = String(pin).trim();
    if (!/^[1-9][0-9]{5}$/.test(clean)) {
      return { 
        valid: false, 
        message: 'Enter a valid 6-digit Indian PIN code (e.g. 400001 or 110001).' 
      };
    }
    return { valid: true, value: clean };
  }

  /**
   * Validates an international postal code against a country specification.
   */
  function validateInternationalPostalCode(postalCode, countrySpec) {
    const clean = postalCode ? String(postalCode).trim() : '';

    if (!countrySpec) {
      // Generic check if country not recognized
      return { valid: true, value: clean };
    }

    if (!countrySpec.postalCodeRequired) {
      // Countries like UAE, Qatar where postal codes are optional or P.O. Box
      return { valid: true, value: clean };
    }

    if (!clean) {
      return { 
        valid: false, 
        message: `Postal code is required for ${countrySpec.name}.` 
      };
    }

    if (countrySpec.postalCodePattern) {
      const regex = new RegExp(countrySpec.postalCodePattern, 'i');
      if (!regex.test(clean)) {
        return { 
          valid: false, 
          message: `Invalid postal code format for ${countrySpec.name} (${countrySpec.postalCodePlaceholder}).` 
        };
      }
    }

    return { valid: true, value: clean };
  }

  /**
   * Validates dimensions (Length, Width, Height) in cm or inches.
   */
  function validateDimensions(length, width, height) {
    const l = sanitizePositiveFloat(length);
    const w = sanitizePositiveFloat(width);
    const h = sanitizePositiveFloat(height);

    if (l === null || l <= 0) {
      return { valid: false, field: 'length', message: 'Length must be a positive number greater than 0.' };
    }
    if (w === null || w <= 0) {
      return { valid: false, field: 'width', message: 'Width must be a positive number greater than 0.' };
    }
    if (h === null || h <= 0) {
      return { valid: false, field: 'height', message: 'Height must be a positive number greater than 0.' };
    }

    return { valid: true, length: l, width: w, height: h };
  }

  /**
   * Validates package weight.
   */
  function validateWeight(weight, unit = 'kg') {
    const w = sanitizePositiveFloat(weight);
    if (w === null || w <= 0) {
      return { valid: false, message: 'Weight must be greater than 0.' };
    }
    if (unit === 'kg' && w > 10000) {
      return { valid: false, message: 'Weight exceeds maximum single-shipment limit of 10,000 kg. Use Bulk Cargo mode.' };
    }
    return { valid: true, weight: w };
  }

  /**
   * Validates COD collection amount.
   */
  function validateCodAmount(isCod, codAmount, declaredValue) {
    if (!isCod) return { valid: true, amount: 0 };
    
    const amt = sanitizePositiveFloat(codAmount);
    if (amt === null || amt <= 0) {
      return { valid: false, message: 'Enter a valid COD collection amount greater than ₹0.' };
    }

    const cfg = (typeof LOGIXPRESS_CONFIG !== 'undefined') ? LOGIXPRESS_CONFIG : (typeof require !== 'undefined' ? require('./config.js') : {});
    const maxCod = (cfg.surcharges && cfg.surcharges.cod && cfg.surcharges.cod.maxCodValue) || 50000;
    if (amt > maxCod) {
      return { valid: false, message: `COD collection cannot exceed ₹${maxCod.toLocaleString('en-IN')} per shipment.` };
    }

    return { valid: true, amount: amt };
  }

  /**
   * Attaches visual validation feedback to a form input element.
   */
  function setFieldFeedback(inputEl, isValid, message = '') {
    if (!inputEl) return;
    
    // Remove existing states
    inputEl.classList.remove('is-invalid', 'is-valid');
    
    // Locate or create invalid feedback sibling
    let parent = inputEl.closest('.form-group') || inputEl.parentElement;
    let feedbackEl = parent.querySelector('.invalid-feedback');
    
    if (!feedbackEl) {
      feedbackEl = document.createElement('div');
      feedbackEl.className = 'invalid-feedback text-start';
      parent.appendChild(feedbackEl);
    }

    if (!isValid) {
      inputEl.classList.add('is-invalid');
      feedbackEl.textContent = message;
      feedbackEl.style.display = 'block';
    } else {
      inputEl.classList.add('is-valid');
      feedbackEl.textContent = '';
      feedbackEl.style.display = 'none';
    }
  }

  /**
   * Clears all validation states within a container.
   */
  function clearValidation(container) {
    if (!container) return;
    container.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
      el.classList.remove('is-invalid', 'is-valid');
    });
    container.querySelectorAll('.invalid-feedback').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
  }

  return {
    sanitizePositiveFloat,
    sanitizePositiveInteger,
    validateDomesticPin,
    validateInternationalPostalCode,
    validateDimensions,
    validateWeight,
    validateCodAmount,
    setFieldFeedback,
    clearValidation
  };
})();

// Export for tests/module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LogiValidator;
}
