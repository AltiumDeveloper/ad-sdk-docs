import React, { type ReactNode } from 'react';
import DocBreadcrumbs from '@theme-original/DocBreadcrumbs';
import HomeBreadcrumbItem from '@theme/DocBreadcrumbs/Items/Home';
import type DocBreadcrumbsType from '@theme/DocBreadcrumbs';
import type { WrapperProps } from '@docusaurus/types';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { markdownHref } from '../markdownRoute';

type Props = WrapperProps<typeof DocBreadcrumbsType>;
type Crumb = [label: string, route: string | null];

// Member pages are not in the sidebar (the type page links them), so the sidebar gives them no breadcrumbs; the
// generator writes their trail into the `crumbs` front matter instead (`[[label, route], …]`, routes without baseUrl).
function MemberBreadcrumbs({ crumbs, title }: { crumbs: Crumb[]; title: string }): ReactNode {
  return (
    <nav className="theme-doc-breadcrumbs" aria-label="Breadcrumbs">
      <ul className="breadcrumbs">
        <HomeBreadcrumbItem />
        {crumbs.map(([label, route]) => (
          <li key={label} className="breadcrumbs__item">
            {route ? <Link className="breadcrumbs__link" to={route}><span>{label}</span></Link> : <span className="breadcrumbs__link">{label}</span>}
          </li>
        ))}
        <li className="breadcrumbs__item breadcrumbs__item--active">
          <span className="breadcrumbs__link">{title}</span>
        </li>
      </ul>
    </nav>
  );
}

// A small "View as Markdown" link on the breadcrumbs row of every doc page. The Markdown twins are written by
// `npm run llms` after the build, so this is a plain <a> (a router <Link> would fail the broken-link check). It
// sits in the breadcrumbs row, outside `.theme-doc-markdown`, so the Markdown conversion never sees it.
export default function DocBreadcrumbsWrapper(props: Props): ReactNode {
  const { metadata } = useDoc();
  const { siteConfig } = useDocusaurusContext();
  const href = markdownHref(metadata.permalink, siteConfig.baseUrl);
  const crumbs = (metadata.frontMatter as { crumbs?: Crumb[] }).crumbs;
  return (
    <div className="doc-markdown-row">
      <div className="doc-markdown-row__crumbs">
        {crumbs ? <MemberBreadcrumbs crumbs={crumbs} title={metadata.frontMatter.sidebar_label ?? metadata.title} /> : <DocBreadcrumbs {...props} />}
      </div>
      <a className="doc-markdown-link" href={href} title="Markdown version of this page for AI assistants">
        View as Markdown
      </a>
    </div>
  );
}
