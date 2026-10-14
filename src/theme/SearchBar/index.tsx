// Schema-aware search: a navbar button (⌘K / Ctrl+K, or "/") opening a modal over static/search-index.json.
// Ranking lives in src/search/engine.mjs; this file is only the UI. The index and MiniSearch are loaded on first use
// (hovering or focusing the button prefetches them), so they cost nothing on page load.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHistory, useLocation } from '@docusaurus/router';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import useGlobalData from '@docusaurus/useGlobalData';
import styles from './styles.module.css';

// The index under its content-hashed name (plugins/search-index.cjs), so a cached index never meets newer code; the
// plain name when the plugin has no index (dev server before `npm run search:index`).
function useIndexUrl(): string {
  const { withBaseUrl } = useBaseUrlUtils();
  const file = (useGlobalData() as any)?.['search-index']?.default?.file as string | null | undefined;
  return withBaseUrl(`/${file ?? 'search-index.json'}`);
}

type SearchRecord = {
  i: number; n: string; k: string; p?: string; c?: number; u: string; d?: string; s?: string; t?: string; f?: number; r?: string;
};
type Context = { id: string; title: string; slug: string };
type Result = { record: SearchRecord; score: number; more: number; others: SearchRecord[] };
type Loaded = { engine: any; index: any; records: SearchRecord[]; contexts: Context[] };
type Recent = { n: string; k: string; p?: string; u: string; c?: number };

const RECENT_KEY = 'api-search-recent';
const RECENT_MAX = 8;
const SHOWN = 60;

let loading: Promise<Loaded> | null = null;
function loadSearch(indexUrl: string): Promise<Loaded> {
  loading ??= Promise.all([
    // @ts-ignore — plain ES module shared with the build scripts
    import('../../search/engine.mjs'),
    fetch(indexUrl).then((response) => {
      if (!response.ok) throw new Error(`search index: HTTP ${response.status}`);
      return response.json();
    }),
  ]).then(([engine, payload]) => ({ engine, ...engine.loadIndex(payload) }));
  loading.catch(() => {
    loading = null;
  });
  return loading;
}

function readRecent(): Recent[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function remember(record: SearchRecord) {
  const entry: Recent = { n: record.n, k: record.k, p: record.p, u: record.u, c: record.c };
  const rest = readRecent().filter((recent) => recent.u !== entry.u);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([entry, ...rest].slice(0, RECENT_MAX)));
  } catch {
    // private mode: no history
  }
}

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Marks the parts of `text` that start with a query word (`comp` in ISch_Component), word boundaries in identifiers
// included.
function Highlight({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>;
  const pattern = new RegExp(`(${words.map(escapeRegExp).join('|')})`, 'ig');
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <mark key={i} className={styles.mark}>{part}</mark> : <React.Fragment key={i}>{part}</React.Fragment>))}
    </>
  );
}

function KindPill({ kind, engine }: { kind: string; engine: any }) {
  const meta = engine?.KINDS?.[kind];
  return <span className={`${styles.kind} ${styles[`kind_${meta?.group ?? 'types'}`]}`}>{meta?.label ?? kind}</span>;
}

function ContextChip({ context }: { context?: Context }) {
  if (!context || context.id === 'common') return null;
  return <span className={`badge badge--secondary badge--context bc-${context.slug} ${styles.context}`}>{context.title}</span>;
}

const OTHERS_SHOWN = 40;

function ResultRow({ result, active, words, loaded, onPick, onHover, id, expanded, onToggle }: {
  result: Result; active: boolean; words: string[]; loaded: Loaded; onPick: (r: SearchRecord, newTab: boolean) => void;
  onHover: () => void; id: string; expanded: boolean; onToggle: () => void;
}) {
  const { record, more, others } = result;
  const { withBaseUrl } = useBaseUrlUtils();
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: 'nearest' });
  }, [active]);
  const flags = record.f ?? 0;
  const context = record.c !== undefined ? loaded.contexts[record.c] : undefined;
  const isGuide = record.k === 'guide';
  return (
    <li
      ref={ref}
      id={id}
      role="option"
      aria-selected={active}
      className={`${styles.result} ${active ? styles.active : ''}`}
      onMouseMove={onHover}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => onPick(record, event.metaKey || event.ctrlKey)}
    >
      <div className={styles.line}>
        <KindPill kind={record.k} engine={loaded.engine} />
        <span className={isGuide ? styles.guideName : styles.name}>
          {record.p && <span className={styles.parent}>{record.p}.</span>}
          <Highlight text={record.n} words={words} />
        </span>
        {record.s && <span className={styles.signature}>{record.s}</span>}
        <span className={styles.spacer} />
        {flags & loaded.engine.FLAG_EXPERIMENTAL ? <span className={styles.exp} title="Experimental">EXP</span> : null}
        {flags & loaded.engine.FLAG_DEPRECATED ? <span className={styles.deprecated}>Deprecated</span> : null}
        <ContextChip context={context} />
      </div>
      {(record.d || isGuide) && (
        <div className={styles.description}>
          {isGuide && record.t && record.t !== record.n && <span className={styles.page}>{record.t} › </span>}
          {record.d && <Highlight text={record.d.length > 180 ? `${record.d.slice(0, 179)}…` : record.d} words={words} />}
        </div>
      )}
      {record.r && <div className={styles.reason}>Deprecated: {record.r}</div>}
      {more > 0 && (
        <div className={styles.othersLine}>
          <button
            type="button"
            className={styles.othersToggle}
            aria-expanded={expanded}
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
          >
            {expanded ? '▾' : '▸'} also on {more} other {more === 1 ? 'type' : 'types'}
          </button>
          {expanded && (
            <span className={styles.others}>
              {others.slice(0, OTHERS_SHOWN).map((other) => (
                <a
                  key={other.i}
                  href={withBaseUrl(other.u)}
                  className={styles.other}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onPick(other, event.metaKey || event.ctrlKey);
                  }}
                >
                  {other.p}
                </a>
              ))}
              {others.length > OTHERS_SHOWN && <span className={styles.more}>+{others.length - OTHERS_SHOWN} more in the Fields tab</span>}
            </span>
          )}
        </div>
      )}
    </li>
  );
}

function SearchModal({ onClose, initialQuery }: { onClose: () => void; initialQuery: string }) {
  const { withBaseUrl } = useBaseUrlUtils();
  const indexUrl = useIndexUrl();
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const history = useHistory();
  const location = useLocation();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [group, setGroup] = useState('all');
  const [context, setContext] = useState<number | null>(null);
  const [hideDeprecated, setHideDeprecated] = useState(false);
  const [active, setActive] = useState(0);
  const [recent] = useState(readRecent);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSearch(indexUrl).then(setLoaded, (err) => setError(String(err?.message ?? err)));
    inputRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [indexUrl]);

  // On a reference page, results from that page's bounded context get a small boost.
  const currentContext = useMemo(() => {
    if (!loaded) return null;
    const slug = /\/reference\/(?:deprecated\/)?([^/]+)\//.exec(location.pathname)?.[1];
    const index = loaded.contexts.findIndex((c) => c.slug === slug);
    return index === -1 ? null : index;
  }, [loaded, location.pathname]);

  const { results, counts, elapsed } = useMemo(() => {
    const empty = { results: [] as Result[], counts: {} as Record<string, number>, elapsed: 0 };
    if (!loaded || !query.trim()) return empty;
    const started = performance.now();
    const all = loaded.engine.search(loaded.index, loaded.records, query, {
      ...loaded.engine.indexOptions(loaded), context, includeDeprecated: !hideDeprecated, currentContext, limit: 400,
    });
    const tally: Record<string, number> = { all: 0 };
    for (const { record } of loaded.engine.collapseMembers(all)) {
      const g = loaded.engine.KINDS[record.k]?.group;
      tally[g] = (tally[g] ?? 0) + 1;
      tally.all += 1;
    }
    const inGroup = group === 'all' ? all : all.filter(({ record }) => loaded.engine.KINDS[record.k]?.group === group);
    const shown = loaded.engine.collapseMembers(inGroup, { keepAll: group === 'members' }).slice(0, SHOWN);
    return { results: shown, counts: tally, elapsed: performance.now() - started };
  }, [loaded, query, group, context, hideDeprecated, currentContext]);

  const words = useMemo(
    () => (loaded
      ? ([...new Set(query.trim().split(/\s+/).flatMap((w) => loaded.engine.identifierWords(w)))] as string[])
        .filter((w) => w.length >= 2 && !loaded.engine.isStopWord(w))
      : []),
    [loaded, query],
  );

  useEffect(() => {
    setActive(0);
    setExpanded(new Set());
  }, [query, group, context, hideDeprecated]);

  const toggle = useCallback((id: number) => setExpanded((current) => {
    const next = new Set(current);
    if (!next.delete(id)) next.add(id);
    return next;
  }), []);

  const pick = useCallback((record: SearchRecord | Recent, newTab = false) => {
    if ('i' in record) remember(record as SearchRecord);
    const href = withBaseUrl(record.u);
    if (newTab) {
      window.open(href, '_blank', 'noopener');
      return;
    }
    onClose();
    history.push(href);
  }, [history, onClose, withBaseUrl]);

  const recentShown = !query.trim() ? recent : [];
  const listLength = query.trim() ? results.length : recentShown.length;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(listLength - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = query.trim() ? results[active]?.record : recentShown[active];
      if (target) pick(target, event.metaKey || event.ctrlKey);
    } else if (event.key === 'Tab' && query.trim()) {
      // Tab / Shift+Tab cycle the kind tabs.
      event.preventDefault();
      const ids = loaded?.engine.GROUPS.map((g: { id: string }) => g.id) ?? ['all'];
      const next = (ids.indexOf(group) + (event.shiftKey ? -1 : 1) + ids.length) % ids.length;
      setGroup(ids[next]);
    }
  };

  return createPortal(
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Search the API reference" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
        <div className={styles.header}>
          <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true"><path d="M14.4 12.9l4.3 4.3-1.5 1.5-4.3-4.3a7.5 7.5 0 111.5-1.5zM8.5 14a5.5 5.5 0 100-11 5.5 5.5 0 000 11z" fill="currentColor" /></svg>
          <input
            ref={inputRef}
            className={styles.input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search operations, types, fields and guides"
            aria-label="Search"
            aria-controls="api-search-results"
            aria-activedescendant={listLength ? `api-search-${active}` : undefined}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button type="button" className={styles.esc} onClick={onClose} aria-label="Close search">esc</button>
        </div>
        <div className={styles.filters}>
          <div className={styles.tabs} role="tablist">
            {(loaded?.engine.GROUPS ?? [{ id: 'all', label: 'All' }]).map((g: { id: string; label: string }) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={group === g.id}
                className={`${styles.tab} ${group === g.id ? styles.tabActive : ''}`}
                onClick={() => {
                  setGroup(g.id);
                  inputRef.current?.focus();
                }}
              >
                {g.label}
                {query.trim() && loaded ? <span className={styles.count}>{counts[g.id] ?? 0}</span> : null}
              </button>
            ))}
          </div>
          <span className={styles.spacer} />
          <select
            className={styles.select}
            value={context ?? ''}
            onChange={(event) => setContext(event.target.value === '' ? null : Number(event.target.value))}
            aria-label="Namespace"
          >
            <option value="">All namespaces</option>
            {loaded?.contexts.map((c, i) => <option key={c.id} value={i}>{c.title}</option>)}
          </select>
        </div>
        <div className={styles.body}>
          {error && <p className={styles.empty}>Search is unavailable: {error}</p>}
          {!error && !loaded && <p className={styles.empty}>Loading the index…</p>}
          {loaded && !query.trim() && (
            recentShown.length ? (
              <>
                <div className={styles.section}>Recently opened</div>
                <ul className={styles.list} id="api-search-results" role="listbox">
                  {recentShown.map((item, i) => (
                    <li
                      key={item.u}
                      id={`api-search-${i}`}
                      role="option"
                      aria-selected={i === active}
                      className={`${styles.result} ${i === active ? styles.active : ''}`}
                      onMouseMove={() => setActive(i)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(event) => pick(item, event.metaKey || event.ctrlKey)}
                    >
                      <div className={styles.line}>
                        <KindPill kind={item.k} engine={loaded.engine} />
                        <span className={item.k === 'guide' ? styles.guideName : styles.name}>
                          {item.p && <span className={styles.parent}>{item.p}.</span>}
                          {item.n}
                        </span>
                        <span className={styles.spacer} />
                        <ContextChip context={item.c !== undefined ? loaded.contexts[item.c] : undefined} />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className={styles.tips}>
                <p>Type a name or a few words. Exact names come first, then types, then members.</p>
                <ul>
                  <li><code>ISch_Component</code>: an exact type name</li>
                  <li><code>sch component</code>: the words of a name, in any case</li>
                  <li><code>ISch_Component.Orientation</code> or <code>GetState_Orientation</code>: a member</li>
                  <li><code>iterator</code>: guides and namespaces</li>
                </ul>
              </div>
            )
          )}
          {loaded && query.trim() && (results.length ? (
            <ul className={styles.list} id="api-search-results" role="listbox">
              {results.map((result: Result, i: number) => (
                <ResultRow
                  key={result.record.i}
                  id={`api-search-${i}`}
                  result={result}
                  active={i === active}
                  words={words}
                  loaded={loaded}
                  onPick={pick}
                  onHover={() => setActive(i)}
                  expanded={expanded.has(result.record.i)}
                  onToggle={() => toggle(result.record.i)}
                />
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>No results for “{query.trim()}”{group !== 'all' || context !== null ? ' with these filters' : ''}.</p>
          ))}
        </div>
        <div className={styles.footer}>
          <span><kbd>↑</kbd><kbd>↓</kbd> select</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>{isMac() ? '⌘' : 'Ctrl'}</kbd><kbd>↵</kbd> new tab</span>
          <span><kbd>tab</kbd> next kind</span>
          <span className={styles.spacer} />
          {query.trim() && loaded ? <span>{counts.all ?? 0} results · {elapsed.toFixed(0)} ms</span> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function SearchBar(): JSX.Element {
  const indexUrl = useIndexUrl();
  const [open, setOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const [mac, setMac] = useState(false);
  const prefetch = useCallback(() => {
    loadSearch(indexUrl).catch(() => {});
  }, [indexUrl]);

  useEffect(() => {
    setMac(isMac());
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if ((event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setInitialQuery('');
        setOpen((o) => !o);
      } else if (event.key === '/' && !typing) {
        event.preventDefault();
        setInitialQuery('');
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        className={styles.button}
        onClick={() => setOpen(true)}
        onMouseEnter={prefetch}
        onFocus={prefetch}
        aria-label="Search the API reference"
      >
        <svg className={styles.buttonIcon} viewBox="0 0 20 20" aria-hidden="true"><path d="M14.4 12.9l4.3 4.3-1.5 1.5-4.3-4.3a7.5 7.5 0 111.5-1.5zM8.5 14a5.5 5.5 0 100-11 5.5 5.5 0 000 11z" fill="currentColor" /></svg>
        <span className={styles.buttonLabel}>Search the API</span>
        <span className={styles.buttonKeys}><kbd>{mac ? '⌘' : 'Ctrl'}</kbd><kbd>K</kbd></span>
      </button>
      {open && <SearchModal initialQuery={initialQuery} onClose={() => setOpen(false)} />}
    </>
  );
}
