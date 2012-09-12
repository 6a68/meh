// absolutely all CSS and dom identifiers for all sites used in tests
// are kept here.  This makes it easy to update all tests when dom structure
// changes.

module.exports = {
  "123done.org": {
    signinButton: 'li#loggedout button img',
    // the email address of the user who is currently logged in
    currentlyLoggedInEmail: 'li#loggedin span'
  },
  "persona.org": {
    windowName: "__persona_dialog",
  },
  "dialog": {
    emailInput: 'input#email',
    newEmailNextButton: 'p.submit.buttonrow button.start',
    choosePassword: 'div#set_password input#password',
    verifyPassword: 'input#vpassword',
    // the button you click on after typing and re-typing your password
    createUserButton: 'button#verify_user'
  },
  "myfavoritbeer.org": {
  },
  "eyedee.me": {
  }
};
