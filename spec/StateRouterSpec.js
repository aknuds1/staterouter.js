describe('Test Router', function () {
    var getHome;
    var getPersons;
    var getPerson;
    var router;

    // Trigger the statechange event
    function triggerStateChange() {
        $(window).trigger('statechange');
    }

    beforeEach(function () {
        getHome = jasmine.createSpy('getHome');
        getPersons = jasmine.createSpy('getPersons');
        getPerson = jasmine.createSpy('getPerson');

        router = new staterouter.Router();
        // Start out with '/' as the URL
        var history = [{data: null, title: null, url: '/'}];
        var curState = 0;
        spyOn(History, 'getState').andCallFake(function () {
            if (curState < 0)
                return null;
            return history[curState];
        });
        spyOn(History, 'pushState').andCallFake(function (data, title, url) {
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
    });

    it('should normalize URLs so they start with /', function () {
        router.route('', getHome).navigate('');
        expect(History.pushState).toHaveBeenCalledWith(undefined, undefined, '/');
        expect(getHome).toHaveBeenCalledWith();
    });

    it('should route paths with parameters to mapped functions', function () {
        var route = '/persons/:id/:resource';
        var path = '/persons/1/name';
        router.route(route, getPerson).navigate(path);
        expect(History.pushState).toHaveBeenCalledWith(undefined, undefined, path);
        expect(getPerson).toHaveBeenCalledWith('1', 'name');
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
        expect(History.getState().url).toEqual('/');
    });

    it('supports going forward in browsing history', function () {
        router.route('/', getHome).route('/persons/:id', getPerson).route('/persons', getPersons);
        router.navigate('/persons/1').navigate('/persons');
        router.back().back();

        router.go(2);
        expect(getHome.calls.length).toEqual(1);
        expect(getPerson.calls.length).toEqual(2);
        expect(getPersons.calls.length).toEqual(2);
        expect(History.getState().url).toEqual('/persons');
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
