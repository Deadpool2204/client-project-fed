/**
 * LOGIXPRESS ENTERPRISE SHIPPING RATE CALCULATOR
 * Tariff Configuration and Master Data Module
 * 
 * Contains demonstration rate cards, zone classifications, postal code directories,
 * country specifications, currency exchange rates, and surcharge rules.
 */

const LOGIXPRESS_CONFIG = {
  company: {
    name: 'LogiXpress Enterprise Logistics',
    shortName: 'LogiXpress',
    tagline: 'Reliable Enterprise Courier & Freight Solutions',
    supportPhone: '+91 (022) 8000-LOGI',
    supportEmail: 'rates@logixpress.example.com',
    currencyDefault: 'INR',
    taxName: 'GST',
    taxRatePercent: 18, // Standard 18% GST for freight/courier services in India
    effectiveDate: '2026-04-01',
    version: '2.5.0'
  },

  // Standard volumetric divisors by service type
  volumetricDivisors: {
    standardCourier: 5000, // cm³/kg (IATA standard courier)
    airCargo: 6000,       // cm³/kg (Commercial air freight)
    surfaceCargo: 4500,   // cm³/kg (Surface bulk / LTL)
    expressPriority: 5000
  },

  // Surcharge & Value-Added Service Rules
  surcharges: {
    fuelSurchargeDomesticPercent: 10,
    fuelSurchargeAirPercent: 12,
    fuelSurchargeIntlPercent: 14,
    fuelSurchargeCargoPercent: 8,
    
    // Cash on Delivery (COD) Rules
    cod: {
      minimumFee: 45, // INR minimum fee
      percentageFee: 2.0, // 2.0% of COD collection amount
      maxCodValue: 50000 // INR limit for standard COD
    },

    // Insurance / Freight Liability Rules
    insurance: {
      freeCoverLimit: 5000, // INR free carrier liability
      ratePercent: 0.25, // 0.25% of total declared value
      minimumFee: 50 // Minimum fee if insurance requested
    },

    // Shipment type multipliers
    shipmentTypes: {
      forward: { multiplier: 1.0, label: 'Forward Delivery' },
      rto: { multiplier: 1.0, label: 'Return to Origin (RTO)', description: 'Full freight applied for returned shipments' },
      reverse: { multiplier: 1.25, label: 'Reverse Pickup / Exchange', description: 'Includes doorstep verification & specialized pickup handling' }
    },

    // Cargo additional handling options
    cargoHandling: {
      tailLift: 500, // Hydraulic tail-lift charge
      insideDelivery: 750, // Inside building / floor delivery
      forkliftAssistance: 1200, // Forklift arrangement at site
      dockAppointment: 350 // Scheduled dock appointment
    },

    // Quick / Hyperlocal urgency surcharges
    quickUrgency: {
      instant: { fee: 80, time: 'Within 90-120 mins', label: 'Instant Priority' },
      sameDay: { fee: 35, time: 'Same-day by 8:00 PM', label: 'Same-Day Evening' },
      nextDay: { fee: 0, time: 'Next-day morning', label: 'Next-Day Standard' }
    }
  },

  // Domestic Zone Definitions
  // Zone A: Intra-city (Local)
  // Zone B: Intra-state / Regional
  // Zone C: Metro-to-Metro
  // Zone D: Rest of India (National)
  // Zone E: Special / Remote (North-East, J&K, Andaman & Nicobar, Lakshadweep)
  zones: {
    A: { name: 'Zone A - Intra-City (Local)', baseMultiplier: 1.0, transitAdjustment: 0 },
    B: { name: 'Zone B - Intra-State / Regional', baseMultiplier: 1.2, transitAdjustment: 1 },
    C: { name: 'Zone C - Metro to Metro', baseMultiplier: 1.35, transitAdjustment: 1 },
    D: { name: 'Zone D - Rest of India (National)', baseMultiplier: 1.55, transitAdjustment: 2 },
    E: { name: 'Zone E - Special / Remote Regions', baseMultiplier: 1.95, transitAdjustment: 4 }
  },

  // Pincode lookup database (sample representative data for major Indian logistics hubs)
  // Maps 6-digit PIN code to City, State, Metro status, and Circle
  pincodeDirectory: {
    '110001': { city: 'New Delhi', state: 'Delhi', isMetro: true, circle: 1 },
    '110020': { city: 'Okhla, New Delhi', state: 'Delhi', isMetro: true, circle: 1 },
    '110037': { city: 'Aerocity, New Delhi', state: 'Delhi', isMetro: true, circle: 1 },
    '122001': { city: 'Gurugram', state: 'Haryana', isMetro: true, circle: 1 },
    '201301': { city: 'Noida', state: 'Uttar Pradesh', isMetro: true, circle: 2 },
    '208001': { city: 'Kanpur', state: 'Uttar Pradesh', isMetro: false, circle: 2 },
    '226001': { city: 'Lucknow', state: 'Uttar Pradesh', isMetro: false, circle: 2 },
    '302001': { city: 'Jaipur', state: 'Rajasthan', isMetro: false, circle: 3 },
    '380001': { city: 'Ahmedabad', state: 'Gujarat', isMetro: true, circle: 3 },
    '395001': { city: 'Surat', state: 'Gujarat', isMetro: false, circle: 3 },
    '400001': { city: 'Fort, Mumbai', state: 'Maharashtra', isMetro: true, circle: 4 },
    '400051': { city: 'Bandra BKC, Mumbai', state: 'Maharashtra', isMetro: true, circle: 4 },
    '400099': { city: 'Sahar Cargo, Mumbai', state: 'Maharashtra', isMetro: true, circle: 4 },
    '411001': { city: 'Pune', state: 'Maharashtra', isMetro: true, circle: 4 },
    '440001': { city: 'Nagpur', state: 'Maharashtra', isMetro: false, circle: 4 },
    '462001': { city: 'Bhopal', state: 'Madhya Pradesh', isMetro: false, circle: 4 },
    '500001': { city: 'Hyderabad', state: 'Telangana', isMetro: true, circle: 5 },
    '500081': { city: 'HITEC City, Hyderabad', state: 'Telangana', isMetro: true, circle: 5 },
    '560001': { city: 'Bengaluru Central', state: 'Karnataka', isMetro: true, circle: 5 },
    '560100': { city: 'Electronic City, Bengaluru', state: 'Karnataka', isMetro: true, circle: 5 },
    '560066': { city: 'Whitefield, Bengaluru', state: 'Karnataka', isMetro: true, circle: 5 },
    '600001': { city: 'Chennai Central', state: 'Tamil Nadu', isMetro: true, circle: 6 },
    '600042': { city: 'Velachery, Chennai', state: 'Tamil Nadu', isMetro: true, circle: 6 },
    '682001': { city: 'Kochi', state: 'Kerala', isMetro: false, circle: 6 },
    '700001': { city: 'Kolkata Central', state: 'West Bengal', isMetro: true, circle: 7 },
    '751001': { city: 'Bhubaneswar', state: 'Odisha', isMetro: false, circle: 7 },
    '781001': { city: 'Guwahati', state: 'Assam', isMetro: false, circle: 7, isRemote: true },
    '795001': { city: 'Imphal', state: 'Manipur', isMetro: false, circle: 7, isRemote: true },
    '190001': { city: 'Srinagar', state: 'Jammu & Kashmir', isMetro: false, circle: 1, isRemote: true },
    '744101': { city: 'Port Blair', state: 'Andaman & Nicobar', isMetro: false, circle: 7, isRemote: true },
    '800001': { city: 'Patna', state: 'Bihar', isMetro: false, circle: 8 },
    '834001': { city: 'Ranchi', state: 'Jharkhand', isMetro: false, circle: 8 }
  },

  // Demonstration Domestic Rate Cards
  domesticTariffs: [
    {
      id: 'demo-surface-standard',
      name: 'AeroTrans Surface Economy',
      code: 'SURF-ECO',
      mode: 'Surface',
      badge: 'Most Economical',
      description: 'Reliable road network shipping for non-urgent shipments with tracking.',
      active: true,
      minWeightKg: 0.5,
      maxWeightKg: 500,
      volumetricDivisor: 5000,
      fuelSurchargePercent: 10,
      baseWeightKg: 1.0,
      weightIncrementKg: 1.0,
      pricingByZone: {
        A: { baseRate: 55, additionalRate: 35, transitMinDays: 1, transitMaxDays: 2 },
        B: { baseRate: 70, additionalRate: 45, transitMinDays: 2, transitMaxDays: 3 },
        C: { baseRate: 85, additionalRate: 52, transitMinDays: 3, transitMaxDays: 5 },
        D: { baseRate: 105, additionalRate: 65, transitMinDays: 4, transitMaxDays: 7 },
        E: { baseRate: 160, additionalRate: 98, transitMinDays: 7, transitMaxDays: 10 }
      }
    },
    {
      id: 'demo-express-air',
      name: 'AeroTrans Express Air',
      code: 'AIR-EXP',
      mode: 'Air',
      badge: 'Fastest Delivery',
      description: 'Scheduled commercial flight connectivity for time-sensitive packages.',
      active: true,
      minWeightKg: 0.2,
      maxWeightKg: 100,
      volumetricDivisor: 5000,
      fuelSurchargePercent: 12,
      baseWeightKg: 0.5,
      weightIncrementKg: 0.5,
      pricingByZone: {
        A: { baseRate: 85, additionalRate: 45, transitMinDays: 1, transitMaxDays: 1 },
        B: { baseRate: 110, additionalRate: 60, transitMinDays: 1, transitMaxDays: 2 },
        C: { baseRate: 135, additionalRate: 75, transitMinDays: 1, transitMaxDays: 2 },
        D: { baseRate: 175, additionalRate: 95, transitMinDays: 2, transitMaxDays: 3 },
        E: { baseRate: 260, additionalRate: 145, transitMinDays: 3, transitMaxDays: 5 }
      }
    },
    {
      id: 'demo-priority-morning',
      name: 'AeroTrans Priority 10:30 AM',
      code: 'AIR-PRIO',
      mode: 'Air',
      badge: 'Guaranteed Morning',
      description: 'Next business morning guaranteed delivery to tier-1 metro commercial districts.',
      active: true,
      minWeightKg: 0.2,
      maxWeightKg: 50,
      volumetricDivisor: 5000,
      fuelSurchargePercent: 14,
      baseWeightKg: 0.5,
      weightIncrementKg: 0.5,
      supportedZones: ['A', 'B', 'C'], // Limited to metro/regional
      pricingByZone: {
        A: { baseRate: 140, additionalRate: 70, transitMinDays: 1, transitMaxDays: 1 },
        B: { baseRate: 180, additionalRate: 95, transitMinDays: 1, transitMaxDays: 1 },
        C: { baseRate: 220, additionalRate: 115, transitMinDays: 1, transitMaxDays: 1 }
      }
    },
    {
      id: 'demo-surface-cargo-lite',
      name: 'AeroTrans Heavy Surface Lite',
      code: 'SURF-HVY',
      mode: 'Surface',
      badge: 'Best for >10kg',
      description: 'High-weight discounted ground transport for packages 10kg and above.',
      active: true,
      minWeightKg: 10,
      maxWeightKg: 1000,
      volumetricDivisor: 4500,
      fuelSurchargePercent: 10,
      baseWeightKg: 10.0,
      weightIncrementKg: 5.0,
      pricingByZone: {
        A: { baseRate: 380, additionalRate: 120, transitMinDays: 2, transitMaxDays: 3 },
        B: { baseRate: 490, additionalRate: 165, transitMinDays: 2, transitMaxDays: 4 },
        C: { baseRate: 620, additionalRate: 210, transitMinDays: 3, transitMaxDays: 6 },
        D: { baseRate: 780, additionalRate: 275, transitMinDays: 5, transitMaxDays: 8 },
        E: { baseRate: 1250, additionalRate: 420, transitMinDays: 8, transitMaxDays: 12 }
      }
    }
  ],

  // International Country Master Data (30+ Countries)
  countries: [
    { code: 'US', name: 'United States', region: 'North America', zone: 4, postalCodeRequired: true, postalCodePattern: '^\\d{5}(-\\d{4})?$', postalCodePlaceholder: 'e.g. 90210 or 10001', currency: 'USD' },
    { code: 'GB', name: 'United Kingdom', region: 'Europe', zone: 3, postalCodeRequired: true, postalCodePattern: '^[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2}$', postalCodePlaceholder: 'e.g. SW1A 1AA or EC1A 1BB', currency: 'GBP' },
    { code: 'AE', name: 'United Arab Emirates', region: 'Middle East', zone: 1, postalCodeRequired: false, postalCodePattern: '.*', postalCodePlaceholder: 'P.O. Box / Optional', currency: 'AED' },
    { code: 'CA', name: 'Canada', region: 'North America', zone: 4, postalCodeRequired: true, postalCodePattern: '^[A-Z]\\d[A-Z] ?\\d[A-Z]\\d$', postalCodePlaceholder: 'e.g. M5V 2T6', currency: 'CAD' },
    { code: 'DE', name: 'Germany', region: 'Europe', zone: 3, postalCodeRequired: true, postalCodePattern: '^\\d{5}$', postalCodePlaceholder: 'e.g. 10115 or 80331', currency: 'EUR' },
    { code: 'AU', name: 'Australia', region: 'Asia-Pacific', zone: 5, postalCodeRequired: true, postalCodePattern: '^\\d{4}$', postalCodePlaceholder: 'e.g. 2000 or 3000', currency: 'AUD' },
    { code: 'SG', name: 'Singapore', region: 'Asia-Pacific', zone: 2, postalCodeRequired: true, postalCodePattern: '^\\d{6}$', postalCodePlaceholder: 'e.g. 048624', currency: 'SGD' },
    { code: 'FR', name: 'France', region: 'Europe', zone: 3, postalCodeRequired: true, postalCodePattern: '^\\d{5}$', postalCodePlaceholder: 'e.g. 75008', currency: 'EUR' },
    { code: 'NL', name: 'Netherlands', region: 'Europe', zone: 3, postalCodeRequired: true, postalCodePattern: '^\\d{4} ?[A-Z]{2}$', postalCodePlaceholder: 'e.g. 1012 JS', currency: 'EUR' },
    { code: 'SA', name: 'Saudi Arabia', region: 'Middle East', zone: 1, postalCodeRequired: true, postalCodePattern: '^\\d{5}$', postalCodePlaceholder: 'e.g. 11564', currency: 'SAR' },
    { code: 'QA', name: 'Qatar', region: 'Middle East', zone: 1, postalCodeRequired: false, postalCodePattern: '.*', postalCodePlaceholder: 'P.O. Box / Optional', currency: 'QAR' },
    { code: 'JP', name: 'Japan', region: 'Asia-Pacific', zone: 2, postalCodeRequired: true, postalCodePattern: '^\\d{3}-?\\d{4}$', postalCodePlaceholder: 'e.g. 100-0001', currency: 'JPY' },
    { code: 'MY', name: 'Malaysia', region: 'Asia-Pacific', zone: 2, postalCodeRequired: true, postalCodePattern: '^\\d{5}$', postalCodePlaceholder: 'e.g. 50450', currency: 'MYR' },
    { code: 'TH', name: 'Thailand', region: 'Asia-Pacific', zone: 2, postalCodeRequired: true, postalCodePattern: '^\\d{5}$', postalCodePlaceholder: 'e.g. 10110', currency: 'THB' },
    { code: 'NZ', name: 'New Zealand', region: 'Asia-Pacific', zone: 5, postalCodeRequired: true, postalCodePattern: '^\\d{4}$', postalCodePlaceholder: 'e.g. 1010', currency: 'NZD' },
    { code: 'IT', name: 'Italy', region: 'Europe', zone: 3, postalCodeRequired: true, postalCodePattern: '^\\d{5}$', postalCodePlaceholder: 'e.g. 00187', currency: 'EUR' },
    { code: 'ES', name: 'Spain', region: 'Europe', zone: 3, postalCodeRequired: true, postalCodePattern: '^\\d{5}$', postalCodePlaceholder: 'e.g. 28001', currency: 'EUR' },
    { code: 'CH', name: 'Switzerland', region: 'Europe', zone: 3, postalCodeRequired: true, postalCodePattern: '^\\d{4}$', postalCodePlaceholder: 'e.g. 8001', currency: 'CHF' },
    { code: 'SE', name: 'Sweden', region: 'Europe', zone: 3, postalCodeRequired: true, postalCodePattern: '^\\d{3} ?\\d{2}$', postalCodePlaceholder: 'e.g. 111 22', currency: 'SEK' },
    { code: 'ZA', name: 'South Africa', region: 'Africa', zone: 6, postalCodeRequired: true, postalCodePattern: '^\\d{4}$', postalCodePlaceholder: 'e.g. 2001', currency: 'ZAR' },
    { code: 'BR', name: 'Brazil', region: 'South America', zone: 6, postalCodeRequired: true, postalCodePattern: '^\\d{5}-?\\d{3}$', postalCodePlaceholder: 'e.g. 01310-100', currency: 'BRL' },
    { code: 'MX', name: 'Mexico', region: 'North America', zone: 4, postalCodeRequired: true, postalCodePattern: '^\\d{5}$', postalCodePlaceholder: 'e.g. 06600', currency: 'MXN' },
    { code: 'IN', name: 'India (Origin)', region: 'South Asia', zone: 0, postalCodeRequired: true, postalCodePattern: '^\\d{6}$', postalCodePlaceholder: 'e.g. 400001', currency: 'INR' }
  ],

  // International Currency Exchange Rates (Base: INR)
  exchangeRates: {
    INR: 1.0,
    USD: 0.012,   // 1 USD ~ 83.3 INR
    EUR: 0.011,   // 1 EUR ~ 90.9 INR
    GBP: 0.0095,  // 1 GBP ~ 105.2 INR
    AED: 0.044,   // 1 AED ~ 22.7 INR
    CAD: 0.016,   // 1 CAD ~ 62.5 INR
    AUD: 0.018    // 1 AUD ~ 55.5 INR
  },

  // Demonstration International Tariffs
  internationalTariffs: [
    {
      id: 'demo-intl-express',
      name: 'AeroGlobal Worldwide Express',
      code: 'AG-EXP',
      mode: 'Air Express',
      badge: 'Fastest Global',
      description: 'End-to-end priority international air courier with customs pre-clearance.',
      active: true,
      minWeightKg: 0.5,
      maxWeightKg: 100,
      volumetricDivisor: 5000,
      fuelSurchargePercent: 14,
      baseWeightKg: 0.5,
      weightIncrementKg: 0.5,
      zonePricing: {
        1: { baseRateINR: 1450, additionalRateINR: 320, transitMinDays: 2, transitMaxDays: 4 }, // Middle East
        2: { baseRateINR: 1650, additionalRateINR: 360, transitMinDays: 3, transitMaxDays: 5 }, // South East Asia
        3: { baseRateINR: 1950, additionalRateINR: 420, transitMinDays: 3, transitMaxDays: 5 }, // Europe & UK
        4: { baseRateINR: 2200, additionalRateINR: 480, transitMinDays: 3, transitMaxDays: 5 }, // North America
        5: { baseRateINR: 2350, additionalRateINR: 510, transitMinDays: 4, transitMaxDays: 6 }, // Australia / NZ
        6: { baseRateINR: 2750, additionalRateINR: 650, transitMinDays: 5, transitMaxDays: 8 }  // Rest of World
      }
    },
    {
      id: 'demo-intl-standard',
      name: 'AeroGlobal Standard International',
      code: 'AG-STD',
      mode: 'Air Standard',
      badge: 'Balanced Value',
      description: 'Economical international delivery through scheduled commercial air cargo lines.',
      active: true,
      minWeightKg: 0.5,
      maxWeightKg: 150,
      volumetricDivisor: 5000,
      fuelSurchargePercent: 12,
      baseWeightKg: 0.5,
      weightIncrementKg: 0.5,
      zonePricing: {
        1: { baseRateINR: 1100, additionalRateINR: 240, transitMinDays: 4, transitMaxDays: 7 },
        2: { baseRateINR: 1280, additionalRateINR: 280, transitMinDays: 4, transitMaxDays: 7 },
        3: { baseRateINR: 1520, additionalRateINR: 330, transitMinDays: 5, transitMaxDays: 8 },
        4: { baseRateINR: 1750, additionalRateINR: 380, transitMinDays: 5, transitMaxDays: 9 },
        5: { baseRateINR: 1890, additionalRateINR: 410, transitMinDays: 6, transitMaxDays: 10 },
        6: { baseRateINR: 2200, additionalRateINR: 520, transitMinDays: 8, transitMaxDays: 14 }
      }
    },
    {
      id: 'demo-intl-economy',
      name: 'AeroGlobal Economy Saver',
      code: 'AG-ECO',
      mode: 'Economy Air/Surface',
      badge: 'Lowest Cost',
      description: 'Ideal for non-critical commercial samples and direct-to-consumer cross-border parcels.',
      active: true,
      minWeightKg: 1.0,
      maxWeightKg: 70,
      volumetricDivisor: 5000,
      fuelSurchargePercent: 10,
      baseWeightKg: 1.0,
      weightIncrementKg: 1.0,
      zonePricing: {
        1: { baseRateINR: 1350, additionalRateINR: 380, transitMinDays: 7, transitMaxDays: 12 },
        2: { baseRateINR: 1550, additionalRateINR: 420, transitMinDays: 8, transitMaxDays: 14 },
        3: { baseRateINR: 1850, additionalRateINR: 510, transitMinDays: 9, transitMaxDays: 15 },
        4: { baseRateINR: 2100, additionalRateINR: 590, transitMinDays: 9, transitMaxDays: 16 },
        5: { baseRateINR: 2250, additionalRateINR: 630, transitMinDays: 10, transitMaxDays: 18 },
        6: { baseRateINR: 2700, additionalRateINR: 790, transitMinDays: 14, transitMaxDays: 24 }
      }
    },
    {
      id: 'demo-intl-freight',
      name: 'AeroGlobal Commercial Air Freight',
      code: 'AG-FRT',
      mode: 'Air Freight',
      badge: 'Commercial Heavy (>30kg)',
      description: 'Airport-to-airport or airport-to-door bulk commercial air cargo with customs documentation assistance.',
      active: true,
      minWeightKg: 30.0,
      maxWeightKg: 5000,
      volumetricDivisor: 6000, // IATA Air freight rule
      fuelSurchargePercent: 14,
      baseWeightKg: 30.0,
      weightIncrementKg: 5.0,
      zonePricing: {
        1: { baseRateINR: 12500, additionalRateINR: 1450, transitMinDays: 4, transitMaxDays: 7 },
        2: { baseRateINR: 14800, additionalRateINR: 1750, transitMinDays: 4, transitMaxDays: 8 },
        3: { baseRateINR: 18900, additionalRateINR: 2250, transitMinDays: 5, transitMaxDays: 9 },
        4: { baseRateINR: 22500, additionalRateINR: 2650, transitMinDays: 5, transitMaxDays: 10 },
        5: { baseRateINR: 24500, additionalRateINR: 2900, transitMinDays: 6, transitMaxDays: 11 },
        6: { baseRateINR: 31000, additionalRateINR: 3800, transitMinDays: 7, transitMaxDays: 14 }
      }
    }
  ],

  // Cargo & Bulk Logistics Configurations
  cargoTariffs: [
    {
      id: 'demo-cargo-ltl',
      name: 'LogiXpress Part-Truckload (LTL)',
      code: 'CRG-LTL',
      mode: 'Surface Road (LTL)',
      badge: 'Flexible Pallet & Box',
      description: 'Shared line-haul surface transport with scheduled consolidation hubs.',
      active: true,
      minWeightKg: 50,
      maxWeightKg: 5000,
      volumetricDivisor: 4000, // Heavy freight divisor: 1 CBM = 250 kg
      baseWeightKg: 50,
      weightIncrementKg: 10,
      baseRate: 950,
      ratePerAdditionalKg: 8.5,
      fuelSurchargePercent: 8,
      docketCharge: 250,
      transitDays: '3 - 6 Business Days'
    },
    {
      id: 'demo-cargo-ftl-14ft',
      name: 'LogiXpress Dedicated 14ft FTL',
      code: 'CRG-FTL-14',
      mode: 'Dedicated Full Truck (14ft)',
      badge: 'Full Vehicle Booking',
      description: 'Direct point-to-point dedicated vehicle. Payload up to 3,500 kg.',
      active: true,
      minWeightKg: 100,
      maxWeightKg: 3500,
      volumetricDivisor: 4000,
      baseFlatRate: 14500, // Flat route benchmark
      fuelSurchargePercent: 6,
      docketCharge: 400,
      transitDays: '2 - 4 Business Days'
    },
    {
      id: 'demo-cargo-air-bulk',
      name: 'LogiXpress Commercial Air Cargo',
      code: 'CRG-AIR',
      mode: 'Domestic Air Freight',
      badge: 'Express Bulk',
      description: 'Domestic priority cargo hold booking for emergency parts, high-value tech, and pharma.',
      active: true,
      minWeightKg: 25,
      maxWeightKg: 2000,
      volumetricDivisor: 6000,
      baseWeightKg: 25,
      weightIncrementKg: 5,
      baseRate: 2850,
      ratePerAdditionalKg: 42,
      fuelSurchargePercent: 12,
      docketCharge: 350,
      transitDays: '24 - 48 Hours'
    }
  ],

  // Quick / Local Delivery Vehicle Types & Rules
  quickDelivery: {
    baseDistanceKm: 5.0, // Demonstration metropolitan radius
    vehicles: [
      {
        id: 'bike',
        name: '2-Wheeler Courier',
        capacity: 'Up to 10 kg',
        maxWeightKg: 10,
        maxVolumeCm: '40 x 40 x 40 cm',
        baseFare: 45,
        perKmFare: 11,
        suitableFor: 'Documents, food, apparel, small retail parcels',
        icon: 'bi-bicycle'
      },
      {
        id: 'auto3w',
        name: '3-Wheeler Cargo Auto',
        capacity: 'Up to 150 kg',
        maxWeightKg: 150,
        maxVolumeCm: '100 x 80 x 80 cm',
        baseFare: 160,
        perKmFare: 22,
        suitableFor: 'Electronics, wholesale inventory, multiple small cartons',
        icon: 'bi-truck'
      },
      {
        id: 'tata-ace',
        name: 'Mini Truck (Tata Ace / Pickup)',
        capacity: 'Up to 750 kg',
        maxWeightKg: 750,
        maxVolumeCm: '210 x 140 x 120 cm',
        baseFare: 380,
        perKmFare: 34,
        suitableFor: 'Commercial appliances, industrial parts, furniture, bulk boxes',
        icon: 'bi-truck-flatbed'
      }
    ],
    // Demonstration distance matrix between common metropolitan nodes
    distanceEstimates: {
      default: 12.5,
      min: 2.0,
      max: 45.0
    }
  }
};

// Freeze the configuration object to avoid accidental mutations
if (typeof Object.freeze === 'function') {
  Object.freeze(LOGIXPRESS_CONFIG.company);
  Object.freeze(LOGIXPRESS_CONFIG.volumetricDivisors);
}

// Export for Node.js/CommonJS test runners
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LOGIXPRESS_CONFIG;
}
