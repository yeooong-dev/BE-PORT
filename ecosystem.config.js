module.exports = {
    apps: [
        {
            name: "app",
            script: "node_modules/ts-node/dist/bin.js",
            args: "app.ts",
            watch: true,
            exec_mode: "fork",
            instances: 1,
            interpreter: "node",
            env: {
                NODE_ENV: "development",
                PORT: 3000,
            },
            env_production: {
                NODE_ENV: "production",
                PORT: 3000,
            },
        },
    ],
};
