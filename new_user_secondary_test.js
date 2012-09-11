#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
vows = require('vows'),
path = require('path'),
wd = require('wd'),
assert = require('assert'),
restmail = require('./lib/restmail.js'),
utils = require('./lib/utils.js'),
persona_urls = require('./lib/urls.js');

// setup
var suite = vows.describe(path.relative("..", __dirname));
suite.options.error = false;

var browser = wd.remote();

function noError(err) { assert.ok(!!err); }

suite.addBatch({
  "starting a session": {
    topic: function() {
      utils.newSession(browser, this.callback);
    },
    "succeeds": noError
  }
});

suite.addBatch({
  "loading sample rp": {
    topic: function() {
      browser.get(persona_urls["123done"], this.callback);
    },
    "succeeds": function(err, foo) {
      assert.isUndefined(err);
    }
  }
});

const theEmail = restmail.randomEmail(10);

suite.addBatch({
  "finding button": {
    topic: function() {
      browser.elementByCss('li#loggedout button img', this.callback);
    },
    "visibility": {
      topic: function(err, element) {
        var self = this;
        utils.waitFor(100, 3000, function(done) {
          browser.displayed(element, function(err, displayed) {
            done(!err && displayed, err, displayed);
          });
        }, function (err, displayed) {
          self.callback(err, element, displayed);
        });
      },
      "occurs": function(err, element, displayed) {
        assert.isNull(err);
        assert.isTrue(displayed);
      },
      "and clicking": {
        topic: function(err, element) {
          browser.clickElement(element, this.callback);
        },
        "succeeds": function(err) { assert.isUndefined(err); },
        "and selecting the dialog window": {
          topic: function() {
            browser.window("__persona_dialog", this.callback);
          },
          "succeeds": function(err) { assert.isUndefined(err); },
          "and the title": {
            topic: function() {
              browser.title(this.callback)
            },
            "is from the dialog": function(err, title) {
              assert.isNull(err);
              assert.equal(title, 'Mozilla Persona: A Better Way to Sign In');
            }
          }
        }
      }
    }
  }
});

suite.addBatch({
  "wait for input text box": {
    topic: function() {
      browser.elementByCss('input#email', this.callback);
    },
    "succeeds": function(err) {
      assert.isNull(err);
    },
    "and typing an email address": {
      topic: function(err, elem) {
        browser.type(elem, theEmail, this.callback);
      },
      "succeeds": function(err, elem) { assert.isUndefined(err); },
      "and finding the next button": {
        topic: function() {
          browser.elementByCss('p.submit.buttonrow button.start', this.callback);
        },
        "succeeds": function(err) { assert.isNull(err); },
        "and clicking it": {
          topic: function(err, elem) {
            browser.clickElement(elem, this.callback);
          },
          "succeeds": function(err) { assert.isUndefined(err); }
        }
      }
    }
  }
});

suite.addBatch({
  "finding password input": {
    topic: function() {
      browser.elementByCss('div#set_password input#password', this.callback);
    },
    "succeeds": function(err) { assert.isNull(err); },
    "and typing password": {
      topic: function(err, elem) {
        browser.type(elem, theEmail.split('@')[0], this.callback);
      },
      "succeeds": function(err) { assert.isUndefined(err); },
      "and finding the verify password input": {
        topic: function() {
          browser.elementByCss('input#vpassword', this.callback);
        },
        "succeeds": function(err) { assert.isNull(err); },
        "and retyping password": {
          topic: function(err, elem) {
            browser.type(elem, theEmail.split('@')[0], this.callback);
          },
          "succeeds": function(err) { assert.isUndefined(err); },
          "and finding the next button": {
            topic: function() {
              browser.elementByCss('button#verify_user', this.callback);
            },
            "succeeds": function(err) { assert.isNull(err); },
            "and clicking it": {
              topic: function(err, elem) {
                browser.clickElement(elem, this.callback);
              },
              "succeeds": function(err) { assert.isUndefined(err); }
            }
          }
        }
      }
    }
  }
});

suite.addBatch({
  "checking email": {
    topic: function() {
      restmail.getVerificationLink({ email: theEmail }, this.callback);
    },
    "finds email": function(err, link, email) {
      assert.isNull(err);
      assert.ok(link);
    },
    "and opening verification page": {
      topic: function(err, link, email) {
        var self = this;
        browser.close(function() {
          browser.windowHandles(function(err, data) {
            assert.ok(!err);
            assert.equal(data.length, 1);
            browser.window(data[0], function(err) {
              browser.get(link, self.callback);
            });
          });
        });
      },
      "causes redirect to 123done": {
        topic: function() {
          utils.waitFor(700, 20000, function(done) {
            browser.elementByCss('li#loggedin span', function(err, elem) {
              if (err) return done(false, err, elem);
              browser.text(elem, function(err, text) {
                done(!err && typeof text === 'string' && text.length, err, text);
              });
            });
          }, this.callback);
        },
        "and proper email address is logged in": function(err, text) {
          assert.isNull(err);
          assert.strictEqual(text, theEmail);
        }
      }
    }
  }
});


suite.addBatch({
  "ending a session": {
    topic: function() {
      browser.quit(this.callback);
    },
    "succeeds": function(err) { assert.isUndefined(err); }
  }
});

// run or export the suite.
if (process.argv[1] === __filename) suite.run();
else suite.export(module);
