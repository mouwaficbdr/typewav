import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPreference: vi.fn<(key: string) => Promise<unknown>>(),
  setPreference: vi.fn<(key: string, value: unknown) => Promise<void>>(),
}));

vi.mock('@/lib/db', () => ({
  getPreference: (key: string) => mocks.getPreference(key),
  setPreference: (key: string, value: unknown) => mocks.setPreference(key, value),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import { MobileTypingHint } from '../MobileTypingHint';

const DISMISS_KEY = 'mobile_typing_hint_dismissed';

describe('MobileTypingHint', () => {
  beforeEach(() => {
    mocks.getPreference.mockReset();
    mocks.setPreference.mockReset().mockResolvedValue(undefined);
  });

  it('affiche le bandeau quand la préférence de rejet est absente', async () => {
    mocks.getPreference.mockResolvedValue(undefined);
    render(<MobileTypingHint />);

    expect(await screen.findByText('desktopHint')).toBeInTheDocument();
    expect(mocks.getPreference).toHaveBeenCalledWith(DISMISS_KEY);
  });

  it('ne rend rien quand le bandeau a déjà été rejeté', async () => {
    mocks.getPreference.mockResolvedValue(true);
    render(<MobileTypingHint />);

    await waitFor(() => expect(mocks.getPreference).toHaveBeenCalled());
    expect(screen.queryByText('desktopHint')).not.toBeInTheDocument();
  });

  it('ne rend rien tant que la lecture IndexedDB n’a pas répondu', () => {
    mocks.getPreference.mockReturnValue(new Promise(() => {}));
    render(<MobileTypingHint />);

    expect(screen.queryByText('desktopHint')).not.toBeInTheDocument();
  });

  it('rejet : masque le bandeau et persiste le choix', async () => {
    mocks.getPreference.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<MobileTypingHint />);

    await screen.findByText('desktopHint');
    await user.click(screen.getByRole('button', { name: 'desktopHintDismiss' }));

    expect(screen.queryByText('desktopHint')).not.toBeInTheDocument();
    expect(mocks.setPreference).toHaveBeenCalledWith(DISMISS_KEY, true);
  });

  it('lecture IndexedDB en échec : affiche le bandeau (pas de crash)', async () => {
    mocks.getPreference.mockRejectedValue(new Error('idb down'));
    render(<MobileTypingHint />);

    expect(await screen.findByText('desktopHint')).toBeInTheDocument();
  });
});
