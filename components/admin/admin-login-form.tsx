"use client";

import { useActionState } from "react";
import { LockKeyhole, UserRound } from "lucide-react";

import { loginAdminAction, type LoginActionState } from "@/app/admin/actions";

const initialState: LoginActionState = {};

export function AdminLoginForm({
  nextPath,
  notice,
}: {
  nextPath?: string;
  notice?: string;
}) {
  const [state, formAction, pending] = useActionState(loginAdminAction, initialState);
  const message = state.message || notice;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={nextPath ?? "/admin"} />

      {message ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
          {message}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-semibold text-slate-700">
          Username
        </label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="username"
            name="username"
            autoComplete="username"
            required
            className="h-12 w-full rounded-2xl border border-[#dce5f8] bg-[#f8faff] pl-11 pr-4 text-sm text-slate-800 outline-none transition-colors focus:border-[#4f46e5] focus:bg-white"
            placeholder="admin"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-semibold text-slate-700">
          Password
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-12 w-full rounded-2xl border border-[#dce5f8] bg-[#f8faff] pl-11 pr-4 text-sm text-slate-800 outline-none transition-colors focus:border-[#4f46e5] focus:bg-white"
            placeholder="Enter your password"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#3525cd] to-[#4f46e5] px-5 text-sm font-semibold text-white shadow-[0_20px_42px_-22px_rgba(53,37,205,0.78)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
      >
        {pending ? "Signing in..." : "Sign in to Admin"}
      </button>
    </form>
  );
}
