import { readFileSync } from "fs";

import { createSecureServer, createServer, Http2SecureServer, Http2Server } from "http2";

import { join } from "path";

import { HttpCheck } from "../http-check";

describe("Class HttpCheck", () => {
    describe("Provided a server that is an instance of Http2SecureServer", () => {
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

        describe("On calling send()", () => {
            afterEach(() => {
                server.removeAllListeners("request");
            });

            test("Passes the value of :method to request.method", async() => {
                const testMethod = "GET";

                server.on("request", (request, response) => {
                    response.end();

                    expect(request.method).toEqual(testMethod);
                });

                await httpCheck.send({
                    ":method": testMethod,
                    ":path": "/items/dried-mango",
                });
            });

            test("Passes the value of :url to request.url", async() => {
                const testUri = "/items/dried-mango";

                server.on("request", (request, response) => {
                    response.end();

                    expect(request.url).toEqual(testUri);
                });

                await httpCheck.send({
                    ":method": "DELETE",
                    ":path": testUri,
                });
            });

            test("Passes the value of :url to request.url preserving unencoded characters", async() => {
                const testUri = "/items?q=dried fruit";

                server.on("request", (request, response) => {
                    response.end();

                    expect(request.url).toEqual(testUri);
                });

                await httpCheck.send({
                    ":method": "GET",
                    ":path": testUri,
                });
            });

            test("Passes the value of :url to request.url preserving encoded characters", async() => {
                const testUri = encodeURI("/items?q=dried fruit");

                server.on("request", (request, response) => {
                    response.end();

                    expect(request.url).toEqual(testUri);
                });

                await httpCheck.send({
                    ":method": "GET",
                    ":path": testUri,
                });
            });

            test("Passes headers to request.headers", async() => {
                const testHeaderAccept = "application/json";

                const testHeaderAcceptEncoding = "gzip deflate";

                server.on("request", (request, response) => {
                    response.end();

                    expect(request.headers.accept).toEqual(testHeaderAccept);

                    expect(request.headers["accept-encoding"]).toEqual(testHeaderAcceptEncoding);
                });

                await httpCheck.send({
                    ":method": "GET",
                    ":path": "/items/dried-mango",
                    "accept": testHeaderAccept,
                    "accept-encoding": testHeaderAcceptEncoding,
                });
            });

            test("Passes data to request.stream", async() => {
                const testData = JSON.stringify({
                    "productId": 2558,
                });

                server.on("request", (request, response) => {
                    let chunks = "";

                    request.stream.on("data", (chunk) => {
                        chunks += chunk;
                    });

                    request.stream.on("end", () => {
                        response.end();

                        expect(chunks).toEqual(testData);
                    });
                });

                await httpCheck.send({
                    ":method": "POST",
                    ":path": "/customer/543/favorites",
                }, testData);
            });

            test("Returns response status code and body", async() => {
                const testResponseBody = JSON.stringify({
                    customerId: 543,
                    key: 1,
                    productId: 2558,
                });

                const testResponseStatusCode = 200;

                server.on("request", (request, response) => {
                    response.statusCode = testResponseStatusCode;

                    response.end(testResponseBody);
                });

                const response = await httpCheck.send({
                    ":method": "GET",
                    ":path": "/customer/543/favorites",
                });

                expect(response).toHaveProperty("data", testResponseBody);

                expect(response).toHaveProperty("headers.:status", testResponseStatusCode);
            });
        });
    });

    describe("Provided a server that is an instance of Http2Server", () => {
        let httpCheck: HttpCheck;

        let server: Http2Server;

        beforeAll(async() => {
            server = createServer();

            httpCheck = new HttpCheck(server);

            await httpCheck.start();
        });

        afterAll(async() => {
            await httpCheck.end();
        });

        describe("On calling send()", () => {
            afterEach(() => {
                server.removeAllListeners("request");
            });

            test("Passes the value of :method to request.method", async() => {
                const testMethod = "GET";

                server.on("request", (request, response) => {
                    response.end();

                    expect(request.method).toEqual(testMethod);
                });

                await httpCheck.send({
                    ":method": testMethod,
                    ":path": "/items/dried-mango",
                });
            });

            test("Passes the value of :url to request.url", async() => {
                const testUri = "/items/dried-mango";

                server.on("request", (request, response) => {
                    response.end();

                    expect(request.url).toEqual(testUri);
                });

                await httpCheck.send({
                    ":method": "DELETE",
                    ":path": testUri,
                });
            });

            test("Passes the value of :url to request.url preserving unencoded characters", async() => {
                const testUri = "/items?q=dried fruit";

                server.on("request", (request, response) => {
                    response.end();

                    expect(request.url).toEqual(testUri);
                });

                await httpCheck.send({
                    ":method": "GET",
                    ":path": testUri,
                });
            });

            test("Passes the value of :url to request.url preserving encoded characters", async() => {
                const testUri = encodeURI("/items?q=dried fruit");

                server.on("request", (request, response) => {
                    response.end();

                    expect(request.url).toEqual(testUri);
                });

                await httpCheck.send({
                    ":method": "GET",
                    ":path": testUri,
                });
            });

            test("Passes headers to request.headers", async() => {
                const testHeaderAccept = "application/json";

                const testHeaderAcceptEncoding = "gzip deflate";

                server.on("request", (request, response) => {
                    response.end();

                    expect(request.headers.accept).toEqual(testHeaderAccept);

                    expect(request.headers["accept-encoding"]).toEqual(testHeaderAcceptEncoding);
                });

                await httpCheck.send({
                    ":method": "GET",
                    ":path": "/items/dried-mango",
                    "accept": testHeaderAccept,
                    "accept-encoding": testHeaderAcceptEncoding,
                });
            });

            test("Passes data to request.stream", async() => {
                const testData = JSON.stringify({
                    "productId": 2558,
                });

                server.on("request", (request, response) => {
                    let chunks = "";

                    request.stream.on("data", (chunk) => {
                        chunks += chunk;
                    });

                    request.stream.on("end", () => {
                        response.end();

                        expect(chunks).toEqual(testData);
                    });
                });

                await httpCheck.send({
                    ":method": "POST",
                    ":path": "/customer/543/favorites",
                }, testData);
            });

            test("Returns response status code and body", async() => {
                const testResponseBody = JSON.stringify({
                    customerId: 543,
                    key: 1,
                    productId: 2558,
                });

                const testResponseStatusCode = 200;

                server.on("request", (request, response) => {
                    response.statusCode = testResponseStatusCode;

                    response.end(testResponseBody);
                });

                const response = await httpCheck.send({
                    ":method": "GET",
                    ":path": "/customer/543/favorites",
                });

                expect(response).toHaveProperty("data", testResponseBody);

                expect(response).toHaveProperty("headers.:status", testResponseStatusCode);
            });
        });
    });
});
