/**
 * Collection Code : snippets sous licence MIT / Apache 2.0 / domaine public.
 * Langages : TypeScript, Python, Rust, Go, Shell, SQL, CSS, JSON, JavaScript.
 * Spec : docs/specs/06-content.md
 */

import type { CollectionConfig } from '@typewav/types';

export const codeCollection: CollectionConfig = {
  id: 'code',
  name: 'Code',
  nameEn: 'Code',
  description: 'Snippets issus de projets open source : MIT, Apache 2.0.',
  language: 'en',
  recommendedTheme: 'terminal',
  isPremium: false,
  texts: [
    // ── English ───────────────────────────────────────────────────────────────
    {
      id: 'code-ts-01',
      content: `const greet = (name: string): string => \`Hello, \${name}!\`;`,
      source: 'TypeScript, exemple original',
      language: 'en',
      difficulty: 1,
      wordCount: 9,
      charCount: 58,
      tags: ["typescript","function","template-literal"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-02',
      content: `async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return response.json() as Promise<T>;
}`,
      source: 'TypeScript, exemple original',
      language: 'en',
      difficulty: 3,
      wordCount: 16,
      charCount: 133,
      tags: ["typescript","async","generics"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-03',
      content: `type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };`,
      source: 'TypeScript, pattern Result type',
      language: 'en',
      difficulty: 3,
      wordCount: 17,
      charCount: 69,
      tags: ["typescript","types","discriminated-union"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-04',
      content: `export function pipe<T>(...fns: Array<(x: T) => T>): (x: T) => T {
  return (x) => fns.reduce((v, f) => f(v), x);
}`,
      source: 'TypeScript, functional programming',
      language: 'en',
      difficulty: 5,
      wordCount: 21,
      charCount: 115,
      tags: ["typescript","functional","higher-order"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-05',
      content: `const debounce = <T extends unknown[]>(fn: (...args: T) => void, ms: number) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};`,
      source: 'TypeScript, utilitaire debounce',
      language: 'en',
      difficulty: 5,
      wordCount: 32,
      charCount: 232,
      tags: ["typescript","utility","timing"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-py-01',
      content: `def factorial(n: int) -> int:
    return 1 if n <= 1 else n * factorial(n - 1)`,
      source: 'Python, exemple original',
      language: 'en',
      difficulty: 1,
      wordCount: 17,
      charCount: 78,
      tags: ["python","recursion","math"],
      codeLanguage: 'python',
    },
    {
      id: 'code-py-02',
      content: `from typing import Generator

def fibonacci() -> Generator[int, None, None]:
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b`,
      source: 'Python, générateur Fibonacci',
      language: 'en',
      difficulty: 3,
      wordCount: 26,
      charCount: 148,
      tags: ["python","generator","math"],
      codeLanguage: 'python',
    },
    {
      id: 'code-py-03',
      content: `words = ["hello", "world", "python"]
result = {word: len(word) for word in words if len(word) > 4}`,
      source: 'Python, dict comprehension',
      language: 'en',
      difficulty: 1,
      wordCount: 17,
      charCount: 98,
      tags: ["python","comprehension","dict"],
      codeLanguage: 'python',
    },
    {
      id: 'code-rs-01',
      content: `fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    let sum: i32 = numbers.iter().sum();
    println!("Sum: {}", sum);
}`,
      source: 'Rust, exemple original',
      language: 'en',
      difficulty: 3,
      wordCount: 20,
      charCount: 123,
      tags: ["rust","iterators","collections"],
      codeLanguage: 'rust',
    },
    {
      id: 'code-rs-02',
      content: `pub fn binary_search<T: Ord>(arr: &[T], target: &T) -> Option<usize> {
    let (mut low, mut high) = (0, arr.len());
    while low < high {
        let mid = low + (high - low) / 2;
        match arr[mid].cmp(target) {
            std::cmp::Ordering::Equal => return Some(mid),
            std::cmp::Ordering::Less => low = mid + 1,
            std::cmp::Ordering::Greater => high = mid,
        }
    }
    None
}`,
      source: 'Rust, algorithme recherche binaire',
      language: 'en',
      difficulty: 5,
      wordCount: 56,
      charCount: 414,
      tags: ["rust","algorithm","generics"],
      codeLanguage: 'rust',
    },
    {
      id: 'code-sh-01',
      content: `find . -name "*.ts" -not -path "*/node_modules/*" | xargs wc -l | sort -n`,
      source: 'Shell, compter les lignes TypeScript',
      language: 'en',
      difficulty: 3,
      wordCount: 14,
      charCount: 73,
      tags: ["shell","unix","find"],
    },
    {
      id: 'code-sh-02',
      content: `git log --oneline --graph --all --decorate | head -20`,
      source: 'Git, visualiser l\'historique',
      language: 'en',
      difficulty: 1,
      wordCount: 9,
      charCount: 53,
      tags: ["git","shell","log"],
    },
    {
      id: 'code-json-01',
      content: `{
  "name": "typewav",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}`,
      source: 'JSON, package.json exemple',
      language: 'en',
      difficulty: 1,
      wordCount: 17,
      charCount: 134,
      tags: ["json","config","npm"],
    },
    {
      id: 'code-css-01',
      content: `:root {
  --color-bg: #000000;
  --color-accent: #00D4AA;
  --font-mono: "JetBrains Mono", monospace;
}`,
      source: 'CSS, variables custom properties',
      language: 'en',
      difficulty: 1,
      wordCount: 11,
      charCount: 103,
      tags: ["css","custom-properties","design-tokens"],
    },
    {
      id: 'code-sql-01',
      content: `SELECT u.name, COUNT(s.id) AS session_count
FROM users u
LEFT JOIN sessions s ON s.user_id = u.id
GROUP BY u.id
HAVING session_count > 10
ORDER BY session_count DESC;`,
      source: 'SQL, requête agrégation',
      language: 'en',
      difficulty: 5,
      wordCount: 27,
      charCount: 166,
      tags: ["sql","database","aggregation"],
      codeLanguage: 'sql',
    },
    {
      id: 'code-ts-06',
      content: `interface Store<T> {
  getState(): T;
  setState(partial: Partial<T>): void;
  subscribe(listener: () => void): () => void;
}`,
      source: 'TypeScript, interface Store minimaliste',
      language: 'en',
      difficulty: 3,
      wordCount: 16,
      charCount: 125,
      tags: ["typescript","interface","state"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-07',
      content: `export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);`,
      source: 'TypeScript, utilitaire clamp',
      language: 'en',
      difficulty: 1,
      wordCount: 15,
      charCount: 112,
      tags: ["typescript","math","utility"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-py-04',
      content: `@dataclass
class Point:
    x: float
    y: float

    def distance_to(self, other: "Point") -> float:
        return ((self.x - other.x) ** 2 + (self.y - other.y) ** 2) ** 0.5`,
      source: 'Python, dataclass',
      language: 'en',
      difficulty: 3,
      wordCount: 27,
      charCount: 176,
      tags: ["python","dataclass","oop"],
      codeLanguage: 'python',
    },
    {
      id: 'code-rs-03',
      content: `let result: Vec<_> = (1..=10).filter(|n| n % 2 == 0).map(|n| n * n).collect();`,
      source: 'Rust, iterator chaining',
      language: 'en',
      difficulty: 3,
      wordCount: 13,
      charCount: 78,
      tags: ["rust","iterators","functional"],
      codeLanguage: 'rust',
    },
    {
      id: 'code-ts-08',
      content: `const memoize = <T, R>(fn: (arg: T) => R): ((arg: T) => R) => {
  const cache = new Map<T, R>();
  return (arg) => {
    if (cache.has(arg)) return cache.get(arg)!;
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
};`,
      source: 'TypeScript, memoization',
      language: 'en',
      difficulty: 5,
      wordCount: 39,
      charCount: 247,
      tags: ["typescript","performance","memoize"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-09',
      content: `function isEmpty<T>(arr: T[]): boolean {
  return arr.length === 0;
}`,
      source: 'TypeScript, type guard utility',
      language: 'en',
      difficulty: 1,
      wordCount: 10,
      charCount: 69,
      tags: ["typescript","utility","array"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-10',
      content: `type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;`,
      source: 'TypeScript, deep partial type',
      language: 'en',
      difficulty: 5,
      wordCount: 16,
      charCount: 87,
      tags: ["typescript","types","deep"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-11',
      content: `const groupBy = <T>(arr: T[], key: keyof T): Record<string, T[]> =>
  arr.reduce((groups, item) => {
    const group = String(item[key]);
    return { ...groups, [group]: [...(groups[group] ?? []), item] };
  }, {} as Record<string, T[]>);`,
      source: 'TypeScript, groupBy utility',
      language: 'en',
      difficulty: 5,
      wordCount: 33,
      charCount: 239,
      tags: ["typescript","functional","groupBy"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-12',
      content: `class EventEmitter<T extends Record<string, unknown>> {
  private listeners = new Map<keyof T, Set<(data: T[keyof T]) => void>>();
}`,
      source: 'TypeScript, typed EventEmitter',
      language: 'en',
      difficulty: 5,
      wordCount: 18,
      charCount: 132,
      tags: ["typescript","events","class"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-13',
      content: `const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));`,
      source: 'TypeScript, async sleep utility',
      language: 'en',
      difficulty: 3,
      wordCount: 12,
      charCount: 97,
      tags: ["typescript","async","timer"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-14',
      content: `export type Nullable<T> = T | null | undefined;`,
      source: 'TypeScript, nullable type alias',
      language: 'en',
      difficulty: 1,
      wordCount: 9,
      charCount: 47,
      tags: ["typescript","types","nullable"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-15',
      content: `const unique = <T>(arr: T[]): T[] => [...new Set(arr)];`,
      source: 'TypeScript, unique array elements',
      language: 'en',
      difficulty: 1,
      wordCount: 9,
      charCount: 55,
      tags: ["typescript","array","set"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-py-05',
      content: `import functools

@functools.lru_cache(maxsize=None)
def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)`,
      source: 'Python, memoized fibonacci',
      language: 'en',
      difficulty: 3,
      wordCount: 22,
      charCount: 127,
      tags: ["python","memoize","fibonacci"],
      codeLanguage: 'python',
    },
    {
      id: 'code-py-06',
      content: `from contextlib import contextmanager
from typing import Generator

@contextmanager
def timer() -> Generator[None, None, None]:
    import time
    start = time.perf_counter()
    yield
    print(f'Elapsed: {time.perf_counter() - start:.3f}s')`,
      source: 'Python, context manager timer',
      language: 'en',
      difficulty: 5,
      wordCount: 25,
      charCount: 243,
      tags: ["python","contextmanager","timing"],
      codeLanguage: 'python',
    },
    {
      id: 'code-py-07',
      content: `squares = [x ** 2 for x in range(1, 11)]`,
      source: 'Python, list comprehension squares',
      language: 'en',
      difficulty: 1,
      wordCount: 10,
      charCount: 40,
      tags: ["python","comprehension","math"],
      codeLanguage: 'python',
    },
    {
      id: 'code-py-08',
      content: `def chunk(lst: list, size: int) -> list:
    return [lst[i:i + size] for i in range(0, len(lst), size)]`,
      source: 'Python, chunk list into batches',
      language: 'en',
      difficulty: 3,
      wordCount: 17,
      charCount: 103,
      tags: ["python","list","batch"],
      codeLanguage: 'python',
    },
    {
      id: 'code-rs-04',
      content: `fn is_palindrome(s: &str) -> bool {
    let chars: Vec<char> = s.chars().collect();
    chars == chars.iter().rev().cloned().collect::<Vec<_>>()
}`,
      source: 'Rust, palindrome check',
      language: 'en',
      difficulty: 3,
      wordCount: 15,
      charCount: 146,
      tags: ["rust","string","palindrome"],
      codeLanguage: 'rust',
    },
    {
      id: 'code-rs-05',
      content: `use std::collections::HashMap;

let mut scores: HashMap<&str, i32> = HashMap::new();
scores.entry("player1").and_modify(|s| *s += 10).or_insert(10);`,
      source: 'Rust, HashMap entry API',
      language: 'en',
      difficulty: 5,
      wordCount: 13,
      charCount: 148,
      tags: ["rust","hashmap","entry"],
      codeLanguage: 'rust',
    },
    {
      id: 'code-rs-06',
      content: `#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: f64,
    y: f64,
}`,
      source: 'Rust, derive macro struct',
      language: 'en',
      difficulty: 3,
      wordCount: 11,
      charCount: 75,
      tags: ["rust","struct","derive"],
      codeLanguage: 'rust',
    },
    {
      id: 'code-go-01',
      content: `func main() {
    fmt.Println("Hello, World!")
}`,
      source: 'Go, hello world',
      language: 'en',
      difficulty: 1,
      wordCount: 6,
      charCount: 48,
      tags: ["go","hello","basics"],
      codeLanguage: 'go',
    },
    {
      id: 'code-go-02',
      content: `func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}`,
      source: 'Go, recursive fibonacci',
      language: 'en',
      difficulty: 3,
      wordCount: 18,
      charCount: 111,
      tags: ["go","recursion","fibonacci"],
      codeLanguage: 'go',
    },
    {
      id: 'code-go-03',
      content: `ch := make(chan int, 10)
go func() {
    for i := 0; i < 10; i++ {
        ch <- i
    }
    close(ch)
}()`,
      source: 'Go, goroutine channel',
      language: 'en',
      difficulty: 5,
      wordCount: 23,
      charCount: 106,
      tags: ["go","goroutine","channel"],
      codeLanguage: 'go',
    },
    {
      id: 'code-go-04',
      content: `type Stack[T any] struct {
    items []T
}

func (s *Stack[T]) Push(item T) {
    s.items = append(s.items, item)
}`,
      source: 'Go, generic stack',
      language: 'en',
      difficulty: 5,
      wordCount: 19,
      charCount: 115,
      tags: ["go","generics","stack"],
      codeLanguage: 'go',
    },
    {
      id: 'code-go-05',
      content: `defer func() {
    if r := recover(); r != nil {
        log.Printf("Recovered from panic: %v", r)
    }
}()`,
      source: 'Go, recover from panic',
      language: 'en',
      difficulty: 3,
      wordCount: 18,
      charCount: 108,
      tags: ["go","defer","panic"],
      codeLanguage: 'go',
    },
    {
      id: 'code-sh-03',
      content: `#!/bin/bash
set -euo pipefail
mkdir -p dist && cp -r src/* dist/`,
      source: 'Shell, strict mode script',
      language: 'en',
      difficulty: 3,
      wordCount: 12,
      charCount: 64,
      tags: ["shell","bash","scripting"],
    },
    {
      id: 'code-sh-04',
      content: `for f in *.json; do jq . "$f" > "\${f%.json}.formatted.json"; done`,
      source: 'Shell, format all JSON files',
      language: 'en',
      difficulty: 3,
      wordCount: 11,
      charCount: 65,
      tags: ["shell","jq","json"],
    },
    {
      id: 'code-sh-05',
      content: `docker ps --format 'table {{.ID}}	{{.Names}}	{{.Status}}' | grep running`,
      source: 'Docker, list running containers',
      language: 'en',
      difficulty: 3,
      wordCount: 10,
      charCount: 72,
      tags: ["docker","shell","containers"],
    },
    {
      id: 'code-sql-02',
      content: `CREATE INDEX CONCURRENTLY idx_users_email
ON users (email)
WHERE email IS NOT NULL;`,
      source: 'SQL, concurrent index creation',
      language: 'en',
      difficulty: 3,
      wordCount: 12,
      charCount: 83,
      tags: ["sql","index","performance"],
      codeLanguage: 'sql',
    },
    {
      id: 'code-sql-03',
      content: `WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM sessions
)
SELECT * FROM ranked WHERE rn = 1;`,
      source: 'SQL, latest row per user CTE',
      language: 'en',
      difficulty: 5,
      wordCount: 28,
      charCount: 153,
      tags: ["sql","cte","window-function"],
      codeLanguage: 'sql',
    },
    {
      id: 'code-css-02',
      content: `.container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}`,
      source: 'CSS, responsive grid layout',
      language: 'en',
      difficulty: 3,
      wordCount: 11,
      charCount: 108,
      tags: ["css","grid","responsive"],
    },
    {
      id: 'code-css-03',
      content: `@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}`,
      source: 'CSS, fade-in animation',
      language: 'en',
      difficulty: 3,
      wordCount: 18,
      charCount: 123,
      tags: ["css","animation","keyframes"],
    },
    {
      id: 'code-json-02',
      content: `{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "moduleResolution": "bundler"
  }
}`,
      source: 'JSON, tsconfig.json example',
      language: 'en',
      difficulty: 1,
      wordCount: 11,
      charCount: 108,
      tags: ["json","typescript","config"],
    },
    {
      id: 'code-json-03',
      content: `{
  "extends": "../../eslint.config.mjs",
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-explicit-any": "error"
  }
}`,
      source: 'JSON, ESLint config',
      language: 'en',
      difficulty: 3,
      wordCount: 11,
      charCount: 136,
      tags: ["json","eslint","config"],
    },
    {
      id: 'code-js-01',
      content: `const throttle = (fn, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};`,
      source: 'JavaScript, throttle utility',
      language: 'en',
      difficulty: 5,
      wordCount: 29,
      charCount: 209,
      tags: ["javascript","utility","throttle"],
      codeLanguage: 'javascript',
    },
    {
      id: 'code-js-02',
      content: `const curry = fn => {
  const arity = fn.length;
  return function curried(...args) {
    return args.length >= arity ? fn(...args) : curried.bind(null, ...args);
  };
};`,
      source: 'JavaScript, curry function',
      language: 'en',
      difficulty: 5,
      wordCount: 25,
      charCount: 170,
      tags: ["javascript","functional","curry"],
      codeLanguage: 'javascript',
    },
    // ── Français ──────────────────────────────────────────────────────────────
    {
      id: 'code-ts-fr-01',
      content: `// Vérifie si un tableau est vide
const estVide = <T>(tab: T[]): boolean => tab.length === 0;`,
      source: 'TypeScript, utilitaire tableau vide',
      language: 'fr',
      difficulty: 1,
      wordCount: 17,
      charCount: 93,
      tags: ["typescript","tableau","utilitaire"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-fr-02',
      content: `// Attend N millisecondes de façon asynchrone
const attendre = (ms: number): Promise<void> =>
  new Promise((résoudre) => setTimeout(résoudre, ms));`,
      source: 'TypeScript, utilitaire attente',
      language: 'fr',
      difficulty: 3,
      wordCount: 19,
      charCount: 148,
      tags: ["typescript","async","attente"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-fr-03',
      content: `// Retourne les éléments uniques d'un tableau
const unique = <T>(tab: T[]): T[] => [...new Set(tab)];`,
      source: 'TypeScript, éléments uniques',
      language: 'fr',
      difficulty: 1,
      wordCount: 16,
      charCount: 101,
      tags: ["typescript","tableau","set"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-fr-04',
      content: `// Limite une valeur entre un minimum et un maximum
export const limiter = (valeur: number, min: number, max: number): number =>
  Math.min(Math.max(valeur, min), max);`,
      source: 'TypeScript, utilitaire limiter',
      language: 'fr',
      difficulty: 1,
      wordCount: 25,
      charCount: 168,
      tags: ["typescript","math","utilitaire"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-fr-05',
      content: `// Interface d'un magasin d'état minimaliste
interface Magasin<T> {
  lireÉtat(): T;
  modifierÉtat(partiel: Partial<T>): void;
  abonner(écouteur: () => void): () => void;
}`,
      source: 'TypeScript, interface Magasin',
      language: 'fr',
      difficulty: 3,
      wordCount: 22,
      charCount: 174,
      tags: ["typescript","interface","état"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-fr-06',
      content: `// Fonction de composition : applique les fonctions de gauche à droite
export function composer<T>(...fns: Array<(x: T) => T>): (x: T) => T {
  return (x) => fns.reduce((v, f) => f(v), x);
}`,
      source: 'TypeScript, programmation fonctionnelle',
      language: 'fr',
      difficulty: 5,
      wordCount: 33,
      charCount: 190,
      tags: ["typescript","fonctionnel","composition"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-py-fr-01',
      content: `# Calcule le factoriel de façon récursive
def factorielle(n: int) -> int:
    return 1 if n <= 1 else n * factorielle(n - 1)`,
      source: 'Python, factorielle récursive',
      language: 'fr',
      difficulty: 1,
      wordCount: 24,
      charCount: 124,
      tags: ["python","récursion","math"],
      codeLanguage: 'python',
    },
    {
      id: 'code-py-fr-02',
      content: `# Générateur de la suite de Fibonacci
from typing import Generator

def fibonacci() -> Generator[int, None, None]:
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b`,
      source: 'Python, générateur Fibonacci',
      language: 'fr',
      difficulty: 3,
      wordCount: 33,
      charCount: 186,
      tags: ["python","générateur","math"],
      codeLanguage: 'python',
    },
    {
      id: 'code-py-fr-03',
      content: `# Compter les mots dans chaque chaîne
mots = ["bonjour", "monde", "python"]
résultat = {mot: len(mot) for mot in mots if len(mot) > 4}`,
      source: 'Python, compréhension de dict',
      language: 'fr',
      difficulty: 1,
      wordCount: 24,
      charCount: 134,
      tags: ["python","compréhension","dict"],
      codeLanguage: 'python',
    },
    {
      id: 'code-py-fr-04',
      content: `# Découpe une liste en sous-listes de taille fixe
def découper(liste: list, taille: int) -> list:
    return [liste[i:i + taille] for i in range(0, len(liste), taille)]`,
      source: 'Python, découpage de liste',
      language: 'fr',
      difficulty: 3,
      wordCount: 26,
      charCount: 168,
      tags: ["python","liste","lot"],
      codeLanguage: 'python',
    },
    {
      id: 'code-py-fr-05',
      content: `# Carrés des dix premiers entiers
carrés = [x ** 2 for x in range(1, 11)]`,
      source: 'Python, compréhension de liste',
      language: 'fr',
      difficulty: 1,
      wordCount: 16,
      charCount: 73,
      tags: ["python","compréhension","math"],
      codeLanguage: 'python',
    },
    {
      id: 'code-rs-fr-01',
      content: `// Vérifie si une chaîne est un palindrome
fn est_palindrome(s: &str) -> bool {
    let chars: Vec<char> = s.chars().collect();
    chars == chars.iter().rev().cloned().collect::<Vec<_>>()
}`,
      source: 'Rust, palindrome',
      language: 'fr',
      difficulty: 3,
      wordCount: 23,
      charCount: 190,
      tags: ["rust","chaîne","palindrome"],
      codeLanguage: 'rust',
    },
    {
      id: 'code-rs-fr-02',
      content: `// Structure Point dérivant Debug, Clone et PartialEq
#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: f64,
    y: f64,
}`,
      source: 'Rust, struct dérivée',
      language: 'fr',
      difficulty: 3,
      wordCount: 19,
      charCount: 129,
      tags: ["rust","struct","dérivation"],
      codeLanguage: 'rust',
    },
    {
      id: 'code-rs-fr-03',
      content: `// Résultat de chaîne d'itérateurs
let résultat: Vec<_> = (1..=10).filter(|n| n % 2 == 0).map(|n| n * n).collect();`,
      source: 'Rust, chaîne d\'itérateurs',
      language: 'fr',
      difficulty: 3,
      wordCount: 18,
      charCount: 115,
      tags: ["rust","itérateurs","fonctionnel"],
      codeLanguage: 'rust',
    },
    {
      id: 'code-go-fr-01',
      content: `// Point d'entrée principal du programme
func main() {
    fmt.Println("Bonjour, monde !")
}`,
      source: 'Go, bonjour monde',
      language: 'fr',
      difficulty: 1,
      wordCount: 13,
      charCount: 92,
      tags: ["go","bonjour","bases"],
      codeLanguage: 'go',
    },
    {
      id: 'code-go-fr-02',
      content: `// Fibonacci récursif
func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}`,
      source: 'Go, fibonacci récursif',
      language: 'fr',
      difficulty: 3,
      wordCount: 21,
      charCount: 133,
      tags: ["go","récursion","fibonacci"],
      codeLanguage: 'go',
    },
    {
      id: 'code-go-fr-03',
      content: `// Goroutine envoyant des entiers dans un canal
ch := make(chan int, 10)
go func() {
    for i := 0; i < 10; i++ {
        ch <- i
    }
    close(ch)
}()`,
      source: 'Go, goroutine et canal',
      language: 'fr',
      difficulty: 5,
      wordCount: 31,
      charCount: 154,
      tags: ["go","goroutine","canal"],
      codeLanguage: 'go',
    },
    {
      id: 'code-sh-fr-01',
      content: `#!/bin/bash
# Mode strict : sortir en cas d'erreur
set -euo pipefail
mkdir -p dist && cp -r src/* dist/`,
      source: 'Shell, script mode strict',
      language: 'fr',
      difficulty: 3,
      wordCount: 20,
      charCount: 103,
      tags: ["shell","bash","scripting"],
    },
    {
      id: 'code-sh-fr-02',
      content: `# Compter les lignes TypeScript en excluant node_modules
find . -name '*.ts' -not -path '*/node_modules/*' | xargs wc -l | sort -n`,
      source: 'Shell, compter les lignes TypeScript',
      language: 'fr',
      difficulty: 3,
      wordCount: 22,
      charCount: 130,
      tags: ["shell","unix","find"],
    },
    {
      id: 'code-sh-fr-03',
      content: `# Visualiser l'historique git en ligne
git log --oneline --graph --all --decorate | head -20`,
      source: 'Git, visualiser l\'historique',
      language: 'fr',
      difficulty: 1,
      wordCount: 15,
      charCount: 92,
      tags: ["git","shell","historique"],
    },
    {
      id: 'code-ts-fr-07',
      content: `// File d'attente de tâches avec limite de concurrence
class FileDeTaches<T> {
  private enCours = 0;
  private attente: Array<() => void> = [];

  constructor(private limite: number) {}

  async executer(tache: () => Promise<T>): Promise<T> {
    if (this.enCours >= this.limite) {
      await new Promise<void>((resoudre) => this.attente.push(resoudre));
    }
    this.enCours++;
    try {
      return await tache();
    } finally {
      this.enCours--;
      this.attente.shift()?.();
    }
  }
}`,
      source: 'TypeScript, file de tâches concurrente',
      language: 'fr',
      difficulty: 4,
      wordCount: 59,
      charCount: 502,
      tags: ["typescript", "concurrence", "file-attente"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-py-fr-06',
      content: `# Regroupe une liste d'éléments par lots de taille fixe
def regrouper_par_lots(elements, taille_lot):
    if taille_lot <= 0:
        raise ValueError("la taille du lot doit être strictement positive")
    lots = []
    lot_courant = []
    for element in elements:
        lot_courant.append(element)
        if len(lot_courant) == taille_lot:
            lots.append(lot_courant)
            lot_courant = []
    if lot_courant:
        lots.append(lot_courant)
    return lots`,
      source: 'Python, regroupement par lots',
      language: 'fr',
      difficulty: 2,
      wordCount: 50,
      charCount: 479,
      tags: ["python", "liste", "utilitaire"],
      codeLanguage: 'python',
    },
    {
      id: 'code-go-fr-04',
      content: `// Calcule la médiane d'une tranche de nombres flottants
func mediane(nombres []float64) float64 {
	copie := make([]float64, len(nombres))
	copy(copie, nombres)
	sort.Float64s(copie)
	milieu := len(copie) / 2
	if len(copie)%2 == 0 {
		return (copie[milieu-1] + copie[milieu]) / 2
	}
	return copie[milieu]
}`,
      source: 'Go, calcul de médiane',
      language: 'fr',
      difficulty: 3,
      wordCount: 41,
      charCount: 306,
      tags: ["go", "statistiques", "tri"],
      codeLanguage: 'go',
    },
    {
      id: 'code-ts-fr-08',
      content: `// Cache mémoire simple avec expiration par entrée
class CacheAvecExpiration<K, V> {
  private entrees = new Map<K, { valeur: V; expireA: number }>();

  constructor(private dureeDeVieMs: number) {}

  definir(cle: K, valeur: V): void {
    this.entrees.set(cle, { valeur, expireA: Date.now() + this.dureeDeVieMs });
  }

  obtenir(cle: K): V | undefined {
    const entree = this.entrees.get(cle);
    if (!entree) return undefined;
    if (Date.now() > entree.expireA) {
      this.entrees.delete(cle);
      return undefined;
    }
    return entree.valeur;
  }

  nettoyerExpirees(): number {
    const maintenant = Date.now();
    let supprimees = 0;
    for (const [cle, entree] of this.entrees) {
      if (maintenant > entree.expireA) {
        this.entrees.delete(cle);
        supprimees++;
      }
    }
    return supprimees;
  }
}`,
      source: 'TypeScript, cache avec expiration',
      language: 'fr',
      difficulty: 4,
      wordCount: 99,
      charCount: 843,
      tags: ["typescript", "cache", "ttl"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-py-fr-07',
      content: `# Implémentation d'une pile qui retient aussi le minimum courant
class PileAvecMinimum:
    """Pile classique augmentée d'un accès au minimum en temps constant."""

    def __init__(self):
        self.pile = []
        self.minimums = []

    def empiler(self, valeur):
        self.pile.append(valeur)
        if not self.minimums or valeur <= self.minimums[-1]:
            self.minimums.append(valeur)
        else:
            self.minimums.append(self.minimums[-1])

    def depiler(self):
        if not self.pile:
            raise IndexError("pile vide")
        self.minimums.pop()
        return self.pile.pop()

    def minimum(self):
        if not self.minimums:
            raise IndexError("pile vide")
        return self.minimums[-1]

    def sommet(self):
        if not self.pile:
            raise IndexError("pile vide")
        return self.pile[-1]

    def taille(self):
        return len(self.pile)

    def vider(self):
        self.pile.clear()
        self.minimums.clear()

    def est_vide(self):
        return len(self.pile) == 0`,
      source: 'Python, pile avec minimum',
      language: 'fr',
      difficulty: 3,
      wordCount: 89,
      charCount: 1062,
      tags: ["python", "structure-de-donnees", "pile"],
      codeLanguage: 'python',
    },
    {
      id: 'code-rs-fr-04',
      content: `// Structure de file d'attente à priorité minimale sur un tas binaire
use std::collections::BinaryHeap;
use std::cmp::Reverse;

struct FilePriorite<T: Ord> {
    tas: BinaryHeap<Reverse<T>>,
}

impl<T: Ord> FilePriorite<T> {
    fn nouvelle() -> Self {
        FilePriorite { tas: BinaryHeap::new() }
    }

    fn inserer(&mut self, valeur: T) {
        self.tas.push(Reverse(valeur));
    }

    fn extraire_minimum(&mut self) -> Option<T> {
        self.tas.pop().map(|Reverse(valeur)| valeur)
    }

    fn est_vide(&self) -> bool {
        self.tas.is_empty()
    }

    fn taille(&self) -> usize {
        self.tas.len()
    }

    fn depuis_vec(valeurs: Vec<T>) -> Self {
        let tas = valeurs.into_iter().map(Reverse).collect();
        FilePriorite { tas }
    }
}`,
      source: 'Rust, file de priorité minimale',
      language: 'fr',
      difficulty: 5,
      wordCount: 85,
      charCount: 777,
      tags: ["rust", "tas-binaire", "file-priorite"],
      codeLanguage: 'rust',
    },
    {
      id: 'code-ts-16',
      content: `// Debounces a function so it only fires after calls settle
function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}`,
      source: 'TypeScript, debounce utility',
      language: 'en',
      difficulty: 3,
      wordCount: 48,
      charCount: 361,
      tags: ["typescript", "debounce", "utility"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-py-09',
      content: `# Flattens an arbitrarily nested list into a single flat list
def flatten(nested):
    result = []
    for item in nested:
        if isinstance(item, (list, tuple)):
            result.extend(flatten(item))
        else:
            result.append(item)
    return result


def flatten_unique(nested):
    seen = []
    for item in flatten(nested):
        if item not in seen:
            seen.append(item)
    return seen`,
      source: 'Python, recursive flatten',
      language: 'en',
      difficulty: 2,
      wordCount: 46,
      charCount: 423,
      tags: ["python", "recursion", "list"],
      codeLanguage: 'python',
    },
    {
      id: 'code-go-06',
      content: `// Retries a function with exponential backoff up to maxAttempts
func retryWithBackoff(fn func() error, maxAttempts int) error {
	var err error
	for attempt := 0; attempt < maxAttempts; attempt++ {
		if err = fn(); err == nil {
			return nil
		}
		time.Sleep(time.Duration(1<<attempt) * time.Second)
	}
	return err
}`,
      source: 'Go, exponential backoff retry',
      language: 'en',
      difficulty: 3,
      wordCount: 48,
      charCount: 316,
      tags: ["go", "retry", "resilience"],
      codeLanguage: 'go',
    },
    {
      id: 'code-ts-17',
      content: `// A small event emitter supporting typed listeners and unsubscribe
class EventEmitter<Events extends Record<string, unknown[]>> {
  private listeners: { [K in keyof Events]?: Array<(...args: Events[K]) => void> } = {};

  on<K extends keyof Events>(event: K, handler: (...args: Events[K]) => void): () => void {
    const list = (this.listeners[event] ??= []);
    list.push(handler);
    return () => {
      const index = list.indexOf(handler);
      if (index !== -1) list.splice(index, 1);
    };
  }

  emit<K extends keyof Events>(event: K, ...args: Events[K]): void {
    for (const handler of this.listeners[event] ?? []) {
      handler(...args);
    }
  }

  clear(event: keyof Events): void {
    delete this.listeners[event];
  }
}`,
      source: 'TypeScript, typed event emitter',
      language: 'en',
      difficulty: 5,
      wordCount: 96,
      charCount: 744,
      tags: ["typescript", "event-emitter", "generics"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-py-10',
      content: `# A least-recently-used cache backed by an ordered dictionary
from collections import OrderedDict

class LRUCache:
    """Fixed-capacity cache that evicts the least recently used entry first."""

    def __init__(self, capacity):
        self.capacity = capacity
        self.store = OrderedDict()

    def get(self, key):
        if key not in self.store:
            return None
        self.store.move_to_end(key)
        return self.store[key]

    def put(self, key, value):
        if key in self.store:
            self.store.move_to_end(key)
        self.store[key] = value
        if len(self.store) > self.capacity:
            self.store.popitem(last=False)

    def __contains__(self, key):
        return key in self.store

    def __len__(self):
        return len(self.store)

    def keys(self):
        return list(self.store.keys())

    def clear(self):
        self.store.clear()`,
      source: 'Python, LRU cache implementation',
      language: 'en',
      difficulty: 4,
      wordCount: 82,
      charCount: 899,
      tags: ["python", "cache", "lru"],
      codeLanguage: 'python',
    },
    {
      id: 'code-rs-07',
      content: `// A minimal thread-safe counter shared across worker threads
use std::sync::{Arc, Mutex};
use std::thread;

fn run_parallel_counter(worker_count: usize, increments_per_worker: usize) -> usize {
    let counter = Arc::new(Mutex::new(0usize));
    let mut handles = Vec::new();

    for _ in 0..worker_count {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            for _ in 0..increments_per_worker {
                let mut value = counter.lock().unwrap();
                *value += 1;
            }
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    let final_value = *counter.lock().unwrap();
    let expected = worker_count * increments_per_worker;
    assert_eq!(final_value, expected, "lost updates detected under contention");
    final_value
}`,
      source: 'Rust, thread-safe shared counter',
      language: 'en',
      difficulty: 5,
      wordCount: 85,
      charCount: 836,
      tags: ["rust", "concurrency", "mutex"],
      codeLanguage: 'rust',
    },
    {
      id: 'code-ts-fr-09',
      content: `// File d'attente de priorité générique avec réévaluation des clés
class FileDePrioriteAvecMiseAJour<T> {
  private tas: Array<{ cle: number; valeur: T }> = [];

  inserer(cle: number, valeur: T): void {
    this.tas.push({ cle, valeur });
    this.tas.sort((a, b) => a.cle - b.cle);
  }

  extraireMinimum(): T | undefined {
    const entree = this.tas.shift();
    return entree?.valeur;
  }

  mettreAJourCle(valeur: T, nouvelleCle: number): boolean {
    const index = this.tas.findIndex((e) => e.valeur === valeur);
    if (index === -1) return false;
    this.tas[index]!.cle = nouvelleCle;
    this.tas.sort((a, b) => a.cle - b.cle);
    return true;
  }

  contient(valeur: T): boolean {
    return this.tas.some((e) => e.valeur === valeur);
  }

  taille(): number {
    return this.tas.length;
  }

  estVide(): boolean {
    return this.tas.length === 0;
  }

  vider(): void {
    this.tas = [];
  }
}`,
      source: 'TypeScript, file de priorité avec réévaluation',
      language: 'fr',
      difficulty: 4,
      wordCount: 117,
      charCount: 913,
      tags: ["typescript", "file-priorite", "structure-de-donnees"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-18',
      content: `// Rate limiter using a sliding window of request timestamps
class SlidingWindowRateLimiter {
  private timestamps: number[] = [];

  constructor(private maxRequests: number, private windowMs: number) {}

  allow(now: number): boolean {
    const cutoff = now - this.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > cutoff);
    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }
    this.timestamps.push(now);
    return true;
  }

  remaining(now: number): number {
    const cutoff = now - this.windowMs;
    const active = this.timestamps.filter((t) => t > cutoff);
    return Math.max(0, this.maxRequests - active.length);
  }

  retryAfterMs(now: number): number {
    if (this.timestamps.length === 0) return 0;
    const oldest = Math.min(...this.timestamps);
    return Math.max(0, oldest + this.windowMs - now);
  }

  reset(): void {
    this.timestamps = [];
  }
}`,
      source: 'TypeScript, sliding window rate limiter',
      language: 'en',
      difficulty: 4,
      wordCount: 108,
      charCount: 918,
      tags: ["typescript", "rate-limiter", "sliding-window"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-19',
      content: `function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const wrapped = (...args: A): void => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  wrapped.cancel = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  return wrapped;
}`,
      source: 'TypeScript, debounce with cancel',
      language: 'en',
      difficulty: 3,
      wordCount: 57,
      charCount: 396,
      tags: ["typescript","debounce","timers"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-20',
      content: `type Action =
  | { type: 'increment'; by: number }
  | { type: 'reset' }
  | { type: 'set'; value: number };

function counterReducer(state: number, action: Action): number {
  switch (action.type) {
    case 'increment':
      return state + action.by;
    case 'reset':
      return 0;
    case 'set':
      return action.value;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}`,
      source: 'TypeScript, discriminated union reducer',
      language: 'en',
      difficulty: 4,
      wordCount: 58,
      charCount: 425,
      tags: ["typescript","reducer","union"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-21',
      content: `function groupBy<T, K extends string | number>(
  items: readonly T[],
  key: (item: T) => K,
): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) {
    const k = key(item);
    (out[k] ??= []).push(item);
  }
  return out;
}`,
      source: 'TypeScript, groupBy helper',
      language: 'en',
      difficulty: 3,
      wordCount: 43,
      charCount: 256,
      tags: ["typescript","groupby","generics"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-22',
      content: `type Handler<T> = (payload: T) => void;

class Emitter<Events extends Record<string, unknown>> {
  private handlers: { [K in keyof Events]?: Set<Handler<Events[K]>> } = {};

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
    (this.handlers[event] ??= new Set()).add(handler);
    return () => this.handlers[event]?.delete(handler);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.handlers[event]?.forEach((handler) => handler(payload));
  }
}`,
      source: 'TypeScript, tiny event emitter',
      language: 'en',
      difficulty: 5,
      wordCount: 58,
      charCount: 512,
      tags: ["typescript","events","generics"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-23',
      content: `const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const lerp = (from: number, to: number, t: number): number =>
  from + (to - from) * clamp(t, 0, 1);`,
      source: 'TypeScript, clamp and lerp',
      language: 'en',
      difficulty: 2,
      wordCount: 34,
      charCount: 207,
      tags: ["typescript","math","clamp"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-ts-24',
      content: `async function retry<T>(
  task: () => Promise<T>,
  attempts = 3,
  baseMs = 200,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, baseMs * 2 ** i));
    }
  }
  throw lastError;
}`,
      source: 'TypeScript, retry with backoff',
      language: 'en',
      difficulty: 4,
      wordCount: 56,
      charCount: 354,
      tags: ["typescript","retry","async"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-py-11',
      content: `from collections import deque


def sliding_max(nums: list[int], k: int) -> list[int]:
    q: deque[int] = deque()
    out: list[int] = []
    for i, n in enumerate(nums):
        while q and nums[q[-1]] <= n:
            q.pop()
        q.append(i)
        if q[0] == i - k:
            q.popleft()
        if i >= k - 1:
            out.append(nums[q[0]])
    return out`,
      source: 'Python, sliding window maximum',
      language: 'en',
      difficulty: 3,
      wordCount: 48,
      charCount: 372,
      tags: ["python","sliding-window","deque"],
      codeLanguage: 'python',
    },
    {
      id: 'code-py-12',
      content: `def memoize(fn):
    cache = {}

    def wrapper(*args):
        if args not in cache:
            cache[args] = fn(*args)
        return cache[args]

    return wrapper


@memoize
def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)`,
      source: 'Python, simple memoize decorator',
      language: 'en',
      difficulty: 2,
      wordCount: 39,
      charCount: 255,
      tags: ["python","decorator","memoize"],
      codeLanguage: 'python',
    },
    {
      id: 'code-py-13',
      content: `import time
from contextlib import contextmanager


@contextmanager
def timed(label: str):
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = (time.perf_counter() - start) * 1000
        print(f"{label}: {elapsed:.1f} ms")


with timed("load"):
    total = sum(i * i for i in range(1_000_000))`,
      source: 'Python, context manager for timing',
      language: 'en',
      difficulty: 4,
      wordCount: 37,
      charCount: 328,
      tags: ["python","context-manager","timing"],
      codeLanguage: 'python',
    },
    {
      id: 'code-py-14',
      content: `from typing import Any, Iterable, Iterator


def flatten(items: Iterable[Any]) -> Iterator[Any]:
    for item in items:
        if isinstance(item, (list, tuple, set)):
            yield from flatten(item)
        else:
            yield item


result = list(flatten([1, [2, 3, [4, [5]]], (6, 7)]))`,
      source: 'Python, flatten nested iterables',
      language: 'en',
      difficulty: 3,
      wordCount: 35,
      charCount: 298,
      tags: ["python","recursion","generators"],
      codeLanguage: 'python',
    },
    {
      id: 'code-py-15',
      content: `from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity: int) -> None:
        self.capacity = capacity
        self.store: OrderedDict[int, int] = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.store:
            return -1
        self.store.move_to_end(key)
        return self.store[key]

    def put(self, key: int, value: int) -> None:
        if key in self.store:
            self.store.move_to_end(key)
        self.store[key] = value
        if len(self.store) > self.capacity:
            self.store.popitem(last=False)`,
      source: 'Python, LRU cache from scratch',
      language: 'en',
      difficulty: 5,
      wordCount: 57,
      charCount: 590,
      tags: ["python","lru-cache","ordereddict"],
      codeLanguage: 'python',
    },
    {
      id: 'code-rs-08',
      content: `fn running_sum(values: &[i64]) -> Vec<i64> {
    values
        .iter()
        .scan(0i64, |acc, &value| {
            *acc += value;
            Some(*acc)
        })
        .collect()
}

fn main() {
    let totals = running_sum(&[1, 2, 3, 4, 5]);
    assert_eq!(totals, vec![1, 3, 6, 10, 15]);
}`,
      source: 'Rust, iterator adaptor for running sum',
      language: 'en',
      difficulty: 4,
      wordCount: 37,
      charCount: 299,
      tags: ["rust","iterator","scan"],
      codeLanguage: 'rust',
    },
    {
      id: 'code-rs-09',
      content: `use std::ops::Deref;

struct NonEmpty<T>(Vec<T>);

impl<T> NonEmpty<T> {
    fn new(first: T) -> Self {
        NonEmpty(vec![first])
    }

    fn push(&mut self, value: T) {
        self.0.push(value);
    }

    fn first(&self) -> &T {
        &self.0[0]
    }
}

impl<T> Deref for NonEmpty<T> {
    type Target = [T];
    fn deref(&self) -> &[T] {
        &self.0
    }
}`,
      source: 'Rust, generic newtype with Deref',
      language: 'en',
      difficulty: 5,
      wordCount: 48,
      charCount: 375,
      tags: ["rust","newtype","deref"],
      codeLanguage: 'rust',
    },
    {
      id: 'code-rs-10',
      content: `use std::collections::HashMap;

fn word_count(text: &str) -> HashMap<String, usize> {
    let mut counts = HashMap::new();
    for word in text.split_whitespace() {
        let key = word.to_lowercase();
        *counts.entry(key).or_insert(0) += 1;
    }
    counts
}`,
      source: 'Rust, word frequency count',
      language: 'en',
      difficulty: 3,
      wordCount: 29,
      charCount: 268,
      tags: ["rust","hashmap","entry"],
      codeLanguage: 'rust',
    },
    {
      id: 'code-go-07',
      content: `func process(jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	for job := range jobs {
		results <- job * job
	}
}

func run(nums []int) []int {
	jobs := make(chan int, len(nums))
	results := make(chan int, len(nums))
	var wg sync.WaitGroup
	for w := 0; w < 4; w++ {
		wg.Add(1)
		go process(jobs, results, &wg)
	}
	for _, n := range nums {
		jobs <- n
	}
	close(jobs)
	wg.Wait()
	close(results)
	out := make([]int, 0, len(nums))
	for r := range results {
		out = append(out, r)
	}
	return out
}`,
      source: 'Go, worker pool with channels',
      language: 'en',
      difficulty: 3,
      wordCount: 91,
      charCount: 522,
      tags: ["go","goroutines","channels"],
      codeLanguage: 'go',
    },
    {
      id: 'code-go-08',
      content: `func reverse[T any](s []T) {
	for i, j := 0, len(s)-1; i < j; i, j = i+1, j-1 {
		s[i], s[j] = s[j], s[i]
	}
}`,
      source: 'Go, reverse a slice in place',
      language: 'en',
      difficulty: 2,
      wordCount: 27,
      charCount: 110,
      tags: ["go","generics","slice"],
      codeLanguage: 'go',
    },
    {
      id: 'code-go-09',
      content: `func fetchWithTimeout(url string, d time.Duration) (*http.Response, error) {
	ctx, cancel := context.WithTimeout(context.Background(), d)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	return http.DefaultClient.Do(req)
}`,
      source: 'Go, context with timeout',
      language: 'en',
      difficulty: 4,
      wordCount: 34,
      charCount: 299,
      tags: ["go","context","http"],
      codeLanguage: 'go',
    },
    {
      id: 'code-sql-04',
      content: `SELECT
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total
FROM orders
WHERE customer_id = 42
ORDER BY order_date;`,
      source: 'SQL, running total with window function',
      language: 'en',
      difficulty: 4,
      wordCount: 28,
      charCount: 205,
      tags: ["sql","window-function","running-total"],
      codeLanguage: 'sql',
    },
    {
      id: 'code-sql-05',
      content: `SELECT category, name, price
FROM (
  SELECT
    category,
    name,
    price,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn
  FROM products
) ranked
WHERE rn <= 3
ORDER BY category, price DESC;`,
      source: 'SQL, top N per group',
      language: 'en',
      difficulty: 3,
      wordCount: 34,
      charCount: 221,
      tags: ["sql","row-number","partition"],
      codeLanguage: 'sql',
    },
    {
      id: 'code-js-03',
      content: `function deepFreeze(obj) {
  for (const key of Object.getOwnPropertyNames(obj)) {
    const value = obj[key];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return Object.freeze(obj);
}`,
      source: 'JavaScript, deep-freeze an object',
      language: 'en',
      difficulty: 3,
      wordCount: 29,
      charCount: 248,
      tags: ["javascript","immutability","recursion"],
      codeLanguage: 'javascript',
    },
    {
      id: 'code-js-04',
      content: `const chunk = (array, size) =>
  Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size),
  );

const pages = chunk([1, 2, 3, 4, 5, 6, 7], 3);`,
      source: 'JavaScript, chunk an array',
      language: 'en',
      difficulty: 2,
      wordCount: 35,
      charCount: 194,
      tags: ["javascript","array","chunk"],
      codeLanguage: 'javascript',
    },
    {
      id: 'code-ts-fr-10',
      content: `// Regroupe des résultats par clé calculée, sans perdre l'ordre d'insertion.
function indexer<T>(elements: readonly T[], cle: (e: T) => string): Map<string, T[]> {
  const index = new Map<string, T[]>();
  for (const element of elements) {
    const k = cle(element);
    const seau = index.get(k);
    if (seau) {
      seau.push(element);
    } else {
      index.set(k, [element]);
    }
  }
  return index;
}`,
      source: 'TypeScript, exemple original',
      language: 'fr',
      difficulty: 3,
      wordCount: 57,
      charCount: 412,
      tags: ["typescript","map","index"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-py-fr-08',
      content: `def moyenne_glissante(valeurs: list[float], fenetre: int) -> list[float]:
    """Retourne la moyenne mobile sur une fenetre donnee."""
    if fenetre <= 0:
        raise ValueError("la fenetre doit etre positive")
    sortie: list[float] = []
    cumul = 0.0
    for i, valeur in enumerate(valeurs):
        cumul += valeur
        if i >= fenetre:
            cumul -= valeurs[i - fenetre]
        if i >= fenetre - 1:
            sortie.append(cumul / fenetre)
    return sortie`,
      source: 'Python, exemple original',
      language: 'fr',
      difficulty: 3,
      wordCount: 60,
      charCount: 480,
      tags: ["python","moyenne-mobile","fenetre"],
      codeLanguage: 'python',
    },
    {
      id: 'code-rs-fr-05',
      content: `/// Decoupe une tranche en morceaux de taille fixe, le dernier pouvant etre plus court.
fn morceaux<T>(donnees: &[T], taille: usize) -> impl Iterator<Item = &[T]> {
    assert!(taille > 0, "la taille doit etre non nulle");
    donnees.chunks(taille)
}

fn main() {
    let valeurs = [1, 2, 3, 4, 5, 6, 7];
    for bloc in morceaux(&valeurs, 3) {
        println!("{:?}", bloc);
    }
}`,
      source: 'Rust, exemple original',
      language: 'fr',
      difficulty: 4,
      wordCount: 60,
      charCount: 385,
      tags: ["rust","chunks","iterator"],
      codeLanguage: 'rust',
    },
    {
      id: 'code-go-fr-05',
      content: `// filtrer garde les elements pour lesquels garder renvoie vrai.
func filtrer[T any](valeurs []T, garder func(T) bool) []T {
	sortie := make([]T, 0, len(valeurs))
	for _, v := range valeurs {
		if garder(v) {
			sortie = append(sortie, v)
		}
	}
	return sortie
}`,
      source: 'Go, exemple original',
      language: 'fr',
      difficulty: 3,
      wordCount: 43,
      charCount: 262,
      tags: ["go","generics","filtre"],
      codeLanguage: 'go',
    },
    {
      id: 'code-ts-25',
      content: `class MinHeap<T> {
  private data: T[] = [];

  constructor(private readonly less: (a: T, b: T) => boolean) {}

  get size(): number {
    return this.data.length;
  }

  push(value: T): void {
    this.data.push(value);
    let i = this.data.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.less(this.data[i]!, this.data[parent]!)) break;
      [this.data[i], this.data[parent]] = [this.data[parent]!, this.data[i]!];
      i = parent;
    }
  }

  pop(): T | undefined {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0 && last !== undefined) {
      this.data[0] = last;
      let i = 0;
      const n = this.data.length;
      while (true) {
        const left = 2 * i + 1;
        const right = left + 1;
        let smallest = i;
        if (left < n && this.less(this.data[left]!, this.data[smallest]!)) smallest = left;
        if (right < n && this.less(this.data[right]!, this.data[smallest]!)) smallest = right;
        if (smallest === i) break;
        [this.data[i], this.data[smallest]] = [this.data[smallest]!, this.data[i]!];
        i = smallest;
      }
    }
    return top;
  }
}`,
      source: 'TypeScript, binary min-heap',
      language: 'en',
      difficulty: 5,
      wordCount: 156,
      charCount: 1178,
      tags: ["typescript","heap","priority-queue"],
      codeLanguage: 'typescript',
    },
    {
      id: 'code-py-16',
      content: `class Node:
    def __init__(self, key: int) -> None:
        self.key = key
        self.left: "Node | None" = None
        self.right: "Node | None" = None


class BST:
    def __init__(self) -> None:
        self.root: Node | None = None

    def insert(self, key: int) -> None:
        if self.root is None:
            self.root = Node(key)
            return
        node = self.root
        while True:
            if key < node.key:
                if node.left is None:
                    node.left = Node(key)
                    return
                node = node.left
            else:
                if node.right is None:
                    node.right = Node(key)
                    return
                node = node.right

    def in_order(self) -> list[int]:
        out: list[int] = []
        stack: list[Node] = []
        node = self.root
        while stack or node:
            while node:
                stack.append(node)
                node = node.left
            node = stack.pop()
            out.append(node.key)
            node = node.right
        return out`,
      source: 'Python, binary search tree with in-order walk',
      language: 'en',
      difficulty: 5,
      wordCount: 115,
      charCount: 1097,
      tags: ["python","bst","traversal"],
      codeLanguage: 'python',
    },
    {
      id: 'code-rs-11',
      content: `fn evaluate(expression: &str) -> Result<f64, String> {
    let mut stack: Vec<f64> = Vec::new();
    for token in expression.split_whitespace() {
        match token {
            "+" | "-" | "*" | "/" => {
                let b = stack.pop().ok_or("stack underflow")?;
                let a = stack.pop().ok_or("stack underflow")?;
                let result = match token {
                    "+" => a + b,
                    "-" => a - b,
                    "*" => a * b,
                    _ => {
                        if b == 0.0 {
                            return Err("division by zero".to_string());
                        }
                        a / b
                    }
                };
                stack.push(result);
            }
            number => {
                let value = number.parse::<f64>().map_err(|_| "invalid token")?;
                stack.push(value);
            }
        }
    }
    stack.pop().ok_or_else(|| "empty expression".to_string())
}`,
      source: 'Rust, generic stack-based calculator',
      language: 'en',
      difficulty: 5,
      wordCount: 98,
      charCount: 995,
      tags: ["rust","rpn","calculator"],
      codeLanguage: 'rust',
    },
    {
      id: 'code-go-10',
      content: `type entry struct {
	value   string
	expires time.Time
}

type Store struct {
	mu    sync.RWMutex
	items map[string]entry
}

func NewStore() *Store {
	return &Store{items: make(map[string]entry)}
}

func (s *Store) Set(key, value string, ttl time.Duration) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.items[key] = entry{value: value, expires: time.Now().Add(ttl)}
}

func (s *Store) Get(key string) (string, bool) {
	s.mu.RLock()
	e, ok := s.items[key]
	s.mu.RUnlock()
	if !ok || time.Now().After(e.expires) {
		return "", false
	}
	return e.value, true
}`,
      source: 'Go, in-memory key-value store with TTL',
      language: 'en',
      difficulty: 5,
      wordCount: 72,
      charCount: 550,
      tags: ["go","key-value","ttl"],
      codeLanguage: 'go',
    },
    {
      id: 'code-sql-06',
      content: `SELECT date_trunc('month', event_at) AS month, COUNT(DISTINCT user_id) AS active_users FROM events GROUP BY 1 ORDER BY 1;`,
      source: 'SQL, monthly active users',
      language: 'en',
      difficulty: 2,
      wordCount: 17,
      charCount: 121,
      tags: ["sql","aggregate","metrics"],
      codeLanguage: 'sql',
    },
    {
      id: 'code-js-05',
      content: `const uniqueBy = (items, key) => [...new Map(items.map((item) => [key(item), item])).values()];`,
      source: 'JavaScript, unique by key',
      language: 'en',
      difficulty: 2,
      wordCount: 11,
      charCount: 95,
      tags: ["javascript","array","dedupe"],
      codeLanguage: 'javascript',
    },
    {
      id: 'code-py-fr-09',
      content: `def est_palindrome(texte: str) -> bool:
    filtre = [c.lower() for c in texte if c.isalnum()]
    return filtre == filtre[::-1]`,
      source: 'Python, exemple original',
      language: 'fr',
      difficulty: 2,
      wordCount: 18,
      charCount: 128,
      tags: ["python","palindrome","chaine"],
      codeLanguage: 'python',
    },
    {
      id: 'code-ts-fr-11',
      content: `// Renvoie une nouvelle fonction qui ne s'execute qu'une seule fois.
function une_fois<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R | undefined {
  let appele = false;
  let resultat: R | undefined;
  return (...args: A) => {
    if (!appele) {
      appele = true;
      resultat = fn(...args);
    }
    return resultat;
  };
}`,
      source: 'TypeScript, exemple original',
      language: 'fr',
      difficulty: 3,
      wordCount: 55,
      charCount: 350,
      tags: ["typescript","once","closure"],
      codeLanguage: 'typescript',
    },
  ],
};
