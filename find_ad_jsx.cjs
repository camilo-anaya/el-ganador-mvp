const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:\\Users\\camil\\.gemini\\antigravity\\brain\\2efac539-cfa0-4198-a137-c34196d2714e\\.system_generated\\logs\\transcript.jsonl'),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  if (line.includes('activeAdIndex') && line.includes('adBanner') || line.includes('adCard') || line.includes('adTrack') || line.includes('pasarela') && line.includes('publicidad')) {
    console.log(line.substring(0, 300));
  }
});
