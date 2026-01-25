/**
 * Widget Script Endpoint
 * Serves JavaScript that gets injected into Salla stores via App Snippet
 *
 * Usage in Salla Partners Portal App Snippet:
 * <script src="https://your-app.com/widget" defer></script>
 */

import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  // Get merchant ID from query param (Salla passes store info)
  const url = new URL(request.url);
  const merchantSallaId = url.searchParams.get("store");

  // The widget JavaScript - using safe DOM methods (no innerHTML with user content)
  const widgetScript = `
(function() {
  'use strict';

  // DA9I9A Widget - Injected into Salla Stores
  const DA9I9A_API = '${url.origin}';

  // Get store ID from Salla's global context
  const storeId = window.Salla?.config?.store?.id || '${merchantSallaId || ""}';

  // Wait for DOM ready
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // Create element helper
  function createElement(tag, styles, text) {
    const el = document.createElement(tag);
    Object.assign(el.style, styles);
    if (text) el.textContent = text;
    return el;
  }

  // Create and inject the widget
  function injectWidget() {
    // Find footer or create container
    const footer = document.querySelector('footer') || document.body;

    // Create widget container
    const widget = document.createElement('div');
    widget.id = 'da9i9a-widget';
    Object.assign(widget.style, {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px',
      textAlign: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      direction: 'rtl'
    });

    // Icon
    const icon = createElement('div', { fontSize: '28px', marginBottom: '8px' }, '✨');
    widget.appendChild(icon);

    // Arabic text
    const titleAr = createElement('div', {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '4px'
    }, 'مرحباً من دقيقة!');
    widget.appendChild(titleAr);

    // English text
    const titleEn = createElement('div', {
      fontSize: '14px',
      opacity: '0.9'
    }, 'Hey from DA9I9A - Your AI-Powered Store Builder');
    widget.appendChild(titleEn);

    // Insert before footer or at end of body
    if (footer.tagName === 'FOOTER') {
      footer.parentNode.insertBefore(widget, footer);
    } else {
      footer.appendChild(widget);
    }

    console.log('[DA9I9A] Widget injected successfully');
  }

  // Initialize
  ready(function() {
    console.log('[DA9I9A] Initializing widget for store:', storeId);
    injectWidget();
  });

})();
`;

  // Return as JavaScript with proper headers
  return new Response(widgetScript, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300", // Cache for 5 minutes
      "Access-Control-Allow-Origin": "*", // Allow cross-origin (needed for Salla stores)
    },
  });
}
