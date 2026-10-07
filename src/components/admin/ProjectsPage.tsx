'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { api, publicImage, type Project } from '../../api';

const pageSize = 10;

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setBusy(true);
    setError('');
    const query = new URLSearchParams({ limit: String(pageSize), skip: String(page * pageSize) });
    if (search.trim()) query.set('search', search.trim());
    if (type !== 'all') query.set('type', type);
    try {
      const result = await api.projects(query.toString());
      setProjects(result.data);
      setTotal(result.total);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Projects could not be loaded.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void load(); }, [search, type, page]);

  async function archive(project: Project) {
    if (!window.confirm(`Archive “${project.projectDetail.title}”? It will disappear from the public website.`)) return;
    try {
      await api.archive(project.id);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Project could not be archived.');
    }
  }

  return (
    <div className="page-wrap">
      <header className="page-header"><div><p className="eyebrow">PORTFOLIO</p><h1>Projects</h1><p className="muted">Manage the projects displayed across the Shilp website.</p></div><Link href="/admin/projects/new" className="primary-button"><Plus size={17} /> Add project</Link></header>
      <section className="table-panel">
        <div className="table-toolbar"><label className="search-field"><Search size={17} /><input placeholder="Search projects" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /></label><label className="filter-select"><span>Category</span><select value={type} onChange={(event) => { setType(event.target.value); setPage(0); }}><option value="all">All categories</option><option value="commercial">Commercial</option><option value="residential">Residential</option><option value="plotted">Plotted</option></select></label><span className="result-count">{total} records</span></div>
        {error && <div className="notice-error">{error}</div>}
        <div className="table-scroll"><table><thead><tr><th>PROJECT</th><th>CATEGORY</th><th>STATUS</th><th>UPDATED</th><th className="actions-heading">ACTIONS</th></tr></thead><tbody>
          {projects.map((project) => <tr key={project.id}><td><div className="project-cell"><img src={publicImage(project.banner.banner)} alt="" /><span><strong>{project.projectDetail.title}</strong><small>{project.projectDetail.shortAddress || 'No location'}</small></span></div></td><td><span className="category-label">{project.typeOfProject}</span></td><td><span className={`table-status ${project.isActive ? 'status-active' : 'status-archived'}`}><i />{project.isActive ? 'Active' : 'Archived'}</span></td><td>{new Date(project.updatedAt).toLocaleDateString()}</td><td><div className="row-actions"><a className="icon-button" href={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/projects/${project.slug}`} target="_blank" rel="noreferrer" aria-label="View public project"><ArrowUpRight size={16} /></a><Link className="icon-button" href={`/admin/projects/${project.id}`} aria-label={`Edit ${project.projectDetail.title}`}><Pencil size={16} /></Link><button className="icon-button danger-action" onClick={() => void archive(project)} aria-label={`Archive ${project.projectDetail.title}`}><Trash2 size={16} /></button></div></td></tr>)}
          {!busy && projects.length === 0 && <tr><td colSpan={5} className="table-empty">No matching projects.</td></tr>}
          {busy && <tr><td colSpan={5} className="table-empty">Loading projects…</td></tr>}
        </tbody></table></div>
        <footer className="table-footer"><span>Showing {total ? page * pageSize + 1 : 0}–{Math.min((page + 1) * pageSize, total)} of {total}</span><div><button className="icon-button" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button><button className="icon-button" disabled={(page + 1) * pageSize >= total} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight size={17} /></button></div></footer>
      </section>
    </div>
  );
}