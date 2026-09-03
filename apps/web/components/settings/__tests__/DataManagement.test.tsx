import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockExportAll = vi.fn();
const mockImportAll = vi.fn();
vi.mock('@/lib/db', () => ({
  exportAll: () => mockExportAll(),
  importAll: (data: unknown) => mockImportAll(data),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('lucide-react', () => ({
  HardDrive: () => null,
  Download: () => null,
  Upload: () => null,
}));

import { DataManagement } from '../DataManagement';

const clickSpy = vi.fn();

beforeEach(() => {
  mockExportAll.mockReset().mockResolvedValue({ app: 'typewav', stores: {} });
  mockImportAll.mockReset().mockResolvedValue(undefined);
  clickSpy.mockReset();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clickSpy);
  Object.defineProperty(URL, 'createObjectURL', {
    value: vi.fn(() => 'blob:mock'),
    configurable: true,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: vi.fn(),
    configurable: true,
  });
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function fileInput(): HTMLInputElement {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

describe('DataManagement', () => {
  it('affiche la microcopie « sur cet appareil »', () => {
    render(<DataManagement />);
    expect(screen.getByText('dataOnDevice')).toBeTruthy();
  });

  it('le bouton export appelle exportAll et déclenche un téléchargement', async () => {
    render(<DataManagement />);

    fireEvent.click(screen.getByRole('button', { name: 'dataExport' }));

    await waitFor(() => expect(mockExportAll).toHaveBeenCalledTimes(1));
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('un fichier importé appelle importAll puis onImported', async () => {
    const onImported = vi.fn();
    render(<DataManagement onImported={onImported} />);

    const file = new File(['{"app":"typewav","stores":{}}'], 'data.json', {
      type: 'application/json',
    });
    fireEvent.change(fileInput(), { target: { files: [file] } });

    await waitFor(() => expect(onImported).toHaveBeenCalledOnce());
    expect(mockImportAll).toHaveBeenCalledWith('{"app":"typewav","stores":{}}');
  });

  it('un import qui échoue affiche l’erreur et n’appelle pas onImported', async () => {
    mockImportAll.mockRejectedValue(new Error('nope'));
    const onImported = vi.fn();
    render(<DataManagement onImported={onImported} />);

    fireEvent.change(fileInput(), {
      target: { files: [new File(['x'], 'bad.json')] },
    });

    await waitFor(() => expect(screen.getByText('dataImportError')).toBeTruthy());
    expect(onImported).not.toHaveBeenCalled();
  });

  it('confirmation refusée : pas d’import', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<DataManagement onImported={vi.fn()} />);

    fireEvent.change(fileInput(), {
      target: { files: [new File(['x'], 'x.json')] },
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(mockImportAll).not.toHaveBeenCalled();
  });
});
