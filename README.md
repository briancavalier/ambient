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

An environment is a set of resources.  The resources can be anything: app configuration, a logger, a database API, a remote service API.

_TODO: Add example_

### Fx at a glance

We'll go into more depth on the `Fx` type later.  For now, let's keep it simple: `Fx` represents a computation that will produce an `A` only if executed in an environment that provides a set of resources, `R`.

_For the next few sections_, think of `Fx` as being like a function:

```typescript
type Fx<R, A> = (r: R) => A
```

### Executing a computation

If `Fx` is like a function, clearly we need to provide an `R` to execute it.  At first glance, then, `runPure`'s type may seem confusing.

```typescript
function runPure <A> (fx: Fx<{}, A>, ...): ...
```

It can only execute computations that require no resources. We need a way to reduce the requirements of an `Fx` to the empty set so that we can execute it with `runPure`.

### Satisfying requirements

Let's look at the type of `use`:

```typescript
function use <RA, RB, A> (rb: RB, fx: Fx<RA & RB, A>): Fx<RA, A>
```

Notice how the _input_, `fx`, requires `RA & RB`, and the _output_ `Fx` requires only `RA`.  By providing an `RB`, `use` satisfies some or all of `fx`'s requirements.  To put it another way, by providing `RB`, `use` subtracts `RB` from `fx`'s requirements, leaving only `RA`.

When `RB` contains a subset of the resources required by `fx`, `use` returns an `Fx` with a smaller set of requirements.

Crucially, when `RB` contains _all_ the resources of `RA` (i.e. `RB` is the same as, or a width subtype of `RA`), `use` returns an `Fx` whose requirements have been fully satisfied, and can be executed with `runPure`.

### Building computations

What if we have two computations:

```typescript
// User data access capability
type UserService = {
  lookupUserByUsername: (username: string) => Promise<User>
}
// Getting a User requires UserService
function getUserByUsername(username: string): Fx<UserService, User> {
  // ...
}

// Email sending capability
type EmailService = {
  sendMessage: (message: EmailMessage) => Promise<EmailSendStatus>
}
// Sending email requires EmailService
function sendEmail(to: Email, subject: string, body: string): Fx<EmailService, EmailSendStatus> {
  // ...
}
```

It may seem that we need to call each, then call `use` twice to satisfy the requirements of each, and then call `runPure` on each.  Instead, we can use `chain`:

```typescript
function chain <RA, RB, A, B> (f: (a: A) => Fx<RB, B>, fx: Fx<RA, A>): Fx<RA & RB, B>
```

`chain` allows us to write a new computation that gets a User by username and then sends them an email. Note the intersection `RA & RB` in the _output_ `Fx`.

In contrast to `use`, which has an intersection in its _input_ `Fx` and _eliminates_ requirements, `chain` has an intersection in its _output_ and _aggregates_ requirements.

```typescript
function sendWelcomeEmailToUsername (username: string): Fx<UserService & EmailService, EmailSendStatus> {
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
const fx: Fx<UserService & EmailService, EmailSendStatus> = sendWelcomeEmailToUsername('brian')

// Provide all the required resources
const pureFx: Fx<{}, EmailSendStatus> = use({ ...userService, ...emailService }, fx)

// Go! Lookup user 'brian' and send a welcome email
runPure(pureFx)
```

### Fx in depth

There's a lot going on in the `Fx` type, so let's step through it from left to right.

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
