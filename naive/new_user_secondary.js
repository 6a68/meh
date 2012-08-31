#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
vows = require('vows'),
path = require('path'),
wd = require('wd'),
assert = require('assert'),
request = require('request');

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
    "succeeds": function(err) {
      assert.isNull(err);
    },
    "setting implicit timeout": {
      topic: function() {
        browser.setImplicitWaitTimeout(20000, this.callback);
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
    "succeeds": function(err, foo) {
      assert.isUndefined(err);
    }
  }
});

function waitFor(poll, timeout, check, complete) {
  var startTime = new Date();
  function doit() {
    check(function(done) {
      if (done || ((new Date() - startTime) > timeout)) {
        complete.apply(null, Array.prototype.slice.call(arguments, 1));
      } else {
        setTimeout(doit, poll);
      }
    });
  }
  setTimeout(doit, poll);
}

function randomEmail(chars) {
  var str = "";
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i=0; i < chars; i++) {
    str += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return str + '@restmail.net';
};

const theEmail = randomEmail(10);

suite.addBatch({
  "finding button": {
    topic: function() {
      browser.elementByCss('li#loggedout button img', this.callback);
    },
    "visibility": {
      topic: function(err, element) {
        var self = this;
        waitFor(100, 3000, function(done) {
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
        "succeeds": function(err) {
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
              "succeeds": function(err) { assert.isUndefined(err); },
              "and waiting for transition": {
                topic: function() {
                  var self = this;
                  waitFor(700, 10000, function(done) {
                    browser.elementByCss('div.contents p:nth-child(2) strong', function(err, elem) {
                      browser.text(elem, function(err, text) {
                        done(!err && typeof text === 'string' && text.length > 0, err, text);
                      });
                    });
                  }, this.callback);
                },
                "works": function(err, email) {
                  assert.isNull(err);
                  assert.equal(email, theEmail);
                }
              }
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
      waitFor(1000, 10000, function(doneCB) {
        request('http://restmail.net/mail/' + theEmail.split('@')[0], function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var b = JSON.parse(body);
            if (b.length > 0) doneCB(true, error, b[0]);
            else doneCB(false);
          } else {
            doneCB(false);
          }
        })
      }, this.callback);
    },
    "finds email": function(err, email) {
      assert.isNull(err);
      assert.ok(email.headers['x-browserid-verificationurl']);
    },
    "and opening verification page": {
      topic: function(err, email) {
        var self = this;
        browser.close(function() {
          browser.windowHandles(function(err, data) {
            assert.ok(!err);
            assert.equal(data.length, 1);
            browser.window(data[0], function(err) {
              browser.get(email.headers['x-browserid-verificationurl'], self.callback);
            });
          });
        });
      },
      "causes redirect to 123done": {
        topic: function() {
          waitFor(700, 20000, function(done) {
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
    "succeeds": function(err) {
      assert.isUndefined(err);
    }
  }
});

// run or export the suite.
if (process.argv[1] === __filename) suite.run();
else suite.export(module);
