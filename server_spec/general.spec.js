/**
 * Created by Amin on 30/01/2017.
 */
const request = require("request");
const base_url = "http://localhost:3000/";

describe("Express Server", function() {
  describe("GET /", function() {
    it("returns status code 200", function(done) {
      request.get(base_url, function(error, response) {
        expect(response.statusCode).toBe(200);
        done();
      });
    });

    it("contains 'Welcome to Express'", function(done) {
      request.get(base_url, function(error, response, body) {
        expect(body).toContain('Welcome to Express');
        done();
      });
    });
  });
});