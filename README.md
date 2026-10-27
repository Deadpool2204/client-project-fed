# LogiXpress Enterprise Shipping Rate Calculator

An enterprise-grade, responsive, multi-carrier shipping rate calculator prototype engineered for courier and logistics companies. Built with HTML5, CSS3, Bootstrap 5.3, Bootstrap Icons, Vanilla JavaScript (ES6+), and Chart.js.

Designed following modern B2B SaaS aesthetics: clean typography, an 8px grid system, restrained navy/slate color palette, accessible field validation, verified logistics calculation formulas, and zero unnecessary visual clutter.

---

## 1. Key Features & Workflows

### A. Domestic Shipping Calculator (`domestic.html` & `index.html#domestic`)
- **PIN Code Routing & Auto-Detection**: Validates 6-digit Indian PIN codes, identifies originating and destination cities/states, and determines logistics circles.
- **Location Swap**: One-click origin and destination PIN code swapper with smooth UI rotation.
- **Live Volumetric & Chargeable Weight Preview**: Instant updates of volumetric weight `(L × W × H) / 5000` and chargeable weight `max(actual, volumetric)` as dimensions are keyed in.
- **Cash on Delivery (COD) Rules**: Dynamically displays collection input with business rule validation (greater of ₹45 flat fee or 2.0% collection charge, up to ₹50,000 maximum).
- **Shipment Flow Support**: Forward delivery, Return to Origin (RTO), and Reverse Pickup (1.25× multiplier).
- **Statutory GST Breakdown**: Automatic 18% GST calculation with itemized CGST 9% + SGST 9% for intra-state and IGST 18% for inter-state routes.

### B. International Shipping Calculator (`international.html` & `index.html#international`)
- **Global Country Master**: Searchable database of 30+ major trade lane countries across North America, Europe, Middle East, and Asia-Pacific.
- **Flexible Postal Code Validation**: Country-specific regex patterns (e.g. US 5-digit ZIP, UK alphanumeric, Canada A1A 1A1) while gracefully supporting countries where postal codes are optional (e.g. UAE, Qatar).
- **Multi-Currency Support**: Real-time conversion across INR, USD, EUR, GBP, AED, CAD, and AUD using `Intl.NumberFormat`.
- **Unit Flexibility**: Metric (`kg`, `cm`) and Imperial (`lbs`, `in`) toggle with automatic mathematical conversion.
- **Regulatory Transparency**: Explicit customs notices clarifying that import duties, destination VAT, and broker fees are determined solely by destination customs authorities (DDU/DAP terms) and are not fabricated.

### C. Commercial Cargo & Bulk Freight (`cargo.html` & `index.html#cargo`)
- **Multi-Package & Pallet Manifest Builder**: Dynamically add and remove multiple package types (Master Cartons, Standard Pallets 120×80 cm, Euro Pallets, Heavy Wooden Crates, Drums, Custom Boxes).
- **Live CBM & Weight Aggregation**: Real-time totals for pieces, physical weight, cubic metre (CBM) volume, and chargeable cargo weight.
- **Special Equipment Add-ons**: Hydraulic tail-lift (+₹500), Inside building delivery (+₹750), Forklift assistance (+₹1,200), and Dock appointment scheduling (+₹350).

### D. Quick / Hyperlocal Metropolitan Delivery (`quick-delivery.html` & `index.html#quick`)
- **Fleet Selection**: 2-Wheeler Courier (up to 10kg), 3-Wheeler Cargo Auto (up to 150kg), and Mini Truck (Tata Ace up to 750kg).
- **Urgency Levels**: Instant Priority (2-hour SLA), Same-Day Evening, and Next-Day Standard.
- **Transparent Routing Notice**: Labeled demonstration estimates based on standard metropolitan distance matrices.

### E. Rate Comparison & Analysis Tools
- **Sorting & Filtering Toolbar**: Sort by lowest price, fastest transit, service name; filter by transport mode (Surface vs Air) and transit days.
- **High Information Density Table & Mobile Cards**: Responsive comparison table on desktop that collapses cleanly into touch-optimized cards on mobile.
- **Restrained Badges**: Highlights cheapest rate and fastest delivery without visual noise.
- **Interactive Chart.js Visualizations**:
  - Cost Component Breakdown (Base Freight vs Fuel Surcharge vs Surcharges vs GST).
  - Weight Analysis Doughnut Chart (Actual Weight vs Volumetric Weight).
- **Line-by-Line Itemized Modal**: Complete audit trail of freight charges, additional weight charges, fuel index, COD fees, insurance, and taxes.
- **Export Capabilities**:
  - Download estimate as CSV spreadsheet.
  - Copy formatted estimate summary to clipboard with toast notification.
  - Print-ready official freight quotation memo with `@media print` styling.
- **LocalStorage Quote Manager**: Save quotes to an offcanvas drawer, delete individual quotes, or clear history with confirmation.

---

## 2. Project Structure

```
shipping-calculator/
├── index.html                 # Unified multi-service shipping calculator portal
├── domestic.html              # Dedicated domestic shipping calculator page
├── international.html         # Dedicated international air freight page
├── cargo.html                 # Dedicated commercial cargo & bulk freight page
├── quick-delivery.html        # Dedicated hyperlocal / quick delivery page
├── faq.html                   # Logistics knowledge base & domain guide
├── tests.html                 # Visual in-browser automated test runner
├── assets/
│   ├── css/
│   │   ├── main.css           # Design tokens, 8px grid, typography, forms, buttons
│   │   ├── components.css     # Comparison table, pills, charts, modal, drawer
│   │   └── responsive.css     # Mobile breakpoints and clean print quotation memo
│   ├── js/
│   │   ├── config.js          # Demo rate cards, zones, countries, exchange rates
│   │   ├── validation.js      # Strict PIN, postal code, dimension, and weight rules
│   │   ├── pricing-engine.js  # Verified mathematical and logistics calculation engine
│   │   ├── storage.js         # LocalStorage history manager with confirmation
│   │   ├── export.js          # CSV export, clipboard copy, and print generator
│   │   ├── results.js         # Table/cards renderer, Chart.js visualizer, filters
│   │   ├── calculator.js      # Form controllers, live previews, dynamic rows
│   │   └── app.js             # Master coordinator, tabs, deep links, demo presets
│   └── images/
├── tests/
│   └── calculator-tests.js    # Automated unit & integration test suite (40 assertions)
└── README.md                  # System architecture, tariff guides, and API integration
```

---

## 3. How to Run Locally

Because the application uses clean standard web technologies (HTML5, Vanilla ES6 JavaScript, CSS3), it can be run using any local static web server or opened directly in a modern web browser.

### Option A: Using Python (Recommended)
```bash
# In the project root directory
python -m http.server 8080
```
Open your browser and navigate to:
```
http://localhost:8080
```

### Option B: Using Node.js `npx http-server`
```bash
npx http-server -p 8080
```

### Option C: Direct Browser Execution
Double-click `index.html` in your file explorer to open it directly in Chrome, Firefox, Safari, or Edge.

---

## 4. Automated Testing

The project includes a comprehensive automated test suite verifying 40 critical business logic assertions:
- Volumetric weight calculation with 5000, 6000, and 4000 divisors.
- Chargeable weight selection (`max(actual, volumetric)`).
- Multi-package and multi-pallet aggregation and CBM computation.
- Indian postal zone determination (Zone A, B, C, D, E).
- COD fee threshold and percentage calculations.
- Declared value insurance thresholding.
- Weight slab rounding and 18% GST tax computations.
- Reverse logistics multipliers (1.25×).
- Country-specific postal code validation (US, UK, UAE optional).
- Currency formatting and sanitization of zero/negative inputs.

### Running Tests in Node.js
```bash
node -e "const t = require('./tests/calculator-tests.js'); t.runAllTests();"
```

### Running Tests Visually in the Browser
Open `tests.html` in your browser or click the **Tests** link in the application navbar to view live pass/fail badges, assertion details, and execution timing.

---

## 5. Replacing Demo Tariffs with Real Carrier Rate Cards

The rate structure is completely decoupled from UI markup in `assets/js/config.js`. To replace demonstration tariffs with real negotiated rate cards or contract tariffs:

### A. Updating Domestic Courier Tariffs
Edit `LOGIXPRESS_CONFIG.domesticTariffs` in `assets/js/config.js`:
```javascript
{
  id: 'carrier-surface-contract',
  name: 'Your Company Express Road',
  code: 'EXP-ROAD',
  mode: 'Surface',
  active: true,
  minWeightKg: 0.5,
  maxWeightKg: 500,
  volumetricDivisor: 5000,
  fuelSurchargePercent: 9.5,
  baseWeightKg: 0.5,
  weightIncrementKg: 0.5,
  pricingByZone: {
    A: { baseRate: 42, additionalRate: 28, transitMinDays: 1, transitMaxDays: 2 },
    B: { baseRate: 58, additionalRate: 36, transitMinDays: 2, transitMaxDays: 3 },
    C: { baseRate: 72, additionalRate: 44, transitMinDays: 3, transitMaxDays: 4 },
    D: { baseRate: 90, additionalRate: 55, transitMinDays: 4, transitMaxDays: 6 },
    E: { baseRate: 140, additionalRate: 85, transitMinDays: 6, transitMaxDays: 9 }
  }
}
```

### B. Connecting to a Backend Rate API
The pricing engine is designed so `LogiPricingEngine.calculateDomesticRates` can be converted into an asynchronous network call:

```javascript
// Example future backend service interface
async function fetchCarrierRatesFromBackend(shipmentPayload) {
  const response = await fetch('/api/v1/shipping/rates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shipmentPayload)
  });
  if (!response.ok) throw new Error('Carrier rate API unavailable');
  return await response.json();
}
```

---

## 6. Assumptions & Limitations

1. **Demonstration Rates**: Tariffs included in `config.js` represent industry-standard rate cards for Indian and international corridors; they are not official carrier price commitments.
2. **Local Delivery Distance**: Intra-city distance in the Quick Delivery module is benchmarked to standard metropolitan nodes (12.5 km). Production implementations require integration with Google Maps Distance Matrix, Mapbox, or open-source OSRM routing APIs.
3. **Customs Duties**: As per domain best practices, cross-border import duties and destination VAT are explicitly labeled as excluded, as they require destination customs clearance inspection and commercial harmonized system tariff schedules.
4. **GST Treatment**: Domestic freight applies standard 18% GST (9% CGST + 9% SGST for intra-state; 18% IGST for inter-state) based on reverse-charge and forward-charge logistics norms.

---

## 7. License & Credits

Developed for enterprise logistics prototyping. Compliant with standard IATA dimensional rules and Indian Carriage by Road Rules 2011.
