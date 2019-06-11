// Cancel represents the ability to cancel a computation
export type Cancel = () => void

// A Cancel that can't be canceled
// Useful for synchronous computations
export const uncancelable = (_: unknown): Cancel =>
  () => {}

// Env represents a computation that must execute in an
// environment which provides a set of resources `R`
export type Env<R, A> = (r: R, k: (a: A) => void) => Cancel

// An empty set of resources
export type None = { [k: string]: never }

// Any set of resources
export type Any = {}

// A set of resources formed by subtracting the set T1 from T
export type Subtract<T, T1 extends T> = Omit<T, keyof T1>

// Satisfy some or all of e's requirements.  If RA is a subset
// of RB, then the resulting Env will be "pure".  It's
// requirements will have been fully satisfied, and it can be
// executed with runPure.
export const use = <RA, RB extends RA, A>(rb: RB, e: Env<RA, A>): Env<Subtract<RA, RB>, A> =>
  (ra, k) => e({ ...rb, ...ra } as RA & RB, k)

// Execute a computation whose requirements have been fully satisfied.
export const runPure = <A>(e: Env<None, A>, k: (a: A) => void = () => {}): Cancel =>
  e({}, k)

// A pure value computation has no specific requirements, and
// thus can "execute" in any environment.
export const pure = <A>(a: A): Env<Any, A> =>
  (_, k) => uncancelable(k(a))

// Transform a computation's result without changing its
// requirements.
export const map = <R, A, B>(e: Env<R, A>, f: (a: A) => B): Env<R, B> =>
  (r, k) => e(r, a => k(f(a)))

// Chain two computations.  The resulting (composite) computation's
// requirements are the union set of the requirements of the two
// chained computations' requirements.
export const chain = <RA, RB, A, B>(e: Env<RA, A>, f: (a: A) => Env<RB, B>): Env<RA & RB, B> =>
  (rab, k) => {
    let cancel = e(rab, a => {
      cancel = f(a)(rab, k)
    })
    return () => cancel()
  }

// Compute a value directly from a set of requirements.
export const withEnv = <R, A>(f: (r: R) => A): Env<R, A> =>
  (r, k) => uncancelable(k(f(r)))

// Embed computation with requirements RB into an environment
// with requirements RA.
export const embed = <RA, RB, A> (f: (r: RA) => RB, e: Env<RB, A>): Env<RA, A> =>
  (ra, k) => e(f(ra), k)
