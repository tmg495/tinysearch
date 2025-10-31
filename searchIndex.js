// Wink NLP is copyright 2017-25 GRAYPE Systems Private Limited.
// It is licensed under the terms of the MIT License.
// import * as winkNLP from 'wink-nlp';
// import * as model from 'wink-eng-lite-web-model';
const winkNLP = require('wink-nlp');
const model = require('wink-eng-lite-web-model')
const nlp = winkNLP(model);
const its = nlp.its;
// 
// import * as ranker from './ranker.js'

const createIndex = function () {
    return new Map()
}

const addPageToIndex = function (index, url, pageContent) {
    url = url.toLowerCase();
    urlCheck(url);
    const keywords = extractKeywords(pageContent);
    keywords.forEach(keyword => {
        if (!index.has(keyword)) {
            index.set(keyword, [])
        }
        if (!index.get(keyword).includes(url)) {
            index.get(keyword).push(url)
        }
    })
}

const updatePageInIndex = function (index, url, newPageContent) {
    removePageFromIndex(index, url);
    addPageToIndex(index, url, newPageContent);
}

const removePageFromIndex = function(index, url) {
    url = url.toLowerCase();
    urlCheck(url);
    let urlList = [];
    index.keys().forEach(keyword => {
         urlList = index.get(keyword);
         urlList = urlList.filter(str => str != url);
         index.set(keyword, urlList);
    })
}

const getPagesForKeyword = function(index, keyword) {
    // lemmatizes the keyword to capture variants
    keyword = nlp.readDoc(keyword).tokens().out(its.lemma)[0];
    
    if (index.has(keyword)) {
        return index.get(keyword);
    } else {
        return [];
    }
}

const extractKeywords = function(pageContent) {
    //implements lemmatization to bundle similar words
    const doc = nlp.readDoc(pageContent);
    let strings = doc.tokens().out(its.lemma);
    strings = strings.filter(str => isAlpha(str));
    strings = strings.filter(str => !isStopWord(str));
    return strings;
}

const isStopWord = function (word) {
    const stopList = ['a', 'of', 'on', 'i', 'for', 'with', 'the', 'at', 'from', 'in', 'to'];
    return stopList.includes(word)
}

const isAlpha = function (str) {
    //regular expression to remove punctuation, other than -
    return /^[a-zA-Z-]+$/.test(str);
}

const urlCheck = function (url) {
    try {
        if (!url.includes('.')) {
            throw new Error('Domain not separated by periods.');
        }
        if (!(url.includes('http://') || url.includes('https://'))) {
            throw new Error('Missing http string.');
        }
    } catch (error) {
        console.error('URL Error: ', error.message);
    }
}

module.exports = {createIndex, addPageToIndex, updatePageInIndex, removePageFromIndex, getPagesForKeyword}

// let index = createIndex();
// addPageToIndex(index, 'https://www.thebomb.com', 'The quick brown fox jumped over the lazy dog.');
// updatePageInIndex(index, 'https://www.TheBomb.com', 'The agile moose jumped over the quick fox, which jumped over the lazy dog.');
// addPageToIndex(index, 'https://www.oneupper.com', 'The even quicker brown fox jumped over the much lazier dog.');
// addPageToIndex(index, 'https://www.shouting.org', 'THE QUICK FOX DID WHAT? NOT CLICKBAIT')
// console.log(index);
// console.log(getPagesForKeyword(index, 'jumped'));