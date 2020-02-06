import { readFileSync } from "fs";

import { createSecureServer, Http2SecureServer, Http2ServerRequest, Http2ServerResponse } from "http2";

import { join } from "path";

import { HttpCheck } from "../http-check";

describe("Class HttpCheck", () => {
    describe("Given that the server is a Http2SecureServer", () => {
        let httpCheck: HttpCheck;

        let server: Http2SecureServer;

        beforeAll(async() => {
            server = createSecureServer({
                cert: readFileSync(join(__dirname, "../../ssl/cert.pem")),
                key: readFileSync(join(__dirname, "../../ssl/key.pem")),
            });

            httpCheck = new HttpCheck(server);

            await httpCheck.start();
        });

        afterAll(async() => {
            await httpCheck.end();
        });

        describe("When a request is made", () => {
            afterEach(() => {
                server.removeAllListeners("request");
            });

            test("passes method to the request handler", async() => {
                const sampleMethod = "GET";

                const sampleUrl = "/customers/543/favourites";

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
                        expect(capturedRequest.method).toEqual(sampleMethod);
                    });
            });

            test("passes url to the request handler", async() => {
                const sampleMethod = "GET";

                const sampleUrl = "/customers/543/favourites";

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
                        expect(capturedRequest.url).toEqual(sampleUrl);
                    });
            });

            test("passes url with query parameters to the request handler", async() => {
                const sampleMethod = "GET";

                const sampleUrl = "/customers/543/favourites?q=dried fruit";

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
                        expect(capturedRequest.url).toEqual(sampleUrl);
                    });
            });

            test("passes encoded url with query parameters to the request handler", async() => {
                const sampleMethod = "GET";

                const sampleUrl = encodeURI("/customers/543/favourites?text=dried fruit");

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
                        expect(capturedRequest.url).toEqual(sampleUrl);
                    });
            });

            test("passes headers to the request handler", async() => {
                const sampleMethod = "GET";

                const sampleUrl = "/customers/543/favourites";

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
                        expect(capturedRequest.headers.accept).toEqual(sampleHeaderAccept);

                        expect(capturedRequest.headers["accept-encoding"]).toEqual(sampleHeaderAcceptEncoding);
                    });
            });

            test("passes data to the request handler", async() => {
                const sampleMethod = "POST";

                const sampleUrl = "/customers/543/favourites";

                const sampleData = JSON.stringify({
                    productId: 2558,
                });

                let capturedData = "";

                server.on("request", (request: Http2ServerRequest, response: Http2ServerResponse) => {
                    request.stream.on("data", (chunk) => {
                        capturedData += chunk;
                    });

                    response.end();
                });

                return httpCheck.send({
                    ":method": sampleMethod,
                    ":path": sampleUrl,
                }, sampleData)
                    .then(() => {
                        expect(capturedData).toEqual(sampleData);
                    });
            });

            test("returns status code and data set in the request handler", async() => {
                const sampleMethod = "GET";

                const sampleUrl = "/customers/543/favourites/1";

                const sampleStatusCode = 200;

                const sampleResponseData = JSON.stringify({
                    customerId: 543,
                    key: 1,
                    productId: 2558,
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
                        expect(response)
                            .toHaveProperty("headers.:status", sampleStatusCode);

                        expect(response)
                            .toHaveProperty("data", sampleResponseData);
                    });
            });
        });
    });
});
