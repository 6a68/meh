#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const 
vows = require('vows'),
path = require('path'),
wd = require('wd'),
assert = require('assert');

// setup
var suite = vows.describe(path.relative("..", __dirname));
suite.options.error = false;

browser = wd.remote();

const URLS = {
  "123done": 'http://dev.123done.org',
  persona: 'https://login.dev.anosrep.org',
  myfavoritebeer: 'https://login.dev.anosrep.org',
  eyedeeme: 'https://eyedee.me',
};

suite.addBatch({
  "starting a session": {
    topic: function() {
      browser.init(this.callback);
    },
    "works": function(err) {
      assert.isNull(err);
    },
    "setting implicit timeout": {
      topic: function() {
        browser.setImplicitWaitTimeout(10000, this.callback);
      },
      "works also": function(err) {
        assert.isUndefined(err);
      }
    }
  }
});

suite.addBatch({
  "loading sample rp": {
    topic: function() {
      browser.get(URLS["123done"], this.callback);
    },
    "works": function(err, foo) {
      assert.isUndefined(err);
    }
  }
});

suite.addBatch({
  "finding button": {
    topic: function() {
      browser.elementByCss('li#loggedout button img', this.callback);
    },
    "waiting for visibility": {
      topic: function(err, element) {
        browser.isVisible(

        assert.isNull(err);
        browser.clickElement(element, this.callback);
      },
      "works": function(err) {
        assert.isUndefined(err);
      },
      "and selecting the dialog window": {
        topic: function() {
          browser.window("__persona_dialog", this.callback);
        },
        "succeeds": function(err) {
          assert.isUndefined(err);
        },
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
});

suite.addBatch({
  "wait for input text box": {
    topic: function() {
      browser.elementByCss('input#email', this.callback);
    },
    "succeeds": function(err) {
      assert.isNull(err);
    },
    "and typing and email address": {
      topic: function(err, elem) {
        browser.type(elem, "user@example.com", function(){});
      },
      "works": function(err, elem) {
        assert.isUndefined(err);
      }
    }
  }
});


suite.addBatch({
  "ending a session": {
    topic: function() {
      browser.quit(this.callback);
    },
    "works": function(err) {
      assert.isUndefined(err);
    }
  }
});

// run or export the suite.
if (process.argv[1] === __filename) suite.run();
else suite.export(module);
