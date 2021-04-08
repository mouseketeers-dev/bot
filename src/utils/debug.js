import debug from 'debug';

const createDebug = (name) => {
  const d = debug("mkt:" + name);
  d.log = console.log.bind(console);
  return d;
};

export default createDebug;
