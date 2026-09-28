import './globals.css';

export const metadata = {
  title: 'AI Resume Analyzer - Next-Gen ATS Portal',
  description: 'AI-Powered Resume ATS Matching Tool using Gemini and MongoDB',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{__html: `
          try {
            const theme = localStorage.getItem('app-theme') || 'theme-midnight';
            document.documentElement.className = theme;
          } catch (e) {}
        `}} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}