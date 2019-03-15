import { Cancel, chain, Env, map, runPure, uncancelable, use } from '../src'
import { EOL } from 'os'
import { createInterface } from 'readline'

export const forever = <R, A>(fx: Env<R, A>): Env<R, never> =>
  chain(() => forever(fx), fx)

// Print effect and constructor
type Print = {
  print(s: string, k: (r: void) => void): Cancel
}

const print = (s: string): Env<Print, void> =>
  ({ print }, k) => print(s, k)

// Read effect and constructor
type Read = {
  read(k: (r: string) => void): Cancel
}

const read: Env<Read, string> =
  ({ read }, k) => read(k)

// Helper to append newlines
const addEol = (s: string): string => `${s}${EOL}`

// Effectful computation that prints a prompt, reads
// user input and prints it.
const echo: Env<Print & Read, void> =
  chain(() => chain(print, map(addEol, read)), print('> '))

// To run echo, we need to provide usingrs for the
// Read and Print effect

// We'll use node's readline to implement a Read usingr
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

// Implement the Print and Read effect usingrs
const env: Print & Read = {
  print: (s, k): Cancel =>
    uncancelable(k(void process.stdout.write(s))),
  read: k => {
    rl.once('line', k)
    return () => rl.removeListener('line', k)
  }
}

// Loop echo forever using the effect usingrs
runPure(use(env, forever(echo)))