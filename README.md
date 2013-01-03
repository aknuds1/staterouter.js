# StateRouter.js

## Description

StateRouter.js is a small JavaScript library intended to extend the
[History.js](https://github.com/balupton/History.js/) HTML5 history library
with routing capabilities.

## Why

I wasn't able to find any routing libraries for History.js that I was quite
happy with, so I decided I might as well write my own. An important benefit of
doing it myself is that I can ensure good test coverage. The tests are written
BDD style, with the help of the excellent
[Jasmine](http://pivotal.github.com/jasmine/) framework.

## Requirements

StateRouter.js requires just the
[History.js](https://github.com/balupton/History.js/) library.

## Installation

Download lib/staterouter.js and include it in your page after History.js.

## Usage

    function getHome() {
    }
    function getPersons() {
    }
    function getPerson(id) {
    }

    var router = new staterouter.Router();
    // Configure routes
    router
      .route('/', getHome)
      .route('/persons', getPersons)
      .route('/persons/:id', getPerson);

    $(document).ready(function () {
        // Perform initial routing
        router.perform();

        // Navigate to a URL
        router.navigate('/persons/1');

        // Go back
        router.back();

        // Go forward
        router.go(1);
    });

## Testing

StateRouter.js is tested through Jasmine specifications, contained in
'spec/StateRouter.js'. In order to run them, open 'specrunner.html' in a
browser.

<!-- vim: set ff=unix sts=4 sw=4 et: -->
