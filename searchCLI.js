const readline = require('node:readline');
const { stdin: input, stdout: output } = require('node:process');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const {crawl} = require('./spider.js')
const {rankSearchResults} = require('./ranker.js')

function initialize() {
    rl.question('Welcome to TinySearch. Press enter.', () => {
        interact()
    })
}

function interact() {
    rl.question(
        "What are you looking for?\n",
        (answer) => {
        answer = answer.toLowerCase();
        if (answer == 'exit') {
            rl.close();
        } else {
            console.log('Searching...')
            executeSearch(answer, () =>{
                interact()
            });
        }
        }
    );
}
initialize()

async function executeSearch(query, cb) {
    let crawlDepth = 3;
    let startingUrl = 'https://www.python.org';
    let index = new Map()
    index = await crawl(startingUrl, index, crawlDepth);
    let searchResults = index.get(query);
    let rankedResults = await rankSearchResults(index, query, searchResults)
    console.log(rankedResults[0][0])
    cb();
}