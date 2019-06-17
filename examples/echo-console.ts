import { EOL } from 'os'
import { createInterface } from 'readline'

import { Cancel, chain, Env, map, runPure, use, withEnv } from '../src'

// Print capability
type Print = {
  print(s: string): void
}

const print = (s: string): Env<Print, void> =>
  withEnv(r => r.print(s))

// Read capability
type Read = {
  read(k: (r: string) => void): Cancel
}

const read: Env<Read, string> =
  (r, k) => r.read(k)

// Helper to append newlines
const addEol = (s: string): string => s + EOL

// Effectful computation that prints a prompt, reads
// user input and prints it.
const echo: Env<Print & Read, void> = chain(
  print('> '),
  _ => chain(
    map(read, addEol),
    print
  ))

// To run echo, we need to provide implementations of
// Print and Read

// We'll use node's readline to implement Read
const readline = createInterface({
  input: process.stdin
})

// Concrete Print and Read implementations
const capabilities: Print & Read = {
  print: s => void process.stdout.write(s),
  read: k => {
    readline.once('line', k)
    return k => {
      readline.removeListener('line', k)
      readline.close()
      k()
    }
  }
}

// Simple helper to repeat a computation forever.
export const forever = <R, A>(e: Env<R, A>): Env<R, never> =>
  chain(e, _ => forever(e))

// Loop echo forever using the Print and Read capabilities
const x = use(capabilities, forever(echo))
runPure(x)
