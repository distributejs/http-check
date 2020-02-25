# DistributeJS http-check
[![CircleCI](https://circleci.com/gh/distributejs/http-check.svg?style=svg)](https://circleci.com/gh/distributejs/http-check)

## Introduction
DistributeJS http-check is a utility for checking HTTP server requests and responses in Node.js.

## Supported servers and clients
DistributeJS http-check currently supports checks on:
- Http2SecureServer with HTTP/2 client
- Http2SecureServer with HTTP/1.x client
- Http2Server with HTTP/2 client
- Server from "http" module with HTTP/1.x client
- Server from "https" module with HTTP/1.x client

## Usage
Create a new instance of HttpCheck, passing the server as argument:
```
const httpCheck = new HttpCheck(server);
```

By default, the client is set to HTTP/2. To change it to HTTP/1.x pass `false` in the second argument:

```
const httpCheck = new HttpCheck(server, false);
```

Start listening for connections and connect to the server by calling:
```
httpCheck.start();
```
*Note that the ```start()``` method is asynchronous and returns a Promise.*

Run a check by calling:
```
const response = await httpCheck.send(headers);
```

or with data, by calling:
```
const response = await httpCheck.send(headers, data);
```

Argument ```headers``` must be an object. It should include ```:method``` and ```:path``` properties. It can include any standard or custom request headers, including ```Set-Cookie``` headers.

Optional argument ```data``` must be a string, if defined.

Finally, disconnect from and close the server by calling:
```
httpCheck.end();
```
*Note that the ```end()``` method is asynchronous and returns a Promise.*

## Examples
### Single check with Http2SecureServer
```
import { readFileSync } from "fs";

import { createSecureServer } from "http2";

import { HttpCheck } from "@distributejs/http-check";

(async () => {
    const server = createSecureServer({
        cert: readFileSync("path-to-cert-file"),
        key: readFileSync("path-to-key-file"),
    });

    server.on("request", (request, response) => {
        response.end(JSON.stringify({
            customerId: 543,
            key: 1,
            productId: 2558,
        }));
    });
    
    const httpCheck = new HttpCheck(server);
    
    await httpCheck.start();

    const response = await httpCheck.send({
        ":method": "GET",
        ":path": "/customers/543/favourites",
    });

    await httpCheck.end();
})();

```

### Checks with Http2SecureServer in Jest
```
import { readFileSync } from "fs";

import { createSecureServer, Http2SecureServer } from "http2";

import { HttpCheck } from "@distributejs/http-check";

import { parseParameters } from "path-to-tested-module";

describe("CustomerFavorites", () => {
    let httpCheck: HttpCheck;

    let server: Http2SecureServer;

    beforeAll(async() => {
        server = createHttp2SecureServer({
            cert: readFileSync("path-to-cert-file"),
            key: readFileSync("path-to-key-file"),
        });

        httpCheck = new HttpCheck(server);

        await httpCheck.start();
    });

    afterAll(async() => {
        await httpCheck.end();
    });

    describe("On receiving a request", () => {
        afterEach(() => {
            server.removeAllListeners("request");
        });

        test("Parses incoming query parameters", async() => {
            // Test parsed parameters
            const testParsedParameters = {
                "customerId": 543,
            };

            server.on("request", (request, response) => {
                // Collect output from logic performed while processing the request.
                const parsedParameters = parseParameters(request);

                response.end();

                expect(parsedParameters).toEqual(testParsedParameters);
            });

            await httpCheck.send({
                ":method": "GET",
                ":path": "/customers/543/favourites",
            });
        });

        test("Responds with a collection of CustomerFavoriteItem objects", async() => {
            // Test response body
            const testResponseBody = JSON.stringify({
                favorites: [],
            });

            server.on("request", (request, response) => {
                response.end(testResponseBody);
            });

            const response = await httpCheck.send({
                ":method": "GET",
                ":path": "/customers/543/favourites",
            });

            expect(response).toHaveProperty("data", testResponseBody);
        });
    });
});
```

### Checks with Server from "http" module in Jest
```
import { createServer, Server } from "http";

import { HttpCheck } from "@distributejs/http-check";

import { parseParameters } from "path-to-tested-module";

describe("CustomerFavorites", () => {
    let httpCheck: HttpCheck;

    let server: Server;

    beforeAll(async() => {
        server = createServer();

        httpCheck = new HttpCheck(server, false);

        await httpCheck.start();
    });

    afterAll(async() => {
        await httpCheck.end();
    });

    describe("On receiving a request", () => {
        afterEach(() => {
            server.removeAllListeners("request");
        });

        test("Parses incoming query parameters", async() => {
            // Test parsed parameters
            const testParsedParameters = {
                "customerId": 543,
            };

            server.on("request", (request, response) => {
                // Collect output from logic performed while processing the request.
                const parsedParameters = parseParameters(request);

                response.end();

                expect(parsedParameters).toEqual(testParsedParameters);
            });

            await httpCheck.send({
                ":method": "GET",
                ":path": "/customers/543/favourites",
            });
        });

        test("Responds with a collection of CustomerFavoriteItem objects", async() => {
            // Test response body
            const testResponseBody = JSON.stringify({
                favorites: [],
            });

            server.on("request", (request, response) => {
                response.end(testResponseBody);
            });

            const response = await httpCheck.send({
                ":method": "GET",
                ":path": "/customers/543/favourites",
            });

            expect(response).toHaveProperty("data", testResponseBody);
        });
    });
});
```

## Developers

### Generating test cert and key files
Test cert and key files, necessary for running tests, are not included in the repository and need to be generated. They are automatically generated as part of "pretest" script. If you usually run tests using a different method than calling ```npm test```, run ```npm test``` once to generate these files. 
