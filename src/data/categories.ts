import { CategoryInfo } from '@/types';

export const categories: CategoryInfo[] = [
  {
    slug: 'ai-writing',
    name: 'AI Writing Tools',
    description:
      'AI-powered writing assistants that help create blog posts, marketing copy, emails, and more. Compare pricing, features, and availability across countries.',
    icon: '✍️',
    toolCount: 5,
  },
  {
    slug: 'ai-image',
    name: 'AI Image Generation',
    description:
      'AI tools that generate images from text prompts. Compare Midjourney, DALL-E, Stable Diffusion and more across different markets.',
    icon: '🎨',
    toolCount: 5,
  },
  {
    slug: 'ai-coding',
    name: 'AI Coding Assistants',
    description:
      'AI-powered code completion, generation, and debugging tools. Compare GitHub Copilot, Cursor, and alternatives available in your country.',
    icon: '💻',
    toolCount: 5,
  },
  {
    slug: 'ai-voice',
    name: 'AI Voice & Audio',
    description:
      'AI-powered voice synthesis, audio editing, and content repurposing tools. Compare ElevenLabs, Murf AI, Descript and more across markets.',
    icon: '🎙️',
    toolCount: 4,
  },
  {
    slug: 'ai-productivity',
    name: 'AI Productivity',
    description:
      'AI-powered presentation, meeting, and document tools. Compare Gamma, Beautiful.ai, Fireflies.ai and more for your workflow.',
    icon: '⚡',
    toolCount: 4,
  },
];

export function getCategoryBySlug(slug: string): CategoryInfo | undefined {
  return categories.find((c) => c.slug === slug);
}
