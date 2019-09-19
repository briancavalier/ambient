import { Env, Cancel } from './env'

type U2I<U> = 
  (U extends any ? (k: U)=>void : never) extends ((k: infer I)=>void) ? I : never

type ReqsOf<E> = U2I<ReqOf<E>>
type ReqOf<E> = E extends Env<infer R, any> ? R : never

type ResOf<E> = E extends Env<any, infer A> ? A : never

export const doEnv = <Args extends any[], Y extends Env<any, any>, R, A>(f: (...args: Args) => Generator<Y, Env<R, A>, ResOf<Y>>): (...a: Args) => Env<ReqsOf<Y> & R, A> =>
    (...a) => (r, k) => start(f(...a), r, k)

const start = <Y extends Env<any, any>, R, A> (g: Generator<Y, Env<R, A>, ResOf<Y>>, r: ReqsOf<Y> & R, k: (a: A) => Cancel): Cancel => {
    const gr = g.next();
    if (gr.done) {
        return gr.value(r, k)
    }

    return gr.value(r, n => next(g, n, r, k))
}

const next = <Y extends Env<any, any>, R, A> (g: Generator<Y, Env<R, A>, ResOf<Y>>, n: ResOf<Y>, r: ReqsOf<Y> & R, k: (a: A) => Cancel): Cancel => {
    const gr = g.next(n);
    if (gr.done) {
        return gr.value(r, k)
    }

    return gr.value(r, n => next(g, n, r, k))
}