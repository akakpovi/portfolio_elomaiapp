export type Lang = 'fr' | 'en' | 'de';

export type L = Record<Lang, string>;

/** Single source of truth for external links and contact data. */
export const SITE = {
  name: 'Elom Akakpovi',
  brand: 'EL0M AI ENGINEER',
  title: 'AI Engineer & Full-Stack Developer',
  url: 'https://elomaiapp.com/',
  email: 'ekakpovi656@gmail.com',
  github: 'https://github.com/akakpovi',
  githubHandle: 'github.com/akakpovi',
  freelancer: 'https://www.freelancer.com/u/eakakpovi656',
  freelancerHandle: 'freelancer.com/u/eakakpovi656',
  location: 'Worms, Germany',
  keywords:
    'AI Engineer Germany, Full-Stack Developer Germany, Python Developer, React Developer, AI Agent Development, Local AI, RAG Development, Docker, DevOps',
} as const;
