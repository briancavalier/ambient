# Ambient

Simple, strongly-typed, testable, effectful computations.

## How does it work?

Let's start with the types and some basic intuitions about the pieces:

```typescript
type Fx<R, A> = ...

function chain <RA, RB, A, B> (f: (a: A) => Fx<RB, B>, fx: Fx<RA, A>): Fx<RA & RB, B>

function use <RA, RB, A> (rb: RB, fx: Fx<RA & RB, A>): Fx<RA, A>

function runPure <A> (fx: Fx<{}, A>, k: (a: A) => void = () => {}): Cancel
```

- `Fx` represents computations that must execute in an _environment_ which provides a set of resources `R`.
- `chain` _aggregates_ resource requirements by combining two `Fx` computations to produce a third `Fx` computation.
- `use` _eliminates_ resources requirements on the environment by providing some or all of the resources.
- `runPure` executes a computation whose resource requirements have been _fully satisfied_.

**Note the intersections `RA & RB` in `chain` and `use`**.  They are a key part of what makes `Fx` useful.

### Environment

An envrionment is an object containing a set of resources.  The resources can be anything: app configuration, a logger, a database API, a remote service API.

_TODO: Add example_

### Fx at a glance

We'll go into more depth on the `Fx` type later.  For now, let's keep it simple: `Fx` represents a computation that will produce an `A` only if executed in an environment that provides a set of resources, `R`.

_For the next few sections_, think of `Fx` as being like a function:

```typescript
type Fx<R, A> = (r: R) => A
```

### Executing a computation

If `Fx` is like a function, clearly we need to provide an `R` to execute it.  At first glance, then, `runPure` seems to have a confusing type:

```typescript
function runPure <A> (fx: Fx<{}, A>, ...): ...
```

`runPure` seems only to be able to run computations that require no resources.  Read on.

#### Satisfying requirements

_coming soon_

#### Aggregating requirements

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
