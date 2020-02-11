import {
    ClientHttp2Session,
    connect,
    Http2SecureServer,
    IncomingHttpHeaders,
    OutgoingHttpHeaders,
    Http2Server,
} from "http2";

import { AddressInfo } from "net";

import { Server as TlsServer } from "tls";

interface HttpCheckResponse {
    data: string;

    headers: IncomingHttpHeaders;
}

export class HttpCheck {
    protected clientSession: ClientHttp2Session;

    protected server: Http2SecureServer | Http2Server;

    constructor(server: Http2SecureServer | Http2Server) {
        this.server = server;
    }

    public async end(): Promise<void> {
        return new Promise((resolve, reject) => {
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

        return new Promise((resolve, reject) => {
            const request = this.clientSession.request(headers, {
                endStream,
            });

            if (requestData) {
                request.write(requestData);

                request.end();
            }

            let responseData = "";

            let responseHeaders: IncomingHttpHeaders;

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

    public async start(): Promise<void> {
        if (this.server.listening) {
            this.server.close();
        }

        return new Promise((resolve) => {
            this.server.listen(() => {
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
}
