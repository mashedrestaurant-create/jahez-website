import { sql, gte, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customers } from "@/db/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  try {
    const db = getDb();

    const allCustomers = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        birthday: customers.birthday,
        area: customers.area,
        ordersCount: customers.ordersCount,
        totalSpent: customers.totalSpent,
        lastSeenAt: customers.lastSeenAt,
      })
      .from(customers)
      .orderBy(sql`${customers.lastSeenAt} desc`)
      .limit(250);

    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const nextMm = String(((now.getMonth() + 1) % 12) + 1).padStart(2, "0");
    const nextMonthLastDay = new Date(now.getFullYear(), (now.getMonth() + 1) % 12 + 1, 0).getDate();
    const nextDd = String(nextMonthLastDay).padStart(2, "0");

    const upcomingBirthdays = allCustomers.filter((c) => {
      if (!c.birthday || c.birthday.length < 10) return false;
      const bdayMMDD = c.birthday.slice(5, 10);
      return bdayMMDD >= `${mm}-${dd}` && bdayMMDD <= `${nextMm}-${nextDd}`;
    });

    const firstTimers = allCustomers.filter((c) => c.ordersCount === 1);
    const repeatCustomers = allCustomers.filter((c) => c.ordersCount >= 2);
    const vipCustomers = allCustomers.filter((c) => c.totalSpent >= 500);

    const counts = {
      total: allCustomers.length,
      withBirthday: allCustomers.filter((c) => c.birthday && c.birthday.length > 0).length,
      firstTimers: firstTimers.length,
      repeat: repeatCustomers.length,
      vip: vipCustomers.length,
    };

    return Response.json({
      counts,
      segments: {
        upcomingBirthdays: upcomingBirthdays.slice(0, 100),
        firstTimers: firstTimers.slice(0, 100),
        repeatCustomers: repeatCustomers.slice(0, 100),
        vipCustomers: vipCustomers.slice(0, 100),
      },
    });
  } catch (error) {
    console.error("segments error", error);
    return Response.json(
      { counts: { total: 0, withBirthday: 0, firstTimers: 0, repeat: 0, vip: 0 }, segments: { upcomingBirthdays: [], firstTimers: [], repeatCustomers: [], vipCustomers: [] } },
      { status: 200 },
    );
  }
}
