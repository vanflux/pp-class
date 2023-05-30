export function escape(input: string) {
  return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
