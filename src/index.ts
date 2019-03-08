export type Cancel = () => void

export const uncancelable = <A> (_: A): Cancel =>
  () => {}

export type Fx<R, A> = (r: R, k: (a: A) => void) => Cancel

export const use = <R0, R1, A> (r0: R0, e: Fx<R0 & R1, A>): Fx<R1, A> =>
  (r1, k) => e({ ...r1, ...r0 } as R0 & R1, k)

export const runPure = <A>(e: Fx<{}, A>, k: (a: A) => void = () => {}): Cancel =>
  e({}, k)

export const pure = <A>(a: A): Fx<{}, A> =>
  (_, k) => uncancelable(k(a))

export const map = <R, A, B> (f: (a: A) => B, e: Fx<R, A>): Fx<R, B> =>
  (r, k) => e(r, a => k(f(a)))

export const chain = <RA, RB, A, B>(f: (a: A) => Fx<RA, B>, e: Fx<RB, A>): Fx<RA & RB, B> =>
  (rab, k) => {
    let cancel = e(rab, a => {
      cancel = f(a)(rab, k)
    })
    return () => cancel()
  }
