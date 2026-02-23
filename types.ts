export enum PricingModel {
  FREE = 'Free',
  FREEMIUM = 'Freemium',
  PAID = 'Paid',
  TRIAL = 'Free Trial'
}

export enum ToolCategory {
  WRITING = 'AI Writing',
  COPYWRITING = 'Copywriting',
  IMAGE = 'Image Generation',
  GENERATIVE_ART = 'Generative Art',
  GRAPHIC_DESIGN = 'Graphic Design',
  VIDEO = 'Video AI',
  TEXT_TO_VIDEO = 'Text to Video AI',
  MARKETING = 'Marketing AI',
  ADVERTISING = 'Advertising',
  SOCIAL_MEDIA = 'Social Media',
  SEO = 'SEO AI',
  CODING = 'Coding AI',
  VOICE = 'Voice & Audio',
  AGENTS = 'Automation & Agents',
  BUSINESS = 'Business AI',
  BUSINESS_INTEL = 'Business Intelligence',
  WEBSITE_BUILDER = 'AI Website Builder',
  AI_DETECTION = 'AI Detection',
  HEALTH = 'Health Tech',
  PRODUCTIVITY = 'Productivity',
  RECRUITMENT = 'Recruitment',
  EDUCATION = 'Education'
}

export interface AITool {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  detailedDescription: string;
  category: ToolCategory;
  pricingModel: PricingModel;
  websiteUrl: string;
  affiliateUrl?: string;
  tags: string[];
  logo: string;
  featured: boolean;
  rating: number;
  views: number;
  launchDate: string;
  pros: string[];
  cons: string[];
  useCases: string[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string; // HTML content
  category: string;
  featuredImage: string;
  author: string;
  createdAt: string;
  excerpt: string;
}

export interface SiteSettings {
  site_name: string;
  ga4_id: string;
  gsc_verification_tag: string;
  meta_title: string;
  meta_description: string;
}