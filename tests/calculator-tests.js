/**
 * LOGIXPRESS ENTERPRISE SHIPPING RATE CALCULATOR
 * Automated Mathematical & Logic Test Suite
 * 
 * Verifies calculation accuracy, slab increments, COD rules,
 * tax formulations, multi-piece aggregation, and boundary conditions.
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['../assets/js/config.js', '../assets/js/pricing-engine.js', '../assets/js/validation.js'], factory);
  } else if (typeof module === 'object' && module.exports) {
    const config = require('../assets/js/config.js');
    const pricing = require('../assets/js/pricing-engine.js');
    const validation = require('../assets/js/validation.js');
    module.exports = factory(global.LOGIXPRESS_CONFIG || config, pricing, validation);
  } else {
    const cfg = typeof LOGIXPRESS_CONFIG !== 'undefined' ? LOGIXPRESS_CONFIG : root.LOGIXPRESS_CONFIG;
    const pe = typeof LogiPricingEngine !== 'undefined' ? LogiPricingEngine : root.LogiPricingEngine;
    const val = typeof LogiValidator !== 'undefined' ? LogiValidator : root.LogiValidator;
    root.LogiTestSuite = factory(cfg, pe, val);
  }
})(typeof self !== 'undefined' ? self : this, function(CONFIG, Engine, Validator) {
  'use strict';

  const testResults = [];

  function assert(condition, testName, details = '') {
    if (condition) {
      testResults.push({ name: testName, status: 'PASS', details: details });
      console.log(`%c[PASS] ${testName}`, 'color: #059669; font-weight: bold;');
    } else {
      testResults.push({ name: testName, status: 'FAIL', details: details });
      console.error(`[FAIL] ${testName}: ${details}`);
    }
  }

  function assertAlmostEqual(actual, expected, tolerance = 0.05, testName, details = '') {
    const diff = Math.abs(actual - expected);
    const pass = diff <= tolerance;
    assert(pass, testName, `Expected ~${expected}, got ${actual} (diff: ${diff.toFixed(4)}). ${details}`);
  }

  function runAllTests() {
    testResults.length = 0;
    console.log('%c--- STARTING LOGIXPRESS AUTOMATED TEST SUITE ---', 'color: #1e40af; font-size: 14px; font-weight: bold;');

    // Test 1: Volumetric weight calculation (cm / 5000)
    // 50 x 40 x 30 cm / 5000 = 60,000 / 5000 = 12.0 kg
    const vol1 = Engine.calculateVolumetricWeight(50, 40, 30, 5000);
    assertAlmostEqual(vol1, 12.0, 0.01, 'Volumetric Weight: 50x40x30 cm / 5000', 'Should equal 12.0 kg');

    // Test 2: Chargeable weight (Volumetric > Actual)
    // Actual: 5.0 kg, Volumetric: 12.0 kg -> Chargeable should be 12.0 kg
    const char1 = Engine.calculateChargeableWeight(5.0, 12.0);
    assert(char1 === 12.0, 'Chargeable Weight: Volumetric > Actual', `Expected 12.0, got ${char1}`);

    // Test 3: Chargeable weight (Actual > Volumetric)
    // Actual: 18.5 kg, Volumetric: 12.0 kg -> Chargeable should be 18.5 kg
    const char2 = Engine.calculateChargeableWeight(18.5, 12.0);
    assert(char2 === 18.5, 'Chargeable Weight: Actual > Volumetric', `Expected 18.5, got ${char2}`);

    // Test 4: Multi-package aggregation
    // Package 1: 2 units of 10kg, 40x30x20 cm (vol per piece = 4.8kg)
    // Package 2: 1 unit of 25kg, 80x50x40 cm (vol per piece = 32.0kg)
    // Total Actual = (2*10) + 25 = 45 kg
    // Total Volumetric = (2*4.8) + 32.0 = 41.6 kg
    // Chargeable should be 45.0 kg
    const multiPkgs = [
      { quantity: 2, weight: 10, length: 40, width: 30, height: 20 },
      { quantity: 1, weight: 25, length: 80, width: 50, height: 40 }
    ];
    const multiSummary = Engine.calculateMultiPackageTotals(multiPkgs, 5000);
    assert(multiSummary.totalPieces === 3, 'Multi-package Pieces Count', `Expected 3, got ${multiSummary.totalPieces}`);
    assertAlmostEqual(multiSummary.totalActual, 45.0, 0.01, 'Multi-package Total Actual Weight');
    assertAlmostEqual(multiSummary.totalVolumetric, 41.6, 0.01, 'Multi-package Total Volumetric Weight');
    assertAlmostEqual(multiSummary.chargeableWeight, 45.0, 0.01, 'Multi-package Chargeable Weight');

    // Test 5: Volume in CBM calculation
    // 100 x 100 x 100 cm = 1.0 m³
    const cbm1 = Engine.calculateVolumeCbm(100, 100, 100, 1);
    assertAlmostEqual(cbm1, 1.0, 0.001, 'CBM Volume for 100x100x100 cm', 'Should be exactly 1.0 m³');

    // Test 6: Domestic Zone Determination
    // Same circle/city: 400001 -> 400051 (Zone A)
    const zoneA = Engine.determineDomesticZone('400001', '400051');
    assert(zoneA === 'A', 'Zone Determination: Same City', `Expected A, got ${zoneA}`);

    // Metro to Metro: 400001 (Mumbai) -> 110001 (Delhi) (Zone C)
    const zoneC = Engine.determineDomesticZone('400001', '110001');
    assert(zoneC === 'C', 'Zone Determination: Metro to Metro', `Expected C, got ${zoneC}`);

    // Remote / Special Circle: 110001 (Delhi) -> 795001 (Imphal, NE) (Zone E)
    const zoneE = Engine.determineDomesticZone('110001', '795001');
    assert(zoneE === 'E', 'Zone Determination: Special / Remote (NE)', `Expected E, got ${zoneE}`);

    // Test 7: COD Fee Logic
    // Minimum fee ₹45 applies when 2% is lower (e.g. ₹1,000 * 2% = ₹20 < ₹45)
    const codLow = Engine.calculateCodFee(true, 1000);
    assert(codLow === 45, 'COD Fee Minimum Benchmark', `Expected ₹45, got ₹${codLow}`);

    // Percentage applies when higher (e.g. ₹5,000 * 2% = ₹100 > ₹45)
    const codHigh = Engine.calculateCodFee(true, 5000);
    assert(codHigh === 100, 'COD Fee Percentage Calculation', `Expected ₹100, got ₹${codHigh}`);

    // COD disabled returns 0
    const codNone = Engine.calculateCodFee(false, 5000);
    assert(codNone === 0, 'COD Disabled', `Expected 0, got ${codNone}`);

    // Test 8: Insurance Fee Logic
    // Free cover limit ₹5,000 -> declared value ₹4,000 should be ₹0
    const insFree = Engine.calculateInsuranceFee(true, 4000);
    assert(insFree === 0, 'Insurance Free Liability Limit (<= ₹5,000)', `Expected 0, got ${insFree}`);

    // Declared value ₹40,000 -> 0.25% = ₹100
    const insCharged = Engine.calculateInsuranceFee(true, 40000);
    assertAlmostEqual(insCharged, 100, 0.1, 'Insurance Fee for ₹40,000 Declared Value', '0.25% of ₹40,000 = ₹100');

    // Test 9: Domestic Prepaid Rate & GST Calculation
    // Route 400001 -> 110001 (Zone C), Actual 2.0 kg, dims 20x20x10 (vol = 0.8 kg) -> Chargeable = 2.0 kg
    // Tariff: AeroTrans Surface Economy (Base: 1.0 kg @ ₹85, additional 1kg @ ₹52 -> Net = ₹137)
    // Fuel: 10% of ₹137 = ₹13.70
    // Subtotal = ₹150.70
    // Tax: 18% of ₹150.70 = ₹27.13
    // Grand Total = ₹177.83
    const domRates = Engine.calculateDomesticRates({
      pickupPin: '400001',
      deliveryPin: '110001',
      actualWeightKg: 2.0,
      lengthCm: 20,
      widthCm: 20,
      heightCm: 10,
      numberOfPackages: 1,
      paymentMode: 'prepaid',
      transportMode: 'any',
      shipmentType: 'forward',
      hasInsurance: false
    });

    assert(domRates.length > 0, 'Domestic Rates Generated', 'Should find valid tariffs');
    const surfEco = domRates.find(r => r.tariffId === 'demo-surface-standard');
    assert(Boolean(surfEco), 'AeroTrans Surface Economy Tariff Available');
    if (surfEco) {
      assertAlmostEqual(surfEco.costBreakdown.baseFreight, 85, 0.01, 'Surface Eco Base Freight Zone C');
      assertAlmostEqual(surfEco.costBreakdown.additionalWeightCharge, 52, 0.01, 'Surface Eco Additional 1kg');
      assertAlmostEqual(surfEco.costBreakdown.fuelSurcharge, 13.70, 0.05, 'Surface Eco Fuel Surcharge (10%)');
      assertAlmostEqual(surfEco.costBreakdown.totalTax, 27.13, 0.1, 'Surface Eco GST 18%');
      assertAlmostEqual(surfEco.costBreakdown.grandTotal, 177.83, 0.2, 'Surface Eco Grand Total');
    }

    // Test 10: RTO and Reverse Multiplier
    // Reverse pickup should be 1.25x forward net freight
    const domReverse = Engine.calculateDomesticRates({
      pickupPin: '400001',
      deliveryPin: '110001',
      actualWeightKg: 2.0,
      lengthCm: 20,
      widthCm: 20,
      heightCm: 10,
      numberOfPackages: 1,
      paymentMode: 'prepaid',
      shipmentType: 'reverse'
    });
    const surfReverse = domReverse.find(r => r.tariffId === 'demo-surface-standard');
    if (surfReverse && surfEco) {
      const forwardBase = 85 + 52; // ₹137
      const reverseExpected = forwardBase * 1.25; // ₹171.25
      assertAlmostEqual(surfReverse.costBreakdown.subtotal - surfReverse.costBreakdown.fuelSurcharge, reverseExpected, 0.1, 'Reverse Logistics 1.25x Multiplier');
    }

    // Test 11: Validation - Domestic PIN rules
    assert(Validator.validateDomesticPin('400001').valid === true, 'Validation: Valid PIN 400001');
    assert(Validator.validateDomesticPin('012345').valid === false, 'Validation: Reject PIN starting with 0');
    assert(Validator.validateDomesticPin('40000').valid === false, 'Validation: Reject 5-digit PIN');
    assert(Validator.validateDomesticPin('4000012').valid === false, 'Validation: Reject 7-digit PIN');
    assert(Validator.validateDomesticPin('ABCDEF').valid === false, 'Validation: Reject alphanumeric domestic PIN');

    // Test 12: Validation - International Postal Code rules
    const usSpec = CONFIG.countries.find(c => c.code === 'US');
    assert(Validator.validateInternationalPostalCode('90210', usSpec).valid === true, 'Validation: US ZIP 90210');
    assert(Validator.validateInternationalPostalCode('9021', usSpec).valid === false, 'Validation: Invalid US ZIP');

    // Country with optional postal code (UAE)
    const uaeSpec = CONFIG.countries.find(c => c.code === 'AE');
    assert(Validator.validateInternationalPostalCode('', uaeSpec).valid === true, 'Validation: Optional UAE Postal Code');

    // Test 13: Zero and negative weight rejection
    assert(Validator.validateWeight(0).valid === false, 'Validation: Reject Zero Weight');
    assert(Validator.validateWeight(-5).valid === false, 'Validation: Reject Negative Weight');
    assert(Validator.validateWeight(2.5).valid === true, 'Validation: Accept Positive Weight 2.5 kg');

    // Test 14: Dimensions validation
    assert(Validator.validateDimensions(10, 20, 30).valid === true, 'Validation: Valid Dimensions');
    assert(Validator.validateDimensions(0, 20, 30).valid === false, 'Validation: Reject Zero Length');
    assert(Validator.validateDimensions(10, -5, 30).valid === false, 'Validation: Reject Negative Width');

    // Test 15: Currency Formatting
    const formattedINR = Engine.formatCurrency(1250.50, 'INR');
    assert(formattedINR.includes('1,250.50'), 'Currency Formatting INR', formattedINR);

    const formattedUSD = Engine.formatCurrency(45.90, 'USD');
    assert(formattedUSD.includes('45.90'), 'Currency Formatting USD', formattedUSD);

    console.log(`%c--- TEST RUN COMPLETE: ${testResults.filter(t => t.status === 'PASS').length}/${testResults.length} PASSED ---`, 'color: #059669; font-weight: bold; font-size: 14px;');
    return testResults;
  }

  return {
    runAllTests,
    getResults: () => testResults
  };
});
