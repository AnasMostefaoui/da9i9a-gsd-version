/**
 * Widget Script Endpoint
 * Serves JavaScript that gets injected into Salla stores via App Snippet
 * Detects product pages and injects AI-generated landing page content
 *
 * Usage in Salla Partners Portal App Snippet:
 * <script src="https://your-app.com/widget" defer></script>
 */

import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  // Handle proxied requests (ngrok, cloudflare, etc.)
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const apiOrigin = forwardedHost
    ? `${forwardedProto || "https"}://${forwardedHost}`
    : url.origin;

  // The widget JavaScript
  const widgetScript = `
(function() {
  'use strict';

  // DA9I9A Widget Configuration
  const DA9I9A_API = '${apiOrigin}';
  const WIDGET_VERSION = '1.0.0';

  // Styles for the landing page sections (using CSS custom properties for colors)
  const STYLES = \`
    .da9i9a-landing {
      font-family: system-ui, -apple-system, sans-serif;
      direction: rtl;
      max-width: 100%;
      margin: 20px 0;
      /* Default color palette (overridden by inline styles) */
      --da-primary: #f97316;
      --da-primary-hover: #ea580c;
      --da-primary-light: #fed7aa;
      --da-accent: #c2410c;
      --da-accent-light: #ffedd5;
      --da-hero-bg-from: #fff7ed;
      --da-hero-bg-to: #ffffff;
      --da-cta-bg-from: #f97316;
      --da-cta-bg-to: #ea580c;
      --da-text-on-primary: #ffffff;
      --da-stats-color: #ea580c;
    }
    .da9i9a-landing.lang-en {
      direction: ltr;
    }
    .da9i9a-section {
      padding: 24px 16px;
    }
    .da9i9a-hero {
      background: linear-gradient(135deg, var(--da-hero-bg-from) 0%, var(--da-hero-bg-to) 100%);
      text-align: center;
    }
    .da9i9a-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      margin-bottom: 16px;
    }
    .da9i9a-badge {
      background: var(--da-primary-light);
      color: var(--da-accent);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    .da9i9a-headline {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 8px 0;
    }
    .da9i9a-subheadline {
      font-size: 16px;
      color: #6b7280;
      margin: 0 0 16px 0;
    }
    .da9i9a-trust-signals {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
    }
    .da9i9a-trust-signal {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      color: #4b5563;
    }
    .da9i9a-features {
      background: #ffffff;
    }
    .da9i9a-feature-title {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 8px 0;
    }
    .da9i9a-feature-desc {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 20px 0;
    }
    .da9i9a-highlight {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
      margin-bottom: 12px;
    }
    .da9i9a-highlight-icon {
      width: 48px;
      height: 48px;
      background: var(--da-primary-light);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }
    .da9i9a-highlight-content h4 {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 4px 0;
    }
    .da9i9a-highlight-content p {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }
    .da9i9a-cta {
      background: linear-gradient(135deg, var(--da-cta-bg-from) 0%, var(--da-cta-bg-to) 100%);
      text-align: center;
      border-radius: 16px;
      margin: 16px;
      padding: 24px;
    }
    .da9i9a-cta h3 {
      font-size: 20px;
      font-weight: 700;
      color: var(--da-text-on-primary);
      margin: 0 0 8px 0;
    }
    .da9i9a-cta p {
      font-size: 14px;
      color: var(--da-text-on-primary);
      opacity: 0.9;
      margin: 0 0 16px 0;
    }
    .da9i9a-cta-btn {
      background: white;
      color: var(--da-primary);
      border: none;
      padding: 12px 32px;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .da9i9a-stats {
      background: #f9fafb;
    }
    .da9i9a-stats-title {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      text-align: center;
      margin: 0 0 16px 0;
    }
    .da9i9a-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .da9i9a-stat {
      background: white;
      padding: 16px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .da9i9a-stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--da-stats-color);
    }
    .da9i9a-stat-label {
      font-size: 12px;
      color: #6b7280;
    }
    .da9i9a-benefits {
      background: white;
    }
    .da9i9a-benefits-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .da9i9a-benefit {
      background: var(--da-accent-light);
      padding: 16px;
      border-radius: 12px;
      text-align: center;
    }
    .da9i9a-benefit-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
    .da9i9a-benefit h4 {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 4px 0;
    }
    .da9i9a-benefit p {
      font-size: 12px;
      color: #6b7280;
      margin: 0;
    }
    .da9i9a-comparison {
      background: #f9fafb;
    }
    .da9i9a-comparison-title {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 8px 0;
    }
    .da9i9a-comparison-desc {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 16px 0;
    }
    .da9i9a-comparison-table {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .da9i9a-comparison-header {
      display: grid;
      grid-template-columns: 1fr 60px 60px;
      padding: 12px 16px;
      background: #f3f4f6;
      font-size: 14px;
      font-weight: 500;
      color: #4b5563;
    }
    .da9i9a-comparison-row {
      display: grid;
      grid-template-columns: 1fr 60px 60px;
      padding: 12px 16px;
      border-top: 1px solid #f3f4f6;
      font-size: 14px;
      color: #4b5563;
    }
    .da9i9a-check {
      color: #22c55e;
      font-size: 18px;
    }
    .da9i9a-cross {
      color: #d1d5db;
      font-size: 18px;
    }
    .da9i9a-faq {
      background: white;
    }
    .da9i9a-faq-title {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 16px 0;
    }
    .da9i9a-faq-item {
      background: #f9fafb;
      border-radius: 12px;
      margin-bottom: 8px;
      overflow: hidden;
    }
    .da9i9a-faq-question {
      width: 100%;
      padding: 16px;
      border: none;
      background: none;
      text-align: inherit;
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .da9i9a-faq-answer {
      padding: 0 16px 16px;
      font-size: 14px;
      color: #6b7280;
      display: none;
    }
    .da9i9a-faq-item.open .da9i9a-faq-answer {
      display: block;
    }
    .da9i9a-powered {
      text-align: center;
      padding: 16px;
      font-size: 12px;
      color: #9ca3af;
    }
    .da9i9a-powered a {
      color: #6366f1;
      text-decoration: none;
    }
  \`;

  // Icon mappings
  const FEATURE_ICONS = {
    mic: '🎤', headphones: '🎧', shield: '🛡️', zap: '⚡', star: '⭐', check: '✅'
  };
  const BENEFIT_ICONS = {
    truck: '🚚', headset: '🎧', award: '🏆', refresh: '🔄'
  };

  // Utility functions
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function createElement(tag, className, content) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content) el.textContent = content;
    return el;
  }

  // Detect if on product page and get product ID
  function getProductId() {
    // Method 1: Salla's global context
    if (window.Salla?.config?.page?.id && window.Salla?.config?.page?.type === 'product') {
      return window.Salla.config.page.id;
    }
    // Method 2: URL pattern - Salla uses /p{id} (e.g., /p1971852499)
    const sallaMatch = window.location.pathname.match(/\\/p(\\d+)/);
    if (sallaMatch) return sallaMatch[1];
    // Method 3: Standard URL patterns /products/{id}
    const standardMatch = window.location.pathname.match(/\\/products\\/([\\w-]+)/);
    if (standardMatch) return standardMatch[1];
    // Method 4: Check for product data in page meta tags
    const productMeta = document.querySelector('meta[property="product:price:amount"]');
    if (productMeta) {
      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) {
        const urlMatch = ogUrl.content.match(/\\/p(\\d+)/) || ogUrl.content.match(/\\/products\\/([\\w-]+)/);
        if (urlMatch) return urlMatch[1];
      }
    }
    return null;
  }

  // Fetch landing page content from our API
  async function fetchLandingContent(productId) {
    try {
      const response = await fetch(DA9I9A_API + '/api/landing/' + productId);
      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (e) {
      console.error('[DA9I9A] Error fetching landing content:', e);
      return null;
    }
  }

  // Render landing page sections
  function renderLandingPage(data) {
    const content = data.content;
    const isArabic = data.lang === 'ar';
    const palette = data.palette;

    const container = createElement('div', 'da9i9a-landing' + (isArabic ? '' : ' lang-en'));

    // Apply palette colors as CSS custom properties
    if (palette) {
      container.style.setProperty('--da-primary', palette.primary);
      container.style.setProperty('--da-primary-hover', palette.primaryHover);
      container.style.setProperty('--da-primary-light', palette.primaryLight);
      container.style.setProperty('--da-accent', palette.accent);
      container.style.setProperty('--da-accent-light', palette.accentLight);
      container.style.setProperty('--da-hero-bg-from', palette.heroBgFrom);
      container.style.setProperty('--da-hero-bg-to', palette.heroBgTo);
      container.style.setProperty('--da-cta-bg-from', palette.ctaBgFrom);
      container.style.setProperty('--da-cta-bg-to', palette.ctaBgTo);
      container.style.setProperty('--da-text-on-primary', palette.textOnPrimary);
      container.style.setProperty('--da-stats-color', palette.statsColor);
    }

    // Hero Section
    if (content.hero) {
      const hero = createElement('div', 'da9i9a-section da9i9a-hero');

      const badges = createElement('div', 'da9i9a-badges');
      content.hero.badges.forEach(b => {
        const badge = createElement('span', 'da9i9a-badge', b);
        badges.appendChild(badge);
      });
      hero.appendChild(badges);

      hero.appendChild(createElement('h2', 'da9i9a-headline', content.hero.headline));
      hero.appendChild(createElement('p', 'da9i9a-subheadline', content.hero.subheadline));

      const signals = createElement('div', 'da9i9a-trust-signals');
      content.hero.trustSignals.forEach(s => {
        const signal = createElement('span', 'da9i9a-trust-signal');
        signal.textContent = '✓ ' + s;
        signals.appendChild(signal);
      });
      hero.appendChild(signals);

      container.appendChild(hero);
    }

    // Features Section
    if (content.features) {
      const features = createElement('div', 'da9i9a-section da9i9a-features');
      features.appendChild(createElement('h3', 'da9i9a-feature-title', content.features.title));
      features.appendChild(createElement('p', 'da9i9a-feature-desc', content.features.description));

      content.features.highlights.forEach(h => {
        const highlight = createElement('div', 'da9i9a-highlight');
        const icon = createElement('div', 'da9i9a-highlight-icon', FEATURE_ICONS[h.icon] || '✨');
        const contentDiv = createElement('div', 'da9i9a-highlight-content');
        contentDiv.appendChild(createElement('h4', '', h.title));
        contentDiv.appendChild(createElement('p', '', h.description));
        highlight.appendChild(icon);
        highlight.appendChild(contentDiv);
        features.appendChild(highlight);
      });

      container.appendChild(features);
    }

    // CTA Section
    if (content.cta) {
      const cta = createElement('div', 'da9i9a-cta');
      cta.appendChild(createElement('h3', '', content.cta.headline));
      cta.appendChild(createElement('p', '', content.cta.description));
      const btn = createElement('button', 'da9i9a-cta-btn', content.cta.buttonText);
      btn.onclick = () => {
        const addToCartBtn = document.querySelector('[data-add-to-cart], .add-to-cart, button[type="submit"]');
        if (addToCartBtn) addToCartBtn.click();
      };
      cta.appendChild(btn);
      container.appendChild(cta);
    }

    // Social Proof Section
    if (content.socialProof) {
      const stats = createElement('div', 'da9i9a-section da9i9a-stats');
      stats.appendChild(createElement('h3', 'da9i9a-stats-title', content.socialProof.title));

      const grid = createElement('div', 'da9i9a-stats-grid');
      content.socialProof.stats.forEach(s => {
        const stat = createElement('div', 'da9i9a-stat');
        stat.appendChild(createElement('div', 'da9i9a-stat-value', s.value));
        stat.appendChild(createElement('div', 'da9i9a-stat-label', s.label));
        grid.appendChild(stat);
      });
      stats.appendChild(grid);
      container.appendChild(stats);
    }

    // Benefits Grid
    if (content.benefits) {
      const benefits = createElement('div', 'da9i9a-section da9i9a-benefits');
      const grid = createElement('div', 'da9i9a-benefits-grid');

      content.benefits.forEach(b => {
        const benefit = createElement('div', 'da9i9a-benefit');
        benefit.appendChild(createElement('div', 'da9i9a-benefit-icon', BENEFIT_ICONS[b.icon] || '✨'));
        benefit.appendChild(createElement('h4', '', b.title));
        benefit.appendChild(createElement('p', '', b.description));
        grid.appendChild(benefit);
      });

      benefits.appendChild(grid);
      container.appendChild(benefits);
    }

    // Comparison Table
    if (content.comparison) {
      const comp = createElement('div', 'da9i9a-section da9i9a-comparison');
      comp.appendChild(createElement('h3', 'da9i9a-comparison-title', content.comparison.title));
      comp.appendChild(createElement('p', 'da9i9a-comparison-desc', content.comparison.description));

      const table = createElement('div', 'da9i9a-comparison-table');

      const header = createElement('div', 'da9i9a-comparison-header');
      header.appendChild(createElement('div', '', isArabic ? 'الميزة' : 'Feature'));
      header.appendChild(createElement('div', '', isArabic ? 'نحن' : 'Us'));
      header.appendChild(createElement('div', '', isArabic ? 'الآخرين' : 'Others'));
      table.appendChild(header);

      content.comparison.features.forEach(f => {
        const row = createElement('div', 'da9i9a-comparison-row');
        row.appendChild(createElement('div', '', f.name));
        row.appendChild(createElement('div', f.us ? 'da9i9a-check' : 'da9i9a-cross', f.us ? '✓' : '✕'));
        row.appendChild(createElement('div', f.others ? 'da9i9a-check' : 'da9i9a-cross', f.others ? '✓' : '✕'));
        table.appendChild(row);
      });

      comp.appendChild(table);
      container.appendChild(comp);
    }

    // FAQ Section
    if (content.faq) {
      const faq = createElement('div', 'da9i9a-section da9i9a-faq');
      faq.appendChild(createElement('h3', 'da9i9a-faq-title', isArabic ? 'الأسئلة الشائعة' : 'FAQ'));

      content.faq.forEach(q => {
        const item = createElement('div', 'da9i9a-faq-item');
        const question = createElement('button', 'da9i9a-faq-question');
        question.textContent = q.question;
        const arrow = createElement('span', '', '▼');
        question.appendChild(arrow);
        question.onclick = () => item.classList.toggle('open');

        const answer = createElement('div', 'da9i9a-faq-answer', q.answer);
        item.appendChild(question);
        item.appendChild(answer);
        faq.appendChild(item);
      });

      container.appendChild(faq);
    }

    // Powered by
    const powered = createElement('div', 'da9i9a-powered');
    powered.innerHTML = 'Powered by <a href="https://da9i9a.com" target="_blank">DA9I9A</a> ✨';
    container.appendChild(powered);

    return container;
  }

  // Inject styles
  function injectStyles() {
    if (document.getElementById('da9i9a-styles')) return;
    const style = document.createElement('style');
    style.id = 'da9i9a-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  // Main initialization
  async function init() {
    console.log('[DA9I9A] Widget v' + WIDGET_VERSION + ' initializing...');

    const productId = getProductId();
    if (!productId) {
      console.log('[DA9I9A] Not a product page, skipping');
      return;
    }

    console.log('[DA9I9A] Product page detected, ID:', productId);

    const data = await fetchLandingContent(productId);
    if (!data) {
      console.log('[DA9I9A] No landing page content for this product');
      return;
    }

    console.log('[DA9I9A] Landing content found, rendering...');

    injectStyles();

    const landingPage = renderLandingPage(data);

    // Find insertion point - insert at the END of product content, after any sliders
    // Priority: after product sliders > before footer > end of main content

    let inserted = false;

    // First, try to insert after Salla's product slider (related products section)
    const sallaSlider = document.querySelector('salla-products-slider, .products-slider, [data-products-slider]');
    if (sallaSlider) {
      sallaSlider.parentNode.insertBefore(landingPage, sallaSlider.nextSibling);
      inserted = true;
      console.log('[DA9I9A] Landing page inserted after products slider');
    }

    // If no slider found, insert before footer
    if (!inserted) {
      const footer = document.querySelector('footer');
      if (footer) {
        footer.parentNode.insertBefore(landingPage, footer);
        inserted = true;
        console.log('[DA9I9A] Landing page inserted before footer');
      }
    }

    // Fallback: find the main product container and append at the end
    if (!inserted) {
      const productContainers = [
        '.product-single',
        '.product-page',
        '.product-container',
        'main',
        'article'
      ];

      for (const selector of productContainers) {
        const el = document.querySelector(selector);
        if (el) {
          el.appendChild(landingPage);
          inserted = true;
          console.log('[DA9I9A] Landing page appended to:', selector);
          break;
        }
      }
    }

    // Last resort: append to body
    if (!inserted) {
      document.body.appendChild(landingPage);
      console.log('[DA9I9A] Landing page appended to body');
    }
  }

  // Run on DOM ready
  ready(init);

})();
`;

  return new Response(widgetScript, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
