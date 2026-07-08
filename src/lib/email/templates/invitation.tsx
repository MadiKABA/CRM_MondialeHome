import type { JSX } from "react";

interface InvitationEmailProps {
  recipientName: string;
  inviterName: string;
  loginUrl: string;
  email: string;
  tempPassword: string;
  roleName: string;
  appUrl: string;
}

export function InvitationEmail({
  recipientName,
  inviterName,
  loginUrl,
  email,
  tempPassword,
  roleName,
  appUrl,
}: InvitationEmailProps): JSX.Element {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Bienvenue sur Mondiale Home CRM</title>
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
                        margin: "0 0 8px",
                        fontSize: "20px",
                        color: "#2D2D2D",
                        fontWeight: "700",
                      }}
                    >
                      Bienvenue, {recipientName} !
                    </p>
                    <p
                      style={{
                        margin: "0 0 24px",
                        fontSize: "15px",
                        color: "#555555",
                        lineHeight: "1.6",
                      }}
                    >
                      <strong>{inviterName}</strong> vous a ajouté au CRM de{" "}
                      <strong>Mondiale Home</strong> avec le profil{" "}
                      <strong>{roleName}</strong>. Voici vos identifiants de connexion :
                    </p>

                    {/* Credentials block */}
                    <div
                      style={{
                        backgroundColor: "#F9F5EF",
                        border: "1px solid #EEE6D8",
                        borderRadius: "8px",
                        padding: "20px 24px",
                        marginBottom: "24px",
                      }}
                    >
                      <table width="100%" cellPadding="0" cellSpacing="0">
                        <tr>
                          <td style={{ paddingBottom: "12px" }}>
                            <p
                              style={{
                                margin: "0 0 4px",
                                fontSize: "12px",
                                color: "#999999",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Adresse email
                            </p>
                            <p
                              style={{
                                margin: "0",
                                fontSize: "15px",
                                color: "#2D2D2D",
                                fontWeight: "600",
                              }}
                            >
                              {email}
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{ borderTop: "1px solid #EEE6D8", paddingTop: "12px" }}
                          >
                            <p
                              style={{
                                margin: "0 0 4px",
                                fontSize: "12px",
                                color: "#999999",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Mot de passe temporaire
                            </p>
                            <p
                              style={{
                                margin: "0",
                                fontSize: "18px",
                                color: "#8B6914",
                                fontWeight: "700",
                                fontFamily: "Courier New, monospace",
                                letterSpacing: "2px",
                              }}
                            >
                              {tempPassword}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </div>

                    {/* Security warning */}
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
                        🔒 Pour votre sécurité, changez votre mot de passe dès votre
                        première connexion dans votre profil.
                      </p>
                    </div>

                    {/* CTA */}
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td align="center" style={{ paddingBottom: "24px" }}>
                          <a
                            href={loginUrl}
                            style={{
                              display: "inline-block",
                              backgroundColor: "#8B6914",
                              color: "#FFFFFF",
                              padding: "14px 32px",
                              borderRadius: "8px",
                              textDecoration: "none",
                              fontSize: "15px",
                              fontWeight: "600",
                            }}
                          >
                            Se connecter maintenant
                          </a>
                        </td>
                      </tr>
                    </table>

                    <hr
                      style={{
                        border: "none",
                        borderTop: "1px solid #EEEEEE",
                        margin: "0 0 20px",
                      }}
                    />

                    <p style={{ margin: "0", fontSize: "13px", color: "#999999" }}>
                      Lien de connexion :{" "}
                      <a href={loginUrl} style={{ color: "#8B6914" }}>
                        {loginUrl}
                      </a>
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
