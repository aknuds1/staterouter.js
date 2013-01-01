var staterouter = (function () {
    function normalizePath(path) {
        if (path[0] != '/')
            path = '/' + path;
        return path;
    }

    function Router() {
        var self = this;
        self.routes = {};

        self.route = function (path, func) {
            path = normalizePath(path);
            self.routes[path] = func;
            return self;
        };

        self.navigate = function (path, state, title) {
            path = normalizePath(path);
            History.pushState(state, title, path);
            return self;
        };

        self.perform = function () {
            state = History.getState();
            url = normalizePath(state.url);
            for (var route in self.routes) {
                // Replace :[^/]+ with ([^/]+), f.ex. /persons/:id/resource -> /persons/([^/]+)/resource
                var rx = new RegExp('^' + route.replace(/:[^\/]+/g, '([^/]+)') + '$');
                var match = rx.exec(url);
                if (match != null) {
                    // Translate groups to parameters
                    var func = self.routes[route];
                    //console.log('Route ' + route  + ' matched, arguments: ' + match.slice(1));
                    func.apply(null, match.slice(1));
                    break;
                }
                else {
                    //console.log('Route ' + route + ' didn\'t match ' + url);
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
        $(window).bind('statechange', onStateChange);
    };

    return {
        Router: Router
    };
})();

// vim: set sts=4 sw=4 et:
