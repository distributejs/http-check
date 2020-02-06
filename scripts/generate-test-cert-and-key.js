"use strict";

const fs = require("fs");

const path = require("path");

const selfsigned = require("selfsigned");

const certFilePath = path.join(__dirname, "../ssh/cert.pem");

const keyFilePath = path.join(__dirname, "../ssh/key.pem");

if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
    const pem = selfsigned.generate([{ name: 'commonName', value: 'localhost' }], { days: 365 });

    fs.writeFileSync(certFilePath, pem.cert);

    fs.writeFileSync(keyFilePath, pem.private);
}
