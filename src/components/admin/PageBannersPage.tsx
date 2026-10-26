'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Check, ImagePlus, LoaderCircle, Upload, X } from 'lucide-react';
import { api, publicImage, type BannerPage, type PageBannerDraft } from '../../api';

const pageLabels: Record<BannerPage, string> = {
  blog: 'Blogs',
  home: 'Homepage',
  'about-us': 'About Us',
  'our-team': 'Our Team',
  careers: 'Careers',
  'project-overview': 'Project Overview',
  'our-work': 'Our Work',
  'contact-us': 'Contact Us',
  commercial: 'Commercial',
  residential: 'Residential',
  plotted: 'Plotted',
};

const pageDescriptions: Record<BannerPage, string> = {
  blog: 'Hero banner at the top of the blog listing page.',
  home: 'Homepage hero at the top of the home page.',
  'about-us': 'Hero at the top of the About Us page.',
  'our-team': 'Hero at the top of the Our Team page.',
  careers: 'Hero at the top of the Careers page.',
  'project-overview': 'Hero at the top of the Project Overview page.',
  'our-work': 'Hero at the top of the Our Work page.',
  'contact-us': 'Hero at the top of the Contact Us page.',
  commercial: 'Image above the Commercial Paradigms list. The left/right layout and side feature image stay unchanged.',
  residential: 'The Family Matters banner above the Residential section. The Residential section image stays static.',
  plotted: 'The Context Matters banner above the Plotted section. The Plotted section side image stays static.',
};

const pages = Object.keys(pageLabels) as BannerPage[];

function emptyBanner(page: BannerPage): PageBannerDraft {
  return { page, desktopImage: '', mobileImage: '', imageAlt: '' };
}

export function PageBannersPage() {
  const [banners, setBanners] = useState<Record<BannerPage, PageBannerDraft>>(
    () => Object.fromEntries(pages.map((page) => [page, emptyBanner(page)])) as Record<BannerPage, PageBannerDraft>,
  );
  const [loading, setLoading] = useState(true);
  const [savingPage, setSavingPage] = useState<BannerPage | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [savedPage, setSavedPage] = useState<BannerPage | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [expandedImage, setExpandedImage] = useState<{ src: string; label: string } | null>(null);
  const skipAltBlurSave = useRef(false);

  useEffect(() => {
    let current = true;
    api.pageBanners()
      .then(({ data }) => {
        if (!current) return;
        setBanners((previous) => {
          const next = { ...previous };
          for (const banner of data) {
            if (pages.includes(banner.page)) {
              next[banner.page] = {
                page: banner.page,
                desktopImage: banner.desktopImage,
                mobileImage: banner.mobileImage,
                imageAlt: banner.imageAlt,
              };
            }
          }
          return next;
        });
      })
      .catch((cause) => {
        if (current) setError(cause instanceof Error ? cause.message : 'Page banners could not be loaded.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    if (!expandedImage) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpandedImage(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [expandedImage]);

  async function uploadImage(page: BannerPage, kind: 'desktopImage' | 'mobileImage', event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const key = `${page}:${kind}`;
    setUploading(key);
    setError('');
    setStatusMessage('');
    setSavedPage(null);
    try {
      const result = await api.upload(file);
      const draft = { ...banners[page], [kind]: result.url };
      setBanners((previous) => ({ ...previous, [page]: draft }));
      setSavingPage(page);
      try {
        const { data } = await api.savePageBanner(draft);
        setBanners((previous) => ({
          ...previous,
          [page]: {
            page: data.page,
            desktopImage: data.desktopImage,
            mobileImage: data.mobileImage,
            imageAlt: data.imageAlt,
          },
        }));
        setSavedPage(page);
        setStatusMessage(`${pageLabels[page]} ${kind === 'desktopImage' ? 'desktop' : 'mobile'} banner saved.`);
      } finally {
        setSavingPage(null);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `${pageLabels[page]} banner image upload failed.`);
    } finally {
      setUploading(null);
    }
  }

  async function saveBanner(page: BannerPage, draft = banners[page]) {
    if (!draft.desktopImage && !draft.mobileImage) return;
    setSavingPage(page);
    setError('');
    setStatusMessage('');
    setSavedPage(null);
    try {
      const { data } = await api.savePageBanner(draft);
      setBanners((previous) => ({
        ...previous,
        [page]: {
          page: data.page,
          desktopImage: data.desktopImage,
          mobileImage: data.mobileImage,
          imageAlt: data.imageAlt,
        },
      }));
      setSavedPage(page);
      setStatusMessage(`${pageLabels[page]} banner changes saved.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `${pageLabels[page]} banner could not be saved.`);
    } finally {
      setSavingPage(null);
    }
  }

  function updateAlt(page: BannerPage, imageAlt: string) {
    setSavedPage(null);
    setStatusMessage('');
    setBanners((previous) => ({ ...previous, [page]: { ...previous[page], imageAlt } }));
  }

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <p className="eyebrow">WEBSITE CONTENT</p>
          <h1>Page Banner Management</h1>
          <p className="muted">Upload separate desktop and mobile images for page banners, homepage story banners and category images. The commercial feature image beside the project list stays unchanged.</p>
        </div>
      </header>
      {error && <div role="alert" className="notice-error mb-5">{error}</div>}
      {statusMessage && <div role="status" className="mb-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{statusMessage}</div>}
      {loading && <div className="table-empty">Loading page bannersâ€¦</div>}
      {!loading && (
        <div className="grid gap-5">
          {pages.map((page) => {
            const banner = banners[page];
            const isUploading = uploading !== null;
            return (
              <section key={page} className="overflow-hidden border border-slate-200 bg-white shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-7">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">{pageLabels[page]} Banner</h2>
                    <p className="mt-1 text-xs text-slate-600">{pageDescriptions[page]}</p>
                    <p className="mt-1 text-xs text-slate-500">Each image saves immediately. Mobile artwork is used below 768px and desktop artwork at 768px and above; either image is used until both are uploaded.</p>
                  </div>
                  {savingPage === page && <span role="status" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600"><LoaderCircle size={15} className="animate-spin" /> Saving changesâ€¦</span>}
                  {savedPage === page && savingPage !== page && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700"><Check size={15} /> Saved</span>}
                </header>
                <div className="grid grid-cols-2 gap-3 p-3 sm:gap-5 sm:p-7">
                  {([
                    ['desktopImage', 'Desktop Banner'],
                    ['mobileImage', 'Mobile Banner'],
                  ] as const).map(([kind, label]) => (
                    <div key={kind} className="min-w-0">
                      <p className="mb-2 text-xs font-medium text-slate-700">{label}</p>
                      <button
                        type="button"
                        onClick={() => banner[kind] && setExpandedImage({
                          src: publicImage(banner[kind]),
                          label: `${pageLabels[page]} ${label}`,
                        })}
                        disabled={!banner[kind]}
                        aria-label={banner[kind] ? `View full ${pageLabels[page]} ${label.toLowerCase()}` : `No ${label.toLowerCase()} uploaded`}
                        className="relative flex h-28 w-full items-center justify-center overflow-hidden border border-slate-200 bg-slate-50 disabled:cursor-default sm:h-40 lg:h-48"
                      >
                        {banner[kind]
                          ? <img src={publicImage(banner[kind])} alt={`${pageLabels[page]} ${label.toLowerCase()} preview. Select to view full image.`} className="h-full w-full bg-white object-contain" />
                          : <span className="flex flex-col items-center gap-2 text-slate-400"><ImagePlus size={25} /><span className="text-center text-xs">No image uploaded</span></span>}
                      </button>
                      {banner[kind] && <p className="mt-1 text-center text-[10px] text-slate-500">Click to view full image</p>}
                      <label className="mt-2 flex min-h-10 cursor-pointer items-center justify-center gap-2 bg-black px-4 text-xs font-medium text-white transition-colors hover:bg-slate-800" onMouseDown={() => {
                        const activeElement = document.activeElement;
                        if (activeElement instanceof HTMLInputElement && activeElement.placeholder === 'Describe the banner image') {
                          skipAltBlurSave.current = true;
                        }
                      }}>
                        {uploading === `${page}:${kind}` ? <><LoaderCircle size={14} className="animate-spin" /> Uploadingâ€¦</> : <><Upload size={14} /> Replace {label.replace(' Banner', '')}</>}
                        <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" disabled={isUploading || savingPage !== null} onChange={(event) => void uploadImage(page, kind, event)} />
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:items-end sm:p-7">
                  <label className="block flex-1 text-xs font-medium text-slate-700">
                    Alt Text (for accessibility)
                    <input
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-slate-500"
                      maxLength={240}
                      value={banner.imageAlt}
                      onChange={(event) => updateAlt(page, event.target.value)}
                      onBlur={(event) => {
                        if (skipAltBlurSave.current) {
                          skipAltBlurSave.current = false;
                          return;
                        }
                        const draft = { ...banners[page], imageAlt: event.currentTarget.value };
                        if (draft.desktopImage || draft.mobileImage) void saveBanner(page, draft);
                      }}
                      disabled={savingPage !== null || uploading !== null}
                      placeholder="Describe the banner image"
                    />
                  </label>
                </div>
              </section>
            );
          })}
        </div>
      )}
      {expandedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setExpandedImage(null);
          }}
        >
          <section role="dialog" aria-modal="true" aria-label={expandedImage.label} className="relative flex h-full w-full items-center justify-center">
            <button
              type="button"
              onClick={() => setExpandedImage(null)}
              aria-label="Close image preview"
              className="absolute right-0 top-0 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg"
            >
              <X size={22} />
            </button>
            <img src={expandedImage.src} alt={expandedImage.label} className="max-h-full max-w-full object-contain" />
          </section>
        </div>
      )}
    </div>
  );
}
