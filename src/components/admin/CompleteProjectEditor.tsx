'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ImagePlus, LoaderCircle, Plus, Save, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, publicImage, type Project, type ProjectAmenity, type ProjectCategory, type ProjectDraft, type ProjectFaq, type ProjectImage, type ProjectState } from '../../api';

const emptyImage = (): ProjectImage => ({ title: '', image: '', alt: '' });
const blankProject = (): ProjectDraft => ({
  slug: '', typeOfProject: 'residential', projectState: 'On-going', statusPercentage: 0,
  projectDetail: { title: '', shortAddress: '', projectWorkStatus: 'On-going', brochure: '', projectStatus: 'On-going' },
  banner: { banner: '', mobileBanner: '' },
  aboutUs: { description: [], image: '', imageAlt: '', faqs: [] },
  floorPlans: [], projectImages: [], amenities: [],
  projectUpdates: { title: '', images: [emptyImage(), emptyImage()] },
  location: { title: '', description: '', area: '', phone1: '9898211567', phone2: '9898508567', email1: '', email2: '', mapUrl: '', address1: '', address2: '', city: '', state: 'Gujarat', zip: '', country: 'India' },
  projectVideo: { videoUrl: '', title: '' }, reraDetails: '', isActive: true,
  year: new Date().getFullYear().toString(), typology: '', plotSize: '',
});

function slugify(value: string) {
  return value.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function UploadField({ label, value, onFile, required = false, wide = false, iconPreview = false, uploading = false, accept = 'image/png,image/jpeg,image/webp,image/gif' }: {
  label: string; value: string; onFile: (file?: File) => void; required?: boolean; wide?: boolean; iconPreview?: boolean; uploading?: boolean; accept?: string;
}) {
  return (
    <label className={`asset-field ${wide ? 'asset-field-wide' : ''} ${iconPreview ? 'asset-icon-field' : ''}`}>
      <span className="asset-label">{label}{required && <b> *</b>}</span>
      <span className={`asset-dropzone ${value ? 'asset-has-image' : ''}`} style={iconPreview ? { aspectRatio: '1 / 1', maxWidth: 150, borderRadius: '50%', marginInline: 'auto' } : undefined}>
        {value ? <img src={publicImage(value)} alt={`${label} preview`} /> : <span className="asset-empty"><ImagePlus size={24} /><span>Click to upload {label.toLowerCase()}</span></span>}
        {uploading && <span className="asset-uploading"><LoaderCircle className="spin" size={22} /> Uploading image…</span>}
        <span className="asset-change"><Upload size={14} /> {value ? 'Replace image' : 'Choose image'}</span>
      </span>
      <input type="file" accept={accept} onChange={(event) => { onFile(event.target.files?.[0]); event.currentTarget.value = ''; }} />
    </label>
  );
}

function ImageItemCard({ title, item, onChange, onRemove, onUpload, uploading, titleRequired = false }: {
  title: string; item: ProjectImage; onChange: (field: keyof ProjectImage, value: string) => void;
  onRemove?: () => void; onUpload: (file?: File) => void; uploading: boolean; titleRequired?: boolean;
}) {
  return (
    <article className="repeat-card">
      <div className="repeat-card-heading"><strong>{title}</strong>{onRemove && <button type="button" className="icon-button danger-action" onClick={onRemove} aria-label={`Remove ${title}`}><Trash2 size={16} /></button>}</div>
      <UploadField label="Image" value={item.image} onFile={onUpload} required uploading={uploading} />
      {titleRequired && <label className="editor-field">Image title *<input required value={item.title} onChange={(event) => onChange('title', event.target.value)} placeholder="Enter image title" /></label>}
      <label className="editor-field">Alt text *<input required value={item.alt} onChange={(event) => onChange('alt', event.target.value)} placeholder="Describe the image" /></label>
    </article>
  );
}

export function CompleteProjectEditor({ id }: { id?: string }) {
  const router = useRouter();
  const [project, setProject] = useState<ProjectDraft>(blankProject);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');
  const [slugTouched, setSlugTouched] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;
    api.project(id).then(({ data }) => {
      const empty = blankProject();
      setProject({
        ...empty, ...data,
        projectDetail: { ...empty.projectDetail, ...data.projectDetail },
        banner: { ...empty.banner, ...data.banner },
        aboutUs: { ...empty.aboutUs, ...data.aboutUs },
        floorPlans: data.floorPlans || [],
        projectImages: data.projectImages || [],
        amenities: (data.amenities || []).map((item) => typeof item === 'string' ? { title: item, image: '', alt: '' } : { title: item.title, image: item.image || '', alt: item.alt || '' }),
        projectUpdates: { ...empty.projectUpdates, ...data.projectUpdates, images: Array.from({ length: 2 }, (_, index) => data.projectUpdates?.images?.[index] || emptyImage()) },
        location: { ...empty.location, ...data.location },
        projectVideo: { ...empty.projectVideo, ...data.projectVideo },
      });
      setSlugTouched(true);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Project could not be loaded.')).finally(() => setLoading(false));
  }, [id]);

  function updateDetail(field: keyof Project['projectDetail'], value: string) {
    setProject((current) => ({ ...current, projectDetail: { ...current.projectDetail, [field]: value } }));
    if (field === 'title' && !slugTouched) setProject((current) => ({ ...current, slug: slugify(value) }));
  }

  function updateLocation(field: keyof Project['location'], value: string) {
    setProject((current) => ({ ...current, location: { ...current.location, [field]: value } }));
  }

  async function upload(file: File | undefined, key: string, onDone: (url: string) => void) {
    if (!file) return;
    setUploading(key);
    setError('');
    try {
      const result = await api.upload(file);
      onDone(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Image upload failed.');
    } finally {
      setUploading('');
    }
  }

  function updateImageList(field: 'floorPlans' | 'projectImages', index: number, key: keyof ProjectImage, value: string) {
    setProject((current) => ({ ...current, [field]: current[field].map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }));
  }

  function updateFaq(index: number, key: keyof ProjectFaq, value: string) {
    setProject((current) => ({ ...current, aboutUs: { ...current.aboutUs, faqs: current.aboutUs.faqs.map((faq, faqIndex) => faqIndex === index ? { ...faq, [key]: value } : faq) } }));
  }

  function updateAmenity(index: number, key: keyof ProjectAmenity, value: string) {
    setProject((current) => ({ ...current, amenities: current.amenities.map((amenity, itemIndex) => itemIndex === index ? { ...amenity, [key]: value } : amenity) }));
  }

  function updateUpdateImage(index: number, key: keyof ProjectImage, value: string) {
    setProject((current) => ({ ...current, projectUpdates: { ...current.projectUpdates, images: current.projectUpdates.images.map((image, imageIndex) => imageIndex === index ? { ...image, [key]: value } : image) } }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.save({ ...project, projectDetail: { ...project.projectDetail, projectWorkStatus: project.projectState, projectStatus: project.projectState } }, id);
      router.replace('/admin/projects');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Project could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="screen-state">Loading project…</div>;

  return (
    <div className="page-wrap editor-wrap">
      <Link href="/admin/projects" className="back-link"><ArrowLeft size={16} /> Back to projects</Link>
      <header className="page-header editor-heading"><div><p className="eyebrow">PROJECT CONTENT</p><h1>{id ? 'Edit project' : 'New project'}</h1><p className="muted">Complete each section. Saved details publish to the Shilp website.</p></div><button form="project-form" className="primary-button" disabled={saving || Boolean(uploading)}><Save size={16} />{saving ? 'Saving…' : 'Save project'}</button></header>
      {error && <div className="notice-error" role="alert">{error}</div>}

      <form id="project-form" onSubmit={submit} className="complete-editor">
        <section className="form-panel editor-section">
          <div className="form-panel-heading"><span>01</span><div><h2>Basic Information</h2><p>Project identity and listing details.</p></div></div>
          <div className="form-grid">
            <label className="editor-field">Project title *<input required maxLength={120} value={project.projectDetail.title} onChange={(event) => updateDetail('title', event.target.value)} placeholder="Enter project title" /></label>
            <label className="editor-field">Slug * <small>Auto-generated from title</small><input required value={project.slug} onChange={(event) => { setSlugTouched(true); setProject((current) => ({ ...current, slug: slugify(event.target.value) })); }} placeholder="project-url-slug" /></label>
            <label className="editor-field">Project state *<select required value={project.projectState} onChange={(event) => setProject((current) => ({ ...current, projectState: event.target.value as ProjectState }))}><option value="Upcoming">Upcoming</option><option value="On-going">On-going</option><option value="Completed">Completed</option></select></label>
            <label className="editor-field">Project type *<select required value={project.typeOfProject} onChange={(event) => setProject((current) => ({ ...current, typeOfProject: event.target.value as ProjectCategory }))}><option value="residential">Residential</option><option value="commercial">Commercial</option><option value="plotted">Plotted</option></select></label>
            <label className="editor-field">Status percentage *<input required type="number" min={0} max={100} value={project.statusPercentage} onChange={(event) => setProject((current) => ({ ...current, statusPercentage: Number(event.target.value) }))} /></label>
            <label className="editor-field">Configuration / typology<input value={project.typology} onChange={(event) => setProject((current) => ({ ...current, typology: event.target.value }))} placeholder="3 & 4 BHK" /></label>
            {project.typeOfProject === 'plotted' && <label className="editor-field">Plot size<input value={project.plotSize} onChange={(event) => setProject((current) => ({ ...current, plotSize: event.target.value }))} placeholder="8400 sq. yd." /></label>}
            <label className="editor-field">Year<input inputMode="numeric" maxLength={4} value={project.year} onChange={(event) => setProject((current) => ({ ...current, year: event.target.value }))} /></label>
            <label className="editor-field field-span-2">Short address *<input required value={project.projectDetail.shortAddress} onChange={(event) => updateDetail('shortAddress', event.target.value)} placeholder="Area, city" /></label>
            <label className="editor-field field-span-2">Brochure link (Google Drive) *<input required type="url" value={project.projectDetail.brochure} onChange={(event) => updateDetail('brochure', event.target.value)} placeholder="https://drive.google.com/..." /><small>Use a shareable HTTPS link.</small></label>
          </div>
        </section>

        <section className="form-panel editor-section">
          <div className="form-panel-heading"><span>02</span><div><h2>Banner Section</h2><p>Desktop and mobile project hero images. Slider image is not included.</p></div></div>
          <div className="banner-upload-grid">
            <UploadField label="Desktop banner image" value={project.banner.banner} required wide uploading={uploading === 'desktop-banner'} onFile={(file) => void upload(file, 'desktop-banner', (url) => setProject((current) => ({ ...current, banner: { ...current.banner, banner: url } })))} />
            <UploadField label="Mobile banner image" value={project.banner.mobileBanner} required wide uploading={uploading === 'mobile-banner'} onFile={(file) => void upload(file, 'mobile-banner', (url) => setProject((current) => ({ ...current, banner: { ...current.banner, mobileBanner: url } })))} />
          </div>
        </section>

        <section className="form-panel editor-section">
          <div className="form-panel-heading"><span>03</span><div><h2>About Us Section</h2><p>Project descriptions, image and optional questions.</p></div></div>
          <label className="editor-field">Description 1 *<textarea required rows={4} value={project.aboutUs.description[0] || ''} onChange={(event) => setProject((current) => ({ ...current, aboutUs: { ...current.aboutUs, description: [event.target.value, ...current.aboutUs.description.slice(1)] } }))} placeholder="Enter the main project description" /></label>
          <label className="editor-field spaced-field">Description 2<textarea rows={4} value={project.aboutUs.description[1] || ''} onChange={(event) => setProject((current) => ({ ...current, aboutUs: { ...current.aboutUs, description: [current.aboutUs.description[0] || '', event.target.value] } }))} placeholder="Optional second description" /></label>
          <div className="about-image-grid"><UploadField label="About us image" value={project.aboutUs.image} required uploading={uploading === 'about-image'} onFile={(file) => void upload(file, 'about-image', (url) => setProject((current) => ({ ...current, aboutUs: { ...current.aboutUs, image: url } })))} /><label className="editor-field">Image alt text *<input required value={project.aboutUs.imageAlt} onChange={(event) => setProject((current) => ({ ...current, aboutUs: { ...current.aboutUs, imageAlt: event.target.value } }))} placeholder="Describe the image" /></label></div>
          <div className="repeat-section-heading"><div><h3>Questions & answers</h3><p>Add project-specific FAQs.</p></div><button type="button" className="secondary-button" onClick={() => setProject((current) => ({ ...current, aboutUs: { ...current.aboutUs, faqs: [...current.aboutUs.faqs, { question: '', answer: '' }] } }))}><Plus size={15} /> Add Q&A</button></div>
          <div className="repeat-grid">{project.aboutUs.faqs.map((faq, index) => <article className="repeat-card" key={`faq-${index}`}><div className="repeat-card-heading"><strong>Question {index + 1}</strong><button type="button" className="icon-button danger-action" aria-label="Remove Q&A" onClick={() => setProject((current) => ({ ...current, aboutUs: { ...current.aboutUs, faqs: current.aboutUs.faqs.filter((_, faqIndex) => faqIndex !== index) } }))}><Trash2 size={16} /></button></div><label className="editor-field">Question<input value={faq.question} onChange={(event) => updateFaq(index, 'question', event.target.value)} /></label><label className="editor-field">Answer<textarea rows={3} value={faq.answer} onChange={(event) => updateFaq(index, 'answer', event.target.value)} /></label></article>)}</div>
        </section>

        <section className="form-panel editor-section">
          <div className="repeat-section-heading"><div className="form-panel-heading"><span>04</span><div><h2>Floor Plans</h2><p>Each plan has a title, image and accessibility text.</p></div></div><button type="button" className="secondary-button" onClick={() => setProject((current) => ({ ...current, floorPlans: [...current.floorPlans, emptyImage()] }))}><Plus size={15} /> Add floor plan</button></div>
          <div className="repeat-grid floor-plan-grid">{project.floorPlans.map((item, index) => <ImageItemCard key={`floor-${index}`} title={`Floor plan ${index + 1}`} item={item} titleRequired onChange={(field, value) => updateImageList('floorPlans', index, field, value)} onRemove={() => setProject((current) => ({ ...current, floorPlans: current.floorPlans.filter((_, itemIndex) => itemIndex !== index) }))} uploading={uploading === `floor-${index}`} onUpload={(file) => void upload(file, `floor-${index}`, (url) => updateImageList('floorPlans', index, 'image', url))} />)}</div>
          {project.floorPlans.length === 0 && <p className="empty-inline">No floor plans added.</p>}
        </section>

        <section className="form-panel editor-section">
          <div className="repeat-section-heading"><div className="form-panel-heading"><span>05</span><div><h2>Project Images</h2><p>Up to five project photos, each with alt text.</p></div></div><button type="button" className="secondary-button" disabled={project.projectImages.length >= 5} onClick={() => setProject((current) => ({ ...current, projectImages: [...current.projectImages, emptyImage()] }))}><Plus size={15} /> Add image</button></div>
          <div className="repeat-grid project-image-grid">{project.projectImages.map((item, index) => <ImageItemCard key={`gallery-${index}`} title={`Project image ${index + 1}`} item={item} onChange={(field, value) => updateImageList('projectImages', index, field, value)} onRemove={() => setProject((current) => ({ ...current, projectImages: current.projectImages.filter((_, itemIndex) => itemIndex !== index) }))} uploading={uploading === `gallery-${index}`} onUpload={(file) => void upload(file, `gallery-${index}`, (url) => updateImageList('projectImages', index, 'image', url))} />)}</div>
          {project.projectImages.length === 0 && <p className="empty-inline">No project images added.</p>}
        </section>

        <section className="form-panel editor-section">
          <div className="repeat-section-heading"><div className="form-panel-heading"><span>06</span><div><h2>Amenities <small>(Optional)</small></h2><p>Upload a separate SVG icon for each amenity.</p></div></div><button type="button" className="secondary-button" onClick={() => setProject((current) => ({ ...current, amenities: [...current.amenities, { title: '', image: '', alt: '' }] }))}><Plus size={15} /> Add amenity</button></div>
          <div className="repeat-grid project-image-grid">{project.amenities.map((amenity, index) => <article className="repeat-card amenity-editor-card" key={`amenity-${index}`}><div className="repeat-card-heading"><strong>Amenity {index + 1}</strong><button type="button" className="icon-button danger-action" aria-label="Remove amenity" onClick={() => setProject((current) => ({ ...current, amenities: current.amenities.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 size={16} /></button></div><label className="editor-field">Title *<input required value={amenity.title} onChange={(event) => updateAmenity(index, 'title', event.target.value)} placeholder="Open Air Space" /></label><UploadField label="Amenity SVG icon" value={amenity.image} onFile={(file) => void upload(file, `amenity-${index}`, (url) => updateAmenity(index, 'image', url))} required iconPreview accept=".svg,image/svg+xml" uploading={uploading === `amenity-${index}`} /><label className="editor-field">Alt text *<input required value={amenity.alt} onChange={(event) => updateAmenity(index, 'alt', event.target.value)} placeholder="Describe the amenity icon" /></label></article>)}</div>
          {project.amenities.length === 0 && <p className="empty-inline">No amenities added.</p>}
        </section>

        <section className="form-panel editor-section">
          <div className="form-panel-heading"><span>07</span><div><h2>Media <small>(Optional)</small></h2><p>External project video.</p></div></div>
          <label className="editor-field">YouTube URL<input type="url" value={project.projectVideo.videoUrl} onChange={(event) => setProject((current) => ({ ...current, projectVideo: { ...current.projectVideo, videoUrl: event.target.value } }))} placeholder="https://youtube.com/..." /></label>
        </section>

        <section className="form-panel editor-section">
          <div className="form-panel-heading"><span>08</span><div><h2>Project Updated Images <small>(Exactly 2 required)</small></h2><p>Both image slots need an image and alt text.</p></div></div>
          <label className="editor-field spaced-field">Updated images section title *<input required value={project.projectUpdates.title} onChange={(event) => setProject((current) => ({ ...current, projectUpdates: { ...current.projectUpdates, title: event.target.value } }))} placeholder="Project updates" /></label>
          <div className="repeat-grid update-grid">{project.projectUpdates.images.map((item, index) => <ImageItemCard key={`update-${index}`} title={`Updated image ${index + 1}`} item={item} onChange={(field, value) => updateUpdateImage(index, field, value)} uploading={uploading === `update-${index}`} onUpload={(file) => void upload(file, `update-${index}`, (url) => updateUpdateImage(index, 'image', url))} />)}</div>
        </section>

        <section className="form-panel editor-section">
          <div className="form-panel-heading"><span>09</span><div><h2>Project Location</h2><p>Location text and map link appear in the project details above.</p></div></div>
          <div className="form-grid">
            <label className="editor-field field-span-2">Location text *<textarea required rows={3} value={project.location.description} onChange={(event) => updateLocation('description', event.target.value)} /></label>
            <label className="editor-field field-span-2">Map URL *<input required type="url" value={project.location.mapUrl} onChange={(event) => updateLocation('mapUrl', event.target.value)} placeholder="https://www.google.com/maps/..." /></label>
          </div>
        </section>

        <section className="form-panel editor-section">
          <div className="form-panel-heading"><span>10</span><div><h2>RERA Details <small>(Optional)</small></h2><p>Leave empty if not applicable.</p></div></div>
          <label className="editor-field">RERA detail<textarea rows={3} value={project.reraDetails} onChange={(event) => setProject((current) => ({ ...current, reraDetails: event.target.value }))} placeholder="Enter RERA registration details" /></label>
        </section>

        <section className="form-panel editor-section publish-panel"><label className="toggle-row"><span><strong>Active project</strong><small>Visible on homepage lists, header menu and project pages after saving</small></span><input type="checkbox" checked={project.isActive} onChange={(event) => setProject((current) => ({ ...current, isActive: event.target.checked }))} /></label><p className="slug-hint">Project path: /projects/{project.slug || 'your-project-slug'}</p></section>
        <div className="editor-submit-row"><Link href="/admin/projects" className="back-link"><ArrowLeft size={16} /> Cancel</Link><button className="primary-button" disabled={saving || Boolean(uploading)}><Save size={16} />{saving ? 'Saving…' : 'Save project'}</button></div>
      </form>
    </div>
  );
}