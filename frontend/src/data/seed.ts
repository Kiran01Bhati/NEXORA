import { TERMS, priceLines, productLine } from "@/lib/domain";
import { daysFromNow, minsAgo } from "@/lib/format";
import type {
  Alert,
  AppState,
  AuditEntry,
  Customer,
  Interaction,
  Invoice,
  Lead,
  LedgerEntry,
  Notice,
  Opportunity,
  Payment,
  Product,
  Purchase,
  Quotation,
  Risk,
  SalesOrder,
  UiState,
  User,
} from "@/types";

export const defaultUi = (): UiState => ({
  commandOpen: false,
  notifOpen: false,
  quickOpen: false,
  scenarioOpen: false,
  sidebarCollapsed: false,
  mobileNav: false,
  refreshing: false,
  decision: null,
  quickType: "customer",
  bannerDismissed: false,
});

export function createInitialState(): AppState {
  const users: User[] = [
    { id: "USR-01", name: "Kiran Bhati", role: "Sales Manager", email: "kiran.bhati@airdive.example", status: "Active" },
    { id: "USR-02", name: "Aarav Mehta", role: "Sales Executive", email: "aarav.mehta@airdive.example", status: "Active" },
    { id: "USR-03", name: "Sara Qureshi", role: "Sales Executive", email: "sara.qureshi@airdive.example", status: "Active" },
    { id: "USR-04", name: "Meera Shah", role: "Finance", email: "meera.shah@airdive.example", status: "Active" },
    { id: "USR-05", name: "Rohan Iyer", role: "Inventory Manager", email: "rohan.iyer@airdive.example", status: "Active" },
    { id: "USR-06", name: "Priya Nair", role: "Compliance Officer", email: "priya.nair@airdive.example", status: "Active" },
    { id: "USR-07", name: "Dev Malhotra", role: "Admin", email: "dev.malhotra@airdive.example", status: "Active" },
  ];

  const customers: Customer[] = [
    c("CUS-1001", "Northwind Labs", "Arvind Rao", "arvind.rao@northwindlabs.example", "+91 98200 11420", "Mumbai", "Technology", "27AABCN1001A1Z1", 1200000, 160000, "USR-03", "Active", minsAgo(60 * 26), daysFromNow(-240)),
    c("CUS-1002", "Helios Clinics", "Dr. Ananya Iyer", "ananya.iyer@heliosclinics.example", "+91 98401 55219", "Hyderabad", "Healthcare", "36AABCH1002A1Z2", 800000, 0, "USR-02", "Active", minsAgo(60 * 80), daysFromNow(-400)),
    c("CUS-1003", "Meridian Hotels", "Farhan Sheikh", "farhan@meridianhotels.example", "+91 98111 44032", "Goa", "Hospitality", "30AABCM1003A1Z3", 250000, 280000, "USR-03", "On Hold", minsAgo(60 * 18), daysFromNow(-180)),
    c("CUS-1004", "ABC Hospitality", "Neha Kapoor", "neha.kapoor@abchospitality.example", "+91 98450 22110", "Bengaluru", "Hospitality", "29AABCA1004D1Z8", 1500000, 240000, "USR-02", "Active", minsAgo(140), daysFromNow(-6)),
    c("CUS-1005", "Lumen Retail", "Kabir Sethi", "kabir.sethi@lumenretail.example", "+91 99000 21884", "New Delhi", "Retail", "07AABCL1005A1Z5", 1000000, 90000, "USR-01", "Active", minsAgo(60 * 30), daysFromNow(-320)),
    c("CUS-1006", "Sable Logistics", "Meenakshi Rao", "meena@sablelogistics.example", "+91 98860 77321", "Pune", "Logistics", "27AABCS1006A1Z6", 600000, 30000, "USR-02", "Active", minsAgo(60 * 50), daysFromNow(-150)),
    c("CUS-1007", "Orbit Schools", "Joseph Mathew", "joseph@orbitschools.example", "+91 94440 11873", "Chennai", "Education", "33AABCO1007A1Z7", 300000, 0, "USR-03", "Prospect", minsAgo(60 * 90), daysFromNow(-20)),
    c("CUS-1008", "Kaveri Foods", "Lakshmi Menon", "lakshmi@kaverifoods.example", "+91 98470 66210", "Kochi", "Food & Beverage", "32AABCK1008A1Z8", 500000, 20000, "USR-03", "Active", minsAgo(60 * 40), daysFromNow(-210)),
    c("CUS-1009", "Axiom Data Centers", "Ritu Banerjee", "ritu.banerjee@axiomdc.example", "+91 98800 44190", "Bengaluru", "Infrastructure", "29AABCA1009A1Z9", 2000000, 0, "USR-01", "Active", minsAgo(60 * 12), daysFromNow(-60)),
    c("CUS-1010", "Blue Orchard Resorts", "Imran Qadri", "imran@blueorchard.example", "+91 98290 33018", "Jaipur", "Hospitality", "08AABCB1010A1Z1", 400000, 0, "USR-03", "Prospect", minsAgo(60 * 70), daysFromNow(-12)),
  ];

  const products: Product[] = [
    { id: "PRD-AS", sku: "AD-AS-PRO", name: "AirSense Pro Node", category: "Sensors", kind: "Hardware", price: 70000, onHand: 25, reorder: 8 },
    { id: "PRD-GW", sku: "AD-GW-01", name: "DiveLink Gateway", category: "Network", kind: "Hardware", price: 150000, onHand: 12, reorder: 4 },
    { id: "PRD-LIC", sku: "AD-LIC-ENT", name: "Fleet Dashboard License", category: "Software", kind: "License", price: 240000, onHand: 40, reorder: 5 },
    { id: "PRD-CAL", sku: "AD-CAL-02", name: "Calibration Kit", category: "Service kits", kind: "Hardware", price: 18500, onHand: 4, reorder: 5 },
    { id: "PRD-FLT", sku: "AD-FLT-10", name: "Filter Module", category: "Consumable", kind: "Hardware", price: 4200, onHand: 0, reorder: 20 },
    { id: "PRD-ECU", sku: "AD-ECU-04", name: "Edge Controller", category: "Network", kind: "Hardware", price: 86000, onHand: 5, reorder: 6 },
    { id: "PRD-INS", sku: "AD-SRV-INS", name: "Installation & Commissioning", category: "Services", kind: "Service", price: 45000, onHand: 20, reorder: 2 },
    { id: "PRD-AMC", sku: "AD-SRV-AMC", name: "Annual Maintenance", category: "Services", kind: "Service", price: 36000, onHand: 30, reorder: 4 },
  ];

  const byId = Object.fromEntries(products.map((p) => [p.id, p]));

  const leads: Lead[] = [
    { id: "LD-401", name: "Priya Deshmukh", company: "Veda Resorts", email: "priya@vedaresorts.example", source: "Website", ownerId: "USR-02", value: 450000, status: "New", lastContact: null, createdAt: daysFromNow(-2, 11, 20) },
    { id: "LD-402", name: "Arjun Patel", company: "BluePeak Offices", email: "arjun@bluepeak.example", source: "Referral", ownerId: "USR-03", value: 280000, status: "Contacted", lastContact: daysFromNow(-3, 16, 10), createdAt: daysFromNow(-6, 9, 40) },
    { id: "LD-403", name: "Dr. Nitin Shah", company: "Harbor Clinics", email: "nitin.shah@harbor.example", source: "Campaign", ownerId: "USR-02", value: 610000, status: "Qualified", lastContact: daysFromNow(-4, 15, 0), createdAt: daysFromNow(-12, 10, 5) },
    { id: "LD-404", name: "Sneha Kulkarni", company: "Pixel Mart", email: "sneha@pixelmart.example", source: "Website", ownerId: "USR-03", value: 120000, status: "Lost", lastContact: daysFromNow(-9, 12, 30), createdAt: daysFromNow(-22, 14, 15) },
    { id: "LD-405", name: "Rahul Jain", company: "Aster Cowork", email: "rahul@astercowork.example", source: "Event", ownerId: "USR-01", value: 340000, status: "Contacted", lastContact: daysFromNow(-1, 17, 45), createdAt: daysFromNow(-5, 18, 10) },
    { id: "LD-406", name: "Divya Nair", company: "Coastline Stays", email: "divya@coastlinestays.example", source: "Partner", ownerId: "USR-02", value: 520000, status: "New", lastContact: null, createdAt: daysFromNow(-1, 9, 15) },
  ];

  const opportunities: Opportunity[] = [
    { id: "OPP-318", name: "AirSense rollout — 3 properties", customerId: "CUS-1004", value: 700000, probability: 72, stage: "Negotiation", ownerId: "USR-02", closeDate: daysFromNow(25, 18), createdAt: minsAgo(60 * 24 * 4) },
    { id: "OPP-302", name: "Fleet monitoring license", customerId: "CUS-1001", value: 450000, probability: 55, stage: "Proposal", ownerId: "USR-03", closeDate: daysFromNow(39, 18), createdAt: daysFromNow(-18, 11) },
    { id: "OPP-276", name: "Clinic air quality program", customerId: "CUS-1002", value: 320000, probability: 40, stage: "Qualified", ownerId: "USR-02", closeDate: daysFromNow(57, 18), createdAt: daysFromNow(-21, 15) },
    { id: "OPP-291", name: "Retail sensor network", customerId: "CUS-1005", value: 640000, probability: 60, stage: "Negotiation", ownerId: "USR-01", closeDate: daysFromNow(35, 18), createdAt: daysFromNow(-16, 10) },
    { id: "OPP-255", name: "Yard gateway pilot", customerId: "CUS-1006", value: 210000, probability: 35, stage: "Qualified", ownerId: "USR-02", closeDate: daysFromNow(80, 18), createdAt: daysFromNow(-28, 12) },
    { id: "OPP-240", name: "Campus monitoring", customerId: "CUS-1007", value: 160000, probability: 20, stage: "Lead", ownerId: "USR-03", closeDate: daysFromNow(98, 18), createdAt: daysFromNow(-9, 16) },
    { id: "OPP-188", name: "Cold-chain sensors", customerId: "CUS-1008", value: 180000, probability: 100, stage: "Won", ownerId: "USR-03", closeDate: daysFromNow(-22, 18), createdAt: daysFromNow(-70, 11) },
    { id: "OPP-174", name: "Lobby retrofit", customerId: "CUS-1003", value: 220000, probability: 0, stage: "Lost", ownerId: "USR-03", closeDate: daysFromNow(-24, 18), createdAt: daysFromNow(-80, 11) },
  ];

  const q2041 = quote("QT-2041", "CUS-1004", "OPP-318", [productLine(byId["PRD-AS"], 10)], 25, "Converted", "USR-02", minsAgo(60 * 26), daysFromNow(22), "SO-1042");
  const q2033 = quote("QT-2033", "CUS-1001", "OPP-302", [productLine(byId["PRD-LIC"], 1), productLine(byId["PRD-GW"], 1, 105000), productLine(byId["PRD-INS"], 1, 105000)], 8, "Sent", "USR-03", daysFromNow(-3, 14, 10), daysFromNow(18));
  const q2028 = quote("QT-2028", "CUS-1005", "OPP-291", [productLine(byId["PRD-AS"], 8, 80000)], 22, "Converted", "USR-01", daysFromNow(-2, 11, 40), daysFromNow(16), "SO-1038");
  const q2019 = quote("QT-2019", "CUS-1002", "OPP-276", [productLine(byId["PRD-AS"], 4), productLine(byId["PRD-CAL"], 2, 20000)], 0, "Draft", "USR-02", daysFromNow(-1, 16, 20), daysFromNow(30));
  const q1988 = quote("QT-1988", "CUS-1006", "OPP-255", [productLine(byId["PRD-GW"], 1), productLine(byId["PRD-INS"], 1, 60000)], 10, "Expired", "USR-02", daysFromNow(-40, 10), daysFromNow(-5));
  const quotations: Quotation[] = [q2041, q2033, q2028, q2019, q1988];

  const so1042 = order({
    id: "SO-1042",
    customerId: "CUS-1004",
    quotationId: "QT-2041",
    opportunityId: "OPP-318",
    lines: [productLine(byId["PRD-AS"], 10)],
    discountPct: 25,
    rules: [
      { code: "HIGH_VALUE", category: "High-Value Transaction", detail: "Order exceeds ₹5,00,000.", likelihood: 4, impact: 4, score: 16, level: "High" },
      { code: "DISCOUNT", category: "Discount Risk", detail: "Discount exceeds 20%.", likelihood: 3, impact: 4, score: 12, level: "High" },
    ],
    riskLevel: "High",
    riskScore: 16,
    approvalStatus: "Pending",
    inventoryStatus: "Not Reserved",
    paymentStatus: "Not Invoiced",
    createdBy: "USR-02",
    approverId: "USR-01",
    createdAt: minsAgo(150),
  });

  const so1038 = order({
    id: "SO-1038",
    customerId: "CUS-1005",
    quotationId: "QT-2028",
    opportunityId: "OPP-291",
    lines: [productLine(byId["PRD-AS"], 8, 80000)],
    discountPct: 22,
    rules: [
      { code: "HIGH_VALUE", category: "High-Value Transaction", detail: "Order exceeds ₹5,00,000.", likelihood: 4, impact: 4, score: 16, level: "High" },
      { code: "DISCOUNT", category: "Discount Risk", detail: "Discount exceeds 20%.", likelihood: 3, impact: 4, score: 12, level: "High" },
    ],
    riskLevel: "High",
    riskScore: 16,
    approvalStatus: "Pending",
    inventoryStatus: "Not Reserved",
    paymentStatus: "Not Invoiced",
    createdBy: "USR-01",
    approverId: "USR-06",
    createdAt: minsAgo(60 * 20),
  });

  const so0991 = order({
    id: "SO-0991",
    customerId: "CUS-1003",
    lines: [productLine(byId["PRD-GW"], 3), productLine(byId["PRD-INS"], 4, 50000)],
    discountPct: 10,
    rules: [
      { code: "HIGH_VALUE", category: "High-Value Transaction", detail: "Order exceeds ₹5,00,000.", likelihood: 4, impact: 4, score: 16, level: "High" },
      { code: "CREDIT", category: "Credit Risk", detail: "Outstanding amount exceeds customer credit limit.", likelihood: 5, impact: 5, score: 25, level: "Critical" },
      { code: "PAYMENT", category: "Payment Risk", detail: "Customer has overdue invoices.", likelihood: 3, impact: 3, score: 9, level: "Medium" },
    ],
    riskLevel: "Critical",
    riskScore: 25,
    approvalStatus: "Pending",
    inventoryStatus: "Not Reserved",
    paymentStatus: "Not Invoiced",
    createdBy: "USR-03",
    approverId: "USR-06",
    createdAt: minsAgo(60 * 30),
  });

  const so1010 = order({
    id: "SO-1010",
    customerId: "CUS-1001",
    lines: [productLine(byId["PRD-GW"], 2)],
    discountPct: 0,
    rules: [],
    riskLevel: "None",
    riskScore: 0,
    approvalStatus: "Not Required",
    inventoryStatus: "Reserved",
    paymentStatus: "Partial",
    createdBy: "USR-03",
    approverId: "USR-01",
    createdAt: daysFromNow(-12, 11, 15),
    invoiceId: "INV-1188",
    reservation: [{ productId: "PRD-GW", name: "DiveLink Gateway", sku: "AD-GW-01", required: 2, availableBefore: 14, reserved: 2 }],
  });

  const so1006 = order({
    id: "SO-1006",
    customerId: "CUS-1006",
    lines: [productLine(byId["PRD-ECU"], 1)],
    discountPct: 0,
    rules: [],
    riskLevel: "None",
    riskScore: 0,
    approvalStatus: "Approved",
    inventoryStatus: "Reserved",
    paymentStatus: "Unpaid",
    createdBy: "USR-02",
    approverId: "USR-01",
    createdAt: daysFromNow(-8, 15, 40),
    invoiceId: "INV-1181",
    reservation: [{ productId: "PRD-ECU", name: "Edge Controller", sku: "AD-ECU-04", required: 1, availableBefore: 6, reserved: 1 }],
  });

  const so0994 = order({
    id: "SO-0994",
    customerId: "CUS-1008",
    opportunityId: "OPP-188",
    lines: [productLine(byId["PRD-AS"], 2), productLine(byId["PRD-INS"], 1)],
    discountPct: 5,
    rules: [],
    riskLevel: "None",
    riskScore: 0,
    approvalStatus: "Approved",
    inventoryStatus: "Fulfilled",
    paymentStatus: "Paid",
    createdBy: "USR-03",
    approverId: "USR-01",
    createdAt: daysFromNow(-40, 10, 20),
    invoiceId: "INV-1144",
  });

  const orders: SalesOrder[] = [so1042, so1038, so0991, so1010, so1006, so0994];

  const invoices: Invoice[] = [
    inv("INV-1175", "CUS-1004", undefined, [line("PRD-INS", "Installation balance", "AD-SRV-INS", 1, 240000)], 0, 240000, 0, 240000, "Issued", daysFromNow(-20, 11), daysFromNow(18)),
    inv("INV-1188", "CUS-1001", "SO-1010", [line("PRD-GW", "Gateway deployment — progress bill", "AD-GW-01", 1, 236000)], 0, 236000, 76000, 160000, "Partially Paid", daysFromNow(-12, 11, 30), daysFromNow(12)),
    inv("INV-1166", "CUS-1003", undefined, [line("PRD-AMC", "Annual maintenance — overdue", "AD-SRV-AMC", 1, 280000)], 0, 280000, 0, 280000, "Overdue", daysFromNow(-50, 10), daysFromNow(-20)),
    inv("INV-1190", "CUS-1005", undefined, [line("PRD-CAL", "Calibration services", "AD-CAL-02", 1, 90000)], 0, 90000, 0, 90000, "Overdue", daysFromNow(-28, 12), daysFromNow(-12)),
    inv("INV-1181", "CUS-1006", "SO-1006", [line("PRD-ECU", "Edge controller — partial bill", "AD-ECU-04", 1, 30000)], 0, 30000, 0, 30000, "Issued", daysFromNow(-8, 16), daysFromNow(8)),
    inv("INV-1201", "CUS-1008", undefined, [line("PRD-FLT", "Consumables", "AD-FLT-10", 1, 20000)], 0, 20000, 0, 20000, "Issued", daysFromNow(-4, 13), daysFromNow(10)),
    inv("INV-1172", "CUS-1002", undefined, [line("PRD-AS", "Clinic sensor installation", "AD-AS-PRO", 1, 148680)], 0, 148680, 148680, 0, "Paid", daysFromNow(-18, 9), daysFromNow(-5)),
    inv("INV-1144", "CUS-1008", "SO-0994", [line("PRD-AS", "Cold-chain project", "AD-AS-PRO", 1, 218300)], 0, 218300, 218300, 0, "Paid", daysFromNow(-36, 10), daysFromNow(-20)),
  ];

  const payments: Payment[] = [
    { id: "PAY-5521", invoiceId: "INV-1172", customerId: "CUS-1002", amount: 148680, method: "NEFT", date: daysFromNow(-6, 14, 12), status: "Cleared", reference: "NEFT240318441", recordedBy: "USR-04" },
    { id: "PAY-5490", invoiceId: "INV-1188", customerId: "CUS-1001", amount: 76000, method: "UPI", date: daysFromNow(-4, 11, 5), status: "Cleared", reference: "UPI8842109931", recordedBy: "USR-04" },
    { id: "PAY-5402", invoiceId: "INV-1144", customerId: "CUS-1008", amount: 218300, method: "RTGS", date: daysFromNow(-22, 16, 40), status: "Cleared", reference: "RTGS992110", recordedBy: "USR-04" },
  ];

  const ledger: LedgerEntry[] = [
    led("LED-01", daysFromNow(-60, 9), "OPEN", "Accounts Receivable", "Opening receivable balance", 820000, 0),
    led("LED-02", daysFromNow(-60, 9), "OPEN", "Opening Equity", "Opening receivable balance", 0, 820000),
    led("LED-10", daysFromNow(-2, 17, 10), "FEE-19", "Bank Charges", "Collection charges", 250, 0),
    led("LED-11", daysFromNow(-2, 17, 10), "FEE-19", "Bank", "Collection charges", 0, 250),
  ];

  const risks: Risk[] = [
    risk("RSK-1042", "HIGH_VALUE", "High-Value Transaction", "SO-1042", "Sales Order", "CUS-1004", 4, 4, 16, "High", "USR-02", "Open", "Require manager approval", "Order exceeds ₹5,00,000.", minsAgo(149), "engine"),
    risk("RSK-1043", "DISCOUNT", "Discount Risk", "SO-1042", "Sales Order", "CUS-1004", 3, 4, 12, "High", "USR-02", "Open", "Require manager approval", "Discount exceeds 20%.", minsAgo(149), "engine"),
    risk("RSK-1038", "HIGH_VALUE", "High-Value Transaction", "SO-1038", "Sales Order", "CUS-1005", 4, 4, 16, "High", "USR-01", "Open", "Escalated — creator is the sales manager", "Order exceeds ₹5,00,000.", minsAgo(60 * 20), "engine"),
    risk("RSK-1039", "DISCOUNT", "Discount Risk", "SO-1038", "Sales Order", "CUS-1005", 3, 4, 12, "High", "USR-01", "Open", "Escalated — creator is the sales manager", "Discount exceeds 20%.", minsAgo(60 * 20), "engine"),
    risk("RSK-0991", "CREDIT", "Credit Risk", "SO-0991", "Sales Order", "CUS-1003", 5, 5, 25, "Critical", "USR-03", "Open", "Escalate to compliance", "Outstanding amount exceeds customer credit limit.", minsAgo(60 * 30), "engine"),
    risk("RSK-0992", "PAYMENT", "Payment Risk", "INV-1190", "Invoice", "CUS-1005", 3, 3, 9, "Medium", "USR-04", "Monitoring", "Collections follow-up", "Invoice INV-1190 is overdue.", daysFromNow(-12, 9), "recorded"),
    risk("RSK-0970", "INVENTORY", "Inventory Risk", "AD-FLT-10", "Product", undefined, 4, 3, 12, "High", "USR-05", "Open", "Inbound purchase PO-438", "Filter Module is out of stock.", daysFromNow(-3, 8, 30), "recorded"),
    risk("RSK-0955", "FREQUENCY", "Transaction Frequency", "CUS-1006", "Customer", "CUS-1006", 2, 2, 4, "Low", "USR-01", "Closed", "Accepted — seasonal replenishment", "Three small orders inside 30 days.", daysFromNow(-15, 11), "recorded"),
    risk("RSK-0944", "SOD", "Segregation of Duties", "CTRL-SOD-01", "Control", undefined, 3, 5, 15, "High", "USR-06", "Monitoring", "Dual control enforced", "Creator and approver must be different users.", daysFromNow(-45, 10), "recorded"),
  ];

  const alerts: Alert[] = [
    { id: "ALT-220", severity: "High", title: "High risk on SO-1042", body: "ABC Hospitality · ₹7,00,000 · high value and 25% discount. Pending manager approval.", at: minsAgo(149), status: "Open", page: "case", entityId: "SO-1042" },
    { id: "ALT-218", severity: "High", title: "Invoice INV-1190 overdue", body: "Lumen Retail · ₹90,000 outstanding past due.", at: daysFromNow(-2, 8, 15), status: "Open", page: "invoice", entityId: "INV-1190" },
    { id: "ALT-214", severity: "High", title: "Filter Module out of stock", body: "AD-FLT-10 available 0. Reorder level 20. PO-438 is inbound.", at: daysFromNow(-3, 8, 40), status: "Open", page: "inventory", entityId: "PRD-FLT" },
    { id: "ALT-209", severity: "Critical", title: "Credit limit breach — Meridian Hotels", body: "Outstanding ₹2,80,000 against a ₹2,50,000 limit. SO-0991 is waiting on compliance.", at: minsAgo(60 * 18), status: "Open", page: "case", entityId: "SO-0991" },
    { id: "ALT-201", severity: "Medium", title: "Calibration Kit below reorder", body: "4 available against a reorder level of 5.", at: daysFromNow(-1, 7, 50), status: "Open", page: "inventory", entityId: "PRD-CAL" },
    { id: "ALT-188", severity: "Info", title: "Payment cleared — Helios Clinics", body: "₹1,48,680 applied to INV-1172.", at: daysFromNow(-6, 14, 20), status: "Acknowledged", page: "payments", entityId: "PAY-5521" },
  ];

  const interactions: Interaction[] = [
    { id: "INT-01", customerId: "CUS-1004", type: "Meeting", subject: "Site walkthrough — Indiranagar property", body: "Neha confirmed three properties for the AirSense rollout and asked for volume pricing above 20%.", ownerId: "USR-02", at: minsAgo(60 * 30) },
    { id: "INT-02", customerId: "CUS-1004", type: "Email", subject: "Quotation QT-2041 sent", body: "Sent the 10-node quotation with a 25% project discount. Validity 22 days.", ownerId: "USR-02", at: minsAgo(60 * 26) },
    { id: "INT-03", customerId: "CUS-1004", type: "Call", subject: "Discount confirmation", body: "Neha accepted the commercial terms. Aarav raised SO-1042 the same afternoon.", ownerId: "USR-02", at: minsAgo(180) },
    { id: "INT-04", customerId: "CUS-1001", type: "Demo", subject: "Fleet dashboard walkthrough", body: "Arvind wants gateway failover demonstrated before accepting QT-2033.", ownerId: "USR-03", at: daysFromNow(-3, 15, 30) },
    { id: "INT-05", customerId: "CUS-1005", type: "Meeting", subject: "Store rollout scope", body: "Kabir asked to hold 22% if installation is bundled. Order raised by Kiran.", ownerId: "USR-01", at: minsAgo(60 * 22) },
    { id: "INT-06", customerId: "CUS-1003", type: "Call", subject: "Credit hold explained", body: "Farhan was told new supply is blocked until the overdue balance is inside the limit.", ownerId: "USR-03", at: minsAgo(60 * 16) },
    { id: "INT-07", customerId: "CUS-1002", type: "Email", subject: "Paid invoice acknowledgement", body: "Shared the paid copy of INV-1172 and proposed a clinic program for two more sites.", ownerId: "USR-02", at: daysFromNow(-5, 11, 10) },
    { id: "INT-08", customerId: "CUS-1009", type: "Note", subject: "Intro from facilities lead", body: "Axiom may need 40 nodes across two halls. No quotation yet.", ownerId: "USR-01", at: minsAgo(60 * 12) },
    { id: "INT-09", customerId: "CUS-1008", type: "Email", subject: "AMC reminder", body: "Small consumable invoice INV-1201 is open. Cold-chain project is already paid.", ownerId: "USR-03", at: daysFromNow(-4, 13, 20) },
  ];

  const purchases: Purchase[] = [
    { id: "PO-441", vendor: "Vertex Components", productId: "PRD-AS", qty: 20, value: 1120000, status: "Received", expected: daysFromNow(-14, 10), ownerId: "USR-05", createdAt: daysFromNow(-21, 9) },
    { id: "PO-438", vendor: "HelioFab", productId: "PRD-FLT", qty: 40, value: 112000, status: "Ordered", expected: daysFromNow(6, 10), ownerId: "USR-05", createdAt: daysFromNow(-3, 11) },
    { id: "PO-429", vendor: "Calibra Labs", productId: "PRD-CAL", qty: 10, value: 140000, status: "Partial", expected: daysFromNow(2, 10), ownerId: "USR-05", createdAt: daysFromNow(-6, 15) },
    { id: "PO-422", vendor: "EdgeForge", productId: "PRD-ECU", qty: 6, value: 408000, status: "Received", expected: daysFromNow(-20, 10), ownerId: "USR-05", createdAt: daysFromNow(-28, 10) },
  ];

  const audit: AuditEntry[] = [
    aud("AUD-1001", minsAgo(60 * 24 * 6), "USR-02", "Aarav Mehta", "Created Customer", "Customer", "CUS-1004", "—", "ABC Hospitality", "Success"),
    aud("AUD-1002", minsAgo(60 * 24 * 4), "USR-02", "Aarav Mehta", "Created Opportunity", "Opportunity", "OPP-318", "—", "₹7,00,000", "Success"),
    aud("AUD-1003", minsAgo(60 * 26), "USR-02", "Aarav Mehta", "Generated Quotation", "Quotation", "QT-2041", "—", "₹7,00,000", "Success"),
    aud("AUD-1004", minsAgo(150), "USR-02", "Aarav Mehta", "Created Sales Order", "Sales Order", "SO-1042", "—", "₹7,00,000", "Success"),
    aud("AUD-1005", minsAgo(149), "system", "System", "Risk Detected", "Sales Order", "SO-1042", "Normal", "High", "Warning"),
    aud("AUD-1006", minsAgo(60 * 20), "USR-01", "Kiran Bhati", "Created Sales Order", "Sales Order", "SO-1038", "—", "₹6,40,000", "Success"),
    aud("AUD-1007", minsAgo(60 * 20 - 1), "system", "System", "Risk Detected", "Sales Order", "SO-1038", "Normal", "High", "Warning"),
    aud("AUD-1008", minsAgo(60 * 18), "system", "System", "Escalated Approval", "Sales Order", "SO-1038", "Sales Manager", "Compliance Officer", "Info"),
    aud("AUD-1009", daysFromNow(-6, 14, 12), "USR-04", "Meera Shah", "Recorded Payment", "Payment", "PAY-5521", "Unpaid", "₹1,48,680", "Success"),
    aud("AUD-1010", daysFromNow(-4, 11, 5), "USR-04", "Meera Shah", "Recorded Payment", "Payment", "PAY-5490", "₹2,36,000", "₹76,000 received", "Success"),
    aud("AUD-1011", daysFromNow(-3, 8, 40), "system", "System", "Stock Alert", "Product", "AD-FLT-10", "Low Stock", "Out of Stock", "Warning"),
    aud("AUD-1012", daysFromNow(-12, 11, 20), "USR-01", "Kiran Bhati", "Approved Order", "Sales Order", "SO-1010", "Pending", "Not Required", "Success"),
    aud("AUD-1013", daysFromNow(-8, 15, 45), "USR-01", "Kiran Bhati", "Approved Order", "Sales Order", "SO-1006", "Pending", "Approved", "Success"),
    aud("AUD-1014", minsAgo(60 * 12), "USR-01", "Kiran Bhati", "Logged Interaction", "Customer", "CUS-1009", "—", "Intro note", "Info"),
  ];

  const notices: Notice[] = [
    { id: "NTC-1", title: "High risk detected", body: "SO-1042 · ABC Hospitality · 2 rules triggered.", at: minsAgo(149), read: false, page: "case", entityId: "SO-1042", tone: "danger" },
    { id: "NTC-2", title: "Approvals waiting", body: "3 sales orders need an independent decision.", at: minsAgo(80), read: false, page: "approvals", tone: "warning" },
    { id: "NTC-3", title: "Overdue invoice", body: "INV-1190 · Lumen Retail · ₹90,000.", at: daysFromNow(-2, 8, 15), read: false, page: "invoice", entityId: "INV-1190", tone: "warning" },
    { id: "NTC-4", title: "Payment received", body: "Helios Clinics · ₹1,48,680 via NEFT.", at: daysFromNow(-6, 14, 12), read: true, page: "payments", entityId: "PAY-5521", tone: "success" },
    { id: "NTC-5", title: "Stockout", body: "Filter Module available quantity is zero.", at: daysFromNow(-3, 8, 40), read: true, page: "inventory", entityId: "PRD-FLT", tone: "danger" },
  ];

  return {
    version: 1,
    userId: "USR-01",
    view: { page: "dashboard" },
    history: [],
    customers,
    leads,
    opportunities,
    quotations,
    orders,
    products,
    purchases,
    invoices,
    payments,
    ledger,
    risks,
    alerts,
    interactions,
    audit,
    notices,
    users,
    policy: { highValue: 500000, discountPct: 20, creditWarnPct: 80 },
    toasts: [],
    ui: defaultUi(),
  };
}

function line(productId: string, name: string, sku: string, qty: number, unitPrice: number) {
  return { productId, name, sku, qty, unitPrice };
}

function c(
  id: string,
  company: string,
  contact: string,
  email: string,
  phone: string,
  city: string,
  industry: string,
  gstin: string,
  creditLimit: number,
  outstanding: number,
  ownerId: string,
  status: Customer["status"],
  lastActivity: string,
  since: string,
): Customer {
  return { id, company, contact, email, phone, city, industry, gstin, creditLimit, outstanding, ownerId, status, lastActivity, since };
}

function quote(
  id: string,
  customerId: string,
  opportunityId: string | undefined,
  lines: Quotation["lines"],
  discountPct: number,
  status: Quotation["status"],
  createdBy: string,
  createdAt: string,
  validUntil: string,
  orderId?: string,
): Quotation {
  const priced = priceLines(lines, discountPct);
  return { id, customerId, opportunityId, lines, discountPct, ...priced, status, validUntil, createdBy, createdAt, orderId, terms: TERMS };
}

function order(input: Omit<SalesOrder, "terms" | "sodAttempts" | "gross" | "discountAmt" | "net" | "tax" | "total"> & Partial<Pick<SalesOrder, "sodAttempts">>): SalesOrder {
  const priced = priceLines(input.lines, input.discountPct);
  return { ...input, ...priced, terms: TERMS, sodAttempts: input.sodAttempts ?? [] };
}

function inv(
  id: string,
  customerId: string,
  orderId: string | undefined,
  lines: Invoice["lines"],
  discountPct: number,
  amount: number,
  paid: number,
  outstanding: number,
  status: Invoice["status"],
  issuedAt: string,
  due: string,
  notes?: string,
): Invoice {
  const priced = priceLines(lines, discountPct);
  return {
    id,
    customerId,
    orderId,
    lines,
    discountPct,
    gross: priced.gross || amount,
    discountAmt: priced.discountAmt,
    net: priced.net || amount,
    tax: priced.tax,
    amount,
    paid,
    outstanding,
    status,
    issuedAt,
    due,
    notes,
  };
}

function led(id: string, date: string, reference: string, account: string, description: string, debit: number, credit: number): LedgerEntry {
  return { id, date, reference, account, description, debit, credit };
}

function risk(
  id: string,
  code: string,
  category: string,
  transaction: string,
  transactionType: string,
  customerId: string | undefined,
  likelihood: number,
  impact: number,
  score: number,
  level: Risk["level"],
  ownerId: string,
  status: Risk["status"],
  treatment: string,
  detail: string,
  createdAt: string,
  source: Risk["source"],
): Risk {
  return { id, code, category, transaction, transactionType, customerId, likelihood, impact, score, level, ownerId, status, treatment, detail, createdAt, source };
}

function aud(
  id: string,
  at: string,
  userId: string,
  userName: string,
  action: string,
  entity: string,
  entityId: string,
  previous: string,
  next: string,
  status: AuditEntry["status"],
): AuditEntry {
  return { id, at, userId, userName, action, entity, entityId, previous, next, status };
}
