/*jslint browser: true*/
/*global History*/
"use strict";

var staterouter = (function () {
    function normalizePath(path) {
        if (path[0] !== '/') {
            path = '/' + path;
        }
        return path;
    }

    function Router() {
        var self = this;
        self.routes = {};

        self.route = function (path, func) {
            var route;
            path = normalizePath(path);
            // Replace :[^/]+ with ([^/]+), f.ex. /persons/:id/resource -> /persons/([^/]+)/resource
            route = '^' + path.replace(/:\w+/g, '([^/]+)') + '$';
            self.routes[route] = func;
            return self;
        };

        self.navigate = function (path, state, title) {
            path = normalizePath(path);
            History.pushState(state, title, path);
            return self;
        };

        self.perform = function () {
            var state = History.getState(),
                // Get pathname part of URL, which is what we'll be matching
                link = document.createElement("a"),
                url,
                route,
                rx,
                match,
                func;
            link.href = state.url;
            url = normalizePath(link.pathname);
            for (route in self.routes) {
                if (self.routes.hasOwnProperty(route)) {
                    rx = new RegExp(route);
                    match = rx.exec(url);
                    //console.log("Route " + route + ", " + url + ", match: " + match);
                    if (match !== null) {
                        // Translate groups to parameters
                        func = self.routes[route];
                        //console.log('Route ' + route  + ' matched, arguments: ' + match.slice(1));
                        func.apply(state, match.slice(1));
                        break;
                    }
                }
            }
            return self;
        };

        self.back = function () {
            History.back();
            return self;
        };

        self.go = function (steps) {
            History.go(steps);
            return self;
        };

        function onStateChange() {
            //console.log('statechange: ' + History.getState().url);
            self.perform();
        }
        History.Adapter.bind(window, 'statechange', onStateChange);
    }

    return {
        Router: Router
    };
}());

// vim: set sts=4 sw=4 et:
