"use client";
import { useAdminStore } from "../lib/admin-store";
import { OverviewTab } from "./tabs/overview";
import { AnalyticsTab } from "./tabs/analytics";
import { OrdersTab } from "./tabs/orders";
import { ProductsTab } from "./tabs/products";
import { CategoriesTab } from "./tabs/categories";
import { LocationsTab } from "./tabs/locations";
import { DriversTab } from "./tabs/drivers";
import { PaymentsTab } from "./tabs/payments";
import { SettingsTab } from "./tabs/settings";
import { UsersTab } from "./tabs/users";
import { MediaTab } from "./tabs/media";
import { OffersTab } from "./tabs/offers";
import { ActivityTab } from "./tabs/activity";

const TAB_MAP: Record<string, React.FC> = {
  overview: OverviewTab,
  analytics: AnalyticsTab,
  orders: OrdersTab,
  products: ProductsTab,
  categories: CategoriesTab,
  locations: LocationsTab,
  drivers: DriversTab,
  payments: PaymentsTab,
  settings: SettingsTab,
  users: UsersTab,
  media: MediaTab,
  offers: OffersTab,
  activity: ActivityTab,
};

export default function AdminPage() {
  const { activeTab } = useAdminStore();
  const Component = TAB_MAP[activeTab] || OverviewTab;
  return <Component />;
}
