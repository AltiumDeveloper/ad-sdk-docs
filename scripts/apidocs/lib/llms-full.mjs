// Pages in one Markdown file, each under front matter, in the format of the Altium 365 API reference's llms-full.txt.
export function llmsFull(pages) {
  return pages
    .map(({ title, url, namespace, kind, markdown }) => [
      '---',
      `title: ${JSON.stringify(title)}`,
      `url: ${JSON.stringify(url)}`,
      `namespace: ${JSON.stringify(namespace)}`,
      `kind: ${JSON.stringify(kind)}`,
      '---',
      '',
      markdown.trim(),
      '',
    ].join('\n'))
    .join('');
}
