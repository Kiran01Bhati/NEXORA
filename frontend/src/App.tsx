import { AppProvider, useApp } from "@/store/store";
import { Shell } from "@/components/shell";
import { RiskCasePage } from "@/components/risk-case";
import { Dashboard } from "@/pages/Dashboard";
import { CustomerPage, CustomersPage, InteractionsPage, LeadsPage, OpportunitiesPage, PipelinePage, QuotationPage, QuotationsPage } from "@/pages/Crm";
import { AccountsPage, InventoryPage, InvoicePage, InvoicesPage, OrderPage, OrdersPage, PaymentsPage, ProductsPage, PurchasesPage } from "@/pages/Erp";
import { AlertsPage, ApprovalsPage, RegisterPage, RiskDashboardPage } from "@/pages/Risk";
import { AnalyticsPage, ReportsPage } from "@/pages/Insights";
import { AuditPage, HierarchyPage, RolesPage, SettingsPage, UsersPage } from "@/pages/Admin";

function Router() {
  const { state } = useApp();
  switch (state.view.page) {
    case "dashboard":
      return <Dashboard />;
    case "customers":
      return <CustomersPage />;
    case "customer":
      return <CustomerPage />;
    case "leads":
      return <LeadsPage />;
    case "opportunities":
      return <OpportunitiesPage />;
    case "pipeline":
      return <PipelinePage />;
    case "quotations":
      return <QuotationsPage />;
    case "quotation":
      return <QuotationPage />;
    case "interactions":
      return <InteractionsPage />;
    case "products":
      return <ProductsPage />;
    case "inventory":
      return <InventoryPage />;
    case "purchases":
      return <PurchasesPage />;
    case "orders":
      return <OrdersPage />;
    case "order":
      return <OrderPage />;
    case "invoices":
      return <InvoicesPage />;
    case "invoice":
      return <InvoicePage />;
    case "payments":
      return <PaymentsPage />;
    case "accounts":
      return <AccountsPage />;
    case "risk":
      return <RiskDashboardPage />;
    case "register":
      return <RegisterPage />;
    case "alerts":
      return <AlertsPage />;
    case "approvals":
      return <ApprovalsPage />;
    case "case":
      return <RiskCasePage />;
    case "reports":
      return <ReportsPage />;
    case "analytics":
      return <AnalyticsPage />;
    case "users":
      return <UsersPage />;
    case "roles":
      return <RolesPage />;
    case "hierarchy":
      return <HierarchyPage />;
    case "audit":
      return <AuditPage />;
    case "settings":
      return <SettingsPage />;
    default:
      return <Dashboard />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <Shell>
        <Router />
      </Shell>
    </AppProvider>
  );
}
