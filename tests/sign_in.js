#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
path = require('path'),
wd = require('wd'),
assert = require('assert'),
restmail = require('../lib/restmail.js'),
utils = require('../lib/utils.js'),
persona_urls = require('../lib/urls.js'),
CSS = require('../lib/css.js'),
dialog = require('../lib/dialog.js'),
vowsHarness = require('../lib/vows_harness.js');

// add fancy helper routines to wd
require('../lib/wd-extensions.js');

var browser = wd.remote();

var useropts = {
  password: process.env['PERSONA_PASSWORD'],
  username: process.env['PERSONA_USERNAME']
};

vowsHarness({
  "create a new selenium session": function(done) {
    browser.newSession(done);
  },
  "load 123done and wait for the signin button to be visible": function(done) {
    browser.get(persona_urls["123done"], done);
  },
  "click the signin button": function(done, el) {
    browser.wclick(CSS['123done.org'].signinButton, done);
  },
  "switch to the dialog when it opens": function(done) {
    browser.wwin(CSS["persona.org"].windowName, done);
  },
  "sign in with the usual fake account": function(done) {
    dialog.signInExistingUser({
      browser: browser,
      email: useropts.username,
      password: useropts.password
    }, done);
  },
  "verify signed in to 123done": function(done) {
    browser.chain()
      .wwin()
      .wtext(CSS['123done.org'].currentlyLoggedInEmail, function(err, text) {
        assert.equal(text, useropts.username);
        done()
       });
  },
  "tear down browser": function(done) {
    browser.quit(done);
  },

  // tricky: you can't have duplicate keys or weird things happen

  // todo extract duplication
  "create another selenium session": function(done) {
    browser.newSession(done);
  },
  "load myfavoritebeer and wait for the signin button to be visible": function(done) {
    browser.chain()
      .get(persona_urls['myfavoritebeer'])
      .wclick(CSS['myfavoritebeer.org'].signinButton, done);
  },
  "mfb switch to the dialog when it opens": function(done) {
    browser.wwin(CSS["persona.org"].windowName, done);
  },
  "mfb sign in with the usual fake account": function(done) {
    dialog.signInExistingUser({
      browser: browser,
      email: useropts.username,
      password: useropts.password
    }, done);
  },
  "verify signed in to myfavoritebeer": function(done) {
    browser.chain()
      .wwin()
      .wtext(CSS['myfavoritebeer.org'].currentlyLoggedInEmail, function(err, text) {
        assert.equal(text, useropts.username);
        done()
      });
  },
  "mfb tear down browser": function(done) {
    browser.quit(done);
  }
}, module);
