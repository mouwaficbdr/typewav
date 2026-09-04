import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AboutSection } from '../AboutSection';

describe('AboutSection', () => {
  it('rend le libellé comme titre de niveau 2', () => {
    render(
      <AboutSection index="03" label="Les modes">
        <p>corps</p>
      </AboutSection>,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Les modes' }),
    ).toBeInTheDocument();
  });

  it('affiche le numéro de rubrique et le corps', () => {
    render(
      <AboutSection index="03" label="Les modes">
        <p>corps de section</p>
      </AboutSection>,
    );
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('corps de section')).toBeInTheDocument();
  });
});
