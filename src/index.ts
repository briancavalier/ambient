export type Cancel = () => void

export const uncancelable = <A> (_: A): Cancel =>
  () => {}

export type Env<R, A> = (r: R, k: (a: A) => void) => Cancel

export const use = <RA, RB, A>(rb: RB, e: Env<RA & RB, A>): Env<RA, A> =>
  (ra, k) => e({ ...rb, ...ra } as RA & RB, k)

export const runPure = <A>(e: Env<{}, A>, k: (a: A) => void = () => {}): Cancel =>
  e({}, k)

export const pure = <A>(a: A): Env<{}, A> =>
  (_, k) => uncancelable(k(a))

export const map = <R, A, B> (f: (a: A) => B, e: Env<R, A>): Env<R, B> =>
  (r, k) => e(r, a => k(f(a)))

export const chain = <RA, RB, A, B>(f: (a: A) => Env<RB, B>, e: Env<RA, A>): Env<RA & RB, B> =>
  (rab, k) => {
    let cancel = e(rab, a => {
      cancel = f(a)(rab, k)
    })
    return () => cancel()
  }
