/**
 * Collection Code — snippets sous licence MIT / Apache 2.0 / domaine public.
 * Langages : TypeScript, Python, Rust.
 * Spec : docs/specs/06-content.md
 */

import type { CollectionConfig } from '@typewav/types';

export const codeCollection: CollectionConfig = {
  id: 'code',
  name: 'Code',
  nameEn: 'Code',
  description: 'Snippets issus de projets open source — MIT, Apache 2.0.',
  language: 'en',
  recommendedTheme: 'terminal',
  recommendedSoundPack: 'chiptune',
  isPremium: false,
  texts: [
    {
      id: 'code-ts-01',
      content: 'const greet = (name: string): string => `Hello, ${name}!`;',
      source: 'TypeScript — exemple original',
      difficulty: 'easy',
      language: 'en',
      tags: ['typescript', 'function', 'template-literal'],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-02',
      content:
        'async function fetchData<T>(url: string): Promise<T> {\n  const response = await fetch(url);\n  return response.json() as Promise<T>;\n}',
      source: 'TypeScript — exemple original',
      difficulty: 'medium',
      language: 'en',
      tags: ['typescript', 'async', 'generics'],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-03',
      content:
        'type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };',
      source: 'TypeScript — pattern Result type',
      difficulty: 'medium',
      language: 'en',
      tags: ['typescript', 'types', 'discriminated-union'],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-04',
      content:
        'export function pipe<T>(...fns: Array<(x: T) => T>): (x: T) => T {\n  return (x) => fns.reduce((v, f) => f(v), x);\n}',
      source: 'TypeScript — functional programming',
      difficulty: 'hard',
      language: 'en',
      tags: ['typescript', 'functional', 'higher-order'],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-05',
      content:
        'const debounce = <T extends unknown[]>(fn: (...args: T) => void, ms: number) => {\n  let timer: ReturnType<typeof setTimeout>;\n  return (...args: T) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), ms);\n  };\n};',
      source: 'TypeScript — utilitaire debounce',
      difficulty: 'hard',
      language: 'en',
      tags: ['typescript', 'utility', 'timing'],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-py-01',
      content:
        'def factorial(n: int) -> int:\n    return 1 if n <= 1 else n * factorial(n - 1)',
      source: 'Python — exemple original',
      difficulty: 'easy',
      language: 'en',
      tags: ['python', 'recursion', 'math'],
      codeLanguage: 'python',
    },
    {
      id: 'code-py-02',
      content:
        'from typing import Generator\n\ndef fibonacci() -> Generator[int, None, None]:\n    a, b = 0, 1\n    while True:\n        yield a\n        a, b = b, a + b',
      source: 'Python — générateur Fibonacci',
      difficulty: 'medium',
      language: 'en',
      tags: ['python', 'generator', 'math'],
      codeLanguage: 'python',
    },
    {
      id: 'code-py-03',
      content:
        'words = ["hello", "world", "python"]\nresult = {word: len(word) for word in words if len(word) > 4}',
      source: 'Python — dict comprehension',
      difficulty: 'easy',
      language: 'en',
      tags: ['python', 'comprehension', 'dict'],
      codeLanguage: 'python',
    },
    {
      id: 'code-rs-01',
      content:
        'fn main() {\n    let numbers = vec![1, 2, 3, 4, 5];\n    let sum: i32 = numbers.iter().sum();\n    println!("Sum: {}", sum);\n}',
      source: 'Rust — exemple original',
      difficulty: 'medium',
      language: 'en',
      tags: ['rust', 'iterators', 'collections'],
      codeLanguage: 'rust',
    },
    {
      id: 'code-rs-02',
      content:
        'pub fn binary_search<T: Ord>(arr: &[T], target: &T) -> Option<usize> {\n    let (mut low, mut high) = (0, arr.len());\n    while low < high {\n        let mid = low + (high - low) / 2;\n        match arr[mid].cmp(target) {\n            std::cmp::Ordering::Equal => return Some(mid),\n            std::cmp::Ordering::Less => low = mid + 1,\n            std::cmp::Ordering::Greater => high = mid,\n        }\n    }\n    None\n}',
      source: 'Rust — algorithme recherche binaire',
      difficulty: 'hard',
      language: 'en',
      tags: ['rust', 'algorithm', 'generics'],
      codeLanguage: 'rust',
    },
    {
      id: 'code-sh-01',
      content:
        'find . -name "*.ts" -not -path "*/node_modules/*" | xargs wc -l | sort -n',
      source: 'Shell — compter les lignes TypeScript',
      difficulty: 'medium',
      language: 'en',
      tags: ['shell', 'unix', 'find'],
    },
    {
      id: 'code-sh-02',
      content: 'git log --oneline --graph --all --decorate | head -20',
      source: "Git — visualiser l'historique",
      difficulty: 'easy',
      language: 'en',
      tags: ['git', 'shell', 'log'],
    },
    {
      id: 'code-json-01',
      content:
        '{\n  "name": "typewav",\n  "version": "0.0.1",\n  "type": "module",\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build"\n  }\n}',
      source: 'JSON — package.json exemple',
      difficulty: 'easy',
      language: 'en',
      tags: ['json', 'config', 'npm'],
    },
    {
      id: 'code-css-01',
      content:
        ':root {\n  --color-bg: #000000;\n  --color-accent: #00D4AA;\n  --font-mono: "JetBrains Mono", monospace;\n}',
      source: 'CSS — variables custom properties',
      difficulty: 'easy',
      language: 'en',
      tags: ['css', 'custom-properties', 'design-tokens'],
    },
    {
      id: 'code-sql-01',
      content:
        'SELECT u.name, COUNT(s.id) AS session_count\nFROM users u\nLEFT JOIN sessions s ON s.user_id = u.id\nGROUP BY u.id\nHAVING session_count > 10\nORDER BY session_count DESC;',
      source: 'SQL — requête agrégation',
      difficulty: 'hard',
      language: 'en',
      tags: ['sql', 'database', 'aggregation'],
      codeLanguage: 'sql',
    },
    {
      id: 'code-ts-06',
      content:
        'interface Store<T> {\n  getState(): T;\n  setState(partial: Partial<T>): void;\n  subscribe(listener: () => void): () => void;\n}',
      source: 'TypeScript — interface Store minimaliste',
      difficulty: 'medium',
      language: 'en',
      tags: ['typescript', 'interface', 'state'],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-07',
      content:
        'export const clamp = (value: number, min: number, max: number): number =>\n  Math.min(Math.max(value, min), max);',
      source: 'TypeScript — utilitaire clamp',
      difficulty: 'easy',
      language: 'en',
      tags: ['typescript', 'math', 'utility'],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-py-04',
      content:
        '@dataclass\nclass Point:\n    x: float\n    y: float\n\n    def distance_to(self, other: "Point") -> float:\n        return ((self.x - other.x) ** 2 + (self.y - other.y) ** 2) ** 0.5',
      source: 'Python — dataclass',
      difficulty: 'medium',
      language: 'en',
      tags: ['python', 'dataclass', 'oop'],
      codeLanguage: 'python',
    },
    {
      id: 'code-rs-03',
      content:
        'let result: Vec<_> = (1..=10).filter(|n| n % 2 == 0).map(|n| n * n).collect();',
      source: 'Rust — iterator chaining',
      difficulty: 'medium',
      language: 'en',
      tags: ['rust', 'iterators', 'functional'],
      codeLanguage: 'rust',
    },
    {
      id: 'code-ts-08',
      content:
        'const memoize = <T, R>(fn: (arg: T) => R): ((arg: T) => R) => {\n  const cache = new Map<T, R>();\n  return (arg) => {\n    if (cache.has(arg)) return cache.get(arg)!;\n    const result = fn(arg);\n    cache.set(arg, result);\n    return result;\n  };\n};',
      source: 'TypeScript — memoization',
      difficulty: 'hard',
      language: 'en',
      tags: ['typescript', 'performance', 'memoize'],
      codeLanguage: 'typescript',
    },
  ],
};
