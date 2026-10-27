/**
 * LOGIXPRESS ENTERPRISE SHIPPING RATE CALCULATOR
 * Storage and History Manager
 * 
 * Manages saved quotations and calculation histories in browser LocalStorage.
 */

const LogiStorage = (function() {
  'use strict';

  const STORAGE_KEY = 'logixpress_saved_quotes_v1';

  /**
   * Retrieves all saved quotations.
   */
  function getSavedQuotes() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Failed to parse saved quotes from storage', e);
      return [];
    }
  }

  /**
   * Saves a quotation to local storage.
   */
  function saveQuote(quoteData) {
    if (!quoteData) return null;
    try {
      const quotes = getSavedQuotes();
      const quoteId = 'LQ-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 899 + 100);
      
      const newEntry = {
        id: quoteId,
        savedAt: new Date().toISOString(),
        serviceType: quoteData.serviceType || 'Domestic',
        route: quoteData.route || 'N/A',
        chargeableWeight: quoteData.chargeableWeight || 0,
        carrierService: quoteData.carrierService || 'Standard',
        transportMode: quoteData.transportMode || 'Surface',
        estimatedTotal: quoteData.estimatedTotal || 0,
        currency: quoteData.currency || 'INR',
        transitTime: quoteData.transitTime || 'N/A',
        details: quoteData
      };

      // Keep latest 25 quotes
      quotes.unshift(newEntry);
      if (quotes.length > 25) quotes.pop();

      localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
      triggerQuoteCountUpdate();
      return newEntry;
    } catch (e) {
      console.error('Failed to save quote', e);
      return null;
    }
  }

  /**
   * Deletes a specific quote by ID.
   */
  function deleteQuote(quoteId) {
    try {
      let quotes = getSavedQuotes();
      quotes = quotes.filter(q => q.id !== quoteId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
      triggerQuoteCountUpdate();
      return true;
    } catch (e) {
      console.error('Failed to delete quote', e);
      return false;
    }
  }

  /**
   * Clears all saved quotes after confirmation.
   */
  function clearAllQuotes(requireConfirm = true) {
    if (requireConfirm) {
      const confirmed = window.confirm('Are you sure you want to clear all saved shipping quotations? This action cannot be undone.');
      if (!confirmed) return false;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
      triggerQuoteCountUpdate();
      return true;
    } catch (e) {
      console.error('Failed to clear quotes', e);
      return false;
    }
  }

  /**
   * Triggers badge count update across any active navbar indicators.
   */
  function triggerQuoteCountUpdate() {
    const count = getSavedQuotes().length;
    const badges = document.querySelectorAll('.saved-quotes-badge');
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'inline-block' : 'none';
    });
  }

  return {
    getSavedQuotes,
    saveQuote,
    deleteQuote,
    clearAllQuotes,
    triggerQuoteCountUpdate
  };
})();

// Export for tests/module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LogiStorage;
}
