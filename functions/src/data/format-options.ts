export type TPlatform = 'youtube' | 'linkedin' | 'twitter';

export type TFormatOption = {
  platform: TPlatform;
  format: string;
  description: string;
};

export const FORMAT_OPTIONS: TFormatOption[] = [
  {
    platform: 'youtube',
    format: 'long-form-video',
    description:
      '8-20 min video essay or tutorial. The only YouTube format we use right now.',
  },

  {
    platform: 'linkedin',
    format: 'text-post',
    description:
      'Long-form LinkedIn post (700-1500 chars). Hook line, narrative or framework, takeaway, soft CTA.',
  },
  {
    platform: 'linkedin',
    format: 'carousel',
    description:
      '8-12 slide PDF carousel. One idea per slide, opinionated framework or how-to walk-through.',
  },
  {
    platform: 'linkedin',
    format: 'video',
    description:
      '60-90 second talking-head or screen-share video. Strong opening, clear point, single takeaway.',
  },
  {
    platform: 'linkedin',
    format: 'audio-newsletter',
    description:
      'Short audio reflection (3-5 min) attached to a written newsletter post.',
  },

  {
    platform: 'twitter',
    format: 'single-tweet',
    description:
      'One-shot tweet under 280 chars. Sharp opinion, observation, or one-liner.',
  },
  {
    platform: 'twitter',
    format: 'thread',
    description:
      '5-12 tweet thread. Hook tweet, numbered or narrative body, takeaway tweet at the end.',
  },
  {
    platform: 'twitter',
    format: 'video',
    description:
      'Native video clip (under 2 min 20 sec). Good for live demos, hot takes, screen recordings.',
  },
  {
    platform: 'twitter',
    format: 'image-quote',
    description:
      'Tweet anchored on an image or screenshot (code, diagram, chart, quote card).',
  },
];

export function formatCatalogString(): string {
  return FORMAT_OPTIONS.map(
    f => `- ${f.platform} / ${f.format}: ${f.description}`,
  ).join('\n');
}
