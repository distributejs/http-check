import * as chai from "chai";

import { readFileSync } from "fs";

import { createSecureServer, Http2ServerRequest, Http2ServerResponse } from "http2";

import { join } from "path";

import { HttpCheck } from "../src/http-check";

describe("Class HttpCheck", () => {
    let httpCheck: HttpCheck;

    let handleRequest: (request: Http2ServerRequest, response: Http2ServerResponse) => void;

    before(async () => {
        const server = createSecureServer({
            cert: readFileSync(join(__dirname, "/fixtures/ssh/cert.pem")),
            key: readFileSync(join(__dirname, "/fixtures/ssh/key.pem")),
        }, (request, response) => {
            handleRequest(request, response);
        });

        httpCheck = new HttpCheck(server);

        await httpCheck.start();
    });

    after(async () => {
        await httpCheck.end();
    });

    describe("When sending a GET request with no parameters, custom headers or cookies", () => {
        const sampleStatusCode = 200;

        const sampleData = JSON.stringify({ greeting: "Hello" });

        before(() => {
            handleRequest = (request, response) => {
                response.statusCode = sampleStatusCode;

                response.end(sampleData);
            };
        });

        it("returns status code and data sent by the server", async () => {
            return httpCheck.send("GET", "/greet")
                .then(async (response) => {
                    chai.expect(response)
                        .property("headers")
                        .property(":status", sampleStatusCode);

                    chai.expect(response)
                        .property("data", sampleData);
                });
        });
    });
});
