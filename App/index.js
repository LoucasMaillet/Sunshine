#!/usr/bin/env node
"use strict"

const Fs = require("fs"),
    Web = require("./web"),
    Root = Web.PathTreeFrom(),
    WebRoot = Root.Views.WebRoot.asRoot(),
    Config = require(Root.App.config),
    Data = require(Root.Views.data);

//* Setup

// Render index.ejs
Web.renderFile(
    Root.Views.Templates.index,
    Root.Views.Build,
    {
        Data, // Content
        Templates: Root.Views.Templates, // Templates path
        WebRoot // Relative root path
    }
)

// Create webserver
const wbs = new Web.Server({
    key: Fs.readFileSync(Root.OpenSSL.key),
    cert: Fs.readFileSync(Root.OpenSSL.cert),
    port: Config.port,
    ip: Config.ip
})

// Add folder
wbs.bind(Root.Views.Build);
wbs.bind(Root.Views.WebRoot);

// Start
wbs.start();
