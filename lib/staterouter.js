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

    // Make URL relative
    function getRelativeUrl(url) {
        return url.replace(/^(?:\/\/|[^\/]+)*\/?/, "");
    }

    // Is an object empty?
    function isEmpty(obj) {
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop))
                return false;
        }

        return true;
    }

    // Get path component of the current URL
    function getCurrentPath(state) {
        var link = document.createElement("a");
        if (state === undefined) {
            state = History.getState();
        }
        link.href = state.url;
        return normalizePath(link.pathname);
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

        // Navigate to a path
        self.navigate = function (path, data, title) {
            var currentState = History.getState(), currentUrl, currentTitle,
                currentData;
            currentUrl = currentState.url;
            currentData = currentState.data;
            currentTitle = currentState.title;
            // Normalize these as undefined if they're empty, different
            // browsers may return different values
            if (isEmpty(currentData)) {
                currentData = undefined;
            }
            if (!currentTitle) {
                currentTitle = undefined;
            }
            if (path[0] !== '/') {
                var currentPath = getCurrentPath();
                // Make absolute path
                if (currentPath.slice(-1)[0] !== '/') {
                    currentPath += '/';
                }
                path = currentPath + path;
            }

            if (path !== normalizePath(getRelativeUrl(currentUrl)) || data !== currentData || title !== currentTitle) {
                History.pushState(data, title, path);
            }
            else {
                // Trigger a statechange when just re-navigating to the same
                // state, as History.js won't do this for us
                //console.log('State hasn\'t changed, just triggering a statechange');
                $(window).trigger('statechange');
            }
            return self;
        };

        self.perform = function () {
            var state = History.getState(),
                // Get pathname part of URL, which is what we'll be matching
                path = getCurrentPath(state),
                route,
                rx,
                match,
                func;
            for (route in self.routes) {
                if (self.routes.hasOwnProperty(route)) {
                    rx = new RegExp(route);
                    match = rx.exec(path);
                    //console.log("Route " + route + ", " + path + ", match: " + match);
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
            //console.log('statechange');
            self.perform();
        }
        History.Adapter.bind(window, 'statechange', onStateChange);
    }

    return {
        Router: Router
    };
}());

// vim: set sts=4 sw=4 et:
