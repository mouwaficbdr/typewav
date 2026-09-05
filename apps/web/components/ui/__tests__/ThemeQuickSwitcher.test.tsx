import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetUserProfile = vi.fn();
vi.mock('@/lib/db', () => ({
  getUserProfile: () => mockGetUserProfile(),
}));

const mockSetTheme = vi.fn();
let mockThemeId = 'terminal';
vi.mock('@/stores/useThemeStore', () => ({
  useThemeStore: (selector: (s: unknown) => unknown) =>
    selector({ themeId: mockThemeId, setTheme: mockSetTheme }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

import { ThemeQuickSwitcher } from '../ThemeQuickSwitcher';

function getRootVar(name: string) {
  return document.documentElement.style.getPropertyValue(name);
}

async function openPanel(
  user: ReturnType<typeof userEvent.setup>,
  name: RegExp = /dark terminal/i,
) {
  await user.click(screen.getByRole('button', { name }));
}

describe('ThemeQuickSwitcher', () => {
  beforeEach(() => {
    mockSetTheme.mockReset();
    mockThemeId = 'terminal';
    mockGetUserProfile.mockReset().mockResolvedValue({ unlockedThemes: [] });
    document.documentElement.removeAttribute('style');
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('affiche le nom du thème actif dans le déclencheur', async () => {
    render(<ThemeQuickSwitcher />);
    expect(await screen.findByText(/dark terminal/i)).toBeInTheDocument();
  });

  it("ouvre le panneau au clic sur le déclencheur, avec un champ de recherche et la liste des thèmes", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeQuickSwitcher />);

    await openPanel(user);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /deep burgundy/i }),
    ).toBeInTheDocument();
  });

  it('rend le panneau dans document.body, jamais comme descendant du déclencheur (ticket footer)', async () => {
    // Un ancêtre transformé (comme le footer avec fadeOnStart) casse
    // position:fixed pour tout descendant non porté : le panneau doit donc
    // toujours s'échapper via un portail, peu importe où il est monté.
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(
      <div style={{ transform: 'translateY(0)' }}>
        <ThemeQuickSwitcher />
      </div>,
    );

    await openPanel(user);

    const dialog = screen.getByRole('dialog');
    expect(container.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it("n'assombrit pas le reste de la page derrière le panneau", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeQuickSwitcher />);
    await openPanel(user);

    const dialog = screen.getByRole('dialog');
    const overlay = dialog.parentElement as HTMLElement;
    expect(overlay.style.background).not.toMatch(/black|rgba?\(0,\s*0,\s*0/i);
  });

  it("positionne le panneau en haut de l'écran, pas centré verticalement", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeQuickSwitcher />);
    await openPanel(user);

    const dialog = screen.getByRole('dialog');
    const overlay = dialog.parentElement as HTMLElement;
    expect(overlay.style.alignItems).toBe('flex-start');
  });

  it("n'affiche aucun bouton de fermeture explicite (Échap/clic extérieur seulement, comme MonkeyType)", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeQuickSwitcher />);
    await openPanel(user);

    expect(
      screen.queryByRole('button', { name: /close|fermer/i }),
    ).not.toBeInTheDocument();
  });

  it('utilise la police mono pour le panneau (cohérence MonkeyType)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeQuickSwitcher />);
    await openPanel(user);

    const dialog = screen.getByRole('dialog');
    expect(dialog.style.fontFamily).toBe('var(--font-mono)');
  });

  it('filtre la liste par nom au fil de la frappe', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeQuickSwitcher />);
    await openPanel(user);

    await user.type(screen.getByRole('combobox'), 'burgundy');

    expect(
      screen.getByRole('option', { name: /deep burgundy/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /cyprus sand/i }),
    ).not.toBeInTheDocument();
  });

  it('pré-sélectionne le thème actif à l’ouverture (surbrillance + défilement)', async () => {
    mockThemeId = 'deep-burgundy';
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeQuickSwitcher />);
    await openPanel(user, /deep burgundy/i);

    const option = screen.getByRole('option', { name: /deep burgundy/i });
    expect(option).toHaveAttribute('aria-selected', 'true');
  });

  it('la coche du thème actif reste sur sa ligne quelle que soit la ligne survolée', async () => {
    mockThemeId = 'deep-burgundy';
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeQuickSwitcher />);
    await openPanel(user, /deep burgundy/i);

    const otherRow = screen.getByRole('option', { name: /cyprus sand/i });
    fireEvent.mouseEnter(otherRow);

    const activeRow = screen.getByRole('option', { name: /deep burgundy/i });
    expect(activeRow.querySelector('svg')).toBeTruthy();
    expect(otherRow).toHaveAttribute('aria-selected', 'true');
    expect(activeRow).toHaveAttribute('aria-selected', 'false');
  });

  it('la flèche bas déplace la surbrillance vers la ligne suivante', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeQuickSwitcher />);
    await openPanel(user);

    await user.keyboard('{ArrowDown}');

    expect(
      screen.getByRole('option', { name: /deep burgundy/i }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('option', { name: /dark terminal/i }),
    ).toHaveAttribute('aria-selected', 'false');
  });

  it('la flèche haut depuis la première ligne boucle sur la dernière', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeQuickSwitcher />);
    await openPanel(user);

    await user.keyboard('{ArrowUp}');

    const options = screen.getAllByRole('option');
    expect(options.at(-1)).toHaveAttribute('aria-selected', 'true');
  });

  it("applique un aperçu live 250ms après le survol d'une ligne", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeQuickSwitcher />);
    await openPanel(user);

    const row = screen.getByRole('option', { name: /deep burgundy/i });
    fireEvent.mouseEnter(row);

    expect(getRootVar('--color-bg')).not.toBe('#5B0E14');
    act(() => {
      vi.advanceTimersByTime(249);
    });
    expect(getRootVar('--color-bg')).not.toBe('#5B0E14');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(getRootVar('--color-bg')).toBe('#5B0E14');
  });

  it('un survol rapide entre deux lignes ne prévisualise que la dernière (debounce)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeQuickSwitcher />);
    await openPanel(user);

    fireEvent.mouseEnter(
      screen.getByRole('option', { name: /deep burgundy/i }),
    );
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.mouseEnter(screen.getByRole('option', { name: /cyprus sand/i }));
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(getRootVar('--color-bg')).toBe('#004643');
  });

  it('le clic sur une ligne valide le thème, l’applique et ferme le panneau', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeQuickSwitcher />);
    await openPanel(user);

    await user.click(screen.getByRole('option', { name: /deep burgundy/i }));

    expect(mockSetTheme).toHaveBeenCalledWith('deep-burgundy');
    expect(getRootVar('--color-bg')).toBe('#5B0E14');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Entrée valide la ligne actuellement en surbrillance', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeQuickSwitcher />);
    await openPanel(user);

    await user.keyboard('{ArrowDown}{Enter}');

    expect(mockSetTheme).toHaveBeenCalledWith('deep-burgundy');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Échap ferme le panneau, restaure le thème réel et annule un aperçu en attente', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeQuickSwitcher />);
    await openPanel(user);

    fireEvent.mouseEnter(
      screen.getByRole('option', { name: /deep burgundy/i }),
    );
    await user.keyboard('{Escape}');

    expect(mockSetTheme).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // L'aperçu debounced ne doit pas se déclencher après coup.
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(getRootVar('--color-bg')).toBe('#000000');
  });

  it('affiche les thèmes de base même avant le chargement du profil', async () => {
    mockGetUserProfile.mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeQuickSwitcher />);
    await openPanel(user);

    expect(
      screen.getByRole('option', { name: /night imperial/i }),
    ).toBeInTheDocument();
  });

  it('affiche aussi les thèmes débloqués par jalon présents dans le profil', async () => {
    mockGetUserProfile.mockResolvedValue({ unlockedThemes: ['noir'] });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ThemeQuickSwitcher />);
    await openPanel(user);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole('option', { name: /^noir/i })).toBeInTheDocument();
  });
});
