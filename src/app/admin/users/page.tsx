import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { format as formatPhone } from "@/lib/phone";
import AddUserForm from "./AddUserForm";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin();
  const roster = await db.select().from(users).orderBy(asc(users.createdAt));
  return (
    <main className="min-h-dvh bg-[#C9E3E7] text-[#4A1E33] font-sans">
      <div className="px-8 pt-16 pb-10 max-w-md mx-auto w-full flex flex-col gap-10">
        <div>
          <div className="text-[11px] font-mono tracking-[0.14em] uppercase text-[#7A6070]">
            Admin · Roster
          </div>
          <h1 className="mt-2 font-serif text-4xl leading-tight">
            Who's around.
          </h1>
        </div>
        <AddUserForm />
        <div className="flex flex-col gap-3">
          {roster.map((u) => (
            <div
              key={u.id}
              className="bg-[#E8DBB9] border border-[#1a17171a] rounded-2xl p-4 flex items-center justify-between"
            >
              <div>
                <div className="font-serif text-xl">{u.name}</div>
                <div className="font-mono text-xs text-[#7A6070] mt-1">{formatPhone(u.phone)}</div>
                {u.email ? (
                  <div className="font-mono text-[10px] text-[#A89F95] mt-0.5">{u.email}</div>
                ) : null}
              </div>
              {u.isAdmin ? (
                <span className="text-[10px] font-mono tracking-wider uppercase text-[#B0863C]">
                  admin
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
