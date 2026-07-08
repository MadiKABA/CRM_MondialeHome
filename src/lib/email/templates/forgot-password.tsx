import type { JSX } from "react";

interface ForgotPasswordEmailProps {
  resetUrl: string;
  userName: string;
  expiresIn: string;
  appUrl: string;
}

export function ForgotPasswordEmail({
  resetUrl,
  userName,
  expiresIn,
  appUrl,
}: ForgotPasswordEmailProps): JSX.Element {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Réinitialisation de votre mot de passe</title>
      </head>
      <body
        style={{
          margin: "0",
          padding: "0",
          backgroundColor: "#F5EFE6",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <table
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={{ backgroundColor: "#F5EFE6", padding: "40px 20px" }}
        >
          <tr>
            <td align="center">
              <table
                width="560"
                cellPadding="0"
                cellSpacing="0"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  maxWidth: "560px",
                }}
              >
                {/* Header */}
                <tr>
                  <td
                    style={{
                      backgroundColor: "#8B6914",
                      padding: "32px 40px",
                      textAlign: "center",
                    }}
                  >
                    <h1
                      style={{
                        margin: "0",
                        color: "#FFFFFF",
                        fontSize: "22px",
                        fontWeight: "700",
                        letterSpacing: "0.5px",
                      }}
                    >
                      MONDIALE HOME
                    </h1>
                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "rgba(255,255,255,0.8)",
                        fontSize: "13px",
                      }}
                    >
                      CRM — Gestion client
                    </p>
                  </td>
                </tr>

                {/* Content */}
                <tr>
                  <td style={{ padding: "40px 40px 32px" }}>
                    <p
                      style={{
                        margin: "0 0 16px",
                        fontSize: "16px",
                        color: "#2D2D2D",
                        fontWeight: "600",
                      }}
                    >
                      Bonjour {userName},
                    </p>
                    <p
                      style={{
                        margin: "0 0 24px",
                        fontSize: "15px",
                        color: "#555555",
                        lineHeight: "1.6",
                      }}
                    >
                      Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le
                      bouton ci-dessous pour en choisir un nouveau.
                    </p>

                    {/* CTA */}
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td align="center" style={{ paddingBottom: "24px" }}>
                          <a
                            href={resetUrl}
                            style={{
                              display: "inline-block",
                              backgroundColor: "#8B6914",
                              color: "#FFFFFF",
                              padding: "14px 32px",
                              borderRadius: "8px",
                              textDecoration: "none",
                              fontSize: "15px",
                              fontWeight: "600",
                              letterSpacing: "0.3px",
                            }}
                          >
                            Réinitialiser mon mot de passe
                          </a>
                        </td>
                      </tr>
                    </table>

                    {/* Expiration */}
                    <div
                      style={{
                        backgroundColor: "#FFF8E6",
                        border: "1px solid #E8C96A",
                        borderRadius: "8px",
                        padding: "12px 16px",
                        marginBottom: "24px",
                      }}
                    >
                      <p style={{ margin: "0", fontSize: "13px", color: "#8B6914" }}>
                        ⏱ Ce lien expire dans <strong>{expiresIn}</strong>. Après ce
                        délai, faites une nouvelle demande.
                      </p>
                    </div>

                    {/* Fallback link */}
                    <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#777777" }}>
                      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur
                      :
                    </p>
                    <p
                      style={{
                        margin: "0 0 24px",
                        fontSize: "12px",
                        color: "#8B6914",
                        wordBreak: "break-all",
                      }}
                    >
                      {resetUrl}
                    </p>

                    <hr
                      style={{
                        border: "none",
                        borderTop: "1px solid #EEEEEE",
                        margin: "24px 0",
                      }}
                    />

                    <p
                      style={{
                        margin: "0",
                        fontSize: "13px",
                        color: "#999999",
                        lineHeight: "1.5",
                      }}
                    >
                      Si vous n&apos;avez pas fait cette demande, ignorez cet email. Votre
                      mot de passe restera inchangé.
                    </p>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td
                    style={{
                      backgroundColor: "#F9F5EF",
                      padding: "20px 40px",
                      textAlign: "center",
                      borderTop: "1px solid #EEE6D8",
                    }}
                  >
                    <p style={{ margin: "0", fontSize: "12px", color: "#AAAAAA" }}>
                      © {new Date().getFullYear()} Mondiale Home · Dakar, Sénégal
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#CCCCCC" }}>
                      Envoyé depuis{" "}
                      <a
                        href={appUrl}
                        style={{ color: "#8B6914", textDecoration: "none" }}
                      >
                        {appUrl.replace(/https?:\/\//, "")}
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}
