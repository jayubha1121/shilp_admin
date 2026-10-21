'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { api, type JobOpening, type JobOpeningDraft, type JobType } from '../../api';

const pageSize = 10;
const jobTypes: JobType[] = ['Full-time', 'Part-time', 'Contract', 'Internship'];

const emptyDraft: JobOpeningDraft = {
  title: '',
  description: '',
  responsibilities: '',
  qualifications: '',
  jobType: 'Full-time',
  location: '',
  experience: '',
  isActive: true,
};

function toDraft(opening: JobOpening, isActive = opening.isActive): JobOpeningDraft {
  return {
    title: opening.title,
    description: opening.description,
    responsibilities: opening.responsibilities,
    qualifications: opening.qualifications,
    jobType: opening.jobType,
    location: opening.location,
    experience: opening.experience,
    isActive,
  };
}

export function JobOpeningsPage() {
  const [openings, setOpenings] = useState<JobOpening[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<JobOpening | null>(null);
  const [draft, setDraft] = useState<JobOpeningDraft>(emptyDraft);

  useEffect(() => {
    let current = true;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      const query = new URLSearchParams({ limit: String(pageSize), skip: String(page * pageSize) });
      if (search.trim()) query.set('search', search.trim());
      try {
        const result = await api.jobOpenings(query.toString());
        if (current) {
          setOpenings(result.data);
          setTotal(result.total);
        }
      } catch (cause) {
        if (current) setError(cause instanceof Error ? cause.message : 'Job openings could not be loaded.');
      } finally {
        if (current) setLoading(false);
      }
    }, 200);

    return () => {
      current = false;
      window.clearTimeout(timeout);
    };
  }, [search, page, refresh]);

  function startCreate() {
    setEditing(null);
    setDraft({ ...emptyDraft });
    setError('');
    setDialogOpen(true);
  }

  function startEdit(opening: JobOpening) {
    setEditing(opening);
    setDraft(toDraft(opening));
    setError('');
    setDialogOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.saveJobOpening(draft, editing?.id);
      setDialogOpen(false);
      setRefresh((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Job opening could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function setActive(opening: JobOpening, isActive: boolean) {
    setError('');
    try {
      const result = await api.saveJobOpening(toDraft(opening, isActive), opening.id);
      setOpenings((current) => current.map((item) => item.id === opening.id ? result.data : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Job opening status could not be updated.');
    }
  }

  async function archive(opening: JobOpening) {
    if (!window.confirm(`Archive “${opening.title}”? It will no longer appear on the Careers page.`)) return;
    setError('');
    try {
      await api.archiveJobOpening(opening.id);
      if (openings.length === 1 && page > 0) setPage((value) => value - 1);
      else setRefresh((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Job opening could not be archived.');
    }
  }

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <p className="eyebrow">CAREERS</p>
          <h1>Job Openings Management</h1>
          <p className="muted">Add and manage the positions shown on the public Careers page.</p>
        </div>
        <button type="button" className="primary-button" onClick={startCreate}><Plus size={17} /> Add Job Opening</button>
      </header>

      <section className="table-panel">
        <div className="table-toolbar">
          <label className="search-field"><Search size={17} /><input placeholder="Search job titles" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /></label>
          <span className="result-count">{total} openings</span>
        </div>
        {error && !dialogOpen && <div className="notice-error">{error}</div>}
        <div className="table-scroll">
          <table>
            <thead><tr><th>JOB TITLE</th><th>EXPERIENCE</th><th>STATUS</th><th className="actions-heading">ACTIONS</th></tr></thead>
            <tbody>
              {openings.map((opening) => (
                <tr key={opening.id}>
                  <td><div className="project-cell"><span><strong>{opening.title}</strong><small>{[opening.jobType, opening.location].filter(Boolean).join(' · ') || 'No location specified'}</small></span></div></td>
                  <td>{opening.experience}</td>
                  <td><label className="inline-flex cursor-pointer items-center gap-2 text-xs"><input type="checkbox" checked={opening.isActive} onChange={(event) => void setActive(opening, event.target.checked)} aria-label={`${opening.isActive ? 'Deactivate' : 'Activate'} ${opening.title}`} /><span>{opening.isActive ? 'Active' : 'Inactive'}</span></label></td>
                  <td><div className="row-actions"><button type="button" className="icon-button" onClick={() => startEdit(opening)} aria-label={`Edit ${opening.title}`}><Pencil size={16} /></button><button type="button" className="icon-button danger-action" onClick={() => void archive(opening)} aria-label={`Archive ${opening.title}`}><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
              {!loading && openings.length === 0 && <tr><td colSpan={4} className="table-empty">{error ? 'Could not load job openings.' : 'No job openings found. Add a position to publish it on the Careers page.'}</td></tr>}
              {loading && <tr><td colSpan={4} className="table-empty">Loading job openings…</td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="table-footer">
          <span>Showing {total ? page * pageSize + 1 : 0}–{Math.min((page + 1) * pageSize, total)} of {total}</span>
          <div><button className="icon-button" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button><button className="icon-button" disabled={(page + 1) * pageSize >= total} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight size={17} /></button></div>
        </footer>
      </section>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDialogOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="job-dialog-title" className="my-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><p className="eyebrow">CAREERS</p><h2 id="job-dialog-title" className="mt-1 text-2xl font-semibold text-slate-900">{editing ? 'Edit Job Opening' : 'Add Job Opening'}</h2></div>
              <button type="button" className="icon-button" onClick={() => setDialogOpen(false)} disabled={saving} aria-label="Close dialog"><X size={18} /></button>
            </div>
            <form className="mt-6 space-y-4" onSubmit={(event) => void save(event)}>
              {error && <div className="notice-error">{error}</div>}
              <label className="block text-sm font-medium text-slate-700">Job Title *<input className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-slate-500" required maxLength={160} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
              <label className="block text-sm font-medium text-slate-700">Job Description<textarea className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-slate-500" rows={3} maxLength={4000} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
              <label className="block text-sm font-medium text-slate-700">Key Responsibilities<textarea className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-slate-500" rows={3} maxLength={6000} value={draft.responsibilities} onChange={(event) => setDraft({ ...draft, responsibilities: event.target.value })} /></label>
              <label className="block text-sm font-medium text-slate-700">Qualifications<textarea className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-slate-500" rows={3} maxLength={6000} value={draft.qualifications} onChange={(event) => setDraft({ ...draft, qualifications: event.target.value })} /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">Job Type<select className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-slate-500" value={draft.jobType} onChange={(event) => setDraft({ ...draft, jobType: event.target.value as JobType })}>{jobTypes.map((jobType) => <option key={jobType}>{jobType}</option>)}</select></label>
                <label className="block text-sm font-medium text-slate-700">Work Location<input className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-slate-500" maxLength={160} value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} /></label>
              </div>
              <label className="block text-sm font-medium text-slate-700">Experience *<input className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-slate-500" required maxLength={120} value={draft.experience} onChange={(event) => setDraft({ ...draft, experience: event.target.value })} placeholder="e.g. 2+ Years Experience" /></label>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} />Publish on Careers page</label>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" className="secondary-button" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
