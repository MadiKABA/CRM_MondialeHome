export const UPLOAD_CONFIG = {
  BASE_DIR: "public/uploads",

  ALLOWED_MIME_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const,

  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"] as const,

  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5 Mo

  AVATAR: {
    MAX_WIDTH: 400,
    MAX_HEIGHT: 400,
    QUALITY: 85,
    SUBDIR: "avatars",
    FILENAME: "avatar.webp",
  },

  ARTICLE_MAIN: {
    MAX_WIDTH: 1200,
    MAX_HEIGHT: 1200,
    QUALITY: 82,
    SUBDIR: "articles",
    FILENAME: "main.webp",
  },

  ARTICLE_SECONDARY: {
    MAX_COUNT: 5,
    MAX_WIDTH: 1200,
    MAX_HEIGHT: 1200,
    QUALITY: 80,
    SUBDIR: "articles",
  },
} as const;

export function getAvatarUrl(userId: string): string {
  return `/uploads/avatars/${userId}/avatar.webp`;
}

export function getArticleMainImageUrl(articleId: string): string {
  return `/uploads/articles/${articleId}/main.webp`;
}

export function getArticleSecondaryImageUrl(articleId: string, index: number): string {
  return `/uploads/articles/${articleId}/${index}.webp`;
}
