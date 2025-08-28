// Simple global debug recorder to store last request info for the on-screen panel
const debug = {
  last: null,
  set(info) {
    try {
      this.last = Object.assign({}, info, { ts: new Date().toISOString() });
    } catch (e) {
      // no-op
    }
  },
  get() {
    return this.last;
  },
};

export default debug;
