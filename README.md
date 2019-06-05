# Ambient

Simple, strongly-typed, testable, effectful computations.

## What is this?

**tl;dr** Reader, plus type intersection and subtraction to manipulate the Reader's environment.

_coming soon_

_TODO: Add example_

## Why?

* **Communication**: see what resources a computation will use just by looking at its type: database, remote service API, logger, etc.
* **Safety**: only computations whose resource requirements have been fully satisfied can be executed.
* **Testability**: easily test computations by providing test resources without "magic mocking", overwriting globals, or other error-prone approaches.

## How does it work?

Let's start with the types and some basic intuitions about the pieces:

```typescript
type Env<R, A> = ...

function chain <RA, RB, A, B> (f: (a: A) => Env<RB, B>, e: Env<RA, A>): Env<RA & RB, B>

type Subtract<T, T1> = Omit<T, keyof T1>

function use <RA, RB, A>(rb: RB, e: Env<RA, A>): Env<Subtract<RA, RB>, A>

type None = ...

function runPure <A> (e: Env<None, A>, k: (a: A) => void = () => {}): Cancel
```

- `Env` represents computations that must execute in an _environment_ which provides a set of resources `R`.
- `chain` _aggregates_ resource requirements by combining two `Env` computations to produce a third `Env` computation.
- `use` _eliminates_ resources requirements on the environment by providing some or all of the resources.
- `runPure` executes a computation whose resource requirements have been _fully satisfied_.

**Note the intersection `RA & RB` in `chain` and the `Subtract` in `use`**.  They are a key part of what makes `Env` useful.

### Environment

An environment is a set of resources.  The resources can be anything: app configuration, a logger, a database API, a remote service API.

_TODO: Add example_

### Env at a glance

We'll go into more depth on the `Env` type later.  For now, let's keep it simple: `Env` represents a computation that will produce an `A` only if executed in an environment that provides a set of resources, `R`.

_For the next few sections_, think of `Env` as being like a function:

```typescript
type Env<R, A> = (r: R) => A
```

### Executing a computation

If `Env` is like a function, clearly we need to provide an `R` to execute it.  At first glance, then, `runPure`'s type may seem confusing.

```typescript
function runPure <A> (e: Env<None, A>, ...): ...
```

It can only execute computations that require no resources. We need a way to reduce the requirements of an `Env` to the empty set so that we can execute it with `runPure`.

### Satisfying requirements

Let's look at the type of `use`:

```typescript
type Subtract<T, T1> = Omit<T, keyof T1>

function use <RA, RB, A>(rb: RB, e: Env<RA, A>): Env<Subtract<RA, RB>, A>
```

Notice how the _input_, `e`, requires `RA`, and the _output_ `Env` requires `Subtract<RA, RB>`.  By providing an `RB`, `use` satisfies some or all of `e`'s requirements.  To put it another way, by providing `RB`, `use` _subtracts_ `RB` from `e`'s requirements.

When `RB` contains a subset of the resources required by `e`, `use` returns an `Env` with a smaller set of requirements.

Crucially, when `RB` contains _all_ the resources of `RA` (e.g., `RB` is the same as `RA`), `use` returns an `Env` whose requirements have been fully satisfied, and can be executed with `runPure`.

### Building computations

What if we have two computations:

```typescript
// User data access capability
type UserService = {
  lookupUserByUsername: (username: string) => Promise<User>
}
// Getting a User requires UserService
function getUserByUsername(username: string): Env<UserService, User> {
  // ...
}

// Email sending capability
type EmailService = {
  sendMessage: (message: EmailMessage) => Promise<EmailSendStatus>
}
// Sending email requires EmailService
function sendEmail(to: Email, subject: string, body: string): Env<EmailService, EmailSendStatus> {
  // ...
}
```

It may seem that we need to call each, then call `use` twice to satisfy the requirements of each, and then call `runPure` on each.  Instead, we can use `chain`:

```typescript
function chain <RA, RB, A, B> (f: (a: A) => Env<RB, B>, e: Env<RA, A>): Env<RA & RB, B>
```

`chain` allows us to write a new computation that gets a User by username and then sends them an email. Note the intersection `RA & RB` in the _output_ `Env`.

In contrast to `use`, which uses subtraction to _eliminate_ requirements, `chain` uses an intersection to _aggregate_ requirements.

```typescript
function sendWelcomeEmailToUsername (username: string): Env<UserService & EmailService, EmailSendStatus> {
  return chain(
    getUserByName(username),
    user => sendEmail(user.email, 'Welcome!', `Hi ${user.displayName}, welcome to the world of composable computations!`
  )
}
```

`sendWelcomeEmailToUsername` returns a computation that requires _both_ the `UserService` and `EmailService`.  To execute it, we need to provide the resources of both `getUserByUsername` and `sendEmail`.  And now we have a choice: we provide both in a single `use`, _or_ we can provide them separately in two `use` calls, whichever fits out needs best.  In either case, we can execute the final computation with a single call to `runPure`.

Note that the explicit type annotations are not necessary and are included here for clarity/documentation. Typescript will infer them correctly.

```typescript
const userService: UserService = //...
const emailService: EmailService = //...

// Create a computation that will lookup user 'brian' and send a welcome email
const computation: Env<UserService & EmailService, EmailSendStatus> = sendWelcomeEmailToUsername('brian')

// Provide all the required resources
const pureComputation: Env<{}, EmailSendStatus> = use({ ...userService, ...emailService }, computation)

// Go! Lookup user 'brian' and send a welcome email
runPure(pureComputation)
```

### Env in depth

There's a lot going on in the `Env` type, so let's step through it from left to right.

```typescript
type Env<R, A> ...
```

`Env` represents a computation that will produce an `A` only if executed in an environment that satisfies its set of requirements, `R`.  What does it mean to "satisfy a set of requirements"?

```typescript
type Env<R, A> = (r: R, ...) => ...
```

`Env` is a function type.  It must be called with an `R` in order to produce an `A`.  Thus, you "satisfy" its set of requirements `R` by calling it with an `R`.  If you're familiar with the Reader type (such as [Haskell's Reader](http://hackage.haskell.org/package/mtl-2.2.2/docs/Control-Monad-Reader.html)), you may recognize this as being similar to the [ReaderT pattern](https://www.fpcomplete.com/blog/2017/06/readert-design-pattern).

Where does the `A` go?

```typescript
type Env<R, A> = (r: R, k: (a: A) => void) => ...
```

The `k` parameter is a _continuation_.  By using a continuation instead of returning an `A`, `Env` supports both synchronous and asynchronous computations.  Finally, let's look at the last piece, the return type.

```typescript
type Env<R, A> = (r: R, k: (a: A) => void) => Cancel
```

`Env` returns a `Cancel`, which allows the caller to abort an in-flight asynchronous computation.
