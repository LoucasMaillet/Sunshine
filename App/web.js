"use strict"

const Fs = require("fs"),
    Path = require("path"),
    Exp = require("express"),
    Ejs = require("ejs"),
    Https = require("https"),
    INDENT = " ".repeat(4);

//* Functions

/**
 * Compile a .ejs file to html
 * @param {String} srcFile
 * @param {PathTree | String} destDir
 * @param {Object} options
 */
function renderFile(srcFile, destDir, options) {
    const srcParse = Path.parse(srcFile);
    Fs.writeFileSync(
        `${destDir}/${srcParse.name}.html`, // build path
        Ejs.render(
            Fs.readFileSync(
                srcFile, // src path
                "utf8"
            ),
            {
                ...options, // Optional content
                date: Date.now() // Date of render
            }
        ).replace(/<!--[\s\S]*?-->/g, "") // remove comment
    )
}

//* Class

class PathTree {
    #path // Path
    /**
     * Create a path tree
     * @param {String} path Starting path
     */
    constructor(path = Path.dirname(__dirname), getChild = true) {
        this.#path = path;
        if (!getChild) return;
        for (let child of Fs.readdirSync(path)) {
            this.pushPath(`${path}/${child}`);
        }
        
    }

    /**
     * Add a file/folder
     * @param {String} parent Starting path
     */
    pushPath(path) {
        const name = Path.parse(path).name;
        if (Fs.lstatSync(path).isDirectory()) this[name] = new PathTree(path);
        else this[name] = path;
    }

    /**
     * Get absolute path from here
     * @param {String | PathTree} path 
     * @returns {String}
     */
    abs(path) {
        return `${path}`.replace(this, '');
    }

    /**
     * Remove something from path
     * @param {String | PathTree} path 
     * @returns {PathTree}
     */
    remove(path) {
        const pathTree = new PathTree(this.#path.replace(path, ''), false);
        for (let k in this) {
            if (typeof (this[k]) === "string") pathTree[k] = this[k].replace(path, '');
            else pathTree[k] = this[k].remove(path);
        }
        return pathTree
    }

    /**
     * Rebuild itself from here as root
     * @returns {PathTree}
     */
    asRoot() {
        return this.remove(this.#path);
    }

    /**
     * Gets his path
     * @returns {String}
     */
    toString() {
        return this.#path
    }

    toTree(indent = '') {
        const keys = Object.keys(this);
        let tree = "";
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            tree += typeof (this[key]) === "object" ? `${indent}├──╼ ${key}\n${this[key].toTree(`${indent}│${INDENT}`)}` : `${indent}├──╼ ${key}\n`;
        }
        const key = keys[keys.length - 1];
        tree += typeof (this[key]) === "object" ? `${indent}└──╼ ${key}\n${this[key].toTree(`${indent} ${INDENT}`)}` : `${indent}└──╼ ${key}\n`;

        return tree
    }
}

class Server {
    constructor(config) {
        this.app = Exp();
        this.config = config;
        this.server = Https.createServer(config, this.app);
    }

    start() {
        this.server.listen(this.config,
            () => {
                console.log(`App is now running on https://${this.config.ip}:${this.config.port}`)
            });
    }

    /**
     * Bind directory to the website
     * @param {PathTree | String} srcDir 
     */
    bind(srcDir) {
        this.app.use(Exp.static(`${srcDir}`));
    }
}

module.exports = {
    PathTree,
    Server,
    renderFile
}
