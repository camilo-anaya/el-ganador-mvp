const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:\\Users\\camil\\.gemini\\antigravity\\brain\\2efac539-cfa0-4198-a137-c34196d2714e\\.system_generated\\logs\\transcript.jsonl'),
  crlfDelay: Infinity
});

let lineNum = 0;
rl.on('line', (line) => {
  lineNum++;
  if (lineNum >= 13525 && lineNum <= 13535) {
    try {
      const parsed = JSON.parse(line);
      console.log(`=== LINE ${lineNum} (step ${parsed.step_index}) ===`);
      console.log(parsed.content ? parsed.content.substring(0, 500) : (parsed.thinking ? parsed.thinking.substring(0, 300) : 'no content'));
      if (parsed.tool_calls) console.log('tool calls:', JSON.stringify(parsed.tool_calls));
    } catch (e) {
      console.log(`=== LINE ${lineNum} raw:`, line.substring(0, 200));
    }
  }
});
