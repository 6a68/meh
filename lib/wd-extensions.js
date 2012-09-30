// add helper routines onto wd that make common operations easy to do
// correctly

var wd = require('wd/lib/webdriver.js');

const utils = require('./utils.js'),
   timeouts = require('./timeouts.js');

function setTimeouts(opts) {
  opts.poll = opts.poll || timeouts.DEFAULT_POLL_MS;
  opts.timeout = opts.timeout || timeouts.DEFAULT_TIMEOUT_MS;
}

// wait for a element to become part of the dom and be visible to
// the user.  The element is identified by CSS selector.  options:
//   which: css selector specifying which element
//   poll (optional):
//   timeout (optional)
wd.prototype.waitForDisplayed = function(opts, cb) {
  if (typeof opts == 'string') opts = { which: opts };
  if (!opts.which) throw "css selector required";
  setTimeouts(opts);
  var browser = this;

  utils.waitFor(opts.poll, opts.timeout, function(done) {
    browser.elementByCss(opts.which, function(err, elem) {
      if (err) return done(!err, err, elem);
      browser.displayed(elem, function(err, displayed) {
        done(!err && displayed, err, elem);
      });
    })
  }, cb);
};

// allocate a new browser session and sets implicit wait timeout
// TODO pass desired capabilities here
wd.prototype.newSession = function(cb) {
  browser = this;
  browser.init(function(err) {
    if (err) return cb(err);
    // note!  the implicit wait timeout is different from other timeouts,
    // it's the amount of time certain wire transactions will wait for
    // procedures like find_element to succeed (we'll actually wait on the
    // *server* side for an element to become visible).  Having this be
    // the same as the global default timeout is interesting.
    browser.setImplicitWaitTimeout(timeouts.DEFAULT_TIMEOUT_MS, cb);
  });
};

// wait for a window, specified by name, to become visible and switch to it
//  .waitForWindow(<name>, <cb>)
//  or
//  .waitForWindow(<opts>, <cb>)
//
// If the latter invocation is employed, you can specify .poll and .timeout
// values.
wd.prototype.waitForWindow = function(opts, cb) {
  if (typeof opts == 'string') opts = { name: opts };
  if (!opts.name) throw "waitForWindow missing window `name`";
  setTimeouts(opts);
  utils.waitFor(opts.poll, opts.timeout, function(done) {
    browser.window(opts.name, function(err) {
      done(!err, err);
    });
  }, cb);
};

// close the currently open browser window and switch to one of the remaining
// open windows (deterministic if you know that exactly two windows are open)
wd.prototype.closeCurrentBrowserWindow = function(cb) {
  var self = this;
  self.close(function(err) {
    if (err) return cb(err);
    self.windowHandles(function(err, data) {
      if (err) return cb(err);
      if (data.length < 1) return cb("no window to switch to!");
      self.window(data[0], cb);
    });
  });
};

// wait for an element, specified by CSS selector, to have a non-empty text value.
//  .waitForWindow(<selector>, <cb>)
//  or
//  .waitForWindow(<opts>, <cb>)

wd.prototype.waitForElementText = function(opts, cb) {
  var self = this;
  if (typeof(opts) === 'string') opts = { which: opts };
  setTimeouts(opts);
  utils.waitFor(opts.poll, opts.timeout, function(done) {
    self.elementByCss(opts.which, function(err, elem) {
      if (err) return done(false, err, elem);
      self.text(elem, function(err, text) {
        done(!err && typeof text === 'string' && text.length, err, text);
      });
    });
  }, cb);
};
