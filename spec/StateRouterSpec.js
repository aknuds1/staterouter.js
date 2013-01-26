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
            if (!url.startsWith(baseAddress)) {
                if (!url.startsWith('/')) {
                    url = '/' + url;
                }
                url = baseAddress + url;
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
        var path = '/';
        router.route(path, getHome).navigate(path);
        expect(History.pushState).toHaveBeenCalledWith(undefined, undefined, path);
        expect(getHome).toHaveBeenCalledWith();
        // Router callbacks should be called with the current state as 'this'
        expect(getHome.mostRecentCall.object).toEqual(getState());
    });

    it('should normalize URLs so they start with /', function () {
        router.route('', getHome).navigate('');
        expect(History.pushState).toHaveBeenCalledWith(undefined, undefined, '/');
        expect(getHome).toHaveBeenCalledWith();
    });

    it('should route paths with parameters to mapped functions', function () {
        console.log("!Okidok")
        var route1 = '/persons/:id/:resource';
        var path1 = '/persons/1/person-name';
        router.route(route1, getPerson).navigate(path1);
        expect(History.pushState).toHaveBeenCalledWith(undefined, undefined, path1);
        expect(getPerson).toHaveBeenCalledWith('1', 'person-name');
        console.log("Okidok!")
    });

    it('supports navigating to a location', function () {
        var path = '/persons';
        router.navigate(path);
        expect(History.pushState).toHaveBeenCalledWith(undefined, undefined, path);
    });

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
        expect(History.getState().url).toEqual(baseAddress + '/persons');
    });

    it('lets you trigger routing', function () {
        router.route('/', getHome).perform();

        expect(getHome).toHaveBeenCalled();
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
