import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('ThemeQuickSwitcher', () => {
  beforeEach(() => {
    mockSetTheme.mockReset();
    mockThemeId = 'terminal';
    mockGetUserProfile.mockReset().mockResolvedValue({ unlockedThemes: [] });
    document.documentElement.removeAttribute('style');
  });

  it('affiche le nom du thème actif dans le déclencheur', async () => {
    render(<ThemeQuickSwitcher />);
    expect(await screen.findByText(/dark terminal/i)).toBeInTheDocument();
  });

  it("ouvre le panneau au clic sur le déclencheur, avec un champ de recherche et la liste des thèmes", async () => {
    const user = userEvent.setup();
    render(<ThemeQuickSwitcher />);

    await user.click(screen.getByRole('button', { name: /dark terminal/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /deep burgundy/i }),
    ).toBeInTheDocument();
  });

  it('filtre la liste par nom au fil de la frappe', async () => {
    const user = userEvent.setup();
    render(<ThemeQuickSwitcher />);
    await user.click(screen.getByRole('button', { name: /dark terminal/i }));

    await user.type(screen.getByRole('textbox'), 'burgundy');

    expect(
      screen.getByRole('button', { name: /deep burgundy/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /cyprus sand/i }),
    ).not.toBeInTheDocument();
  });

  it('applique un aperçu live au survol d’une ligne puis restaure au départ', async () => {
    const user = userEvent.setup();
    render(<ThemeQuickSwitcher />);
    await user.click(screen.getByRole('button', { name: /dark terminal/i }));

    const row = screen.getByRole('button', { name: /deep burgundy/i });
    fireEvent.mouseEnter(row);
    expect(getRootVar('--color-bg')).toBe('#5B0E14');

    fireEvent.mouseLeave(row);
    expect(getRootVar('--color-bg')).toBe('#000000');
  });

  it('applique le même aperçu live au focus clavier de la ligne', async () => {
    const user = userEvent.setup();
    render(<ThemeQuickSwitcher />);
    await user.click(screen.getByRole('button', { name: /dark terminal/i }));

    const row = screen.getByRole('button', { name: /deep burgundy/i });
    fireEvent.focus(row);
    expect(getRootVar('--color-bg')).toBe('#5B0E14');

    fireEvent.blur(row);
    expect(getRootVar('--color-bg')).toBe('#000000');
  });

  it('le clic sur une ligne valide le thème, l’applique et ferme le panneau', async () => {
    const user = userEvent.setup();
    render(<ThemeQuickSwitcher />);
    await user.click(screen.getByRole('button', { name: /dark terminal/i }));

    await user.click(screen.getByRole('button', { name: /deep burgundy/i }));

    expect(mockSetTheme).toHaveBeenCalledWith('deep-burgundy');
    expect(getRootVar('--color-bg')).toBe('#5B0E14');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Échap ferme le panneau et restaure le thème réel sans le persister', async () => {
    const user = userEvent.setup();
    render(<ThemeQuickSwitcher />);
    await user.click(screen.getByRole('button', { name: /dark terminal/i }));

    const row = screen.getByRole('button', { name: /deep burgundy/i });
    fireEvent.mouseEnter(row);
    expect(getRootVar('--color-bg')).toBe('#5B0E14');

    await user.keyboard('{Escape}');

    expect(mockSetTheme).not.toHaveBeenCalled();
    expect(getRootVar('--color-bg')).toBe('#000000');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('coche le thème actuellement actif dans la liste', async () => {
    mockThemeId = 'deep-burgundy';
    const user = userEvent.setup();
    render(<ThemeQuickSwitcher />);
    await user.click(screen.getByRole('button', { name: /deep burgundy/i }));

    const dialog = within(screen.getByRole('dialog'));
    const activeRow = dialog.getByRole('button', { name: /deep burgundy/i });
    expect(activeRow).toHaveAttribute('aria-pressed', 'true');
  });

  it('affiche les thèmes de base même avant le chargement du profil', async () => {
    mockGetUserProfile.mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    render(<ThemeQuickSwitcher />);
    await user.click(screen.getByRole('button', { name: /dark terminal/i }));

    expect(
      screen.getByRole('button', { name: /night imperial/i }),
    ).toBeInTheDocument();
  });

  it('affiche aussi les thèmes débloqués par jalon présents dans le profil', async () => {
    mockGetUserProfile.mockResolvedValue({ unlockedThemes: ['noir'] });
    const user = userEvent.setup();
    render(<ThemeQuickSwitcher />);
    await user.click(screen.getByRole('button', { name: /dark terminal/i }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole('button', { name: /^noir/i })).toBeInTheDocument();
  });
});
