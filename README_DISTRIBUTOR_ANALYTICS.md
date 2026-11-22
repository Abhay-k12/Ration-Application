# 📊 Distributor Analytics Dashboard — Architecture & Implementation Plan

## 📌 Executive Summary
This document outlines the end-to-end architecture, database schema enhancements, backend API design, and frontend UI specifications for the **Distributor Analytics Dashboard** in the Smart-Ration TPDS Administration Portal.

When the Administrator views the list of registered distributors, an interactive **"See Analytics"** button will open a distributor performance & allocation intelligence dashboard. This empowers the Admin to audit commodity allocations, monitor revenue, track scheme utilization, and ensure rations are distributed transparently and accurately.

---

## 🗄️ Database & Schema Requirements Analysis

### 1. Current Schema State (`Transaction` Collection)
Currently, transactions recorded in MongoDB contain the following fields:
```java
public class Transaction {
    @Id
    private String id;
    private String beneficiaryUsername;
    private String aadhaarNumber;
    private YearMonth transactionMonth;
    private LocalDateTime dateOfTransaction;
    private boolean isSynced;
    private boolean faceVerified;
    private String verificationMethod; // "Face Verification" or "Email OTP"
    private List<String> suppliesName;   // e.g. ["Wheat", "Rice", "Sugar"]
    private List<Float> suppliesWeight; // e.g. [5.0, 5.0, 1.0]
    private List<Float> costPerSupplies;// e.g. [10.0, 15.0, 40.0]
    private String distributorUsername; // Indexed
    private Long createdAt;
    private Status status;              // COMPLETED
}
```

### 2. Missing Schema Element: Scheme Tracking
In `TransactionService.java`, the system calculates `applicableScheme` (e.g. `SchemeType.OTHERS`, `AAY`, `BPL`, `APL`) and retrieves the active `Scheme`, but **does not persist `schemeName` and `schemeType`** inside the `Transaction` entity.

### 3. Recommended Database / Schema Additions
To accurately track **"what scheme is used how many times"** as requested, the following fields should be added to the `Transaction` document:

```java
// Add to Transaction.java:
private String schemeName; // e.g. "Antyodaya Anna Yojana (AAY)"
private String schemeType; // e.g. "AAY", "BPL", "APL", "OTHERS"
```

#### Backward Compatibility for Historical Transactions:
For existing records where `schemeName` is null:
- The analytics aggregation service will dynamically look up the beneficiary's `annualIncome` to determine their scheme type retrospectively, or bucket them into `"Income-based General Scheme"`.
- All newly processed transactions will store `schemeName` and `schemeType` explicitly during `processTransaction()`.

---

## 📈 Analytics Metrics & Data Specifications

The analytics endpoint will aggregate all transactions matching `distributorUsername` to calculate:

| Metric | Description | Calculation |
| :--- | :--- | :--- |
| **Total Beneficiaries Served** | Number of unique ration card holders served by this distributor | `count(distinct beneficiaryUsername)` |
| **Total Transactions** | Total ration distribution events completed | `count(transactions)` |
| **Total Revenue Collected** | Total monetary value collected from grain/rations | `sum(costPerSupplies)` across all items |
| **Total Quantity Distributed** | Total weight (in kg) of grains and commodities released | `sum(suppliesWeight)` across all items |
| **Product Breakdown (Pie Chart)** | Share and volume of each commodity (Wheat, Rice, Sugar, etc.) | Group by `suppliesName` with sum of weight and cost |
| **Scheme Usage (Doughnut / Bar)** | Frequency of schemes utilized (AAY, BPL, OTHERS) | Group by `schemeType` with counts and percentages |
| **Verification Method Ratio** | Face Authentication vs Email OTP transactions | Percentage of Face vs OTP |
| **Tabular Product Breakdown** | Itemized table for administrative audit | Product Name, Total Qty (kg), Revenue (₹), Avg Price/kg, Distribution Count |

---

## 🎨 UI / UX & Design System Integration

To ensure the analytics view resonates seamlessly with the existing Admin Dashboard styling, it will follow the established design tokens:

### 1. Design System Tokens
- **Primary Color:** `#1e3a8a` (Deep TPDS Navy Blue)
- **Secondary Color:** `#10b981` (Emerald Action Green)
- **Accent Color:** `#f59e0b` (Warm Amber for scheme alerts)
- **Card Background:** `#ffffff` with subtle borders (`#e2e8f0`) and smooth shadows (`0 4px 6px -1px rgba(0, 0, 0, 0.1)`)
- **Typography:** `Poppins, sans-serif`
- **Charts:** Lightweight Canvas rendering via `Chart.js` using responsive dimensions and color-matched palettes.

### 2. Layout Structure (Modal / Full-Screen Overlay)
```
+-----------------------------------------------------------------------------------------+
| [i] Distributor Analytics: FPS Shop - distributor001 (UP-01)                      [X]   |
+-----------------------------------------------------------------------------------------+
| [ KPI 1: Beneficiaries ]  [ KPI 2: Total Txns ]  [ KPI 3: Total Revenue ]  [ KPI 4: Qty]|
|        142 Users                156 Txns                 ₹14,250                3,200 kg|
+-----------------------------------------------------------------------------------------+
|                                    CHARTS ROW                                           |
|  +---------------------------------------+  +----------------------------------------+  |
|  |  🥧 Commodity Allocation Volume (kg)  |  |  📊 Scheme Utilization Frequency       |  |
|  |  (Pie Chart: Wheat / Rice / Sugar)    |  |  (Doughnut Chart: AAY / BPL / OTHERS)  |  |
|  +---------------------------------------+  +----------------------------------------+  |
+-----------------------------------------------------------------------------------------+
|                                COMMODITY AUDIT TABLE                                    |
|  Product Name   | Total Weight (kg) | Total Revenue (₹) | Avg Rate (₹/kg) | Allocations |
|  Wheat          | 1,600 kg          | ₹3,200            | ₹2.00 / kg      | 156 times   |
|  Rice           | 1,200 kg          | ₹3,600            | ₹3.00 / kg      | 156 times   |
|  Sugar          |   400 kg          | ₹7,450            | ₹18.62 / kg     |  98 times   |
+-----------------------------------------------------------------------------------------+
| [ Close Dashboard ]                                         [ Print / Export Report ]   |
+-----------------------------------------------------------------------------------------+
```

---

## 🛠️ Step-by-Step Implementation Roadmap

### Step 1: Database Schema & Entity Update
- Modify `Transaction.java` to include:
  - `private String schemeName;`
  - `private String schemeType;`
- In `TransactionService.java` (`processTransaction`):
  - Set `transaction.setSchemeName(scheme.getSchemeName());`
  - Set `transaction.setSchemeType(applicableScheme.name());`

### Step 2: Backend Analytics Service & Controller
- In `TransactionService.java`, implement `getDistributorAnalytics(String distributorUsername)`:
  - Queries `transactionRepository.findByDistributorUsername(distributorUsername)`.
  - Computes aggregation: unique beneficiaries, total revenue, itemized product weights, and scheme counts.
- In `AdminController.java`, add endpoint:
  ```java
  @GetMapping("/getDistributorAnalytics/{distributorUsername}")
  public ResponseEntity<?> getDistributorAnalytics(@PathVariable String distributorUsername)
  ```
  Returns `DistributorAnalyticsDTO` or structured Map.

### Step 3: Frontend API Client
- In `api_client.js`, add:
  ```javascript
  async function getDistributorAnalytics(distributorUsername) {
      return apiRequest(`/admin/getDistributorAnalytics/${distributorUsername}`, 'GET');
  }
  ```

### Step 4: Frontend HTML UI (`admin_dashboard.html`)
- Include `Chart.js` in `<head>`:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  ```
- In `#distributorsTableBody`, update action buttons:
  ```html
  <button class="shift-btn" onclick="openComposeMail('${dist.email}')">
      <i class="ri-mail-send-line"></i> Compose Email
  </button>
  <button class="action-btn edit" onclick="viewDistributorAnalytics('${dist.username}')" style="margin-left: 8px;">
      <i class="ri-pie-chart-line"></i> See Analytics
  </button>
  ```
- Add `#distributorAnalyticsModal` with KPI cards, two chart canvases (`#commodityPieChart`, `#schemeDoughnutChart`), and `#commodityTableBody`.

### Step 5: Frontend JS Logic (`admin_dashboard.js`)
- Implement `viewDistributorAnalytics(distributorUsername)`:
  - Fetches data from `/admin/getDistributorAnalytics/{username}`.
  - Updates KPI tiles (Beneficiaries, Revenue, Weight, Txns).
  - Initializes Chart.js pie and doughnut charts with colors matching `--primary` and `--secondary`.
  - Populates the tabular commodity audit rows.
  - Opens the analytics modal.

---

## 🔍 Administrative Audit Value
This feature will directly address transparency:
1. **Detect Discrepancies**: Admin can immediately see if a distributor is over-allocating higher-priced items or favoring particular schemes inappropriately.
2. **Stock Reconciliation**: Compares total allocated commodities against district depot supplies to spot inventory leakage.
3. **Revenue Verification**: Ensures distributors are charging beneficiaries according to mandated government subsidies rather than inflated rates.
