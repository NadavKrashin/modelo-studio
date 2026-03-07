/**
 * TypeScript types mirroring the MyMiniFactory API v2 response shapes.
 *
 * Based on the official OpenAPI spec at:
 * https://myminifactory.github.io/api-documentation/
 *
 * All fields marked optional — the API may return partial objects.
 */

export interface MMFUser {
  username?: string;
  name?: string;
  profile_url?: string;
  avatar_url?: string;
  avatar_thumbnail_url?: string;
  bio?: string;
  website?: string;
  objects?: number;
  likes?: number;
  followers?: number;
}

export interface MMFImageSize {
  url?: string;
  width?: string;
  height?: string;
}

export interface MMFImage {
  id?: number;
  is_primary?: boolean;
  original?: MMFImageSize;
  thumbnail?: MMFImageSize;
  standard?: MMFImageSize;
}

export interface MMFFile {
  id?: number;
  filename?: string;
  description?: string;
  viewer_url?: string;
  thumbnail_url?: string;
  size?: string;
}

export interface MMFCategory {
  id?: number;
  slug?: string;
  url?: string;
  name?: string;
}

export interface MMFLicense {
  type?: string;
  value?: boolean;
}

export interface MMFObject {
  id?: number;
  url?: string;
  name?: string;
  visibility?: string;
  description?: string;
  description_html?: string;
  printing_details?: string;
  views?: number;
  likes?: number;
  published_at?: string;
  featured?: boolean;
  complexity?: number;
  dimensions?: string;
  material_quantity?: string;
  designer?: MMFUser;
  images?: MMFImage[];
  files?: MMFFile[];
  categories?: MMFCategory[];
  tags?: string[];
  licenses?: MMFLicense[];
  license?: string;
}

export interface MMFSearchResponse {
  total_count?: number;
  items?: MMFObject[];
}
