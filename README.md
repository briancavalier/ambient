# Ambient

Simple, strongly-typed, testable, effectful computation.

## How does it work?

The important pieces are:

```typescript
type Fx<R, A> = ...

function chain <RA, RB, A, B> (f: (a: A) => Fx<RB, B>, e: Fx<RA, A>): Fx<RA & RB, B>

function use <RA, RB, A> (rb: RB, e: Fx<RA & RB, A>): Fx<RA, A>

function runPure <A> (e: Fx<{}, A>, k: (a: A) => void = () => {}): Cancel
```

- `Fx` represents computations that must execute in an _environment_ which satisfies a set of requirements `R`.
- `chain` _introduces_ requirements on the environment by combining two `Fx` computations to produce a third `Fx` computation.
- `use` _eliminates_ requirements on the environment by satisfying some or all of them.
- `runPure` executes a computation whose requirements have been _fully satisfied_.

**Note the intersections `RA & RB` in `chain` and `use`**.  They are a key part of what makes `Fx` powerful.

### Fx at a glance

```typescript
type Fx<R, A> = ...
```

We'll go into more depth on the `Fx` type later.  For now, let's keep it simple: `Fx` represents a computation that will produce an `A` only if executed in an environment that satisfies its set of requirements, `R`

### Computation in an environment

_coming soon_

#### Executing a computation

_coming soon_

#### Adding new requirements

_coming soon_

#### Satisfying requirements

_coming soon_

### Fx in depth

There's a lot going on in the `Fx` type, so let's break it down.

```typescript
type Fx<R, A> ...
```

`Fx` represents a computation that will produce an `A` only if executed in an environment that satisfies its set of requirements, `R`.  What does it mean to "satisfy a set of requirements"?

```typescript
type Fx<R, A> = (r: R, ...) => ...
```

`Fx` is a function type.  It must be called with an `R` in order to produce an `A`.  Thus, you "satisfy" its set of requirements `R` by calling it with an `R`.  If you're familiar with the Reader type (such as [Haskell's Reader](http://hackage.haskell.org/package/mtl-2.2.2/docs/Control-Monad-Reader.html)), you may recognize this as being similar to the [ReaderT pattern](https://www.fpcomplete.com/blog/2017/06/readert-design-pattern).

Where does the `A` go?

```typescript
type Fx<R, A> = (r: R, k: (a: A) => void) => ...
```

The `k` parameter is a _continuation_.  By using a continuation instead of returning an `A`, `Fx` supports both synchronous and asynchronous computations.  Finally, let's look at the last piece, the return type.

```typescript
type Fx<R, A> = (r: R, k: (a: A) => void) => Cancel
```

`Fx` returns a `Cancel`, which allows the caller to abort an in-flight asynchronous computation.
