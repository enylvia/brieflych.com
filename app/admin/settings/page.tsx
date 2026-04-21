import Link from "next/link";

import { createAboutAction, deleteAboutAction, updateAboutAction } from "@/app/admin/actions";
import {
  AdminInlineNotice,
  AdminNotice,
  AdminPageIntro,
  AdminSurface,
  StatusBadge,
} from "@/components/admin/admin-primitives";
import { getAboutEntries, getAboutEntryById } from "@/lib/api";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    entryId?: string;
    notice?: string;
    noticeType?: "success" | "error";
  }>;
}) {
  const params = (await searchParams) ?? {};
  const entriesResult = await getAboutEntries();
  const entries = entriesResult.data;
  const selectedId =
    Number(params.entryId) || entries[0]?.id;
  const selectedEntryResult = selectedId ? await getAboutEntryById(selectedId) : { data: null, error: undefined };
  const selectedEntry = selectedEntryResult.data;
  const notice = entriesResult.error || selectedEntryResult.error;

  return (
    <>
      <AdminNotice notice={params.notice} noticeType={params.noticeType} />
      <AdminInlineNotice message={notice} />
      <AdminPageIntro
        title="About Page Content"
        description="Manage the public About page content blocks from the latest internal API."
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <AdminSurface
          title="Available Sections"
          subtitle="Pick a block to edit or create a new section below."
          className="xl:self-start"
        >
          {entries.length === 0 ? (
            <div className="rounded-2xl bg-[#eff4ff] px-4 py-8 text-center text-sm text-slate-500">
              No about sections returned by the internal API yet.
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const active = selectedEntry?.id === entry.id;

                return (
                  <Link
                    key={entry.id}
                    href={`/admin/settings?entryId=${entry.id}`}
                    className={`block rounded-2xl border px-4 py-4 transition-colors ${
                      active
                        ? "border-[#cfcaff] bg-[#eef2ff]"
                        : "border-[#e3e9f8] bg-[#f8faff] hover:border-[#d4ddf4] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{entry.title}</p>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{entry.body}</p>
                      </div>
                      {active ? <StatusBadge tone="primary">Editing</StatusBadge> : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </AdminSurface>

        <div className="space-y-6">
          <AdminSurface
            title="Create Section"
            subtitle="Use only title and body so the admin form stays aligned with the backend contract."
          >
            <form action={createAboutAction} className="space-y-4">
              <input type="hidden" name="redirectTo" value="/admin/settings" />
              <div className="space-y-2">
                <label htmlFor="create-title" className="text-sm font-medium text-slate-700">
                  Title
                </label>
                <input
                  id="create-title"
                  name="title"
                  required
                  placeholder="About BrieflyCH"
                  className="h-11 w-full rounded-xl border border-[#dce5f8] bg-[#f8faff] px-4 text-sm text-slate-800 outline-none transition-colors focus:border-[#4f46e5]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="create-body" className="text-sm font-medium text-slate-700">
                  Body
                </label>
                <textarea
                  id="create-body"
                  name="body"
                  required
                  rows={6}
                  placeholder="Write the public about content here..."
                  className="w-full rounded-2xl border border-[#dce5f8] bg-[#f8faff] px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition-colors focus:border-[#4f46e5]"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#3525cd] to-[#4f46e5] px-5 text-sm font-medium text-white shadow-[0_14px_28px_-18px_rgba(79,70,229,0.55)]"
              >
                Create Section
              </button>
            </form>
          </AdminSurface>

          <AdminSurface
            title="Edit Section"
            subtitle={
              selectedEntry
                ? "This editor uses GET /internal/about/{id} for the selected content block."
                : "Pick a section from the left to load it into the editor."
            }
          >
            {!selectedEntry ? (
              <div className="rounded-2xl bg-[#eff4ff] px-4 py-10 text-center text-sm text-slate-500">
                No about section selected yet.
              </div>
            ) : (
              <div className="space-y-6">
                <form action={updateAboutAction} className="space-y-4">
                  <input type="hidden" name="redirectTo" value={`/admin/settings?entryId=${selectedEntry.id}`} />
                  <input type="hidden" name="aboutId" value={selectedEntry.id} />

                  <div className="space-y-2">
                    <label htmlFor="update-title" className="text-sm font-medium text-slate-700">
                      Title
                    </label>
                    <input
                      id="update-title"
                      name="title"
                      required
                      defaultValue={selectedEntry.title}
                      className="h-11 w-full rounded-xl border border-[#dce5f8] bg-[#f8faff] px-4 text-sm text-slate-800 outline-none transition-colors focus:border-[#4f46e5]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="update-body" className="text-sm font-medium text-slate-700">
                      Body
                    </label>
                    <textarea
                      id="update-body"
                      name="body"
                      required
                      rows={10}
                      defaultValue={selectedEntry.body}
                      className="w-full rounded-2xl border border-[#dce5f8] bg-[#f8faff] px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition-colors focus:border-[#4f46e5]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#3525cd] to-[#4f46e5] px-5 text-sm font-medium text-white shadow-[0_14px_28px_-18px_rgba(79,70,229,0.55)]"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>

                <form action={deleteAboutAction}>
                  <input type="hidden" name="redirectTo" value="/admin/settings" />
                  <input type="hidden" name="aboutId" value={selectedEntry.id} />
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
                  >
                    Delete Section
                  </button>
                </form>
              </div>
            )}
          </AdminSurface>
        </div>
      </div>
    </>
  );
}
