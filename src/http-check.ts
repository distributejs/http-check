import { request as httpRequest, Server as HttpServer } from "http";

import { ClientHttp2Session, connect, Http2SecureServer, Http2Server, IncomingHttpHeaders, IncomingHttpStatusHeader, OutgoingHttpHeaders } from "http2";

import { request as httpsRequest, RequestOptions, Server as HttpsServer } from "https";

import { AddressInfo } from "net";

import { Server as TlsServer } from "tls";

interface HttpCheckResponse {
    data: string;

    headers: IncomingHttpHeaders;
}

export class HttpCheck {
    protected clientSession: ClientHttp2Session;

    protected readonly http2Client: boolean;

    protected readonly server: HttpServer | HttpsServer | Http2SecureServer | Http2Server;

    constructor(server: HttpServer | HttpsServer | Http2SecureServer | Http2Server, http2Client = true) {
        this.server = server;

        this.http2Client = http2Client;
    }

    public async end(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.clientSession) {
                this.server.close((err) => {
                    if (err) {
                        reject(err);

                        return;
                    }

                    resolve();
                });

                return;
            }

            this.clientSession.close(() => {
                this.server.close((err) => {
                    if (err) {
                        reject(err);

                        return;
                    }

                    resolve();
                });
            });
        });
    }

    public async send(headers: OutgoingHttpHeaders, data?: string): Promise<HttpCheckResponse> {
        let requestData: string;

        let endStream = true;

        if (data) {
            switch (typeof data) {
                case "string":
                    requestData = data;

                    endStream = false;

                    break;
            }
        }

        return this.clientSession ? this.sendHttp2Request(headers, endStream, requestData) : this.sendHttp1Request(headers, requestData);
    }

    public async start(): Promise<void> {
        if (!this.http2Client) {
            if (this.server.constructor.name == "Http2Server") {
                throw new Error("Use of HTTP1.x client is not supported with a server that is an instance of Http2Server");
            }
        }

        const a = this.server.constructor;

        if (this.server.listening) {
            this.server.close();
        }

        return new Promise((resolve) => {
            this.server.listen(() => {
                if (!this.http2Client) {
                    resolve();

                    return;
                }

                const addressInfo = this.server.address() as AddressInfo;

                const protocol = this.server instanceof TlsServer ? "https" : "http";

                const options = this.server instanceof TlsServer ? {
                    rejectUnauthorized: false,
                } : {};

                this.clientSession = connect(
                    protocol + "://localhost:" + addressInfo.port,
                    options,
                    () => {
                        resolve();
                    },
                );
            });
        });
    }

    protected sendHttp1Request(headers: OutgoingHttpHeaders, requestData?: string): Promise<HttpCheckResponse> {
        return new Promise((resolve, reject) => {
            const addressInfo = this.server.address() as AddressInfo;

            const protocol = this.server instanceof TlsServer ? "https:" : "http:";

            const path = headers[":path"] as string;

            delete headers[":method"];

            delete headers[":path"];

            const options: RequestOptions = {
                headers,
                path,
                port: addressInfo.port,
                protocol,
                rejectUnauthorized: false,
            };

            const requestFn = this.server instanceof TlsServer ? httpsRequest : httpRequest;

            const request = requestFn(options, (response) => {
                let responseData = "";

                const responseHeaders: IncomingHttpHeaders & IncomingHttpStatusHeader = response.headers;

                responseHeaders[":status"] = response.statusCode;

                response.on("data", (chunk) => {
                    responseData += chunk;
                });

                response.on("end", () => {
                    resolve({
                        data: responseData,
                        headers: responseHeaders,
                    });
                });
            });

            request.on("error", (err) => {
                reject(err);
            });

            request.end(requestData);
        });
    }

    protected sendHttp2Request(headers: OutgoingHttpHeaders, endStream: boolean, requestData?: string): Promise<HttpCheckResponse> {
        return new Promise((resolve, reject) => {
            const request = this.clientSession.request(headers, {
                endStream,
            });

            if (requestData) {
                request.write(requestData);

                request.end();
            }

            let responseData = "";

            let responseHeaders: IncomingHttpHeaders & IncomingHttpStatusHeader;

            request.on("end", () => {
                resolve({
                    data: responseData,
                    headers: responseHeaders,
                });
            });

            request.on("error", (err) => {
                reject(err);
            });

            request.on("data", (chunk) => {
                responseData += chunk;
            });

            request.on("response", (incomingHeaders) => {
                responseHeaders = incomingHeaders;
            });
        });
    }
}
