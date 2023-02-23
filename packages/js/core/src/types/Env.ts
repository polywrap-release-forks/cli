// $start: Env.ts

/** A map of string-indexed, Msgpack-serializable environmental variables associated with a wrapper */
export interface Envs {
  readonly [k: string]: WrapperEnv;
}

export interface WrapperEnv {
  readonly [k: string]: unknown;
}
// $end
