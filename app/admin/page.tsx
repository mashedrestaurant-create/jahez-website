"use client";
import { useAdminStore } from "../lib/admin-store";
import { OverviewTab } from "./tabs/overview";
import { OrdersTab } from "./tabs/orders";
import { ProductsTab } from "./tabs/products";
import { CategoriesTab } from "./tabs/categories";
import { LocationsTab } from "./tabs/locations";
import { DriversTab } from "./tabs/drivers";
import { CustomersTab } from "./tabs/customers";
import { OffersTab } from "./tabs/offers";
import { PaymentsTab } from "./tabs/payments";
import { MediaTab } from "./tabs/media";
import { SettingsTab } from "./tabs/settings";
import { ContentTab } from "./tabs/content";
import { TestimonialsTab } from "./tabs/testimonials";
import { UsersTab } from "./tabs/users";
import { ActivityTab } from "./tabs/activity";

const TAB_MAP: Record<string, React.FC> = {
  overview: OverviewTab,
  orders: OrdersTab,
  products: ProductsTab,
  categories: CategoriesTab,
  locations: LocationsTab,
  drivers: DriversTab,
  customers: CustomersTab,
  offers: OffersTab,
  payments: PaymentsTab,
  media: MediaTab,
  settings: SettingsTab,
  content: ContentTab,
  testimonials: TestimonialsTab,
  users: UsersTab,
  activity: ActivityTab,
};

export default function AdminPage() {
  const { activeTab } = useAdminStore();
  const Component = TAB_MAP[activeTab] || OverviewTab;
  return <Component />;
}
