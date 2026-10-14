import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import { isActiveSidebarItem } from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/Icon/ExternalLink';
import type { Props } from '@theme/DocSidebarItem/Link';

// Ejected from the classic theme (DocSidebarItem/Link) with one change: labels are rendered with <wbr> before
// every capital that follows a lowercase letter or digit. GraphQL names are long camelCase identifiers
// (`desProjectCollaborationSimulationLatestRevision`) that the stock sidebar breaks mid-word; this wraps them
// between words instead. The full name stays in `title`.
const CAMEL_BOUNDARY = /(?<=[a-z0-9])(?=[A-Z])/;

export function breakCamelCase(label: string): ReactNode[] {
  return label.split(CAMEL_BOUNDARY).flatMap((part, index) => (index === 0 ? [part] : [<wbr key={index} />, part]));
}

function LinkLabel({ label }: { label: string }): ReactNode {
  return (
    <span title={label} className="menu__link-label">
      {breakCamelCase(label)}
    </span>
  );
}

export default function DocSidebarItemLink({ item, onItemClick, activePath, level, index: _index, ...props }: Props): ReactNode {
  const { href, label, className, autoAddBaseUrl } = item;
  const isActive = isActiveSidebarItem(item, activePath);
  const isInternalLink = isInternalUrl(href);
  return (
    <li
      className={clsx(
        ThemeClassNames.docs.docSidebarItemLink,
        ThemeClassNames.docs.docSidebarItemLinkLevel(level),
        'menu__list-item',
        className,
      )}
      key={label}
    >
      <Link
        className={clsx('menu__link', { 'menu__link--active': isActive })}
        autoAddBaseUrl={autoAddBaseUrl}
        aria-current={isActive ? 'page' : undefined}
        to={href}
        {...(isInternalLink && { onClick: onItemClick ? () => onItemClick(item) : undefined })}
        {...props}
      >
        <LinkLabel label={label} />
        {!isInternalLink && <IconExternalLink />}
      </Link>
    </li>
  );
}
