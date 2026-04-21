import { ShieldCheck } from "lucide-react";

import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{
    next?: string;
    notice?: string;
    reason?: string;
    noticeType?: "success" | "error";
  }>;
}) {
  const params = (await searchParams) ?? {};
  const notice = getLoginNotice(params.reason);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#eef3ff_0%,#f8f9ff_50%,#e8edfb_100%)] px-4 py-10 text-[#0b1c30]">
      <section className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#3525cd] text-white shadow-[0_20px_44px_-24px_rgba(53,37,205,0.85)]">
            <ShieldCheck className="size-7" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">BrieflyCH Admin</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in to manage jobs, worker runs, sources, and about-page content.
          </p>
        </div>

        <div className="rounded-[30px] border border-white/80 bg-white/94 p-6 shadow-[0_34px_84px_-48px_rgba(11,28,48,0.42)]">
          <AdminLoginForm nextPath={params.next} notice={notice} />
        </div>
      </section>
    </main>
  );
}

function getLoginNotice(reason?: string) {
  if (reason === "expired") {
    return "Session expired. Please login again.";
  }
  if (reason === "logged_out") {
    return "You have been logged out.";
  }

  return undefined;
}
