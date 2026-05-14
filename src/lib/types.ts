// === Database row types (match Supabase REST API snake_case responses) ===

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  display_order: number;
}

export interface DbTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface DbProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'superuser' | 'editor';
  created_at: string;
  updated_at: string;
}

export interface DbArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  category_id: string | null;
  author_id: string | null;
  status: 'draft' | 'published';
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  last_social_push: string | null;
}

export interface DbArticleCategory {
  article_id: string;
  category_id: string;
}

export interface DbArticleTag {
  article_id: string;
  tag_id: string;
}

export interface DbMediaFile {
  id: string;
  filename: string | null;
  original_url: string | null;
  sftp_url: string | null;
  file_type: 'image' | 'video' | 'other' | null;
  folder: string | null;
  size_bytes: number | null;
  transferred_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAd {
  id: string;
  title: string | null;
  image_url: string | null;
  link_url: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  views: number;
  clicks: number;
  created_at: string;
}

export interface DbHomeBanner {
  id: string;
  position: number;
  image_url: string | null;
  link_url: string | null;
  created_at: string;
}

export interface DbDailyEdition {
  id: string;
  title: string;
  edition_date: string;
  pdf_url: string;
  cover_image_url: string | null;
  page_count: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// === Joined/nested types (from Supabase select with relations) ===

export interface ArticleWithRelations extends DbArticle {
  article_categories?: Array<{
    category_id: string;
    categories: Pick<DbCategory, 'name' | 'slug'>;
  }>;
  article_tags?: Array<{
    tag_id: string;
    tags: Pick<DbTag, 'name' | 'slug'>;
  }>;
}

export interface ArticleListItem extends DbArticle {
  article_categories?: Array<{
    category_id: string;
    categories: Pick<DbCategory, 'name' | 'slug'>;
  }>;
}

// === Legacy types (kept for backward compatibility, will remove in E3) ===

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Author = {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'editor' | 'author';
  bio?: string;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  featuredImageId?: string;
  category: Category;
  author: Author;
  publishedAt: string;
  readTime: number;
  isFeatured?: boolean;
  gallery?: MediaGalleryItem[];
};

export type MediaGalleryItem = {
  id: string;
  url: string;
  caption?: string;
  order: number;
};
