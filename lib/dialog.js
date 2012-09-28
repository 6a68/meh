const CSS = require('./css.js'),
    utils = require('./utils.js')

var dlg = CSS['dialog'];

function verifyOpts(optionList, opts) {
  optionList.forEach(function(required) {
    if (!opts[required]) {
      throw (" missing required argument '"+required+"'");
    }
  });
}

function errCheck(err, cb) {
  if (err) {
    cb(err);
    throw ("error: " + err);
  }
}
function noop() {}

exports.signInAsNewUser = function(opts, cb) {
  verifyOpts(['email', 'browser', 'password'], opts);

  var browser = opts.browser;
  // this will implicitly wait for the element to be added
  browser.chain()
    .elementByCss(CSS['dialog'].emailInput, function(err, elem) {
      errCheck(err, cb);
      browser.type(elem, opts.email, noop);
    })
    .elementByCss(CSS['dialog'].newEmailNextButton, function(err, elem) {
      errCheck(err, cb);
      browser.clickElement(elem, noop);
    })
    .elementByCss(CSS['dialog'].choosePassword, function(err, elem) {
      errCheck(err, cb);
      browser.type(elem, opts.password, noop)
    })
    .elementByCss(CSS['dialog'].verifyPassword, function(err, elem) {
      errCheck(err, cb);
      browser.type(elem, opts.password, noop)
    })
    .elementByCss(CSS['dialog'].createUserButton, function(err, elem) {
      errCheck(err, cb);
      browser.clickElement(elem, cb);
    });
};

exports.signInExistingUser = function(opts, cb) {
  //verifyOpts(['email', 'browser', 'password'], opts);
  console.log('inside sign in existing user')
  var browser = opts.browser;
  browser.chain()
    .elementByCss(CSS['dialog'].emailInput, function(err, el) {
      errCheck(err, cb);
      browser.type(el, opts.email, noop);
    })
    .elementByCss(CSS['dialog'].newEmailNextButton, function(err, el) {
      errCheck(err, cb);
      browser.clickElement(el, noop);
    })
    .elementByCss(CSS['dialog'].existingPassword, function(err, el) {
      errCheck(err, cb);
      browser.type(el, opts.password, noop);
    })
    .waitForDisplayed(CSS['dialog'].returningUserButton)
    .elementByCss(CSS['dialog'].returningUserButton, function(err, el) {
      errCheck(err, cb);
      browser.clickElement(el, cb);
    })
};
