"use strict";

const fs = require("fs");

const path = require("path");

const selfsigned = require("selfsigned");

var pem = selfsigned.generate([{ name: 'commonName', value: 'localhost' }], { days: 365 });

fs.writeFileSync(path.join(__dirname, "../tests/fixtures/ssh/cert.pem"), pem.cert);

fs.writeFileSync(path.join(__dirname, "../tests/fixtures/ssh/key.pem"), pem.private);
