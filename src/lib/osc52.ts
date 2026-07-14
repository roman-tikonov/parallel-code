import { base64ToUint8Array } from './terminalConstants';

/**
 * Outcome of parsing an OSC 52 payload.
 *
 * `unhandled` means "not a well-formed OSC 52 payload" — the caller should
 * report it as unhandled so xterm can fall through to any other handler.
 * `ignore` means we understood it and are deliberately doing nothing (a
 * clipboard read request, or an undecodable payload); it still counts as
 * handled, so no reply is emitted.
 */
export type Osc52Request =
  | { kind: 'write'; text: string }
  | { kind: 'ignore' }
  | { kind: 'unhandled' };

/** Base64 alphabet with optional `=` padding — anything else is not decodable. */
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

/**
 * Parse an OSC 52 ("manipulate selection data") payload.
 *
 * The payload is `Pc;Pd`, where `Pc` names the target selection buffer and `Pd`
 * is the base64-encoded text. `Pd` may instead be `?`, which asks the terminal
 * to send the clipboard's current contents *back* to the program.
 *
 * We honour writes and refuse reads. Answering a read would let anything able
 * to write to the PTY — an agent, a stray `printf`, output from a fetched
 * file — exfiltrate whatever the user happens to have on their clipboard.
 *
 * `Pc` is not inspected: the app exposes exactly one clipboard, so every write
 * target maps onto it.
 *
 * Text is decoded as UTF-8 rather than via `atob()`, which would mangle the
 * non-ASCII glyphs (box drawing, emoji) that agent TUIs emit constantly.
 */
export function parseOsc52(data: string): Osc52Request {
  const sep = data.indexOf(';');
  if (sep === -1) return { kind: 'unhandled' };

  const payload = data.slice(sep + 1);
  if (payload === '?') return { kind: 'ignore' };
  if (!BASE64.test(payload)) return { kind: 'ignore' };

  // An empty payload is a valid request to clear the clipboard.
  return { kind: 'write', text: new TextDecoder().decode(base64ToUint8Array(payload)) };
}
