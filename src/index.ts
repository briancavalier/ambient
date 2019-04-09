export type Cancel = () => void

export const uncancelable = <A> (_: A): Cancel =>
  () => {}

export type Env<R, A> = (r: R, k: (a: A) => void) => Cancel

type Subtract<T, T1 extends T> = Pick<T, Exclude<keyof T, keyof T1>>

export const use = <RA, RB extends RA, A>(rb: RB, e: Env<RA, A>): Env<Subtract<RA, RB>, A> =>
  (ra, k) => e({ ...rb, ...ra } as RA & RB, k)

export const runPure = <A>(e: Env<{}, A>, k: (a: A) => void = () => {}): Cancel =>
  e({}, k)

export const pure = <A>(a: A): Env<{}, A> =>
  (_, k) => uncancelable(k(a))

export const map = <R, A, B>(e: Env<R, A>, f: (a: A) => B): Env<R, B> =>
  (r, k) => e(r, a => k(f(a)))

export const chain = <RA, RB, A, B>(e: Env<RA, A>, f: (a: A) => Env<RB, B>): Env<RA & RB, B> =>
  (rab, k) => {
    let cancel = e(rab, a => {
      cancel = f(a)(rab, k)
    })
    return () => cancel()
  }

export const withEnv = <R, A>(f: (r: R) => A): Env<R, A> =>
  (r, k) => uncancelable(k(f(r)))

export const forever = <R, A>(e: Env<R, A>): Env<R, never> =>
  chain(e, _ => forever(e))
