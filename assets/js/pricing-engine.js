/**
 * LOGIXPRESS ENTERPRISE SHIPPING RATE CALCULATOR
 * Mathematical & Logistics Calculation Engine
 * 
 * Provides verified mathematical formulas for:
 * - Actual, Volumetric, and Chargeable Weight calculation
 * - Multi-package aggregation and CBM volume calculation
 * - Domestic zone determination
 * - Tiered slab rounding
 * - Freight, Fuel, COD, Insurance, Handling, and Tax computation
 * - International and Hyperlocal rate evaluations
 */

const LogiPricingEngine = (function() {
  'use strict';

  // Support both browser global and Node.js testing module
  const CFG = (typeof LOGIXPRESS_CONFIG !== 'undefined')
    ? LOGIXPRESS_CONFIG
    : (typeof require !== 'undefined' ? require('./config.js') : {});

  /**
   * Calculates volumetric weight in kilograms from centimetre dimensions.
   * Formula: (Length * Width * Height) / Divisor
   */
  function calculateVolumetricWeight(lengthCm, widthCm, heightCm, divisor = 5000) {
    const l = Math.max(0, parseFloat(lengthCm) || 0);
    const w = Math.max(0, parseFloat(widthCm) || 0);
    const h = Math.max(0, parseFloat(heightCm) || 0);
    const div = Math.max(1, parseFloat(divisor) || 5000);

    if (l <= 0 || w <= 0 || h <= 0) return 0;
    const volWeight = (l * w * h) / div;
    return Math.round(volWeight * 100) / 100; // 2 decimal precision
  }

  /**
   * Calculates total volume in Cubic Metres (CBM).
   * Formula: (Length_cm * Width_cm * Height_cm) / 1,000,000
   */
  function calculateVolumeCbm(lengthCm, widthCm, heightCm, quantity = 1) {
    const l = Math.max(0, parseFloat(lengthCm) || 0);
    const w = Math.max(0, parseFloat(widthCm) || 0);
    const h = Math.max(0, parseFloat(heightCm) || 0);
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    const singleCbm = (l * w * h) / 1000000;
    return Math.round(singleCbm * qty * 1000) / 1000; // 3 decimal precision
  }

  /**
   * Calculates chargeable weight as the greater of actual weight and volumetric weight.
   */
  function calculateChargeableWeight(actualWeightKg, volumetricWeightKg) {
    const actual = Math.max(0, parseFloat(actualWeightKg) || 0);
    const vol = Math.max(0, parseFloat(volumetricWeightKg) || 0);
    const maxWeight = Math.max(actual, vol);
    return Math.round(maxWeight * 100) / 100;
  }

  /**
   * Aggregates multiple packages and computes total actual, volumetric, CBM, and chargeable weight.
   */
  function calculateMultiPackageTotals(packages, divisor = 5000) {
    let totalActual = 0;
    let totalVolumetric = 0;
    let totalCbm = 0;
    let totalPieces = 0;

    if (!Array.isArray(packages) || packages.length === 0) {
      return { totalPieces: 0, totalActual: 0, totalVolumetric: 0, totalCbm: 0, chargeableWeight: 0 };
    }

    packages.forEach(pkg => {
      const qty = Math.max(1, parseInt(pkg.quantity, 10) || 1);
      const weightPerUnit = Math.max(0, parseFloat(pkg.weight) || 0);
      const l = Math.max(0, parseFloat(pkg.length) || 0);
      const w = Math.max(0, parseFloat(pkg.width) || 0);
      const h = Math.max(0, parseFloat(pkg.height) || 0);

      const pkgActual = weightPerUnit * qty;
      const singleVol = (l * w * h) / divisor;
      const pkgVol = singleVol * qty;
      const pkgCbm = ((l * w * h) / 1000000) * qty;

      totalPieces += qty;
      totalActual += pkgActual;
      totalVolumetric += pkgVol;
      totalCbm += pkgCbm;
    });

    totalActual = Math.round(totalActual * 100) / 100;
    totalVolumetric = Math.round(totalVolumetric * 100) / 100;
    totalCbm = Math.round(totalCbm * 1000) / 1000;
    const chargeable = Math.round(Math.max(totalActual, totalVolumetric) * 100) / 100;

    return {
      totalPieces,
      totalActual,
      totalVolumetric,
      totalCbm,
      chargeableWeight: chargeable
    };
  }

  /**
   * Determines domestic logistics zone between pickup and delivery PIN codes.
   */
  function determineDomesticZone(pickupPin, deliveryPin) {
    const pPin = String(pickupPin || '').trim();
    const dPin = String(deliveryPin || '').trim();

    if (!pPin || !dPin) return 'D';

    // Same PIN or immediate local hub (first 3 digits match)
    if (pPin === dPin || pPin.substring(0, 3) === dPin.substring(0, 3)) {
      return 'A'; // Intra-city
    }

    // Remote / Special circles check (J&K: 19xxx, North East: 79xxx, Andaman: 744xxx)
    const remotePrefixes = ['19', '79', '744', '795', '796', '797', '798', '799', '737'];
    const isRemotePickup = remotePrefixes.some(pref => pPin.startsWith(pref));
    const isRemoteDelivery = remotePrefixes.some(pref => dPin.startsWith(pref));
    if (isRemotePickup || isRemoteDelivery) {
      return 'E'; // Special / Remote
    }

    // Directory lookup if known
    const pInfo = CFG.pincodeDirectory[pPin];
    const dInfo = CFG.pincodeDirectory[dPin];

    if (pInfo && dInfo) {
      // Intra-state
      if (pInfo.state === dInfo.state) {
        return 'B';
      }
      // Metro to Metro
      if (pInfo.isMetro && dInfo.isMetro) {
        return 'C';
      }
    }

    // Postal circle analysis (First digit: 1 to 8)
    const pCircle = pPin.charAt(0);
    const dCircle = dPin.charAt(0);

    if (pCircle === dCircle) {
      return 'B'; // Same regional postal circle
    }

    // Default National
    return 'D';
  }

  /**
   * Calculates COD handling fee according to carrier business rules.
   * Rule: Higher of flat minimum fee or configured percentage.
   */
  function calculateCodFee(isCod, codAmount) {
    if (!isCod) return 0;
    const amt = Math.max(0, parseFloat(codAmount) || 0);
    if (amt <= 0) return 0;

    const rules = CFG.surcharges.cod;
    const percentageAmount = (amt * rules.percentageFee) / 100;
    const fee = Math.max(rules.minimumFee, percentageAmount);
    return Math.round(fee * 100) / 100;
  }

  /**
   * Calculates freight transit insurance based on declared shipment value.
   */
  function calculateInsuranceFee(requiresInsurance, declaredValue) {
    if (!requiresInsurance) return 0;
    const value = Math.max(0, parseFloat(declaredValue) || 0);
    const rules = CFG.surcharges.insurance;

    if (value <= rules.freeCoverLimit) {
      return 0; // Covered under free carrier standard liability
    }

    const calculated = (value * rules.ratePercent) / 100;
    const fee = Math.max(rules.minimumFee, calculated);
    return Math.round(fee * 100) / 100;
  }

  /**
   * Calculates domestic rates for all active matching tariffs.
   */
  function calculateDomesticRates(params) {
    const {
      pickupPin,
      deliveryPin,
      actualWeightKg,
      lengthCm,
      widthCm,
      heightCm,
      numberOfPackages = 1,
      packagesList = null,
      declaredValue = 0,
      paymentMode = 'prepaid',
      codAmount = 0,
      transportMode = 'any', // 'surface', 'air', 'any'
      shipmentType = 'forward', // 'forward', 'rto', 'reverse'
      hasInsurance = false
    } = params;

    const zone = determineDomesticZone(pickupPin, deliveryPin);
    const isCod = paymentMode.toLowerCase() === 'cod';

    // Metrics calculation
    let totalPieces = numberOfPackages;
    let actualWeight = 0;
    let volWeight = 0;
    let chargeableWeight = 0;

    if (packagesList && Array.isArray(packagesList) && packagesList.length > 0) {
      const summary = calculateMultiPackageTotals(packagesList, 5000);
      totalPieces = summary.totalPieces;
      actualWeight = summary.totalActual;
      volWeight = summary.totalVolumetric;
      chargeableWeight = summary.chargeableWeight;
    } else {
      actualWeight = (parseFloat(actualWeightKg) || 0) * numberOfPackages;
      volWeight = calculateVolumetricWeight(lengthCm, widthCm, heightCm, 5000) * numberOfPackages;
      chargeableWeight = calculateChargeableWeight(actualWeight, volWeight);
    }

    const codFee = calculateCodFee(isCod, codAmount);
    const insuranceFee = calculateInsuranceFee(hasInsurance, declaredValue);
    const shipmentTypeRule = CFG.surcharges.shipmentTypes[shipmentType] || { multiplier: 1.0, label: 'Forward' };

    const results = [];

    CFG.domesticTariffs.forEach(tariff => {
      if (!tariff.active) return;

      // Mode filter matching
      if (transportMode !== 'any' && tariff.mode.toLowerCase() !== transportMode.toLowerCase()) {
        return;
      }

      // Check supported zones
      if (tariff.supportedZones && !tariff.supportedZones.includes(zone)) {
        return;
      }

      // Weight limits check
      if (chargeableWeight < tariff.minWeightKg) {
        // Can still quote, but apply minimum base chargeable weight
      }
      if (tariff.maxWeightKg && chargeableWeight > tariff.maxWeightKg) {
        return; // Exceeds service weight limit
      }

      const zoneRate = tariff.pricingByZone[zone];
      if (!zoneRate) return;

      // Effective chargeable weight (subject to minimum billable weight)
      const billableWeight = Math.max(chargeableWeight, tariff.minWeightKg);

      // Slabs calculation
      const baseWeight = tariff.baseWeightKg;
      const baseFreight = zoneRate.baseRate;
      let additionalUnits = 0;
      let additionalWeightCharge = 0;

      if (billableWeight > baseWeight) {
        additionalUnits = Math.ceil((billableWeight - baseWeight) / tariff.weightIncrementKg);
        additionalWeightCharge = additionalUnits * zoneRate.additionalRate;
      }

      // Base net freight
      let netFreight = baseFreight + additionalWeightCharge;

      // Apply shipment type multiplier (e.g. Reverse pickup = 1.25x)
      netFreight = netFreight * shipmentTypeRule.multiplier;

      // Fuel Surcharge
      const fuelSurcharge = Math.round((netFreight * (tariff.fuelSurchargePercent / 100)) * 100) / 100;

      // Subtotal before GST
      const subtotal = Math.round((netFreight + fuelSurcharge + codFee + insuranceFee) * 100) / 100;

      // GST Breakdown: 18%
      // Zone A/B = Intra-state (CGST 9% + SGST 9%), Zone C/D/E = Interstate (IGST 18%)
      const isIntraState = zone === 'A' || zone === 'B';
      const taxRate = CFG.company.taxRatePercent;
      const totalTax = Math.round((subtotal * (taxRate / 100)) * 100) / 100;
      const cgst = isIntraState ? Math.round((totalTax / 2) * 100) / 100 : 0;
      const sgst = isIntraState ? Math.round((totalTax / 2) * 100) / 100 : 0;
      const igst = !isIntraState ? totalTax : 0;

      const grandTotal = Math.round((subtotal + totalTax) * 100) / 100;

      // Transit time estimation
      const transitMin = zoneRate.transitMinDays;
      const transitMax = zoneRate.transitMaxDays;
      const transitText = transitMin === transitMax ? `${transitMin} Business Day` : `${transitMin} - ${transitMax} Business Days`;

      // Estimated Delivery Date (skipping Sundays)
      const deliveryDate = calculateEstimatedDeliveryDate(transitMax);

      results.push({
        tariffId: tariff.id,
        serviceName: tariff.name,
        serviceCode: tariff.code,
        transportMode: tariff.mode,
        badge: tariff.badge,
        description: tariff.description,
        zone: zone,
        zoneName: CFG.zones[zone].name,
        billableWeight: billableWeight,
        chargeableWeight: chargeableWeight,
        actualWeight: actualWeight,
        volumetricWeight: volWeight,
        totalPieces: totalPieces,
        transitMinDays: transitMin,
        transitMaxDays: transitMax,
        transitTime: transitText,
        estimatedDeliveryDate: deliveryDate,
        costBreakdown: {
          baseFreight: Math.round(baseFreight * 100) / 100,
          additionalWeightCharge: Math.round(additionalWeightCharge * 100) / 100,
          fuelSurcharge: fuelSurcharge,
          fuelSurchargePercent: tariff.fuelSurchargePercent,
          codFee: codFee,
          insuranceFee: insuranceFee,
          shipmentTypeMultiplier: shipmentTypeRule.multiplier,
          subtotal: subtotal,
          cgst: cgst,
          sgst: sgst,
          igst: igst,
          totalTax: totalTax,
          grandTotal: grandTotal,
          currency: 'INR'
        }
      });
    });

    return results;
  }

  /**
   * Calculates international shipping estimates.
   */
  function calculateInternationalRates(params) {
    const {
      originCountry = 'IN',
      destinationCountry,
      actualWeightKg,
      lengthCm,
      widthCm,
      heightCm,
      declaredValue = 0,
      currency = 'INR',
      commodityType = 'parcel', // 'document', 'parcel', 'cargo'
      preferredSpeed = 'any'
    } = params;

    const countrySpec = CFG.countries.find(c => c.code === destinationCountry);
    if (!countrySpec) {
      throw new Error(`Unsupported destination country: ${destinationCountry}`);
    }

    const zone = countrySpec.zone;
    const actual = Math.max(0.1, parseFloat(actualWeightKg) || 0);
    const volWeight = calculateVolumetricWeight(lengthCm, widthCm, heightCm, 5000);
    const chargeableWeight = calculateChargeableWeight(actual, volWeight);

    const exchangeRate = CFG.exchangeRates[currency] || 1.0;
    const insuranceFeeINR = calculateInsuranceFee(true, declaredValue / exchangeRate);

    const results = [];

    CFG.internationalTariffs.forEach(tariff => {
      if (!tariff.active) return;

      // Commodity restriction (e.g., freight for heavy bulk only)
      if (tariff.mode === 'Air Freight' && chargeableWeight < tariff.minWeightKg) {
        return;
      }
      if (tariff.mode !== 'Air Freight' && chargeableWeight > tariff.maxWeightKg) {
        return;
      }

      const zoneRate = tariff.zonePricing[zone];
      if (!zoneRate) return;

      const billableWeight = Math.max(chargeableWeight, tariff.minWeightKg);
      const baseFreightINR = zoneRate.baseRateINR;
      let additionalChargeINR = 0;

      if (billableWeight > tariff.baseWeightKg) {
        const units = Math.ceil((billableWeight - tariff.baseWeightKg) / tariff.weightIncrementKg);
        additionalChargeINR = units * zoneRate.additionalRateINR;
      }

      const netFreightINR = baseFreightINR + additionalChargeINR;
      const fuelSurchargeINR = Math.round((netFreightINR * (tariff.fuelSurchargePercent / 100)) * 100) / 100;
      const subtotalINR = netFreightINR + fuelSurchargeINR + insuranceFeeINR;
      
      // Indian Export GST on International Freight: Standard logistics rate applies
      const taxINR = Math.round((subtotalINR * 0.18) * 100) / 100;
      const totalINR = Math.round((subtotalINR + taxINR) * 100) / 100;

      // Currency conversion
      const baseFreightConv = Math.round((baseFreightINR * exchangeRate) * 100) / 100;
      const fuelSurchargeConv = Math.round((fuelSurchargeINR * exchangeRate) * 100) / 100;
      const insuranceConv = Math.round((insuranceFeeINR * exchangeRate) * 100) / 100;
      const taxConv = Math.round((taxINR * exchangeRate) * 100) / 100;
      const totalConv = Math.round((totalINR * exchangeRate) * 100) / 100;

      const transitText = `${zoneRate.transitMinDays} - ${zoneRate.transitMaxDays} Business Days`;
      const deliveryDate = calculateEstimatedDeliveryDate(zoneRate.transitMaxDays);

      results.push({
        tariffId: tariff.id,
        serviceName: tariff.name,
        serviceCode: tariff.code,
        transportMode: tariff.mode,
        badge: tariff.badge,
        description: tariff.description,
        destinationCountry: countrySpec.name,
        countryCode: countrySpec.code,
        zone: zone,
        billableWeight: billableWeight,
        chargeableWeight: chargeableWeight,
        actualWeight: actual,
        volumetricWeight: volWeight,
        transitTime: transitText,
        estimatedDeliveryDate: deliveryDate,
        customsDisclaimer: 'Duties and taxes are assessed by destination customs authorities and are not included in freight charges unless explicitly quoted under DDP terms.',
        costBreakdown: {
          baseFreight: baseFreightConv,
          fuelSurcharge: fuelSurchargeConv,
          insuranceFee: insuranceConv,
          tax: taxConv,
          grandTotal: totalConv,
          currency: currency,
          rawTotalINR: totalINR
        }
      });
    });

    return results;
  }

  /**
   * Calculates Cargo and Bulk shipping rates.
   */
  function calculateCargoRates(params) {
    const {
      packagesList = [],
      pickupPin,
      deliveryPin,
      declaredValue = 0,
      handlingOptions = {}
    } = params;

    const summary = calculateMultiPackageTotals(packagesList, 4000); // 4000 divisor for cargo CBM conversion
    const billableWeight = Math.max(summary.chargeableWeight, 50); // Minimum 50 kg for commercial cargo

    // Compute special handling fees
    let handlingFee = 0;
    const handlingDetails = [];
    if (handlingOptions.tailLift) {
      handlingFee += CFG.surcharges.cargoHandling.tailLift;
      handlingDetails.push({ name: 'Hydraulic Tail-Lift', fee: CFG.surcharges.cargoHandling.tailLift });
    }
    if (handlingOptions.insideDelivery) {
      handlingFee += CFG.surcharges.cargoHandling.insideDelivery;
      handlingDetails.push({ name: 'Inside Building Delivery', fee: CFG.surcharges.cargoHandling.insideDelivery });
    }
    if (handlingOptions.forklift) {
      handlingFee += CFG.surcharges.cargoHandling.forkliftAssistance;
      handlingDetails.push({ name: 'Forklift Assistance', fee: CFG.surcharges.cargoHandling.forkliftAssistance });
    }
    if (handlingOptions.dockAppointment) {
      handlingFee += CFG.surcharges.cargoHandling.dockAppointment;
      handlingDetails.push({ name: 'Dock Appointment Scheduling', fee: CFG.surcharges.cargoHandling.dockAppointment });
    }

    const insuranceFee = calculateInsuranceFee(true, declaredValue);
    const results = [];

    CFG.cargoTariffs.forEach(tariff => {
      if (!tariff.active) return;

      let netFreight = 0;
      if (tariff.baseFlatRate) {
        netFreight = tariff.baseFlatRate;
      } else {
        const baseFreight = tariff.baseRate;
        let additionalWeightCharge = 0;
        if (billableWeight > tariff.baseWeightKg) {
          const additionalKg = billableWeight - tariff.baseWeightKg;
          additionalWeightCharge = additionalKg * tariff.ratePerAdditionalKg;
        }
        netFreight = baseFreight + additionalWeightCharge;
      }

      const fuelSurcharge = Math.round((netFreight * (tariff.fuelSurchargePercent / 100)) * 100) / 100;
      const docketCharge = tariff.docketCharge || 0;
      const subtotal = Math.round((netFreight + fuelSurcharge + docketCharge + handlingFee + insuranceFee) * 100) / 100;
      const gst = Math.round((subtotal * 0.18) * 100) / 100;
      const grandTotal = Math.round((subtotal + gst) * 100) / 100;

      results.push({
        tariffId: tariff.id,
        serviceName: tariff.name,
        serviceCode: tariff.code,
        transportMode: tariff.mode,
        badge: tariff.badge,
        description: tariff.description,
        totalPieces: summary.totalPieces,
        totalActualWeight: summary.totalActual,
        totalVolumetricWeight: summary.totalVolumetric,
        totalCbm: summary.totalCbm,
        chargeableWeight: billableWeight,
        transitTime: tariff.transitDays,
        costBreakdown: {
          baseFreight: Math.round(netFreight * 100) / 100,
          fuelSurcharge: fuelSurcharge,
          docketCharge: docketCharge,
          handlingFee: handlingFee,
          handlingDetails: handlingDetails,
          insuranceFee: insuranceFee,
          subtotal: subtotal,
          gst: gst,
          grandTotal: grandTotal,
          currency: 'INR'
        }
      });
    });

    return { summary, results };
  }

  /**
   * Calculates Quick / Hyperlocal delivery estimates.
   */
  function calculateQuickDeliveryRates(params) {
    const {
      pickupLocation,
      deliveryLocation,
      packageWeightKg,
      urgency = 'instant' // 'instant', 'sameDay', 'nextDay'
    } = params;

    const weight = Math.max(0.2, parseFloat(packageWeightKg) || 0);
    const urgencyRule = CFG.surcharges.quickUrgency[urgency] || CFG.surcharges.quickUrgency.instant;
    const distanceKm = CFG.quickDelivery.distanceEstimates.default; // 12.5 km benchmark

    const results = [];

    CFG.quickDelivery.vehicles.forEach(veh => {
      // Check weight capacity
      if (weight > veh.maxWeightKg) return;

      const baseFare = veh.baseFare;
      const extraKm = Math.max(0, distanceKm - CFG.quickDelivery.baseDistanceKm);
      const distanceFare = Math.round(extraKm * veh.perKmFare);
      const urgencyFee = urgencyRule.fee;
      
      const subtotal = baseFare + distanceFare + urgencyFee;
      const gst = Math.round((subtotal * 0.18) * 100) / 100;
      const grandTotal = Math.round((subtotal + gst) * 100) / 100;

      results.push({
        vehicleId: veh.id,
        serviceName: veh.name,
        capacity: veh.capacity,
        maxWeightKg: veh.maxWeightKg,
        icon: veh.icon,
        suitableFor: veh.suitableFor,
        estimatedDistanceKm: distanceKm,
        urgencyLabel: urgencyRule.label,
        transitTime: urgencyRule.time,
        costBreakdown: {
          baseFare: baseFare,
          distanceFare: distanceFare,
          urgencyFee: urgencyFee,
          subtotal: subtotal,
          gst: gst,
          grandTotal: grandTotal,
          currency: 'INR'
        }
      });
    });

    return results;
  }

  /**
   * Helper to project estimated delivery date skipping Sundays.
   */
  function calculateEstimatedDeliveryDate(businessDays) {
    const date = new Date();
    let daysAdded = 0;
    while (daysAdded < businessDays) {
      date.setDate(date.getDate() + 1);
      // Skip Sundays (0)
      if (date.getDay() !== 0) {
        daysAdded++;
      }
    }
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
  }

  /**
   * Formats an amount using Intl.NumberFormat according to ISO currency.
   */
  function formatCurrency(amount, currency = 'INR') {
    const num = parseFloat(amount) || 0;
    try {
      const locale = currency === 'INR' ? 'en-IN' : 'en-US';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    } catch (e) {
      return `${currency} ${num.toFixed(2)}`;
    }
  }

  return {
    calculateVolumetricWeight,
    calculateVolumeCbm,
    calculateChargeableWeight,
    calculateMultiPackageTotals,
    determineDomesticZone,
    calculateCodFee,
    calculateInsuranceFee,
    calculateDomesticRates,
    calculateInternationalRates,
    calculateCargoRates,
    calculateQuickDeliveryRates,
    calculateEstimatedDeliveryDate,
    formatCurrency
  };
})();

// Export for tests/module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LogiPricingEngine;
}
