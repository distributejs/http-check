module.exports = {
    collectCoverage: true,
    coveragePathIgnorePatterns: ["/node_modules/"],
    coverageReporters: ["text"],
    preset: "ts-jest",
    testEnvironment: "node",
    testPathIgnorePatterns: ["/node_modules/"]
};
