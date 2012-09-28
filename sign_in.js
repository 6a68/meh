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

var browser = wd.remote();

// ugh lack of control flow is fucking maddening
function noop() {}

function errCheck(err) {
  if (err) {
    cb(err);
    throw ("error: " + err);
  }
}

var useropts = {
  password: process.env['PERSONA_PASSWORD'],
  username: process.env['PERSONA_USERNAME']
};

// literally cutting and pasting from the other test for right now
// this is really verbose
vowsHarness({
  "create a new selenium session": function(done) {
    browser.newSession(done);
  },
  "load 123done and wait for the signin button to be visible": function(done) {
    browser.get(persona_urls["123done"], noop);
    browser.waitForDisplayed(CSS["123done.org"].signinButton, done);
    // grab a pointer to the top window
  },
  "click the signin button": function(done, el) {
    browser.clickElement(el, done);
  },
  "switch to the dialog when it opens": function(done) {
    browser.waitForWindow(CSS["persona.org"].windowName, done);
  },
  "sign in with the usual fake account": function(done) {
    dialog.signInExistingUser({
      browser: browser,
      email: useropts.username,
      password: useropts.password
    }, done);
  },
  "verify signed in to 123done": function(done) {
    browser.windowHandles(function(err, handles) {
      browser.window(handles[0], function(err) {
        browser.waitForElementText(CSS['123done.org'].currentlyLoggedInEmail, function(err, text) {
          assert.equal(text, useropts.username);
          done()
        });
      });
    });
  },
  "tear down browser": function(done) {
    browser.quit(done);
  }
}, module);

// add this to the webdriver prototype
function clickWhenDisplayed(selector, cb, errb) {
  browser.chain()
    .waitForDisplayed(selector)
    .elementByCss(selector, function(err, el) {
      browser.click(el, errb);
    });
  cb()
}

vowsHarness({
  "create a new selenium session": function(done) {
    browser.newSession(done);
  },
  "load myfavoritebeer and wait for the signin button to be visible": function(done) {
    browser.chain()
      .get(persona_urls['myfavoritebeer'])
      .waitForDisplayed(CSS['myfavoritebeer.org'].signinButton)
      .elementByCss(CSS['myfavoritebeer.org'].signinButton, function (err, el) {
        browser.clickElement(el, done);
      })
  },
  "switch to the dialog when it opens": function(done) {
    browser.waitForWindow(CSS["persona.org"].windowName, done);
  },
  "sign in with the usual fake account": function(done) {
    dialog.signInExistingUser({
      browser: browser,
      email: useropts.username,
      password: useropts.password
    }, done);
  },
  "verify signed in to myfavoritebeer": function(done) {
    browser.windowHandles(function(err, handles) {
      console.log('windowhandles length is ' + handles.length)
      browser.window(handles[0], function(err) {
        browser.waitForElementText(CSS['myfavoritebeer.org'].currentlyLoggedInEmail, function(err, text) {
          assert.equal(text, useropts.username);
          done()
        });
      });
    });
  },
  "tear down browser": function(done) {
    browser.quit(done);
  }
}, module);
