// Génère le HTML final de l'email.
// Compatible Gmail, Outlook, Yahoo, mobile.
// Les articles et CTA viennent de la campagne, pas du template.

import { renderText, calcDiscountPercent, formatPrice } from "./renderer";
import { getHeaderConfig } from "../types";
import type {
  BuildEmailOptions,
  CampaignArticle,
  FreeImage,
  HeaderConfig,
} from "../types";

export function buildEmailHtml(opts: BuildEmailOptions): string {
  const {
    campaignType,
    productCategory,
    subject,
    content,
    conclusion,
    bannerImageUrl,
    bannerLinkUrl = null,
    articles = [],
    freeImages = [],
    ctaText = null,
    ctaUrl = null,
    clientData,
    campaignVars,
  } = opts;

  const header = getHeaderConfig(campaignType, productCategory);
  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";

  const render = (text: string | null) =>
    text ? renderText(text, clientData, campaignVars) : "";

  const articlesHtml = articles.length > 0 ? buildArticlesGrid(articles) : "";
  const freeImagesHtml = freeImages.length > 0 ? buildFreeImagesGrid(freeImages) : "";
  const hasBannerImage = !!bannerImageUrl?.trim();

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${render(subject)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: #F5EFE6; }
    table { border-spacing: 0; }
    img { border: 0; display: block; }
    @media only screen and (max-width: 480px) {
      .article-td { width: 100% !important; max-width: 100% !important; display: block !important; padding: 0 0 12px !important; }
      .email-container { width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F5EFE6; font-family: Inter, Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5EFE6; padding: 24px 16px;">
    <tr>
      <td align="center">

        <table class="email-container" width="560" cellpadding="0" cellspacing="0"
               style="max-width: 560px; background-color: #FFFFFF; border-radius: 12px;
                      overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">

          <!-- ═══ LOGO HEADER (toujours visible) ═══ -->
          ${buildLogoHeader()}

          <!-- ═══ HEADER (colore, fallback) OU BANNIERE IMAGE (si uploadee) ═══ -->
          ${
            hasBannerImage
              ? buildBannerImage(bannerImageUrl!, bannerLinkUrl)
              : buildCampaignHeader(header, render)
          }

          <!-- ═══ INTRODUCTION (depuis le template) ═══ -->
          ${
            content
              ? `
          <tr>
            <td style="padding: 32px 40px 24px;">
              <p style="margin: 0; font-size: 15px; color: #2D2D2D; line-height: 1.7; white-space: pre-line;">
                ${escapeHtml(render(content))}
              </p>
            </td>
          </tr>`
              : ""
          }

          <!-- ═══ ARTICLES (depuis la campagne) ═══ -->
          ${
            articlesHtml
              ? `
          <tr>
            <td style="padding: 0 24px 24px;">
              ${articlesHtml}
            </td>
          </tr>`
              : ""
          }

          <!-- ═══ IMAGES LIBRES (depuis la campagne) ═══ -->
          ${
            freeImagesHtml
              ? `
          <tr>
            <td style="padding: 0 24px 24px;">
              ${freeImagesHtml}
            </td>
          </tr>`
              : ""
          }

          <!-- ═══ CONCLUSION (depuis le template) ═══ -->
          ${
            conclusion
              ? `
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0; font-size: 14px; color: #555555; line-height: 1.6; white-space: pre-line;">
                ${escapeHtml(render(conclusion))}
              </p>
            </td>
          </tr>`
              : ""
          }

          <!-- ═══ BOUTON PRINCIPAL (depuis la campagne) ═══ -->
          ${
            ctaText && ctaUrl
              ? `
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <a href="${sanitizeUrl(ctaUrl)}"
                 style="display: inline-block; background-color: #8B6914; color: #FFFFFF;
                        text-decoration: none; padding: 14px 36px; border-radius: 8px;
                        font-size: 15px; font-weight: 700; letter-spacing: 0.5px;">
                ${escapeHtml(render(ctaText))}
              </a>
            </td>
          </tr>`
              : ""
          }

          <!-- ═══ FOOTER (automatique) ═══ -->
          <tr>
            <td style="background-color: #F9F5EF; padding: 24px 40px; text-align: center;
                       border-top: 1px solid #EEE6D8;">
              <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700;
                        color: #8B6914; letter-spacing: 2px;">
                MONDIAL HOME
              </p>
              <p style="margin: 0 0 4px; font-size: 12px; color: #999999;">
                Dakar, Rue 10 × Liberté 6
              </p>
              <p style="margin: 0 0 16px; font-size: 12px; color: #999999;">
                +221 33 820 00 00
              </p>
              <p style="margin: 0; font-size: 11px; color: #CCCCCC;">
                © ${new Date().getFullYear()} Mondial Home · Dakar, Sénégal
                &nbsp;·&nbsp;
                <a href="${appUrl}/unsubscribe" style="color: #BBBBBB; text-decoration: underline;">
                  Se désabonner
                </a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ── Logo header — toujours visible, jamais remplacé (image bannière ou header colore) ──

function buildLogoHeader(): string {
  return `
  <tr>
    <td style="background-color: #FFFFFF; padding: 20px 40px 16px; text-align: center;
               border-bottom: 2px solid #EEE6D8;">
      <p style="margin: 0 0 2px; font-size: 22px; font-weight: 900; color: #8B6914;
                letter-spacing: 2px;">
        MONDIAL HOME
      </p>
      <p style="margin: 0; font-size: 10px; color: #999999; letter-spacing: 2px;">
        MOBILIER &amp; DÉCORATION
      </p>
    </td>
  </tr>`;
}

// ── Header colore du template — fallback affiche uniquement si pas de bannière image ──

function buildCampaignHeader(
  header: HeaderConfig,
  render: (text: string | null) => string
): string {
  return `
  <tr>
    <td style="background-color: ${header.bgColor}; padding: 32px 40px; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 32px; line-height: 1;">
        ${header.icon}
      </p>
      <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 800;
                 color: ${header.textColor}; letter-spacing: 1px; text-transform: uppercase;">
        ${render(header.title)}
      </h1>
      <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.85); line-height: 1.5;">
        ${render(header.subtitle)}
      </p>
    </td>
  </tr>`;
}

// ── Bannière image (depuis la campagne) — remplace le header colore quand fournie ──

function buildBannerImage(imageUrl: string, linkUrl: string | null | undefined): string {
  const safeImageUrl = sanitizeUrl(imageUrl);
  const safeLinkUrl = linkUrl ? sanitizeUrl(linkUrl) : null;

  const img = `<img
        src="${safeImageUrl}"
        alt="Bannière Mondial Home"
        width="560"
        style="width: 100%; max-height: 220px; object-fit: cover; display: block;"
      />`;

  return `
  <tr>
    <td style="padding: 0;">
      ${safeLinkUrl ? `<a href="${safeLinkUrl}" style="display: block;">${img}</a>` : img}
    </td>
  </tr>`;
}

// ── Grille d'articles depuis le catalogue M2 ──────────────────────────────────

const ARTICLE_CARD_WIDTH = 250;

function buildArticlesGrid(articles: CampaignArticle[]): string {
  if (articles.length === 0) return "";

  if (articles.length === 1) {
    return buildCenteredArticleRow(articles[0]!);
  }

  const rows: string[] = [];
  const pairCount = Math.floor(articles.length / 2) * 2;

  for (let i = 0; i < pairCount; i += 2) {
    rows.push(buildArticlePairRow(articles[i]!, articles[i + 1]!));
  }

  if (articles.length % 2 === 1) {
    rows.push(buildCenteredArticleRow(articles[articles.length - 1]!));
  }

  return rows.join("");
}

// ── 1 article seul, ou dernier article d'un nombre impair → centré ────────────

function buildCenteredArticleRow(article: CampaignArticle): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
    <tr>
      <td align="center">
        <table width="${ARTICLE_CARD_WIDTH}" cellpadding="0" cellspacing="0">
          <tr>
            <td>${buildArticleCard(article)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

// ── 2 articles côte à côte — colonnes fixes compatibles Outlook ────────────────

function buildArticlePairRow(left: CampaignArticle, right: CampaignArticle): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
    <tr>
      <!--[if mso]><td width="${ARTICLE_CARD_WIDTH}" valign="top"><![endif]-->
      <td class="article-td" valign="top"
          style="width: ${ARTICLE_CARD_WIDTH}px; max-width: ${ARTICLE_CARD_WIDTH}px; padding-right: 6px;">
        ${buildArticleCard(left)}
      </td>
      <!--[if mso]></td><td width="${ARTICLE_CARD_WIDTH}" valign="top"><![endif]-->
      <td class="article-td" valign="top"
          style="width: ${ARTICLE_CARD_WIDTH}px; max-width: ${ARTICLE_CARD_WIDTH}px; padding-left: 6px;">
        ${buildArticleCard(right)}
      </td>
      <!--[if mso]></td><![endif]-->
    </tr>
  </table>`;
}

function buildArticleCard(article: CampaignArticle): string {
  const hasPromo = !!article.promoPrice && article.promoPrice > 0;
  const displayPrice = hasPromo
    ? formatPrice(article.promoPrice!)
    : formatPrice(article.price);
  const originalPrice = hasPromo ? formatPrice(article.price) : null;
  const discount = hasPromo
    ? calcDiscountPercent(article.price, article.promoPrice!)
    : null;

  const safeImageUrl = article.mainImage ? sanitizeUrl(article.mainImage) : null;
  const safeLinkUrl = article.linkUrl ? sanitizeUrl(article.linkUrl) : null;

  const linkOpen = safeLinkUrl
    ? `<a href="${safeLinkUrl}" style="text-decoration: none; color: inherit;">`
    : "";
  const linkClose = safeLinkUrl ? "</a>" : "";

  return `
  <table width="100%" cellpadding="0" cellspacing="0"
         style="border: 1px solid #EEE6D8; border-radius: 8px; overflow: hidden;">

    <tr>
      <td style="padding: 0; position: relative;">
        ${linkOpen}
        ${
          safeImageUrl
            ? `<img src="${safeImageUrl}" alt="${escapeHtml(article.name)}" width="100%"
                  style="width: 100%; height: 160px; object-fit: cover; display: block;" />`
            : `<div style="width: 100%; height: 160px; background-color: #F5EFE6;
                         text-align: center; line-height: 160px; font-size: 36px;">
               🛋️
             </div>`
        }
        ${linkClose}
        ${
          discount
            ? `
        <div style="position: absolute; top: 10px; left: 10px; background-color: #DC2626;
                    color: #FFFFFF; padding: 4px 8px; border-radius: 6px;
                    font-size: 12px; font-weight: 700;">
          -${discount}%
        </div>`
            : ""
        }
      </td>
    </tr>

    <tr>
      <td style="padding: 10px 12px 12px;">
        ${linkOpen}
        <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700;
                  color: #2D2D2D; line-height: 1.35;">
          ${escapeHtml(article.name)}
        </p>
        ${linkClose}

        <p style="margin: 0 0 6px; font-size: 10px; color: #AAAAAA;">
          Réf. ${escapeHtml(article.reference)}
        </p>

        ${
          originalPrice
            ? `<p style="margin: 0 0 2px; font-size: 11px; color: #999999;"><s>${originalPrice}</s></p>`
            : ""
        }

        <p style="margin: 0 0 8px; font-size: 16px; font-weight: 800; color: #8B6914;">
          ${displayPrice}
        </p>

        ${
          safeLinkUrl
            ? `<a href="${safeLinkUrl}"
                 style="display: block; text-align: center; background-color: #F5EFE6;
                        color: #8B6914; border: 1px solid #C9A66B; border-radius: 5px;
                        padding: 5px 12px; font-size: 11px; font-weight: 600; text-decoration: none;">
                Voir →
             </a>`
            : ""
        }
      </td>
    </tr>

  </table>`;
}

// ── Grille d'images libres (flyers, photos, affiches...) ──────────────────────

function buildFreeImagesGrid(images: FreeImage[]): string {
  if (images.length === 0) return "";

  const blocks = images.map(buildFreeImageBlock).join("");

  return `
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0"><tr><![endif]-->
        ${blocks}
        <!--[if mso]></tr></table><![endif]-->
      </td>
    </tr>
  </table>`;
}

function buildFreeImageBlock(image: FreeImage): string {
  const safeImageUrl = sanitizeUrl(image.url);
  const safeLinkUrl = image.linkUrl ? sanitizeUrl(image.linkUrl) : null;
  const isFull = image.layout === "full";

  const linkOpen = safeLinkUrl
    ? `<a href="${safeLinkUrl}" style="text-decoration: none; color: inherit;">`
    : "";
  const linkClose = safeLinkUrl ? "</a>" : "";

  return `
  <!--[if mso]><td width="${isFull ? "560" : "270"}" valign="top"><![endif]-->
  <div style="width: ${isFull ? "100%" : "48%"}; display: ${isFull ? "block" : "inline-block"};
              vertical-align: top; margin: 0 ${isFull ? "0" : "1%"}; margin-bottom: 16px;">
    ${linkOpen}
    <img src="${safeImageUrl}" alt="${escapeHtml(image.alt)}" width="100%"
         style="width: 100%; border-radius: 10px; display: block; object-fit: cover;" />
    ${linkClose}
    ${
      image.caption
        ? `<p style="margin: 8px 0 0; font-size: 12px; color: #666666; line-height: 1.4; text-align: center;">
             ${escapeHtml(image.caption)}
           </p>`
        : ""
    }
  </div>
  <!--[if mso]></td><![endif]-->`;
}

// ── Helpers sécurité ──────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol)) return "#";
    return parsed.toString();
  } catch {
    return "#";
  }
}
