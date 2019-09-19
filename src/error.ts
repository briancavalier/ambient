import { Cancel, Env, Subtract, use } from './env';

export type Fail<E> = {
    catchError <A>(e: E, k: (a: A) => Cancel): Cancel
}

export const throwError = <E, A> (e: E): Env<Fail<E>, A> =>
    (r, k) => r.catchError(e, k)

export const catchError = <E, R extends Fail<E>, A> (f: (e: E) => A, e: Env<R, A>): Env<Subtract<R, Fail<E>>, A> =>
    use({ catchError: (e: E, k: (a: A) => Cancel): Cancel => k(f(e)) }, e)

export const attempt = <E, R extends Fail<E>, A> (e: Env<R, A>): Env<Subtract<R, Fail<E>>, E | A> =>
    use({ catchError: (e: E, k: (ea: E | A) => Cancel): Cancel => k(e) }, e)