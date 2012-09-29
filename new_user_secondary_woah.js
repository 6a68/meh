#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
path = require('path'),
wd = require('wd'),
assert = require('assert'),
restmail = require('./lib/restmail.js'),
utils = require('./lib/utils.js'),
persona_urls = require('./lib/urls.js'),
CSS = require('./lib/css.js'),
dialog = require('./lib/dialog.js'),
vowsHarness = require('./lib/vows_harness.js');

// add fancy helper routines to wd
require('./lib/wd-extensions.js');

// generate a randome email we'll use
const theEmail = restmail.randomEmail(10);
var browser = wd.remote();
var eyedeemail = restmail.randomEmail(10, 'eyedee.me');
function startup(cb) {
  browser.chain()
    .newSession()
    .get(persona_urls["123done"])
    .waitForDisplayed(CSS["123done.org"].signinButton, function(err, el) {
      browser.clickElement(el, cb)
    })
}

vowsHarness({

  "create a new selenium session": function(done) {
    browser.newSession(done);
  },
  "load 123done and wait for the signin button to be visible": function(done) {
    browser.get(persona_urls["123done"], function() {});
    browser.waitForDisplayed(CSS["123done.org"].signinButton, done);
  },
  "click the signin button": function(done, el) {
    browser.clickElement(el, done);
  },
  "switch to the dialog when it opens": function(done) {
    browser.waitForWindow(CSS["persona.org"].windowName, done);
  },
  "sign in a new @restmail (secondary) user": function(done) {
    dialog.signInAsNewUser({
      browser: browser,
      email: theEmail,
      password: theEmail.split('@')[0], // we use the user part of email as password.  why not?
    }, done);
  },
  "get verification link from email": function(done) {
    restmail.getVerificationLink({ email: theEmail }, done);
  },
  "open verification link": function(done, link) {
    browser.closeCurrentBrowserWindow(function() {
      browser.get(link, done);
    });
  },
  "verify we're logged in as the expected user": function(done) {
    browser.waitForElementText(CSS['123done.org'].currentlyLoggedInEmail, function(err, text) {
      assert.equal(text, theEmail);
      done()
    });
  },
  "shut down": function(done) {
    browser.quit(done);
  },


  "startup again, load 123done, click sign in": function(done) {
    startup(done)
  },
  "sign in a new eyedeemee user": function(done) {
    function noop() {}
    browser.chain()
      .waitForWindow(CSS['persona.org'].windowName)
      .elementByCss(CSS['dialog'].emailInput, function(err, elem) {
        browser.type(elem, eyedeemail, noop);
      })
      .elementByCss(CSS['dialog'].newEmailNextButton, function(err, elem) {
        browser.clickElement(elem, noop);
      })
      // TODO regular wait doesn't seem to be working.
      // need to ensure there's no spinner inside the button, maybe?
      .waitForDisplayed(CSS['dialog'].verifyWithPrimaryButton)
      .elementByCss(CSS['dialog'].verifyWithPrimaryButton, function(err, elem) {
        browser.clickElement(elem, noop);
      })
      .waitForDisplayed(CSS['eyedee.me'].newPassword)
      .elementByCss(CSS['eyedee.me'].newPassword, function(err, elem) {
        browser.type(elem, eyedeemail.split('@')[0], noop);
      })
      .elementByCss(CSS['eyedee.me'].createAccountButton, function(err, elem) {
        browser.clickElement(elem, done);
      })
    },
    // TODO 123done never seems to log in. something up with beta server?
    "switch back to main window and verify we're logged in": function(done) {
      // this part copied from one of the sign in tests :-P
      browser.windowHandles(function(err, handles) {
        browser.window(handles[0], function(err) {
          browser.waitForElementText(CSS['123done.org'].currentlyLoggedInEmail, function(err, text) {
            assert.equal(text, eyedeemail);
            done()
          });
        });
      });
    }
}, module);
