export interface ModelPersona {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  isActive: boolean;
}

export const models: ModelPersona[] = [
  {
    id: 'lore',
    name: 'Lore',
    slug: 'lore',
    tagline: 'Música & Experiencia VIP',
    isActive: true,
  },
  {
    id: 'camila',
    name: 'Camila',
    slug: 'camila',
    tagline: 'Próximamente',
    isActive: false,
  },
  {
    id: 'luna',
    name: 'Luna',
    slug: 'luna',
    tagline: 'Próximamente',
    isActive: false,
  },
  {
    id: 'valentina',
    name: 'Valentina',
    slug: 'valentina',
    tagline: 'Próximamente',
    isActive: false,
  },
  {
    id: 'salome',
    name: 'Salomé',
    slug: 'salome',
    tagline: 'Próximamente',
    isActive: false,
  },
  {
    id: 'nicole',
    name: 'Nicole',
    slug: 'nicole',
    tagline: 'Próximamente',
    isActive: false,
  },
];
