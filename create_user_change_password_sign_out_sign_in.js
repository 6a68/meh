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

// TODO extract to setup function
var sauceUser = process.env['SAUCE_USER'];
var sauceKey = process.env['SAUCE_APIKEY'];
if (sauceUser && sauceKey) {
  console.log('using remote sauce browser')
  var browser = wd.remote('ondemand.saucelabs.com', 80, sauceUser, sauceKey);
  browser.on('status', function(info){
    // using console.error so we don't mix up plain text with junitxml
    console.error('\x1b[36m%s\x1b[0m', info);
  });

  /*
  browser.on('command', function(meth, path){
    console.log(' > \x1b[33m%s\x1b[0m: %s', meth, path);
  });
  */
} else { 
  console.log('using local browser');
  var browser = wd.remote()
}

var eyedeemail = restmail.randomEmail(10, 'eyedee.me');
// argh! put this in a util!
function noop() {}
function startup(cb) {
  browser.chain()
    .newSession()
    .get(persona_urls["123done"])
    .waitForDisplayed(CSS["123done.org"].signinButton, function(err, el) {
      browser.clickElement(el, cb)
    })
}


// why all this at once? to cover the existing stuff the python 123done tests
// took care of (change password) while verifying the password change really
// worked. obvious todo: factor out all this duplication, and use 
// personatestuser to handle creating dummy users for tests that don't verify
// the account creation flow.

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

  // change the password after creating user. yes, we did just copy-and-paste
  // the contents of the other test. make it work, then refactor to cleanness :-)

  "go back to the account manager": function(done) {
    browser.chain()
      .get(persona_urls['persona'])
      .waitForElementText(CSS['persona.org'].accountManagerHeader, function(err, text) {
        assert.equal(text, 'Account Manager');
        done()
      })
    },
  "make sure the right account is logged in": function(done) {
    browser.waitForElementText(CSS['persona.org'].accountEmail, function(err, text) {
      assert.equal(text, theEmail)
    });
    done()
  },
  "find the change password button": function(done) {
    browser.waitForDisplayed(CSS["persona.org"].changePasswordButton, done);
  },
  "click the change password button": function(done, el) {
    browser.clickElement(el, done);
  },
  "enter old and new passwords and click done": function(done) {
    browser.chain()
      .waitForDisplayed(CSS['persona.org'].oldPassword)
      .elementByCss(CSS['persona.org'].oldPassword, function(err, el) {
        browser.type(el, theEmail.split('@')[0], noop)
      })
      .elementByCss(CSS['persona.org'].newPassword, function(err, el) {
        browser.type(el, 'newpasswordisnew', noop)
      })
      .waitForDisplayed(CSS['persona.org'].passwordChangeDoneButton, function(err, el) {
        browser.clickElement(el, done)
      })
  },
  "back to 123done": function(done) {
    // copied from top of this test, refactor TODO
    browser.get(persona_urls["123done"], done);
  },
  "clear all the cookies and reload": function(done) {
    browser.chain()
      .deleteAllCookies()
      .get(persona_urls["123done"], done);
  },
  "wait for login link to reappear": function(done) {
    browser.waitForDisplayed(CSS["123done.org"].signinButton, done);
  },
  "click the signin button again": function(done, el) {
    browser.clickElement(el, done);
  },
  "switch to the dialog when it opens again": function(done) {
    browser.waitForWindow(CSS["persona.org"].windowName, done);
  },
  // copied from sign_in.js yikes
  "sign in using the changed password": function(done) {
    dialog.signInExistingUser({
      browser: browser,
      email: theEmail,
      password: 'newpasswordisnew'
    }, done);
  },
  // ditto: copied from sign_in.js
  "finally, verify signed in to 123done": function(done) {
    browser.windowHandles(function(err, handles) {
      browser.window(handles[0], function(err) {
        browser.waitForElementText(CSS['123done.org'].currentlyLoggedInEmail, function(err, text) {
          assert.equal(text, theEmail);
          done()
        });
      });
    });
  },
  "shut down": function(done) {
    browser.quit(done);
  }
}, module);
