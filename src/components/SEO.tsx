import React, { useEffect } from "react";

type OG = Partial<{
  title: string;
  description: string;
  url: string;
  type: string;
  site_name: string;
  image: string;
  imageWidth: string | number;
  imageHeight: string | number;
  locale: string;
}>;

type Twitter = Partial<{
  card: "summary" | "summary_large_image" | "app" | "player";
  title: string;
  description: string;
  image: string;
  site: string; // @handle
}>;

type SEOProps = {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  openGraph?: OG;
  twitter?: Twitter;
  jsonLd?: any;
};

const isBrowser = typeof document !== "undefined";

function upsertMetaByName(name: string, content: string) {
  if (!isBrowser || !content) return null;
  let el = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    el.setAttribute("data-seo-managed", "true");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  return el;
}

function upsertMetaByProperty(property: string, content: string) {
  if (!isBrowser || !content) return null;
  let el = document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    el.setAttribute("data-seo-managed", "true");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  return el;
}

function upsertLink(rel: string, href: string) {
  if (!isBrowser || !href) return null;
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    el.setAttribute("data-seo-managed", "true");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  return el;
}

function upsertJsonLd(json: any) {
  if (!isBrowser || !json) return null;
  // remove previous managed JSON-LD
  const olds = document.head.querySelectorAll(
    'script[type="application/ld+json"][data-seo-managed="true"]'
  );
  olds.forEach((n) => n.parentElement?.removeChild(n));

  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.setAttribute("data-seo-managed", "true");
  el.text = JSON.stringify(json);
  document.head.appendChild(el);
  return el;
}

export default function SEO(props: SEOProps) {
  const { title, description, canonical, robots, openGraph, twitter, jsonLd } = props;

  useEffect(() => {
    if (!isBrowser) return;

    const created: Element[] = [];
    const prevTitle = document.title;
    if (title) document.title = title;

    if (description) {
      const el = upsertMetaByName("description", description);
      if (el?.getAttribute("data-seo-managed")) created.push(el);
    }
    if (robots) {
      const el = upsertMetaByName("robots", robots);
      if (el?.getAttribute("data-seo-managed")) created.push(el);
    }
    if (canonical) {
      const el = upsertLink("canonical", canonical);
      if (el?.getAttribute("data-seo-managed")) created.push(el);
    }

    if (openGraph) {
      const map: [string, string | undefined][] = [
        ["og:title", openGraph.title],
        ["og:description", openGraph.description],
        ["og:url", openGraph.url],
        ["og:type", openGraph.type],
        ["og:site_name", openGraph.site_name],
        ["og:image", openGraph.image],
        ["og:image:width", openGraph.imageWidth?.toString()],
        ["og:image:height", openGraph.imageHeight?.toString()],
        ["og:locale", openGraph.locale],
      ];
      map.forEach(([property, val]) => {
        if (!val) return;
        const el = upsertMetaByProperty(property, val);
        if (el?.getAttribute("data-seo-managed")) created.push(el);
      });
    }

    if (twitter) {
      const map: [string, string | undefined][] = [
        ["twitter:card", twitter.card],
        ["twitter:title", twitter.title],
        ["twitter:description", twitter.description],
        ["twitter:image", twitter.image],
        ["twitter:site", twitter.site],
      ];
      map.forEach(([name, val]) => {
        if (!val) return;
        const el = upsertMetaByName(name, val);
        if (el?.getAttribute("data-seo-managed")) created.push(el);
      });
    }

    let jsonNode: Element | null = null;
    if (jsonLd) jsonNode = upsertJsonLd(jsonLd);

    return () => {
      document.title = prevTitle;
      created.forEach((el) => {
        if (el.getAttribute("data-seo-managed") === "true") {
          try {
            document.head.removeChild(el);
          } catch {}
        }
      });
      if (jsonNode && jsonNode.getAttribute("data-seo-managed") === "true") {
        try {
          document.head.removeChild(jsonNode);
        } catch {}
      }
    };
  }, [title, description, canonical, robots, JSON.stringify(openGraph), JSON.stringify(twitter), JSON.stringify(jsonLd)]);

  return null;
}