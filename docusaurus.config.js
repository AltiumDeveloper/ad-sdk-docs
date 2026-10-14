// @ts-check
const { readFileSync } = require('node:fs');
const { parse } = require('yaml');
const { themes } = require('prism-react-renderer');

const site = parse(readFileSync('./config/site.yaml', 'utf8'));
const DEVELOPER_CENTER = 'https://developer.altium.com/';
const PLATFORM_API_DOCS = 'https://altiumdeveloper.github.io/platform-api-docs/';

/** @returns {Promise<import('@docusaurus/types').Config>} */
module.exports = async function createConfig() {
  // Links API names in code spans of the guides (.generated/xref.json from `npm run apidocs`).
  const { default: remarkXref } = await import('./plugins/remark-xref.mjs');
  return {
  title: site.title,
  tagline: site.tagline,
  url: site.url,
  baseUrl: site.baseUrl,
  organizationName: 'AltiumDeveloper',
  projectName: 'ad-sdk-api-reference',
  favicon: 'img/favicon.svg',
  onBrokenLinks: 'throw',
  // Reference pages are plain CommonMark (.md); guides and the home page are MDX (.mdx).
  markdown: { format: 'detect', hooks: { onBrokenMarkdownLinks: 'throw' } },
  plugins: [
    // Search: src/theme/SearchBar over static/search-index.json (npm run search:index), also published under a
    // content-hashed name (usePluginData('search-index').file).
    './plugins/search-index.cjs',
  ],
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        blog: false,
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          editUrl: `${site.repo}/edit/${site.branch}/`,
          remarkPlugins: [remarkXref],
        },
        theme: { customCss: './src/css/custom.css' },
      }),
    ],
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: { respectPrefersColorScheme: true },
      prism: { theme: themes.github, darkTheme: themes.oneDark, additionalLanguages: ['csharp'] },
      navbar: {
        title: `${site.title} - Reference Documentation`,
        logo: { alt: 'Altium', src: 'img/altium-logo.svg', width: 90, height: 20 },
        items: [
          { href: site.examples.repo, label: 'SDK examples', position: 'right' },
          { href: DEVELOPER_CENTER, label: 'Developer Center', position: 'right' },
          { href: site.repo, label: 'GitHub', position: 'right' },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Altium',
            items: [
              { label: 'Developer Center', href: DEVELOPER_CENTER },
              { label: 'Altium 365 API reference', href: PLATFORM_API_DOCS },
            ],
          },
          {
            title: 'This site',
            items: [
              { label: 'For AI assistants (llms.txt)', href: 'pathname:///llms.txt' },
              { label: 'SDK examples', href: site.examples.repo },
              { label: 'Source on GitHub', href: site.repo },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Altium.`,
      },
    }),
  };
};
