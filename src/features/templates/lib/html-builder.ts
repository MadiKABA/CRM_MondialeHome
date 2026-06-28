// Génère le HTML final de l'email.
// Compatible Gmail, Outlook, Yahoo, mobile.
// Les articles et CTA viennent de la campagne, pas du template.

import { renderText, calcDiscountPercent, formatPrice } from "./renderer";
import { getHeaderConfig } from "../types";
import type { BuildEmailOptions, CampaignArticle } from "../types";

export function buildEmailHtml(opts: BuildEmailOptions): string {
  const {
    campaignType,
    productCategory,
    subject,
    content,
    conclusion,
    bannerImageUrl,
    articles = [],
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
    .article-card { display: inline-block; width: 48%; vertical-align: top; }
    @media only screen and (max-width: 480px) {
      .article-card { width: 100% !important; display: block !important; }
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

          <!-- ═══ HEADER (depuis le template) ═══ -->
          <tr>
            <td style="background-color: ${header.bgColor}; padding: 32px 40px; text-align: center;">
              <p style="margin: 0 0 16px; font-size: 13px; font-weight: 700;
                        letter-spacing: 3px; color: rgba(255,255,255,0.7); text-transform: uppercase;">
                MONDIAL HOME
              </p>
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
          </tr>

          <!-- ═══ BANNIÈRE (depuis la campagne) ═══ -->
          ${
            bannerImageUrl
              ? `
          <tr>
            <td style="padding: 0;">
              <img
                src="${sanitizeUrl(bannerImageUrl)}"
                alt="Bannière Mondial Home"
                width="560"
                style="width: 100%; max-height: 220px; object-fit: cover; display: block;"
              />
            </td>
          </tr>`
              : ""
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

// ── Grille d'articles depuis le catalogue M2 ──────────────────────────────────

function buildArticlesGrid(articles: CampaignArticle[]): string {
  if (articles.length === 0) return "";

  const cards = articles.map(buildArticleCard).join("");

  return `
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0"><tr><![endif]-->
        ${cards}
        <!--[if mso]></tr></table><![endif]-->
      </td>
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
  <!--[if mso]><td width="250" valign="top"><![endif]-->
  <div class="article-card"
       style="width: 48%; display: inline-block; vertical-align: top; margin: 0 1%; margin-bottom: 16px;">
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border: 1px solid #EEE6D8; border-radius: 10px; overflow: hidden;">

      <tr>
        <td style="padding: 0; position: relative;">
          ${linkOpen}
          ${
            safeImageUrl
              ? `<img src="${safeImageUrl}" alt="${escapeHtml(article.name)}" width="100%"
                    style="width: 100%; height: 180px; object-fit: cover; display: block;" />`
              : `<div style="width: 100%; height: 180px; background-color: #F5EFE6;
                           text-align: center; line-height: 180px; font-size: 40px;">
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
        <td style="padding: 12px 14px 14px;">
          ${linkOpen}
          <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600;
                    color: #2D2D2D; line-height: 1.3;">
            ${escapeHtml(article.name)}
          </p>
          ${linkClose}

          <p style="margin: 0 0 6px; font-size: 10px; color: #AAAAAA;">
            Réf. ${escapeHtml(article.reference)}
          </p>

          ${
            originalPrice
              ? `<p style="margin: 0 0 2px; font-size: 12px; color: #999999;"><s>${originalPrice}</s></p>`
              : ""
          }

          <p style="margin: 0 0 10px; font-size: 18px; font-weight: 800; color: #8B6914;">
            ${displayPrice}
          </p>

          ${
            safeLinkUrl
              ? `<a href="${safeLinkUrl}"
                   style="display: block; text-align: center; background-color: #F5EFE6;
                          color: #8B6914; border: 1px solid #C9A66B; border-radius: 6px;
                          padding: 8px 12px; font-size: 12px; font-weight: 600; text-decoration: none;">
                  Voir les détails →
               </a>`
              : ""
          }
        </td>
      </tr>

    </table>
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
