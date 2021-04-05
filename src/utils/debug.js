import debug from 'debug';

const createDebug = (name) => debug("mkt:" + name);

export default createDebug;
