import { Article, Category, Author } from "@/lib/types";

export const CATEGORIES: Category[] = [
  { id: '2', name: 'Chiapas', slug: 'chiapas' },
  { id: '1', name: 'Política', slug: 'politica' },
  { id: '5', name: 'Nacional', slug: 'nacional' },
  { id: '6', name: 'Internacional', slug: 'internacional' },
  { id: '3', name: 'Opinión', slug: 'opinion' },
  { id: '4', name: 'Cultura', slug: 'cultura' },
];

export const AUTHORS: Author[] = [
  {
    id: '1',
    name: 'Gamey García Varela',
    avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&auto=format&fit=crop&q=60',
    role: 'admin',
    bio: 'SuperUsuario y administrador general del sistema.'
  }
];

export const ARTICLES: Article[] = [
  {
    id: '1',
    title: 'La transformación del paisaje urbano en Tuxtla Gutiérrez',
    slug: 'transformacion-paisaje-urbano-tuxtla',
    excerpt: 'Un análisis profundo sobre cómo las nuevas obras públicas están redefiniendo la identidad de la capital chiapaneca.',
    content: '<p>Lorem ipsum dolor sit amet...</p>',
    featuredImage: 'https://images.unsplash.com/photo-1518115456253-12501869e5d4?w=1200&auto=format&fit=crop&q=60',
    category: CATEGORIES[0],
    author: AUTHORS[0],
    publishedAt: '2023-10-24T10:00:00Z',
    readTime: 5,
    isFeatured: true,
  },
  {
    id: '2',
    title: 'Elecciones 2024: El panorama político del sureste',
    slug: 'elecciones-2024-panorama-sureste',
    excerpt: 'Expertos debaten sobre el impacto de las próximas elecciones federales en la región sur del país.',
    featuredImage: 'https://images.unsplash.com/photo-1529101091760-61df52838429?w=1200&auto=format&fit=crop&q=60',
    category: CATEGORIES[1],
    author: AUTHORS[0],
    publishedAt: '2023-10-23T14:30:00Z',
    content: '<p>Contenido...</p>',
    readTime: 8,
  },
  {
    id: '3',
    title: 'El café de Chiapas conquista nuevos mercados europeos',
    slug: 'cafe-chiapas-mercados-europeos',
    excerpt: 'Productores locales logran acuerdos históricos para exportación a Francia y Alemania.',
    featuredImage: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1200&auto=format&fit=crop&q=60',
    category: CATEGORIES[0],
    author: AUTHORS[0],
    publishedAt: '2023-10-22T09:15:00Z',
    content: '<p>Contenido...</p>',
    readTime: 4,
  },
  {
    id: '4',
    title: 'La voz crítica: ¿Hacia dónde va el periodismo?',
    slug: 'hacia-donde-va-periodismo',
    excerpt: 'Editorial sobre los retos de la libertad de expresión en la era digital.',
    featuredImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=60',
    category: CATEGORIES[4],
    author: AUTHORS[0],
    publishedAt: '2023-10-21T18:00:00Z',
    content: '<p>Contenido...</p>',
    readTime: 6,
  },
  {
    id: '5',
    title: 'Festival Cervantino llega a San Cristóbal',
    slug: 'festival-cervantino-san-cristobal',
    excerpt: 'Una extensión del famoso festival traerá artistas de talla internacional a los Altos de Chiapas.',
    featuredImage: 'https://images.unsplash.com/photo-1533669955142-6a73332af4db?w=1200&auto=format&fit=crop&q=60',
    category: CATEGORIES[5],
    author: AUTHORS[0],
    publishedAt: '2023-10-20T11:20:00Z',
    content: '<p>Contenido...</p>',
    readTime: 3,
  }
];