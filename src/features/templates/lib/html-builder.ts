import { calcDiscountPercent, formatPrice, renderText, type TestData } from "./renderer";
import { getHeaderConfig } from "../types";
import type { TemplateProduct } from "../types";

interface BuildEmailHtmlOptions {
  campaignType: string;
  productCategory: string | null;
  subject: string;
  content: string | null;
  conclusion: string | null;
  products: TemplateProduct[];
  ctaText: string | null;
  ctaUrl: string | null;
  testData?: TestData;
}

export function buildEmailHtml(opts: BuildEmailHtmlOptions): string {
  const data = opts.testData;
  const header = getHeaderConfig(opts.campaignType, opts.productCategory);
  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";

  const render = (text: string | null) => (text ? renderText(text, data) : "");

  const productsHtml = buildProductsGrid(opts.products);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${render(opts.subject)}</title>
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
    .product-card { display: inline-block; width: 48%; vertical-align: top; }
    @media only screen and (max-width: 480px) {
      .product-card { width: 100% !important; display: block !important; }
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

          <!-- HEADER -->
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

          <!-- INTRODUCTION -->
          ${
            opts.content
              ? `
          <tr>
            <td style="padding: 32px 40px 24px;">
              <p style="margin: 0; font-size: 15px; color: #2D2D2D; line-height: 1.7;">
                ${render(opts.content).replace(/\n/g, "<br/>")}
              </p>
            </td>
          </tr>`
              : ""
          }

          <!-- PRODUITS -->
          ${
            opts.products.length > 0
              ? `
          <tr>
            <td style="padding: 0 24px 24px;">
              ${productsHtml}
            </td>
          </tr>`
              : ""
          }

          <!-- CONCLUSION -->
          ${
            opts.conclusion
              ? `
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0; font-size: 14px; color: #555555; line-height: 1.6;">
                ${render(opts.conclusion).replace(/\n/g, "<br/>")}
              </p>
            </td>
          </tr>`
              : ""
          }

          <!-- BOUTON PRINCIPAL -->
          ${
            opts.ctaText && opts.ctaUrl
              ? `
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <a href="${render(opts.ctaUrl)}"
                 style="display: inline-block; background-color: #8B6914; color: #FFFFFF;
                        text-decoration: none; padding: 14px 36px; border-radius: 8px;
                        font-size: 15px; font-weight: 700; letter-spacing: 0.5px;">
                ${render(opts.ctaText)}
              </a>
            </td>
          </tr>`
              : ""
          }

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #F9F5EF; padding: 24px 40px; text-align: center;
                       border-top: 1px solid #EEE6D8;">
              <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700;
                        color: #8B6914; letter-spacing: 2px;">
                MONDIAL HOME
              </p>
              <p style="margin: 0 0 4px; font-size: 12px; color: #999999;">
                ${render("{{adresse_boutique}}")}
              </p>
              <p style="margin: 0 0 16px; font-size: 12px; color: #999999;">
                ${render("{{telephone_boutique}}")}
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

function buildProductsGrid(products: TemplateProduct[]): string {
  if (products.length === 0) return "";
  const cards = products.map(buildProductCard).join("");
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

function buildProductCard(product: TemplateProduct): string {
  const hasPromo = product.promoPrice !== null && product.promoPrice !== undefined;
  const discount =
    hasPromo && product.originalPrice
      ? calcDiscountPercent(product.originalPrice, product.promoPrice!)
      : null;

  const displayPrice = hasPromo
    ? formatPrice(product.promoPrice!)
    : product.originalPrice
      ? formatPrice(product.originalPrice)
      : null;

  const originalPrice =
    hasPromo && product.originalPrice ? formatPrice(product.originalPrice) : null;

  const hasLink = !!product.linkUrl;
  const linkStart = hasLink
    ? `<a href="${product.linkUrl}" style="text-decoration: none; color: inherit;">`
    : "";
  const linkEnd = hasLink ? "</a>" : "";

  return `
  <!--[if mso]><td width="260" valign="top"><![endif]-->
  <div class="product-card" style="width: 48%; display: inline-block; vertical-align: top;
              margin: 0 1%; margin-bottom: 16px;">
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border: 1px solid #EEE6D8; border-radius: 10px; overflow: hidden;">

      <tr>
        <td style="padding: 0; position: relative;">
          ${linkStart}
          ${
            product.imageUrl
              ? `<img src="${product.imageUrl}" alt="${product.title}" width="100%"
                    style="width: 100%; height: 180px; object-fit: cover; display: block;" />`
              : `<div style="width: 100%; height: 180px; background-color: #F5EFE6;
                           display: flex; align-items: center; justify-content: center;">
                 <span style="font-size: 40px;">🛋️</span>
               </div>`
          }
          ${linkEnd}
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
          ${linkStart}
          <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600;
                    color: #2D2D2D; line-height: 1.3;">
            ${product.title}
          </p>
          ${linkEnd}

          ${
            originalPrice
              ? `<p style="margin: 0 0 2px; font-size: 12px; color: #999999;"><s>${originalPrice}</s></p>`
              : ""
          }

          ${
            displayPrice
              ? `<p style="margin: 0 0 10px; font-size: 18px; font-weight: 800; color: #8B6914;">
            ${displayPrice}
          </p>`
              : ""
          }

          ${
            hasLink
              ? `<a href="${product.linkUrl}"
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
