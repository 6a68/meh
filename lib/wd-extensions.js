// add helper routines onto wd that make common operations easy to do
// correctly

var wd = require('wd/lib/webdriver.js');

const utils = require('./utils.js'),
   timeouts = require('./timeouts.js');

// wait for a element to become part of the dom and be visible to
// the user.  The element is identified by CSS selector.  options:
//   which: css selector specifying which element
//   poll (optional):
//   timeout (optional)
wd.prototype.waitForDisplayed = function(opts, cb) {
  if (!opts.which) throw "css selector required";
  opts.poll = opts.poll || timeouts.DEFAULT_POLL_MS;
  opts.timeout = opts.timeout || timeouts.DEFAULT_TIMEOUT_MS;
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
