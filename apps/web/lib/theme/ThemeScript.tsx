import { APP_THEMES } from './defaultThemes';

export function ThemeScript() {
  const code = `
    (function() {
      try {
        var storage = localStorage.getItem('typewav-theme-storage');
        var themeId = 'cyprus-sand';
        if (storage) {
          var parsed = JSON.parse(storage);
          if (parsed && parsed.state && parsed.state.themeId) {
            themeId = parsed.state.themeId;
          }
        }
        var themes = ${JSON.stringify(APP_THEMES)};
        var theme = themes[themeId] || themes['cyprus-sand'];
        if (theme && theme.colors) {
          var root = document.documentElement;
          root.style.setProperty('--color-bg', theme.colors.bg);
          root.style.setProperty('--color-surface', theme.colors.surface);
          root.style.setProperty('--color-border', theme.colors.border);
          root.style.setProperty('--color-accent', theme.colors.accent);
          root.style.setProperty('--color-text-primary', theme.colors.textPrimary);
          root.style.setProperty('--color-text-muted', theme.colors.textMuted);
          root.style.setProperty('--color-error', theme.colors.error);
          root.style.setProperty('--color-char-pending', theme.colors.charPending);
          root.style.setProperty('--color-char-correct', theme.colors.charCorrect);
          root.style.setProperty('--color-char-error', theme.colors.charError);
          root.style.setProperty('--color-char-current', theme.colors.charCurrent);
          root.style.setProperty('--color-cursor', theme.colors.cursor);
        }
      } catch (e) {
        console.error('Theme initialization failed', e);
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
