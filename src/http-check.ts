import {
    ClientHttp2Session,
    connect,
    Http2SecureServer,
    IncomingHttpHeaders,
    OutgoingHttpHeaders,
} from "http2";

import { AddressInfo } from "net";

interface HttpCheckResponse {
    data: string;

    headers: IncomingHttpHeaders;
}

export class HttpCheck {
    protected clientSession: ClientHttp2Session;

    protected server: Http2SecureServer;

    constructor(server: Http2SecureServer) {
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

    public async send(headers: OutgoingHttpHeaders, data?: string): Promise<HttpCheckResponse>;
    public async send(headers: OutgoingHttpHeaders): Promise<HttpCheckResponse> {
        let requestData: string;

        let endStream: boolean = true;

        if (arguments.length >= 2) {
            switch (typeof arguments[1]) {
                case "string":
                    requestData = arguments[1];

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

                this.clientSession = connect(
                    "https://localhost:" + addressInfo.port,
                    {
                        rejectUnauthorized: false,
                    },
                    () => {
                        resolve();
                    },
                );
            });
        });
    }
}
