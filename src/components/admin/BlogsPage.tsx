'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, CalendarDays, ImagePlus, LoaderCircle, NotebookPen, Pencil, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { api, publicImage, type Blog, type BlogDraft, type BlogPoint, type BlogStatus } from '../../api';
import RichTextEditor from './RichTextEditor';

const today = () => {
  const date = new Date();
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
};
const emptyPoint = (): BlogPoint => ({ title: '', subtitle: '', content: '', imageUrl: '', imageAlt: '' });
const emptyBlog = (): BlogDraft => ({ title: '', slug: '', description: '', author: '', date: today(), status: 'draft', imageUrl: '', imageAlt: '', points: [] });

function slugify(value: string) {
  return value.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function hasRichText(value: string) {
  return value.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/gi, ' ').trim().length > 0;
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [draft, setDraft] = useState<BlogDraft>(emptyBlog);
  const [slugTouched, setSlugTouched] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    api.blogs().then(({ data }) => {
      if (active) setBlogs(data);
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Blogs could not be loaded.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  function startCreate() {
    setEditing(null);
    setDraft(emptyBlog());
    setSlugTouched(false);
    setError('');
    setDialogOpen(true);
  }

  function startEdit(blog: Blog) {
    setEditing(blog);
    setDraft({ ...emptyBlog(), ...blog, points: (blog.points || []).map((point) => ({ ...point, imageUrl: point.imageUrl || '', imageAlt: point.imageAlt || '' })) });
    setSlugTouched(true);
    setError('');
    setDialogOpen(true);
  }

  function changeTitle(title: string) {
    setDraft((current) => ({ ...current, title, ...(slugTouched ? {} : { slug: slugify(title) }) }));
  }

  function updatePoint(index: number, patch: Partial<BlogPoint>) {
    setDraft((current) => ({ ...current, points: current.points.map((point, itemIndex) => itemIndex === index ? { ...point, ...patch } : point) }));
  }

  async function uploadImage(file: File | undefined, key: string, onComplete: (url: string) => void) {
    if (!file) return;
    setUploading(key);
    setError('');
    try {
      const result = await api.upload(file);
      onComplete(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Image upload failed.');
    } finally {
      setUploading('');
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasRichText(draft.description)) {
      setError('Add article description before saving.');
      return;
    }
    if (draft.points.some((point) => !hasRichText(point.content))) {
      setError('Add content to every blog point or remove the empty point.');
      return;
    }
    if (!draft.imageUrl) {
      setError('Upload a main image before saving the blog.');
      return;
    }
    if (!draft.imageAlt.trim()) {
      setError('Add alt text for the main image.');
      return;
    }
    if (draft.points.some((point) => point.imageUrl && !point.imageAlt?.trim())) {
      setError('Add alt text for each uploaded point image.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await api.saveBlog({
        ...draft,
        slug: slugify(draft.slug),
        author: draft.author.trim(),
        imageAlt: draft.imageAlt.trim(),
        points: draft.points.map((point) => ({ ...point, imageAlt: point.imageUrl ? (point.imageAlt || '').trim() : '' })),
      }, editing?.id);
      setBlogs((current) => editing
        ? current.map((blog) => blog.id === editing.id ? result.data : blog)
        : [result.data, ...current]);
      setDialogOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Blog could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function removeBlog(blog: Blog) {
    if (!window.confirm(`Delete “${blog.title}”? This cannot be undone.`)) return;
    setError('');
    try {
      await api.deleteBlog(blog.id);
      setBlogs((current) => current.filter((item) => item.id !== blog.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Blog could not be deleted.');
    }
  }

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div><p className="eyebrow">WEBSITE CONTENT</p><h1>Blogs</h1><p className="muted">Create and manage blog articles, drafts and published posts.</p></div>
        <button type="button" className="primary-button" onClick={startCreate}><Plus size={17} /> New blog</button>
      </header>
      {error && !dialogOpen && <div role="alert" className="notice-error mb-5">{error}</div>}
      {loading && <div className="table-panel table-empty">Loading blogs…</div>}
      {!loading && blogs.length === 0 && <section className="table-panel empty-state"><NotebookPen size={28} className="mx-auto mb-3 text-slate-400" /><p>No blog articles yet.</p><button type="button" className="secondary-button mt-4" onClick={startCreate}><Plus size={15} /> Create your first blog</button></section>}
      {!loading && blogs.length > 0 && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {blogs.map((blog) => <article key={blog.id} className="overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="relative aspect-[16/9] bg-slate-100">
            {blog.imageUrl ? <img src={publicImage(blog.imageUrl)} alt={blog.imageAlt || ''} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><ImagePlus size={28} /></div>}
            <span className={`absolute left-3 top-3 inline-flex items-center border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${blog.status === 'published' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-300 bg-white text-slate-600'}`}>{blog.status}</span>
          </div>
          <div className="p-5">
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-500"><CalendarDays size={14} />{formatDate(blog.date)}<span>·</span>{blog.author}</div>
            <h2 className="line-clamp-2 text-lg font-semibold text-slate-900">{blog.title}</h2>
            <p className="mt-1 text-xs text-slate-500">/{blog.slug}</p>
            <div className="mt-4 flex justify-end gap-1 border-t border-slate-100 pt-3">
              <button type="button" className="secondary-button" onClick={() => startEdit(blog)}><Pencil size={14} /> Edit</button>
              <button type="button" className="icon-button danger-action" onClick={() => void removeBlog(blog)} aria-label={`Delete ${blog.title}`} title="Delete blog"><Trash2 size={16} /></button>
            </div>
          </div>
        </article>)}
      </div>}

      {dialogOpen && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDialogOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="blog-dialog-title" className="my-auto w-full max-w-4xl bg-white shadow-2xl">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
            <div><p className="eyebrow">BLOG CONTENT</p><h2 id="blog-dialog-title" className="mt-1 text-xl font-semibold text-slate-900">{editing ? 'Edit blog' : 'Create blog'}</h2></div>
            <button type="button" className="icon-button" onClick={() => setDialogOpen(false)} disabled={saving} aria-label="Close editor"><X size={19} /></button>
          </header>
          <form onSubmit={(event) => void save(event)} className="space-y-5 p-5 sm:p-8">
            {error && <div role="alert" className="notice-error">{error}</div>}
            <section className="form-panel editor-section">
              <div className="form-panel-heading"><span>01</span><div><h3>Article details</h3><p>Title, URL, author, date and publication status.</p></div></div>
              <div className="form-grid">
                <label className="editor-field field-span-2">Title *<input required maxLength={180} value={draft.title} onChange={(event) => changeTitle(event.target.value)} placeholder="Enter blog title" /></label>
                <label className="editor-field field-span-2">Slug *<input required maxLength={200} value={draft.slug} onChange={(event) => { setSlugTouched(true); setDraft((current) => ({ ...current, slug: slugify(event.target.value) })); }} placeholder="blog-url-slug" /><small>Used in the article URL. Lowercase letters, numbers and hyphens only.</small></label>
                <label className="editor-field">Author *<input required maxLength={120} value={draft.author} onChange={(event) => setDraft((current) => ({ ...current, author: event.target.value }))} placeholder="Author name" /></label>
                <label className="editor-field">Publish date *<input required type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></label>
                <label className="editor-field">Status<select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as BlogStatus }))}><option value="draft">Draft</option><option value="published">Published</option></select><small>Only published blogs are public.</small></label>
              </div>
            </section>

            <section className="form-panel editor-section">
              <div className="form-panel-heading"><span>02</span><div><h3>Main image</h3><p>Upload the listing and article hero image with accessible alt text.</p></div></div>
              <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div>
                  <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 border border-slate-300 bg-slate-50 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100">
                    {uploading === 'main' ? <><LoaderCircle className="animate-spin" size={16} /> Uploading…</> : <><Upload size={16} /> {draft.imageUrl ? 'Replace main image' : 'Upload main image'}</>}
                    <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={Boolean(uploading)} onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ''; void uploadImage(file, 'main', (imageUrl) => setDraft((current) => ({ ...current, imageUrl }))); }} />
                  </label>
                  {draft.imageUrl && <img src={publicImage(draft.imageUrl)} alt="Blog main image preview" className="mt-3 max-h-52 w-full object-cover" />}
                </div>
                <label className="editor-field">Main image alt text *<input required maxLength={240} value={draft.imageAlt} onChange={(event) => setDraft((current) => ({ ...current, imageAlt: event.target.value }))} placeholder="Describe the image" /><small>Describe the image for screen-reader users.</small></label>
              </div>
            </section>

            <section className="form-panel editor-section">
              <div className="form-panel-heading"><span>03</span><div><h3>Article description *</h3><p>Write and format the introduction that appears at the start of the article.</p></div></div>
              <div className="editor-field">
                <label htmlFor="blog-description">Description *</label>
                <RichTextEditor
                  id="blog-description"
                  value={draft.description}
                  onChange={(description) => setDraft((current) => ({ ...current, description }))}
                  placeholder="Write the article introduction..."
                  minHeight="240px"
                />
                <small>Use headings, formatting, lists, quotes and links to structure longer content.</small>
              </div>
            </section>

            <section className="form-panel editor-section">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="form-panel-heading mb-0"><span>04</span><div><h3>Article points</h3><p>Add as many sections as needed. Each point can include optional imagery.</p></div></div>
                <button type="button" className="secondary-button" onClick={() => setDraft((current) => ({ ...current, points: [...current.points, emptyPoint()] }))}><Plus size={15} /> Add point</button>
              </div>
              {draft.points.length === 0 && <p className="border border-dashed border-slate-300 px-4 py-6 text-center text-xs text-slate-500">No points added. Add a point to build article sections.</p>}
              <div className="grid gap-4">{draft.points.map((point, index) => <article key={`point-${index}`} className="border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between"><strong className="text-sm text-slate-800">Point {index + 1}</strong><button type="button" className="icon-button danger-action" onClick={() => setDraft((current) => ({ ...current, points: current.points.filter((_, pointIndex) => pointIndex !== index) }))} aria-label={`Remove point ${index + 1}`} title="Remove point"><Trash2 size={16} /></button></div>
                <div className="form-grid">
                  <label className="editor-field">Title *<input required value={point.title} onChange={(event) => updatePoint(index, { title: event.target.value })} placeholder="Section title" /></label>
                  <label className="editor-field">Subtitle<input value={point.subtitle} onChange={(event) => updatePoint(index, { subtitle: event.target.value })} placeholder="Optional subtitle" /></label>
                  <div className="editor-field field-span-2">
                    <label htmlFor={`blog-point-${index}-content`}>Content *</label>
                    <RichTextEditor
                      id={`blog-point-${index}-content`}
                      value={point.content}
                      onChange={(content) => updatePoint(index, { content })}
                      placeholder={`Write content for point ${index + 1}...`}
                      minHeight="180px"
                    />
                    <small>Format each point’s content with headings, lists, quotes, links and emphasis.</small>
                  </div>
                  <div className="field-span-2 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="flex min-h-10 cursor-pointer items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        {uploading === `point-${index}` ? <><LoaderCircle className="animate-spin" size={14} /> Uploading…</> : <><ImagePlus size={15} /> {point.imageUrl ? 'Replace point image' : 'Add optional image'}</>}
                        <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={Boolean(uploading)} onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ''; void uploadImage(file, `point-${index}`, (imageUrl) => updatePoint(index, { imageUrl })); }} />
                      </label>
                      {point.imageUrl && <div className="mt-2 flex items-start gap-3"><img src={publicImage(point.imageUrl)} alt="Point image preview" className="h-20 w-28 object-cover" /><button type="button" className="text-xs text-red-700 underline" onClick={() => updatePoint(index, { imageUrl: '', imageAlt: '' })}>Remove image</button></div>}
                    </div>
                    <label className="editor-field">Image alt text{point.imageUrl ? ' *' : ''}<input required={Boolean(point.imageUrl)} maxLength={240} value={point.imageAlt || ''} onChange={(event) => updatePoint(index, { imageAlt: event.target.value })} placeholder="Describe this point image" /></label>
                  </div>
                </div>
              </article>)}</div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <button type="button" className="back-link mb-0" onClick={() => setDialogOpen(false)} disabled={saving}><ArrowLeft size={15} /> Cancel</button>
              <button type="submit" className="primary-button" disabled={saving || Boolean(uploading)}>{saving ? <><LoaderCircle className="animate-spin" size={16} /> Saving…</> : <><Save size={16} /> {draft.status === 'published' ? 'Publish blog' : 'Save draft'}</>}</button>
            </div>
          </form>
        </section>
      </div>}
    </div>
  );
}
