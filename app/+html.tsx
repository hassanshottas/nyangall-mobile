import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

const SITE_URL = 'https://nyangall.ma';
const SITE_TITLE = 'NyangAll — Vendez et achetez partout au Maroc';
const SITE_DESCRIPTION =
  "NyangAll est la marketplace 100% marocaine pour acheter et vendre facilement entre particuliers : véhicules, immobilier, mode, électronique et bien plus, partout au Maroc.";
const OG_IMAGE = `${SITE_URL}/og-image.png`;
const GA_MEASUREMENT_ID = process.env.EXPO_PUBLIC_GA_ID;

// Document HTML racine pour l'export web (expo-router). Contrôle les balises
// <head> statiques (SEO, aperçu de partage) qui doivent exister avant même
// que l'app React ne s'hydrate — indispensable pour les robots des réseaux
// sociaux (WhatsApp, Facebook) qui ne lisent que le HTML brut.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <link rel="canonical" href={SITE_URL} />

        {/* Aperçu de partage (Open Graph) */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="NyangAll" />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:locale" content="fr_MA" />

        {/* Twitter/X card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />

        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#E76F51" />

        {GA_MEASUREMENT_ID ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`,
              }}
            />
          </>
        ) : null}

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
