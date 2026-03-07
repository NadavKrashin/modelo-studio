/**
 * TypeScript representations of Thingiverse REST API v2 responses.
 *
 * Fields are deliberately marked optional where the API may omit them —
 * search results, for example, return a much sparser object than
 * /things/{id}.  The normalizer handles all fallbacks.
 */

export interface ThingiverseCreator {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  url?: string;
  public_url?: string;
  thumbnail?: string;
}

export interface ThingiverseTag {
  name: string;
  tag?: string;
  url?: string;
  count?: number;
  things_url?: string;
}

export interface ThingiverseCategory {
  name: string;
  slug?: string;
  url?: string;
  count?: number;
}

export interface ThingiverseImageSize {
  type: string;
  size: string;
  url: string;
}

export interface ThingiverseImage {
  id: number;
  url: string;
  name?: string;
  sizes: ThingiverseImageSize[];
}

export interface ThingiverseThing {
  id: number;
  name?: string;
  url?: string;
  public_url?: string;
  thumbnail?: string;
  creator?: ThingiverseCreator;
  added?: string;
  modified?: string;
  is_published?: boolean;
  is_wip?: boolean;
  is_featured?: boolean;
  is_nsfw?: boolean;
  like_count?: number;
  collect_count?: number;
  comment_count?: number;
  make_count?: number;
  download_count?: number;
  view_count?: number;
  description?: string;
  instructions?: string;
  description_html?: string;
  instructions_html?: string;
  license?: string;
  files_url?: string;
  images_url?: string;
  tags?: ThingiverseTag[];
  categories_url?: string;
  default_image?: ThingiverseImage;
}

export interface ThingiverseSearchResponse {
  total: number;
  hits: ThingiverseThing[];
}
