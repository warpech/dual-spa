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
      var callb = jasmine.createSpy();

      SPA(window.location.href, callb);

      this.server.respondWith('{"hello": "world"}');
      this.server.respond();

      waitsFor(function () {
        return callb.wasCalled;
      }, 10);

      runs(function () {
        expect(callb).toHaveBeenCalledWith(jasmine.any(Object));
      });
    });
  });

  /// ajax
  describe("ajax", function () {
    it("should make a XHR request on init", function () {
      var callb = jasmine.createSpy();

      SPA('/test', callb);

      this.server.respondWith('{"hello": "world"}');
      this.server.respond();

      waitsFor(function () {
        return callb.wasCalled;
      }, 10);

      runs(function () {
        expect(callb).toHaveBeenCalledWith({"hello": "world"});
      });
    });
  });
});