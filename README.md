# Ambient

Simple, strongly-typed, testable, effectful computation.

## How does it work?

The two most important pieces are:

```typescript
type Fx<R, A> = (r: R, k: (a: A) => void) => Cancel

function chain <RA, RB, A, B> (f: (a: A) => Fx<RA, B>, e: Fx<RB, A>): Fx<RA & RB, B>
```

- `Fx` represents computations that must be performed in an environment.
- `chain` sequences two `Fx` computations, producing a third `Fx` computation.

**Note the intersection `RA & RB` in the `chain` return type**.  It's a key part of what makes `Fx` powerful.

### Fx

Let's start with the `Fx` type. There's a lot going on, so let's break it down.

```typescript
type Fx<R, A> ...
```

`Fx` represents a computation that will produce an `A` only if you satisfy its set of requirements, `R`.  What does it mean to "satisfy a set of requirements"?

```typescript
type Fx<R, A> = (r: R, ...) => ...
```

`Fx` is a function type.  It must be called with an `R` in order to produce an `A`.  Thus, you "satisfy" its set of requirements `R` by calling it with an `R`.  Where does the `A` go?

```typescript
type Fx<R, A> = (r: R, k: (a: A) => void) => ...
```

The `k` parameter is a _continuation_.  By using a continuation instead of returning an `A`, `Fx` supports both synchronous and asynchronous computations.  Finally, let's look at the last piece, the return type.

```typescript
type Fx<R, A> = (r: R, k: (a: A) => void) => Cancel
```

`Fx` returns a `Cancel`, which allows the caller to abort an in-flight asynchronous computation.

... more coming soon ...