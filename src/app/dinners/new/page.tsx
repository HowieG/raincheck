import { asc, ne } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/session";
import NewDinnerForm from "./NewDinnerForm";

export const dynamic = "force-dynamic";

export default async function NewDinnerPage() {
  const me = await requireUser();
  const others = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(ne(users.id, me.id))
    .orderBy(asc(users.name));
  return (
    <main className="min-h-dvh bg-[#C9E3E7] text-[#4A1E33] font-sans">
      <div className="px-7 pt-12 pb-8 max-w-md mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-[#7A6070]">
            Close
          </Link>
          <span className="font-serif text-xl">New dinner</span>
          <span className="text-sm text-[#7A6070] opacity-0">Close</span>
        </div>
        <NewDinnerForm me={{ id: me.id, name: me.name }} others={others} />
      </div>
    </main>
  );
}
