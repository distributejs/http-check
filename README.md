# DistributeJS HttpCheck

## Introduction
DistributeJS HttpCheck is a utility for checking HTTP server requests and responses in Node.js.

## Supported server types
DistributeJS HttpCheck currently supports checks on:
- Http2SecureServer

## Usage
Initialise HttpCheck passing an instance of Http2SecureServer, like so:
```
const httpCheck = new HttpCheck(server);
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

### Checks with Http2SecureServer in Mocha + Chai
```
import * as chai from "chai";

import { readFileSync } from "fs";

import { createSecureServer } from "http2";

import { HttpCheck } from "@distributejs/http-check";

import { parseParameters } from "path-to-tested-module";

describe("CustomerFavourites", () => {
    let httpCheck: HttpCheck;

    let server: Http2SecureServer;

    before(async () => {
        server = createSecureServer({
            cert: readFileSync("path-to-cert-file"),
            key: readFileSync("path-to-key-file"),
        });

        httpCheck = new HttpCheck(server);

        await httpCheck.start();
    });

    after(async () => {
        await httpCheck.end();
    });

    describe("When a GET request is made", () => {
        afterEach(() => {
            server.removeAllListeners("request");
        });

        it("parses incoming query parameters", () => {
            const method = "GET";

            const url = "/customers/543/favourites";

            // Sample parsed parameters
            const sampleParsedParameters = {};

            let parsedParameters;

            server.on("request", (request, response) => {
                // Collect output from logic performed while processing the request.
                parsedParameters = parseParameters(request);

                response.end();
            });

            return httpCheck.send({
                ":method": method,
                ":path": url,
            })
                .then(() => {
                    chai.expect(parsedParameters).eq(sampleParsedParameters);
                });
        });

        it("responds with a collection of CustomerFavouriteItem objects", () => {
            const method = "GET";

            const url = "/customers/543/favourites";

            // Sample response
            const sampleResponse = {};

            server.on("request", (request, response) => {
                response.end(sampleResponse);
            });

            return httpCheck.send({
                ":method": method,
                ":path": url,
            })
                .then((response) => {
                    chai.expect(response)
                        .property("data", sampleResponse);
                });
        });
    });
});
```

## Working with the project repository

### Generating test cert and key files
Test cert and key files, necessary for running tests, are not included in the repository and need to be generated. They are automatically generated as part of "pretest" script. If you usually run tests using a different method than calling ```npm test```, run ```npm test``` once to generate these files. 
