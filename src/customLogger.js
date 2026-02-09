// worker.js の一番最初
const noop = () => {}

const customLogger = {
  debug: console.debug,
  log:  console.log,
  warn:  console.warn,
  error: console.error,
}

export {customLogger};
