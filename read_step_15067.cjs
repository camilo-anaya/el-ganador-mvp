const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:\\Users\\camil\\.gemini\\antigravity\\brain\\2efac539-cfa0-4198-a137-c34196d2714e\\.system_generated\\logs\\transcript.jsonl'),
  crlfDelay: Infinity
});

let found = false;
rl.on('line', (line) => {
  if (line.includes('"step_index":15067') || line.includes('"step_index":15068')) {
    console.log(line);
  }
});
