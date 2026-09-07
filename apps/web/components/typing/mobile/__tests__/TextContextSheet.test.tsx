import 'fake-indexeddb/auto';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    if (namespace === 'typing.collection') {
      const labels: Record<string, string> = {
        litterature: 'Littérature',
        poesie: 'Poésie',
        philosophie: 'Philosophie',
        gaming: 'Gaming',
        code: 'Code',
      };
      return labels[key] ?? key;
    }
    if (key === 'langFr') return 'français';
    if (key === 'langEn') return 'anglais';
    if (key === 'langBoth') return 'français + anglais';
    return key;
  },
}));

vi.mock('motion/react', () => ({
  useReducedMotion: () => true,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: {
    div: ({
      children,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) => {
      const {
        initial: _i,
        animate: _a,
        exit: _e,
        transition: _t,
        drag: _d,
        dragConstraints: _dc,
        dragElastic: _de,
        onDragEnd: _od,
        ...rest
      } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

import { DEFAULT_CONFIG, useConfigStore } from '@/stores/useConfigStore';
import { TextContextSheet } from '../TextContextSheet';

beforeEach(async () => {
  await act(async () => {
    await useConfigStore.persist.rehydrate();
    useConfigStore.setState(DEFAULT_CONFIG);
  });
});
afterEach(async () => {
  await act(async () => {
    useConfigStore.setState(DEFAULT_CONFIG);
  });
});

describe('TextContextSheet', () => {
  it('liste collection + langue, coche l’actif', () => {
    render(
      <TextContextSheet open onClose={vi.fn()} effectiveMode={'classic'} />,
    );
    expect(
      screen.getByRole('radio', { name: /Littérature/ }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('radio', { name: /français \+ anglais/ }),
    ).toBeInTheDocument();
  });

  it('choisir une collection met à jour le store', async () => {
    const user = userEvent.setup();
    render(
      <TextContextSheet open onClose={vi.fn()} effectiveMode={'classic'} />,
    );
    await user.click(screen.getByRole('radio', { name: 'Poésie' }));
    expect(useConfigStore.getState().activeCollection).toBe('poesie');
  });

  it('choisir une langue met à jour le store', async () => {
    const user = userEvent.setup();
    render(
      <TextContextSheet open onClose={vi.fn()} effectiveMode={'classic'} />,
    );
    await user.click(screen.getByRole('radio', { name: 'anglais' }));
    expect(useConfigStore.getState().textLanguage).toBe('en');
  });

  it('mode Code : pas de section collection (verrouillée), langue visible', () => {
    render(<TextContextSheet open onClose={vi.fn()} effectiveMode={'code'} />);
    expect(
      screen.queryByRole('radio', { name: /Littérature/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'français' }),
    ).toBeInTheDocument();
  });
});
