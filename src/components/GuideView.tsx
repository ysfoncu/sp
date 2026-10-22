import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ChevronLeft, ChevronRight, Clock, Home } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";
import { cn } from "./ui/utils";
import { GuideDoc, formatGuideHash, guideHeadings, neighbours, parseGuideDoc, slugify, sortGuideDocs } from "../types/guideDocs";

// Every page of the guide (docs/test-guide/*.md), read at build time
const FILES = import.meta.glob("/docs/test-guide/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
export const GUIDE_DOCS: GuideDoc[] = sortGuideDocs(
  Object.entries(FILES)
    .filter(([path]) => !/README\.md$|screenshots\.md$/i.test(path))
    .map(([path, raw]) => parseGuideDoc(raw, path.split("/").pop()!.replace(/\.md$/, ""))),
);

const textOf = (children: React.ReactNode): string =>
  Array.isArray(children) ? children.map(textOf).join("") : typeof children === "string" ? children : typeof children === "number" ? String(children) : "";

interface GuideViewProps {
  docId: string; // "" = the first page
  onOpen: (id: string) => void;
  onBackToApp: () => void;
}

// The guide for the test users: a sidebar of pages, the page itself, "On this page" and previous/next.
export function GuideView({ docId, onOpen, onBackToApp }: GuideViewProps) {
  const doc = GUIDE_DOCS.find((d) => d.id === docId) ?? GUIDE_DOCS[0];
  const { prev, next } = useMemo(() => (doc ? neighbours(GUIDE_DOCS, doc.id) : {}), [doc]);
  const headings = useMemo(() => (doc ? guideHeadings(doc.body) : []), [doc]);
  const [showResearcher, setShowResearcher] = useState(false);

  // A page opens at its top; the researcher part starts closed
  useEffect(() => {
    setShowResearcher(false);
    document.getElementById("guide-top")?.scrollIntoView({ block: "start" });
  }, [doc?.id]);

  if (!doc) return <p className="p-6 text-sm text-gray-600">The guide has no pages yet.</p>;

  const overview: [string, string | undefined][] = [
    ["Page", doc.page],
    ["Role", doc.role],
    ["Goal", doc.goal],
    ["Before you start", doc.needs],
    ["Time", doc.minutes ? `about ${doc.minutes} minutes` : undefined],
    ["Saved or lost", doc.persists],
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      <div id="guide-top" className="flex items-center justify-between gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => onOpen(GUIDE_DOCS[0]?.id ?? "")} className="flex cursor-pointer items-center gap-1 text-gray-600 hover:text-gray-900">
                <Home className="h-3.5 w-3.5" /> Guide
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-gray-900">{doc.short}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <button type="button" onClick={onBackToApp} className="text-sm text-blue-600 hover:underline">
          Back to the prototype
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)_200px]">
        {/* Pages */}
        <nav aria-label="Guide pages" className="lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Test guide</p>
          <ul className="space-y-1">
            {GUIDE_DOCS.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => onOpen(d.id)}
                  aria-current={d.id === doc.id ? "page" : undefined}
                  className={cn("w-full rounded-md px-3 py-2 text-left text-sm transition-colors", d.id === doc.id ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700 hover:bg-gray-100")}
                >
                  {d.short}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* The page */}
        <article className="min-w-0 rounded-lg border border-gray-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-gray-900">{doc.title}</h1>

          {overview.some(([, v]) => v) && (
            <ul className="mt-4 space-y-1 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700" aria-label="Scenario overview">
              {overview.map(([k, v]) =>
                v ? (
                  <li key={k}>
                    <span className="font-semibold text-gray-900">{k}:</span> {v}
                  </li>
                ) : null,
              )}
            </ul>
          )}

          <div className="mt-5">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 id={slugify(textOf(children))} className="mb-3 mt-8 scroll-mt-4 text-xl font-semibold text-gray-900">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 id={slugify(textOf(children))} className="mb-2 mt-6 scroll-mt-4 text-base font-semibold text-gray-900">
                    {children}
                  </h3>
                ),
                p: ({ children }) => <p className="mb-3 leading-relaxed text-gray-700">{children}</p>,
                ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-6 text-gray-700">{children}</ul>,
                ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-6 text-gray-700">{children}</ol>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                code: ({ children }) => <code className="rounded bg-gray-100 px-1 py-0.5 text-[0.9em] text-gray-800">{children}</code>,
                blockquote: ({ children }) => <blockquote className="mb-3 rounded-r-md border-l-4 border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">{children}</blockquote>,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    onClick={(e) => {
                      // A link to another guide page stays in the app
                      const id = href?.match(/^#\/guide\/([\w-]+)$/)?.[1];
                      if (id) {
                        e.preventDefault();
                        onOpen(id);
                      }
                    }}
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {children}
                  </a>
                ),
                img: ({ src, alt }) => (
                  <figure className="my-4">
                    <img src={src} alt={alt ?? ""} className="w-full rounded-md border border-gray-200" loading="lazy" />
                    {alt && <figcaption className="mt-1 text-xs text-gray-500">{alt}</figcaption>}
                  </figure>
                ),
                hr: () => <hr className="my-6 border-gray-200" />,
              }}
            >
              {doc.body}
            </ReactMarkdown>
          </div>

          {doc.researcher && (
            <section className="mt-8 rounded-md border border-dashed border-gray-300">
              <button type="button" onClick={() => setShowResearcher((v) => !v)} aria-expanded={showResearcher} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-700">
                For the researcher
                <ChevronDown className={cn("h-4 w-4 transition-transform", showResearcher && "rotate-180")} aria-hidden="true" />
              </button>
              {showResearcher && (
                <div className="border-t border-dashed border-gray-300 px-4 py-3">
                  <ReactMarkdown
                    components={{
                      ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 text-sm text-gray-700">{children}</ul>,
                      p: ({ children }) => <p className="mb-2 text-sm text-gray-700">{children}</p>,
                      h3: ({ children }) => <h3 className="mb-1 mt-3 text-sm font-semibold text-gray-900">{children}</h3>,
                    }}
                  >
                    {doc.researcher}
                  </ReactMarkdown>
                </div>
              )}
            </section>
          )}

          {/* Previous / next */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
            {prev ? (
              <button type="button" onClick={() => onOpen(prev.id)} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> {prev.short}
              </button>
            ) : (
              <span />
            )}
            {next ? (
              <button type="button" onClick={() => onOpen(next.id)} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                {next.short} <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <span />
            )}
          </div>
        </article>

        {/* On this page */}
        <aside aria-label="On this page" className="hidden lg:sticky lg:top-4 lg:block lg:self-start">
          {doc.minutes && (
            <p className="mb-3 flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> about {doc.minutes} min
            </p>
          )}
          {headings.length > 0 && (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">On this page</p>
              <ul className="space-y-1 text-sm">
                {headings.map((h) => (
                  <li key={h.slug} className={h.level === 3 ? "pl-3" : ""}>
                    <a href={`${formatGuideHash(doc.id)}#${h.slug}`} onClick={(e) => { e.preventDefault(); document.getElementById(h.slug)?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="text-gray-600 hover:text-gray-900">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
