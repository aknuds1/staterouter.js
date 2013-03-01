'use strict';

if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function (str) {
        return this.slice(0, str.length) === str; 
    };
}

describe('Test Router', function () {
    var getHome, getPersons, getPerson, router, baseAddress = 'http://example.com',
        curState, history;

    // Trigger the statechange event
    function triggerStateChange() {
        $(window).trigger('statechange');
    }

    // Get the currently faked state
    function getState() {
        if (curState < 0) {
            return null;
        }
        return history[curState];
    }

    function getAbsUrl(path) {
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        return baseAddress + path;
    }

    beforeEach(function () {
        curState = 0;
        getHome = jasmine.createSpy('getHome');
        getPersons = jasmine.createSpy('getPersons');
        getPerson = jasmine.createSpy('getPerson');

        router = new staterouter.Router();
        // Start out with '/' as the URL
        history = [{data: null, title: null, url: baseAddress}];
        spyOn(History, 'getState').andCallFake(getState);
        spyOn(History, 'pushState').andCallFake(function (data, title, url) {
            var theState = getState();
            if (!url.startsWith(baseAddress)) {
                url = getAbsUrl(url);
            }

            // Emulate that History.js doesn't trigger statechange when
            // re-pushing the same state
            if (url === theState.url && data === theState.data && title === theState.title) {
                return;
            }

            // Pop any future history 
            curState += 1;
            history = history.slice(0, curState);
            history.push({data: data, title: title, url: url});
            triggerStateChange();
        });
        spyOn(History, 'back').andCallFake(function () {
            curState -= 1;
            triggerStateChange();
        });
        spyOn(History, 'go').andCallFake(function (numSteps) {
            if (curState + numSteps >= history.length)
                throw new Error("Too many steps forward");
            curState += numSteps;
            triggerStateChange();
        });
    });

    it('should route paths to mapped functions', function () {
        var path = '/persons';
        router.route(path, getPersons).navigate(path);
        expect(History.pushState).toHaveBeenCalledWith(undefined, undefined, path);
        expect(getPersons).toHaveBeenCalledWith();
        // Router callbacks should be called with the current state as 'this'
        expect(getPersons.mostRecentCall.object).toEqual(getState());
    });

    it('should normalize URLs so they start with /', function () {
        router.route('persons', getPersons).navigate('persons');
        expect(History.pushState).toHaveBeenCalledWith(undefined, undefined, '/persons');
        expect(getPersons).toHaveBeenCalledWith();
    });

    it('should route paths with parameters to mapped functions', function () {
        var route = '/persons/:id/:resource';
        var path = '/persons/1/person-name';
        router.route(route, getPerson).navigate(path);
        expect(History.pushState).toHaveBeenCalledWith(undefined, undefined, path);
        expect(getPerson).toHaveBeenCalledWith('1', 'person-name');
    });

    it ('should ignore URL fragments', function () {
        var route = '/', path = '/#frag';
        router.route(route, getHome).navigate(path);
        expect(History.pushState).toHaveBeenCalledWith(undefined, undefined, path);
        expect(getHome).toHaveBeenCalledWith();
    });

    it ('should ignore URL queries', function () {
        var route = '/', path = '/?option=0';
        router.route(route, getHome).navigate(path);
        expect(History.pushState).toHaveBeenCalledWith(undefined, undefined, path);
        expect(getHome).toHaveBeenCalledWith();
        expect(getHome.mostRecentCall.object).toEqual(getState());
    });

    it('supports navigating to a location', function () {
        var path = '/persons';
        router.navigate(path);
        expect(History.pushState).toHaveBeenCalledWith(undefined, undefined, path);
    });

    it('supports supplying data and title when navigating', function () {
        var path = '/persons', data = {what: 'State'}, title = 'Person';
        router.route('/persons', getPerson).navigate(path, data, title);
        expect(History.pushState).toHaveBeenCalledWith(data, title, path);
        expect(getPerson).toHaveBeenCalledWith();
        expect(getPerson.mostRecentCall.object).toEqual({title: title, data: data, url: getAbsUrl(path)})
    });

    it('supports navigating to a relative location', function () {
        // Start out with a path
        router.navigate('/persons');
        var id = '1';
        // This should be interpreted as relative to /persons/
        router.route('/persons/:id', getPerson).navigate(id);
        expect(getPerson).toHaveBeenCalledWith(id);
    })

    it('supports going backward in browsing history', function () {
        router.route('/', getHome).route('/persons/:id', getPerson).route('/persons', getPersons)
            .navigate('/persons/1').navigate('/persons');
        router.back().back();

        expect(getPerson).toHaveBeenCalled();
        expect(getPersons).toHaveBeenCalled();
        expect(getHome).toHaveBeenCalled();
        expect(History.getState().url).toEqual(baseAddress);
    });

    it('supports going forward in browsing history', function () {
        router.route('/', getHome).route('/persons/:id', getPerson).route('/persons', getPersons);
        router.navigate('/persons/1').navigate('/persons');
        router.back().back();

        router.go(2);
        expect(getHome.calls.length).toEqual(1);
        expect(getPerson.calls.length).toEqual(2);
        expect(getPersons.calls.length).toEqual(2);
        expect(History.getState().url).toEqual(getAbsUrl('/persons'));
    });

    it('lets you trigger routing', function () {
        router.route('/', getHome).perform();

        expect(getHome).toHaveBeenCalled();
    });

    it('triggers statechange event when re-navigating to the current URL/state', function () {
        router.route('/', getHome);
        router.navigate('/');
        router.navigate('/');

        expect(getHome.calls.length).toEqual(2);
    });

    it('pushes state when re-navigating to the current URL with different state or title', function () {
        var path = '/persons', absUrl;
        absUrl = getAbsUrl(path);
        router.route(path, getPersons);
        router.navigate(path);
        router.navigate(path, 'newState');
        router.navigate(path, 'newState', 'newTitle');

        expect(getPersons.calls.length).toEqual(3);
        // Get rid of the first history entry, as this will be the root URL
        history.splice(0, 1);
        expect(history).toEqual([
            {url: absUrl, data: undefined, title: undefined},
            {url: absUrl, data: 'newState', title: undefined},
            {url: absUrl, data: 'newState', title: 'newTitle'},
            ]);
    });
});

(function () {
    var env = jasmine.getEnv();
    env.updateInterval = 250;
    var htmlReporter = new jasmine.HtmlReporter();
    env.addReporter(htmlReporter);
    env.specFilter = function (spec) {
        return htmlReporter.specFilter(spec);
    };

    var curWindowOnLoad = window.onload;
    window.onload = function () {
        if (curWindowOnLoad) {
            curWindowOnLoad();
        }

        //document.querySelector('.version').innerHTML = env.versionString();
        env.execute();
    };
})();

// vim: set sts=4 sw=4 et:
