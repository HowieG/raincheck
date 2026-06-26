import VerifyForm from "./VerifyForm";

export const dynamic = "force-dynamic";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const { phone = "" } = await searchParams;
  return (
    <main className="min-h-dvh bg-[#C9E3E7] text-[#4A1E33] font-sans">
      <div className="px-8 pt-16 pb-10 max-w-md mx-auto w-full flex flex-col gap-8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#C2627E]" />
          <span className="text-xs font-mono tracking-[0.22em] uppercase">Raincheck</span>
        </div>
        <div>
          <h1 className="font-serif text-4xl leading-none">Check your texts.</h1>
          <p className="mt-4 text-[#7A6070] font-mono text-sm">{phone}</p>
        </div>
        <VerifyForm phone={phone} />
      </div>
    </main>
  );
}
