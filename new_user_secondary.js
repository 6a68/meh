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
dialog = require('./lib/dialog.js');

// add fancy helper routines to wd
require('./lib/wd-extensions.js');

// generate a randome email we'll use
const theEmail = restmail.randomEmail(10);

var browser = wd.remote();

browser.newSession(function(err) {
  assert(!err);
  browser.get(persona_urls["123done"], function() {});
  browser.waitForDisplayed(CSS["123done.org"].signinButton, function (err, el) {
    assert(!err);
    browser.clickElement(el, function(err) {
      assert(!err);
      browser.waitForWindow(CSS["persona.org"].windowName, function(err) {
        assert(!err);
        dialog.signInAsNewUser({
          browser: browser,
          email: theEmail,
          password: theEmail.split('@')[0], // we use the user part of email as password.  why not?
        }, function(err) {
          assert(!err);
          restmail.getVerificationLink({ email: theEmail }, function(err, link) {
            assert(!err);
            browser.closeCurrentBrowserWindow(function() {
              browser.get(link, function(err) { assert(!err, err); });
              browser.waitForElementText(CSS['123done.org'].currentlyLoggedInEmail, function(err, text) {
                assert(!err);
                assert.equal(text, theEmail);
                browser.quit(function() {
                  console.log("success!");
                });
              });
            });
          });
        });
      });
    });
  });
});
