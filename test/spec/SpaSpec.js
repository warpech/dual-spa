describe("SPA", function () {
  /// init
  describe("init", function () {
    it("should call callback with an object as single parameter", function () {
      var callb = jasmine.createSpy();

      runs(function () {
        SPA(window.location.href, callb);
      });

      waitsFor(function () {
        return callb.wasCalled;
      }, 1000);

      runs(function () {
        expect(callb).toHaveBeenCalledWith(jasmine.any(Object));
      });
    });
  });

  /// ajax
  describe("ajax", function () {
    beforeEach(function () {
      this.xhr = sinon.useFakeXMLHttpRequest();
      var requests = this.requests = [];
      this.xhr.onCreate = function (xhr) {
        requests.push(xhr);
      };
    });

    afterEach(function () {
      this.xhr.restore();
    });

    it("should make a XHR request on init", function () {
      /*var server = sinon.fakeServer.create();
       server.respondWith("GET", "/test",
       [200, {"Content-Type": "application/json"},
       '{"id":123,"title":"Hollywood - Part 2"}']);*/

      var callb = jasmine.createSpy();

      SPA('/test', callb);


      this.requests[0].respond(200, { "Content-Type": "application/json" },
        '[{ "id": 12, "comment": "Hey there" }]');

      waitsFor(function () {
        return callb.wasCalled;
      }, 10);

      runs(function () {
        expect(callb).toHaveBeenCalledWith(jasmine.any(Object));
      });
    });
  });
});