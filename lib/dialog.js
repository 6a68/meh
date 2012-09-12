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

  // this will implicitly wait for the element to be added
  browser.elementByCss(CSS['dialog'].emailInput, function(err, elem) {
    errCheck(err);
    browser.type(elem, opts.email, function(err) {
      errCheck(err);
      browser.elementByCss(CSS['dialog'].newEmailNextButton, function(err, elem) {
        errCheck(err);
        browser.clickElement(elem, function(err) {
          errCheck(err);
          browser.elementByCss(CSS['dialog'].choosePassword, function(err, elem) {
            errCheck(err);
            browser.type(elem, opts.password, function(err) {
              errCheck(err);
              browser.elementByCss(CSS['dialog'].verifyPassword, function(err, elem) {
                errCheck(err);
                browser.type(elem, opts.password, function(err) {
                  errCheck(err);
                  browser.elementByCss(CSS['dialog'].createUserButton, function(err, elem) {
                    browser.clickElement(elem, cb);
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};
