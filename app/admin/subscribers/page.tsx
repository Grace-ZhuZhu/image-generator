import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { adminAccessAllowed } from "@/utils/admin";

export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage(props: {
  searchParams?: Promise<Record<string, string | string[]>>;
}) {
  const searchParams = (await props.searchParams) || {};
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }
  if (!adminAccessAllowed(user.email)) {
    // 保持和现有 Admin 模块风格一致：非管理员/未开启时隐藏
    return notFound();
  }

  // Read query
  const qRaw = searchParams?.q;
  const q = Array.isArray(qRaw) ? qRaw[0] : qRaw;
  const pageRaw = searchParams?.page;
  const page = parseInt(Array.isArray(pageRaw) ? pageRaw[0] : pageRaw || "1", 10) || 1;
  const pageSize = 100;
  const from = (page - 1) * pageSize;

  // Use service role if available to bypass potential RLS for admin listing
  const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceRoleClient() : supabase;

  let query = db.from("notify_subscribers").select("id,email,created_at").order("created_at", { ascending: false });
  if (q && q.trim()) {
    query = query.ilike("email", `%${q.trim()}%`);
  }

  // Note: Supabase range is inclusive; fetch +pageSize-1 to get exactly pageSize rows
  const { data: rows, error } = await query.range(from, from + pageSize - 1);
  if (error) {
    console.error("/admin/subscribers select error:", error);
  }

  // counts
  const totalCountPromise = db
    .from("notify_subscribers")
    .select("id", { count: "exact", head: true });
  const filteredCountPromise = (q && q.trim())
    ? db.from("notify_subscribers").select("id", { count: "exact", head: true }).ilike("email", `%${q.trim()}%`)
    : null;
  const [{ count: totalCount }] = await Promise.all([
    totalCountPromise,
  ]);
  const filteredCount = filteredCountPromise ? (await filteredCountPromise).count : undefined;

  // Simple next/prev pager indicator
  const hasNext = (rows?.length || 0) === pageSize;

  return (
    <div className="container px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notify Subscribers</h1>
        <div className="flex items-center gap-2">
          <form action="/admin/subscribers" method="GET" className="flex items-center gap-2">
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder="Search email..."
              className="h-9 w-56 rounded-md border bg-background px-3 text-sm"
            />
            <button type="submit" className="h-9 rounded-md border px-3 text-sm">Search</button>
          </form>
          <div className="text-sm text-muted-foreground hidden sm:block">
            Total: {totalCount ?? "-"}
            {typeof filteredCount === "number" && q ? (
              <span> · Matching: {filteredCount}</span>
            ) : null}
          </div>
          <a
            href={`/api/admin/subscribers?format=csv${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className="h-9 rounded-md border px-3 text-sm bg-primary text-primary-foreground"
          >
            Export CSV
          </a>
        </div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 w-[180px]">Created At</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3 w-[80px]">ID</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3 font-medium">{r.email}</td>
                <td className="p-3 text-muted-foreground">{r.id}</td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={3}>
                  No records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Page {page}
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            const prevDisabled = page <= 1;
            const prevHref = prevDisabled
              ? "#"
              : `/admin/subscribers?${new URLSearchParams({ ...(q ? { q } : {}), page: String(Math.max(1, page - 1)) }).toString()}`;
            const base = "h-9 rounded-md border px-3 text-sm";
            return (
              <a
                href={prevHref}
                aria-disabled={prevDisabled}
                className={base + (prevDisabled ? " opacity-50 pointer-events-none" : "")}
              >
                Prev
              </a>
            );
          })()}
          {(() => {
            const nextDisabled = !hasNext;
            const nextHref = nextDisabled
              ? "#"
              : `/admin/subscribers?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) }).toString()}`;
            const base = "h-9 rounded-md border px-3 text-sm";
            return (
              <a
                href={nextHref}
                aria-disabled={nextDisabled}
                className={base + (nextDisabled ? " opacity-50 pointer-events-none" : "")}
              >
                Next
              </a>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

