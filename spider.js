const {addPageToIndex, updatePageInIndex} = require('./searchIndex')
const winkNLP = require('wink-nlp')
const model = require('wink-eng-lite-web-model');
const nlp = winkNLP(model);
const its = nlp.its;
const jsdom = require("jsdom")
const { JSDOM } = jsdom;
const url = require('node:url');

async function searchPage(query, searchURL, onSuccess) {
    try {
        const response = await fetch(searchURL);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const pageContent = await response.text();
        return onSuccess(query, pageContent);
    } catch (err) {
        console.error(err);
    }
}

async function crawl(startingUrl, index, crawlDepth) {
    try{
        if (crawlDepth <= 0) {
            return index;
        } 
        //dictates how many links to investigate
        const crawlBreadth = 3;
        //check robots.txt
        if (!checkRobots(startingUrl)) {
            throw new Error('Path is protected.');
        }
        //fetches the starting url and adds it to the index
        let response = await fetch(startingUrl);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        let pageContent = await response.text();
        let dom = new JSDOM(pageContent);
        let { document } = dom.window;
        let text = [];
        //retrieves data from just headings and paragraphs
        document.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach(portion => {
            text.push(portion.textContent)
        })
        let rawString = text.toString();
        if (index.has(rawString)) {
            updatePageInIndex(index, startingUrl, rawString)
        } else {
           addPageToIndex(index, startingUrl, rawString);
        }
        //makes an array of urls to continue the crawl
        let linkList = [];
        document.querySelectorAll('a').forEach(link => {
            linkList.push(link.href);
        })
        linkList = linkList.filter((link) => link[0] == '/' || link[0] == 'h');
        for (let i=0;i<linkList.length;i++){
            let link = linkList[i];
            if (link[0] == '/') {
                linkList[i] = startingUrl + link;
            }
        }
        //fetch data from links
        if (linkList.length > 1) {
            for (i=0;i<crawlBreadth;i++) {
                //which links to crawl to are chosen randomly
                let num = Math.floor(Math.random()*linkList.length)
                await crawl(linkList[num], index, crawlDepth-1)
            }
            return index;
        }
    } catch (err) {
        console.error(err);
    }
}

async function checkRobots (checkURL) {
    try {
        let link = new URL(checkURL);
        const response = await fetch(link.origin +'/robots.txt');
        if (!response.ok) {
            throw new Error('Invalid link to robots.txt')
        }
        const pageContent = await response.text();
        let lines = pageContent.split('\n');
        let banList = [];
        lines.forEach(line => {
            if (line.includes('Disallow')) {
                banList.push(line.slice(10));
            }
        })
        banList.forEach(path => {
            if (checkURL.includes(path)) {
                return false;
            }
        })
        return true;
    } catch (err) {
        console.error(err)
    }
}

module.exports = {crawl}