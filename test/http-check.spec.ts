import * as chai from "chai";

import { readFileSync } from "fs";

import { createSecureServer, Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from "http2";

import { join } from "path";

import { HttpCheck } from "../src/http-check";

describe("Class HttpCheck", () => {
    describe("Given that the server is an HTTP secure server", () => {
        let httpCheck: HttpCheck;

        let server;

        before(async () => {
            server = createSecureServer({
                cert: readFileSync(join(__dirname, "/fixtures/ssh/cert.pem")),
                key: readFileSync(join(__dirname, "/fixtures/ssh/key.pem")),
            });

            httpCheck = new HttpCheck(server);

            await httpCheck.start();
        });

        after(async () => {
            await httpCheck.end();
        });

        describe("When sending a request", () => {
            afterEach(() => {
                server.removeAllListeners("request");
            });

            it("passes method to the request handler", async () => {
                const sampleMethod = "GET";

                const sampleUrl = "/tags";

                let capturedRequest: Http2ServerRequest;

                server.on("request", (request: Http2ServerRequest, response: Http2ServerResponse) => {
                    capturedRequest = Object.create(request);

                    response.end();
                });

                return httpCheck.send({
                    ":method": sampleMethod,
                    ":path": sampleUrl,
                })
                    .then(() => {
                        chai.expect(capturedRequest.method).eq(sampleMethod);
                    });
            });

            it("passes url to the request handler", async () => {
                const sampleMethod = "GET";

                const sampleUrl = "/tags";

                let capturedRequest: Http2ServerRequest;

                server.on("request", (request: Http2ServerRequest, response: Http2ServerResponse) => {
                    capturedRequest = Object.create(request);

                    response.end();
                });

                return httpCheck.send({
                    ":method": sampleMethod,
                    ":path": sampleUrl,
                })
                    .then(() => {
                        chai.expect(capturedRequest.url).eq(sampleUrl);
                    });
            });

            it("passes url with query parameters to the request handler", async () => {
                const sampleMethod = "GET";

                const sampleUrl = "/tags?text=User story";

                let capturedRequest: Http2ServerRequest;

                server.on("request", (request: Http2ServerRequest, response: Http2ServerResponse) => {
                    capturedRequest = Object.create(request);

                    response.end();
                });

                return httpCheck.send({
                    ":method": sampleMethod,
                    ":path": sampleUrl,
                })
                    .then(() => {
                        chai.expect(capturedRequest.url).eq(sampleUrl);
                    });
            });

            it("passes encoded url with query parameters to the request handler", async () => {
                const sampleMethod = "GET";

                const sampleUrl = encodeURI("/tags?text=User story");

                let capturedRequest: Http2ServerRequest;

                server.on("request", (request: Http2ServerRequest, response: Http2ServerResponse) => {
                    capturedRequest = Object.create(request);

                    response.end();
                });

                return httpCheck.send({
                    ":method": sampleMethod,
                    ":path": sampleUrl,
                })
                    .then(() => {
                        chai.expect(capturedRequest.url).eq(sampleUrl);
                    });
            });

            it("passes headers to the request handler", async () => {
                const sampleMethod = "GET";

                const sampleUrl = "/tags";

                const sampleHeaderAccept = "application/json";

                const sampleHeaderAcceptEncoding = "gzip deflate";

                let capturedRequest: Http2ServerRequest;

                server.on("request", (request: Http2ServerRequest, response: Http2ServerResponse) => {
                    capturedRequest = Object.create(request);

                    response.end();
                });

                return httpCheck.send({
                    ":method": sampleMethod,
                    ":path": sampleUrl,
                    "accept": sampleHeaderAccept,
                    "accept-encoding": sampleHeaderAcceptEncoding,
                })
                    .then(() => {
                        chai.expect(capturedRequest.headers.accept).eq(sampleHeaderAccept);

                        chai.expect(capturedRequest.headers["accept-encoding"]).eq(sampleHeaderAcceptEncoding);
                    });
            });

            it("returns status code and data set in the request handler", async () => {
                const sampleMethod = "GET";

                const sampleUrl = "/tags/23";

                const sampleStatusCode = 200;

                const sampleResponseData = JSON.stringify({
                    id: 23,
                    text: "User story",
                });

                server.on("request", (request: Http2ServerRequest, response: Http2ServerResponse) => {
                    response.statusCode = sampleStatusCode;

                    response.end(sampleResponseData);
                });

                return httpCheck.send({
                    ":method": sampleMethod,
                    ":path": sampleUrl,
                })
                    .then((response) => {
                        chai.expect(response)
                            .property("headers")
                            .property(":status", sampleStatusCode);

                        chai.expect(response)
                            .property("data", sampleResponseData);
                    });
            });
        });
    });
});
