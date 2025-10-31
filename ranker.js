const winkNLP = require('wink-nlp');
const model = require('wink-eng-lite-web-model');
const nlp = winkNLP(model);
const its = nlp.its;
const jsdom = require("jsdom")
const { JSDOM } = jsdom;

async function searchPage(query, url, onSuccess) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const pageContent = await response.text();
        return onSuccess(query, pageContent);
    } catch (err) {
        console.error(err);
    }
}

function calcScore(query, pageContent) {
    const dom = new JSDOM(pageContent);
    const { document } = dom.window;
    // query = query.toLowerCase();
    query = nlp.readDoc(query).tokens().out(its.lemma)[0];
    let titles = [];
    let headers = [];
    let paragraphs = [];
    let score = 0;
    document.querySelectorAll('h1').forEach(title => {
        titles.push(title.textContent.toLowerCase());
    });
    document.querySelectorAll('h2, h3, h4, h5, h6').forEach(header => {
        headers.push(header.textContent.toLowerCase());
    })
    document.querySelectorAll('p').forEach(paragraph => {
        paragraphs.push(paragraph.textContent.toLowerCase());
    })
    // scores are calculated here
    titles.forEach(title => {
        if (title.includes(query)) {
            //scoring: title includes the term
            score += 10;
        }
    })
    headers.forEach(header => {
        if (header.includes(query)) {
            //scoring: headers include the term
            score += 2;
        }
    })
    paragraphs.forEach(paragraph => {
        const words = nlp.readDoc(paragraph).tokens().out(its.lemma)
        words.forEach(word => {
            //scoring: each instance of the term in paragraphs
            if (word.trim() == query) {
                score++;
            }
        })
    })
    return score;
}

 

async function rankSearchResults(index, query, searchResults) {
    let scoreTable = [];
    for await (const url of searchResults) {
        let score = await searchPage(query, url, calcScore);
        scoreTable.push([url, score]);
    }
    scoreTable = scoreTable.sort((a, b) => {
        return b[1] - a[1];
    })
    return scoreTable;
}

module.exports = {searchPage, calcScore, rankSearchResults}