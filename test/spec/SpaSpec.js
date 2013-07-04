describe("SPA", function () {
  beforeEach(function () {
    this.server = sinon.fakeServer.create();
  });

  afterEach(function () {
    this.server.restore();
  });

  /// init
  describe("init", function () {
    it("should call callback with an object as single parameter", function () {
      var initSpy = jasmine.createSpy();

      new SPA(window.location.href, initSpy);

      this.server.respondWith('{"hello": "world"}');
      this.server.respond();

      waitsFor(function () {
        return initSpy.wasCalled;
      }, 10);

      runs(function () {
        expect(initSpy).toHaveBeenCalledWith(jasmine.any(Object));
      });
    });
  });

  /// ajax
  describe("ajax", function () {
    it("should make a XHR request on init", function () {
      var initSpy = jasmine.createSpy();

      new SPA('/test', initSpy);

      this.server.respondWith('{"hello": "world"}');
      this.server.respond();

      waitsFor(function () {
        return initSpy.wasCalled;
      }, 10);

      runs(function () {
        expect(initSpy).toHaveBeenCalledWith({"hello": "world"});
      });
    });
  });
});