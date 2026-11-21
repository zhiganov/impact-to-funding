#!/usr/bin/env node
import { checkBackLink, checkBackStatus, formatCheckBack, setCheckBack } from './lib/check-back.mjs';

// Local-only and optional. With no argument it reports whether to offer or ask
// the three-month check-back. It never contacts a network service, and a failure
// produces no output so it never blocks the conversation.
const [action] = process.argv.slice(2);

async function readStdin(limit = 16 * 1024) {
  let text = '';
  for await (const part of process.stdin) {
    text += part;
    if (text.length > limit) throw new Error('Answers are too long');
  }
  return text;
}

try {
  if (!action) {
    const output = formatCheckBack(checkBackStatus());
    if (output) console.log(output);
  } else if (action === 'link') {
    const text = await readStdin();
    console.log(`CHECK_BACK_LINK: ${checkBackLink(text.trim() ? JSON.parse(text) : {})}`);
  } else {
    console.log(setCheckBack(action));
  }
} catch (error) {
  if (action) {
    console.error(`CHECK_BACK_ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}
