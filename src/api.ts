export type ProjectCategory = 'commercial' | 'residential' | 'plotted';
export type ProjectState = 'Upcoming' | 'On-going' | 'Completed';
export type ProjectTreeType = ProjectCategory;

export interface ProjectTreeItem {
  id: string;
  year: string;
  title: string;
  location: string;
  type: ProjectTreeType;
  image: string;
  imageAlt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProjectTreeDraft = Omit<ProjectTreeItem, 'id' | 'createdAt' | 'updatedAt'>;
export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship';

export interface JobOpening {
  id: string;
  title: string;
  description: string;
  responsibilities: string;
  qualifications: string;
  jobType: JobType;
  location: string;
  experience: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type JobOpeningDraft = Omit<JobOpening, 'id' | 'createdAt' | 'updatedAt'>;
export type BannerPage = 'home' | 'about-us' | 'our-team' | 'careers' | 'project-overview' | 'our-work' | 'contact-us' | 'commercial' | 'residential' | 'plotted';

export interface PageBanner {
  id?: string;
  page: BannerPage;
  desktopImage: string;
  mobileImage: string;
  imageAlt: string;
  updatedAt?: string;
}

export type PageBannerDraft = Omit<PageBanner, 'id' | 'updatedAt'>;

export interface ProjectImage {
  title: string;
  image: string;
  alt: string;
}

export interface ProjectFaq {
  question: string;
  answer: string;
}

export interface ProjectAmenity {
  title: string;
  image: string;
  alt: string;
}

export interface Project {
  id: string;
  slug: string;
  typeOfProject: ProjectCategory;
  projectState: ProjectState;
  statusPercentage: number;
  projectDetail: {
    title: string;
    shortAddress: string;
    projectWorkStatus: string;
    brochure: string;
    projectStatus: string;
  };
  banner: { banner: string; mobileBanner: string };
  aboutUs: { description: string[]; image: string; imageAlt: string; faqs: ProjectFaq[] };
  floorPlans: ProjectImage[];
  projectImages: ProjectImage[];
  amenities: ProjectAmenity[];
  projectUpdates: { title: string; images: ProjectImage[] };
  location: {
    mapUrl: string;
    title: string;
    description: string;
    area: string;
    phone1: string;
    phone2: string;
    email1: string;
    email2: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  projectVideo: { videoUrl: string; title: string };
  reraDetails: string;
  isActive: boolean;
  year: string;
  typology: string;
  plotSize: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectDraft = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

const apiUrl = '';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers: { ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...init.headers },
    });
  } catch {
    throw new Error('Cannot reach the backend. Start the API on port 8081 and restart the admin app.');
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || 'The request could not be completed.');
  return result as T;
}

export const api = {
  authSetup: () => request<{ success: true; setupRequired: boolean }>('/api/auth/setup'),
  register: (name: string, email: string, password: string) => request<{ success: true }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  }),
  login: (email: string, password: string) => request<{ success: true }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  logout: () => request<{ success: true }>('/api/auth/logout', { method: 'POST' }),
  check: () => request<{ success: true; user: { email: string; name: string } }>('/api/auth/check'),
  projects: (query: string) => request<{ data: Project[]; total: number }>(`/api/projects?all=true&${query}`),
  projectTree: (query: string) => request<{ data: ProjectTreeItem[]; total: number }>(`/api/project-tree?all=true&${query}`),
  saveProjectTreeItem: (draft: ProjectTreeDraft, id?: string) => request<{ data: ProjectTreeItem }>(id ? `/api/project-tree/${encodeURIComponent(id)}` : '/api/project-tree', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(draft),
  }),
  archiveProjectTreeItem: (id: string) => request<{ success: true }>(`/api/project-tree/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  jobOpenings: (query: string) => request<{ data: JobOpening[]; total: number }>(`/api/job-openings?all=true&${query}`),
  saveJobOpening: (draft: JobOpeningDraft, id?: string) => request<{ data: JobOpening }>(id ? `/api/job-openings/${encodeURIComponent(id)}` : '/api/job-openings', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(draft),
  }),
  archiveJobOpening: (id: string) => request<{ success: true }>(`/api/job-openings/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  pageBanners: () => request<{ data: PageBanner[] }>('/api/page-banners'),
  savePageBanner: (draft: PageBannerDraft) => request<{ data: PageBanner }>(`/api/page-banners/${encodeURIComponent(draft.page)}`, {
    method: 'PUT',
    body: JSON.stringify(draft),
  }),
  project: (id: string) => request<{ data: Project }>(`/api/projects/${encodeURIComponent(id)}`),
  save: (draft: ProjectDraft, id?: string) => request<{ data: Project }>(id ? `/api/projects/${encodeURIComponent(id)}` : '/api/projects', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(draft),
  }),
  archive: (id: string) => request<{ success: true }>(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  upload: async (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return request<{ url: string }>('/api/upload', { method: 'POST', body });
  },
};

export function publicImage(path: string) {
  try {
    const url = new URL(path);
    if (['localhost', '127.0.0.1'].includes(url.hostname) && url.pathname.startsWith('/api/uploads/')) {
      return `${apiUrl}${url.pathname}${url.search}`;
    }
  } catch {
    // Keep relative public assets below on the configured website origin.
  }

  if (path.startsWith('/api/uploads/')) return `${apiUrl}${path}`;
  if (path.startsWith('/')) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production'
      ? 'https://shilp-website.vercel.app'
      : 'http://localhost:3000');
    return `${siteUrl}${path}`;
  }
  return path;
}