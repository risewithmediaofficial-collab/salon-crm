import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Automatically scrolls the window and any scrollable layout containers
 * back to the top (0, 0) whenever the route/navigation changes.
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // If there is an anchor hash (#section), smooth scroll to the target element
    if (hash) {
      const targetId = hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Scroll main window to top
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }

    // Reset document scrolling elements
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    // Also reset any scrollable main wrappers (e.g., AdminLayout POS / dashboard container)
    const scrollableContainers = document.querySelectorAll(
      '[data-scroll-container], main, .overflow-y-auto'
    );
    scrollableContainers.forEach((el) => {
      if (el && typeof el.scrollTop === 'number') {
        el.scrollTop = 0;
      }
    });
  }, [pathname, search]);

  return null;
}

export default ScrollToTop;
