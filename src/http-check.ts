import { ClientHttp2Session, connect, Http2SecureServer, IncomingHttpHeaders } from "http2";

import { AddressInfo } from "net";

export class HttpCheck {
    protected clientSession: ClientHttp2Session;

    protected server: Http2SecureServer;

    constructor(server: Http2SecureServer) {
        this.server = server;
    }

    public async end() {
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

    public async send(method: string, url: string) {
        return await new Promise((resolve, reject) => {
            const request = this.clientSession.request({
                ":method": method,
                ":path": url,
            });

            let data = "";

            let headers: IncomingHttpHeaders;

            request.on("end", () => {
                resolve({
                    data,
                    headers,
                });
            });

            request.on("error", (err) => {
                reject(err);
            });

            request.on("data", (chunk) => {
                data += chunk;
            });

            request.on("response", (responseHeaders) => {
                headers = responseHeaders;
            });
        });
    }

    public async start() {
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
