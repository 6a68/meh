const CSS = require('./css.js'),
    utils = require('./utils.js')

exports.signInAsNewUser = function(opts, cb) {
  [ 'email', 'browser', 'password' ].forEach(function(required) {
    if (!opts[required]) throw ".signInAsNewUser missing required argument '"+required+"'";
  });

  function errCheck(err) {
    if (err) {
      cb(err);
      throw ("error: " + err);
    }
  }

  var browser = opts.browser;
  function noop() {}
  // this will implicitly wait for the element to be added
  browser.chain()
    .elementByCss(CSS['dialog'].emailInput, function(err, elem) {
      errCheck(err);
      browser.type(elem, opts.email, noop);
    })
    .elementByCss(CSS['dialog'].newEmailNextButton, function(err, elem) {
      errCheck(err);
      browser.clickElement(elem, noop);
    })
    .elementByCss(CSS['dialog'].choosePassword, function(err, elem) {
      errCheck(err);
      browser.type(elem, opts.password, noop)
    })
    .elementByCss(CSS['dialog'].verifyPassword, function(err, elem) {
      errCheck(err);
      browser.type(elem, opts.password, noop)
    })
    .elementByCss(CSS['dialog'].createUserButton, function(err, elem) {
      errCheck(err);
      browser.clickElement(elem, cb);
    });
};
