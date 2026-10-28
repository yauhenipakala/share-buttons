// Checked by `npm run typecheck` only: every {n} placeholder must get exactly one argument
import { popup } from '../src/handlers';

popup('https://a.example/?u={0}&t={1}', (c) => [c.url, c.title]);
popup('https://a.example/?t={0}&u={1}&s={0}', (c) => [c.title, c.url]);

// @ts-expect-error missing argument for {1}
popup('https://a.example/?u={0}&t={1}', (c) => [c.url]);

// @ts-expect-error extra argument
popup('https://a.example/?u={0}', (c) => [c.url, c.title]);
