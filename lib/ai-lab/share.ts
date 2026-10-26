import type { Metadata } from 'next';
import { LABS, LAB_WORLDS, type LabIndustry } from './content';

/**
 * Share-card metadata for the AI Lab. The root layout carries the security assessment's Open Graph tags, and Next
 * merges a child's `openGraph` only if the child sets one, so every AI Lab route sets its own title, description and
 * image here (learned 26 Oct 2026: a shared /ai-lab/meeting link previewed as "Security Assessment").
 */
export const SITE = 'https://d3smbmxdr.vercel.app';

export function shareMetadata({ title, description, path, image, alt }: { title: string; description: string; path: string; image: string; alt: string }): Metadata {
  const url = SITE + path, img = SITE + image;
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Data#3', type: 'website', locale: 'en_AU', images: [{ url: img, alt }] },
    twitter: { card: 'summary_large_image', title, description, images: [{ url: img, alt }] },
  };
}

export const HUB_SHARE = shareMetadata({
  title: 'Data#3 AI Lab',
  description: 'Six interactive 3D worlds, three places each: water and energy, mining, retail, an AI-ready datacenter, local AI on a laptop and a Cisco meeting room. See where AI could make a difference.',
  path: '/ai-lab',
  image: '/ai-lab-share.jpg',
  alt: 'The six Data#3 AI Lab worlds: dam and treatment plant, open-pit mine, supermarket, datacenter, laptop desk and meeting room',
});

/** One world's card: its name, its hub tile line and its poster (rendered from the world itself). */
export function worldShare(id: LabIndustry, path = '/ai-lab/' + id): Metadata {
  const w = LAB_WORLDS[id];
  return shareMetadata({ title: `${w.name} | Data#3 AI Lab`, description: w.tile, path, image: LABS[id].poster, alt: w.alt });
}
