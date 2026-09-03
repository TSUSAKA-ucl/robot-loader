// worker.js の一番最初
const noop = () => {}

const customLogger = {
  none: noop,
  debug: noop,
  info: console.log,
  log:  console.log,
  warn:  console.warn,
  error: console.error,
}

export {customLogger};
export default customLogger;
