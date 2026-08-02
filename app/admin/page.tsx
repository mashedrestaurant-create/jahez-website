import { getAdminSession } from "../admin-auth";
import { AdminDashboard } from "./admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) {
    return (
      <section className="admin-denied">
        <div>
          <span>JAHEZ CONTROL ROOM</span>
          <h1>غير مصرح بالدخول</h1>
          <p>حسابك غير مضاف ضمن فريق إدارة جاهز أو تم إيقافه.</p>
        </div>
      </section>
    );
  }
  return <AdminDashboard userName={session.name} role={session.role} />;
}
