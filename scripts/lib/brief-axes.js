/**
 * The brief's non-visual axes: architecture, sector, tone, twist, naming shape.
 * Keep in sync with the STEP 0 tables in .agents/prompts/daily-brief-generator.md.
 */

/** wordFloor doubles as the architecture's fingerprint: meta has no architecture field, but it has wordFloor. */
export const ARCHITECTURES = [
  { name: 'landing', wordFloor: 650 },
  { name: 'dense one-pager', wordFloor: 1100 },
  { name: 'multi-page', wordFloor: 1900 },
];
export const ARCHITECTURE_NAMES = ARCHITECTURES.map((a) => a.name);

export function architectureFromMeta(meta) {
  return ARCHITECTURES.find((a) => a.wordFloor === Number(meta?.wordFloor))?.name;
}

/** Tags are the brief §1 tag palette; they let sector be inferred for sites that predate meta.sector. */
export const SECTORS = [
  {
    name: 'trades / industrial',
    tags: [
      'fabrication',
      'metalwork',
      'engineering',
      'tooling',
      'construction',
      'welding',
      'precision',
      'heavy-equipment',
    ],
  },
  {
    name: 'food / hospitality',
    tags: ['fermentation', 'provenance', 'tasting', 'catering', 'specialty-food', 'distillery', 'bakery', 'foraging'],
  },
  {
    name: 'health / wellness',
    tags: ['clinical', 'therapy', 'diagnostics', 'recovery', 'rehabilitation', 'pharmacy', 'fitness', 'biotech'],
  },
  {
    name: 'creative / arts',
    tags: ['studio', 'gallery', 'design', 'performance', 'publishing', 'typography', 'printmaking', 'ceramics'],
  },
  {
    name: 'tech / digital services',
    tags: ['saas', 'platform', 'security', 'analytics', 'automation', 'hardware', 'networking', 'open-source'],
  },
  {
    name: 'retail / e-commerce',
    tags: ['apparel', 'homeware', 'specialty-retail', 'marketplace', 'direct-to-consumer', 'luxury', 'vintage'],
  },
  {
    name: 'leisure / outdoors',
    tags: ['expedition', 'gear', 'recreation', 'adventure', 'conservation', 'climbing', 'sailing', 'cycling'],
  },
  {
    name: 'civic / infrastructure',
    tags: ['utilities', 'transit', 'water', 'waste', 'surveying', 'municipal', 'roadworks', 'telemetry', 'permitting'],
  },
  {
    name: 'agriculture / land & food production',
    tags: [
      'husbandry',
      'horticulture',
      'soil',
      'seed-stock',
      'orchard',
      'dairy',
      'forestry',
      'land-management',
      'irrigation',
    ],
  },
  {
    name: 'maritime / logistics & freight',
    tags: [
      'freight',
      'shipyard',
      'harbour',
      'cold-chain',
      'warehousing',
      'customs',
      'chandlery',
      'dredging',
      'haulage',
    ],
  },
  {
    name: 'education / research & archives',
    tags: [
      'archive',
      'laboratory',
      'curriculum',
      'field-study',
      'museum',
      'cataloguing',
      'instrumentation',
      'publishing-academic',
    ],
  },
  {
    name: 'repair / restoration & salvage',
    tags: [
      'conservation-repair',
      'refurbishment',
      'salvage',
      'reclamation',
      'upholstery',
      'horology',
      'spares',
      'retrofit',
      'patina',
    ],
  },
];
export const SECTOR_NAMES = SECTORS.map((s) => s.name);

/** meta.sector when present, else the sector most of the site's tags belong to. */
export function sectorFromMeta(meta) {
  if (meta?.sector && SECTOR_NAMES.includes(meta.sector)) return meta.sector;
  const counts = new Map();
  for (const tag of meta?.tags ?? []) {
    const s = SECTORS.find((x) => x.tags.includes(tag));
    if (s) counts.set(s.name, (counts.get(s.name) ?? 0) + 1);
  }
  let best;
  for (const [name, n] of counts) if (!best || n > counts.get(best)) best = name;
  return best;
}

export const TONES = [
  'dry expert',
  'warm maker',
  'sharp industrial',
  'wry editorial',
  'calm clinical',
  'adventurous field',
  'playful provocateur',
  'stoic technical',
  'intimate artisan',
  'terse military',
];

export const TWIST_AXES = [
  'audience',
  'geography / base',
  'delivery / format',
  'material / method',
  'business model / access',
  'time constraint',
  'scale',
  'heritage / tradition',
  'environmental constraint',
  'collaboration',
];

export const NAMING_STYLES = [
  'X & Y (noun pair)',
  'single invented or uncommon word',
  'place + trade descriptor',
  'alphanumeric / initialism',
  'The + noun-phrase',
  'verb-forward or action compound',
  'portmanteau or blend',
];
