'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Building2, CheckCircle2, CircleDashed, Plus } from 'lucide-react';
import Link from 'next/link';
import { api, publicImage, type Project } from '../../api';

export function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.projects('limit=200&skip=0').then((result) => setProjects(result.data)).catch((cause) => setError(cause.message));
  }, []);

  const active = projects.filter((project) => project.isActive);
  const counts = ['commercial', 'residential', 'plotted'].map((type) => ({ type, count: active.filter((project) => project.typeOfProject === type).length }));

  return (
    <div className="page-wrap">
      <header className="page-header"><div><p className="eyebrow">{new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()).toUpperCase()}</p><h1>Overview</h1><p className="muted">A clear view of your project portfolio.</p></div><Link className="primary-button" href="/admin/projects/new"><Plus size={17} /> Add project</Link></header>
      {error && <div className="notice-error">{error}</div>}
      <section className="stats-grid" aria-label="Project summary">
        <article className="stat-card stat-card-dark"><span className="stat-icon"><Building2 size={19} /></span><p>Total projects</p><strong>{projects.length}</strong><small>Across all categories</small></article>
        <article className="stat-card"><span className="stat-icon green"><CheckCircle2 size={19} /></span><p>Active projects</p><strong>{active.length}</strong><small>Visible on the website</small></article>
        {counts.map(({ type, count }) => <article key={type} className="stat-card category-stat"><span className="stat-icon"><CircleDashed size={19} /></span><p>{type}</p><strong>{count}</strong><small>Current portfolio</small></article>)}
      </section>
      <section className="content-section"><div className="section-heading"><div><p className="eyebrow">LATEST UPDATES</p><h2>Recently updated</h2></div><Link href="/admin/projects" className="text-link">All projects <ArrowUpRight size={15} /></Link></div>
        <div className="recent-list">{projects.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5).map((project) => <Link className="recent-row" key={project.id} href={`/admin/projects/${project.id}`}><span className="recent-image" style={{ backgroundImage: `url(${publicImage(project.banner.banner)})` }} /><span className="recent-title"><strong>{project.projectDetail.title}</strong><small>{project.typeOfProject} · {project.projectDetail.shortAddress || 'Location not set'}</small></span><span className={`status-dot ${project.isActive ? 'on' : 'off'}`} /><span className="recent-date">{new Date(project.updatedAt).toLocaleDateString()}</span><ArrowUpRight size={16} className="recent-arrow" /></Link>)}
          {!projects.length && !error && <p className="empty-state">No projects yet. Add your first project to begin.</p>}
        </div>
      </section>
    </div>
  );
}