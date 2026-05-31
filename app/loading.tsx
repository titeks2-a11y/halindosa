export default function Loading() {
  return (
    <div className="space-y-4 px-3 py-4 sm:px-4 lg:px-0 lg:py-8" aria-label="할인도사 화면을 불러오는 중">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-5 w-28 animate-pulse rounded-full bg-red-100" />
        <div className="mt-4 h-8 w-3/4 animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
      </section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <article key={index} className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-100" />
            <div className="mt-3 h-4 w-24 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-2 h-5 w-full animate-pulse rounded-full bg-slate-100" />
            <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
          </article>
        ))}
      </section>
    </div>
  );
}
