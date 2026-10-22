'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { api, publicImage, type ProjectTreeDraft, type ProjectTreeItem, type ProjectTreeType } from '../../api';

const emptyDraft: ProjectTreeDraft = {
  year: String(new Date().getFullYear()),
  title: '',
  location: '',
  type: 'residential',
  image: '',
  imageAlt: '',
  isActive: true,
};

const types: ProjectTreeType[] = ['residential', 'commercial', 'plotted'];
const pageSize = 10;

export function ProjectTreePage() {
  const [items, setItems] = useState<ProjectTreeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState<'active' | 'archived' | 'all'>('active');
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectTreeItem | null>(null);
  const [draft, setDraft] = useState<ProjectTreeDraft>(emptyDraft);

  useEffect(() => {
    let current = true;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      const query = new URLSearchParams({ limit: String(pageSize), skip: String(page * pageSize) });
      if (search.trim()) query.set('search', search.trim());
      if (/^[12]\d{3}$/.test(year.trim())) query.set('year', year.trim());
      if (type) query.set('type', type);
      if (status !== 'all') query.set('status', status);
      try {
        const result = await api.projectTree(query.toString());
        if (current) {
          setItems(result.data);
          setTotal(result.total);
        }
      } catch (cause) {
        if (current) setError(cause instanceof Error ? cause.message : 'Project tree items could not be loaded.');
      } finally {
        if (current) setLoading(false);
      }
    }, 250);

    return () => {
      current = false;
      window.clearTimeout(timeout);
    };
  }, [search, year, type, status, page, refresh]);

  function startCreate() {
    setEditing(null);
    setDraft({ ...emptyDraft, year: String(new Date().getFullYear()) });
    setError('');
    setDialogOpen(true);
  }

  function startEdit(item: ProjectTreeItem) {
    setEditing(item);
    setDraft({
      year: item.year,
      title: item.title,
      location: item.location,
      type: item.type,
      image: item.image,
      imageAlt: item.imageAlt,
      isActive: item.isActive,
    });
    setError('');
    setDialogOpen(true);
  }

  async function uploadImage(file?: File) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const result = await api.upload(file);
      setDraft((current) => ({
        ...current,
        image: result.url,
        imageAlt: current.imageAlt || file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.saveProjectTreeItem(draft, editing?.id);
      setDialogOpen(false);
      setRefresh((current) => current + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Project tree item could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function archive(item: ProjectTreeItem) {
    if (!window.confirm(`Archive “${item.title}”? It will disappear from the public website.`)) return;
    setError('');
    try {
      await api.archiveProjectTreeItem(item.id);
      if (items.length === 1 && page > 0) setPage((current) => current - 1);
      else setRefresh((current) => current + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Project tree item could not be archived.');
    }
  }

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <p className="eyebrow">PORTFOLIO</p>
          <h1>Project Tree</h1>
          <p className="muted">Manage the projects displayed on the public project overview page.</p>
        </div>
        <button type="button" className="primary-button" onClick={startCreate}><Plus size={17} /> Add project</button>
      </header>

      <section className="table-panel">
        <div className="table-toolbar">
          <label className="search-field"><Search size={17} /><input placeholder="Search title or location" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /></label>
          <label className="filter-select"><span>Year</span><input inputMode="numeric" maxLength={4} placeholder="All years" value={year} onChange={(event) => { setYear(event.target.value.replace(/\D/g, '')); setPage(0); }} /></label>
          <label className="filter-select"><span>Category</span><select value={type} onChange={(event) => { setType(event.target.value); setPage(0); }}><option value="">All categories</option>{types.map((itemType) => <option key={itemType} value={itemType}>{itemType}</option>)}</select></label>
          <label className="filter-select"><span>Status</span><select value={status} onChange={(event) => { setStatus(event.target.value as 'active' | 'archived' | 'all'); setPage(0); }}><option value="active">Active</option><option value="archived">Archived</option><option value="all">All statuses</option></select></label>
          <span className="result-count">{total} records</span>
        </div>
        {error && !dialogOpen && <div className="notice-error">{error}</div>}
        <div className="table-scroll">
          <table>
            <thead><tr><th>PROJECT</th><th>YEAR</th><th>CATEGORY</th><th>STATUS</th><th className="actions-heading">ACTIONS</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><div className="project-cell"><img src={publicImage(item.image)} alt="" /><span><strong>{item.title}</strong><small>{item.location}</small></span></div></td>
                  <td>{item.year}</td>
                  <td><span className="category-label">{item.type}</span></td>
                  <td><span className={`table-status ${item.isActive ? 'status-active' : 'status-archived'}`}><i />{item.isActive ? 'Active' : 'Archived'}</span></td>
                  <td><div className="row-actions"><button type="button" className="icon-button" onClick={() => startEdit(item)} aria-label={`Edit ${item.title}`}><Pencil size={16} /></button><button type="button" className="icon-button danger-action" onClick={() => void archive(item)} aria-label={`Archive ${item.title}`}><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
              {!loading && items.length === 0 && <tr><td colSpan={5} className="table-empty">{error ? 'Could not load project tree.' : 'No matching project tree items. Add a project to get started.'}</td></tr>}
              {loading && <tr><td colSpan={5} className="table-empty">Loading project tree…</td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="table-footer"><span>Showing {total ? page * pageSize + 1 : 0}–{Math.min((page + 1) * pageSize, total)} of {total}</span><div><button className="icon-button" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button><button className="icon-button" disabled={(page + 1) * pageSize >= total} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight size={17} /></button></div></footer>
      </section>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving && !uploading) setDialogOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="tree-dialog-title" className="my-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><p className="eyebrow">PROJECT TREE</p><h2 id="tree-dialog-title" className="mt-1 text-2xl font-semibold text-slate-900">{editing ? 'Edit project' : 'Add project'}</h2><p className="mt-1 text-sm text-slate-500">This information appears on the public project overview.</p></div>
              <button type="button" className="icon-button" onClick={() => setDialogOpen(false)} disabled={saving || uploading} aria-label="Close dialog"><X size={18} /></button>
            </div>
            <form className="mt-6 space-y-5" onSubmit={(event) => void save(event)}>
              {error && <div className="notice-error">{error}</div>}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">Year<input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-slate-500" required inputMode="numeric" pattern="[12][0-9]{3}" maxLength={4} value={draft.year} onChange={(event) => setDraft({ ...draft, year: event.target.value.replace(/\D/g, '').slice(0, 4) })} /></label>
                <label className="block text-sm font-medium text-slate-700">Project type<select className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal capitalize outline-none focus:border-slate-500" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as ProjectTreeType })}>{types.map((itemType) => <option key={itemType} value={itemType}>{itemType}</option>)}</select></label>
                <label className="block text-sm font-medium text-slate-700 sm:col-span-2">Project title<input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-slate-500" required maxLength={120} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
                <label className="block text-sm font-medium text-slate-700 sm:col-span-2">Location<input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-slate-500" required maxLength={160} value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} /></label>
              </div>
              <div>
                <span className="block text-sm font-medium text-slate-700">Project image</span>
                {draft.image && <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 p-2"><img className="h-16 w-24 rounded object-cover" src={publicImage(draft.image)} alt={draft.imageAlt} /><span className="min-w-0 flex-1 truncate text-xs text-slate-500">{draft.image}</span></div>}
                <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-600 hover:bg-slate-50"><Upload size={17} />{uploading ? 'Uploading image…' : 'Choose image to upload'}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" disabled={uploading || saving} onChange={(event) => { void uploadImage(event.target.files?.[0]); event.currentTarget.value = ''; }} /></label>
                <label className="mt-3 block text-sm font-medium text-slate-700">Image description<input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-slate-500" required maxLength={240} value={draft.imageAlt} onChange={(event) => setDraft({ ...draft, imageAlt: event.target.value })} /></label>
              </div>
              {editing && <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} />Show on the public website</label>}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" className="secondary-button" onClick={() => setDialogOpen(false)} disabled={saving || uploading}>Cancel</button><button type="submit" className="primary-button" disabled={saving || uploading || !draft.image}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add project'}</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
