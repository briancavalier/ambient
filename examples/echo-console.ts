import { Cancel, chain, Env, forever, map, runPure, use, withEnv } from '../src'
import { EOL } from 'os'
import { createInterface } from 'readline'

// Print capability
type Print = {
  print (s: string): void
}

const print = (s: string): Env<Print, void> =>
  withEnv(({ print }) => print(s))

// Read capability
type Read = {
  read (k: (r: string) => void): Cancel
}

const read: Env<Read, string> =
  ({ read }, k) => read(k)

// Helper to append newlines
const addEol = (s: string): string => s + EOL

// Effectful computation that prints a prompt, reads
// user input and prints it.
const echo: Env<Print & Read, void> =
  chain(() => chain(print, map(addEol, read)), print('> '))

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
    return () => readline.removeListener('line', k)
  }
}

// Loop echo forever using the Print and Read capabilities
runPure(use(capabilities, forever(echo)))