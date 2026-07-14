import { describe, expect, it } from 'vitest';
import { parseOsc52 } from './osc52';

/** Encode text the way a TUI agent does before emitting OSC 52. */
const enc = (text: string): string => Buffer.from(text, 'utf8').toString('base64');

describe('parseOsc52', () => {
  it('decodes a clipboard write (the Claude Code / Codex copy path)', () => {
    expect(parseOsc52(`c;${enc('npm run build')}`)).toEqual({
      kind: 'write',
      text: 'npm run build',
    });
  });

  it('preserves newlines so a copied block of commands pastes as separate lines', () => {
    expect(parseOsc52(`c;${enc('npm install\nnpm test\n')}`)).toEqual({
      kind: 'write',
      text: 'npm install\nnpm test\n',
    });
  });

  it('decodes as UTF-8, not latin1 — agent TUIs emit box drawing and emoji', () => {
    const text = '╭─ Claude ─╮\n│ ✅ done │\n╰──────────╯';
    expect(parseOsc52(`c;${enc(text)}`)).toEqual({ kind: 'write', text });
  });

  it('accepts an empty Pc target', () => {
    expect(parseOsc52(`;${enc('hello')}`)).toEqual({ kind: 'write', text: 'hello' });
  });

  it.each([
    ['one byte', 'a'],
    ['two bytes', 'ab'],
    ['three bytes', 'abc'],
  ])('round-trips a payload of %s across base64 padding boundaries', (_label, text) => {
    expect(parseOsc52(`c;${enc(text)}`)).toEqual({ kind: 'write', text });
  });

  it('treats an empty payload as a request to clear the clipboard', () => {
    expect(parseOsc52('c;')).toEqual({ kind: 'write', text: '' });
  });

  it('refuses a clipboard read so the PTY cannot exfiltrate the clipboard', () => {
    // "?" asks the terminal to send clipboard contents back to the program.
    // It must be swallowed (handled, no reply), never answered.
    expect(parseOsc52('c;?')).toEqual({ kind: 'ignore' });
  });

  it('ignores a payload that is not decodable base64', () => {
    expect(parseOsc52('c;not*valid*b64!')).toEqual({ kind: 'ignore' });
  });

  it('reports a payload with no Pc;Pd separator as unhandled', () => {
    expect(parseOsc52('garbage')).toEqual({ kind: 'unhandled' });
  });
});
