// Read-only repository inventory and document-link review; no application requests.
// Updates only the QA inventory, generated source list and artifact-audit JSON.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const base=path.resolve('docs/qa-2026-09-19');
const git=args=>execFileSync('git',['-c','core.quotepath=false',...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const names=[...new Set([...git(['diff','--name-only']).split('\n'),...git(['ls-files','--others','--exclude-standard']).split('\n')])].filter(Boolean).sort();
const tests=names.filter(n=>n.startsWith('Backend-API.Tests/')||n.startsWith('Frontend/Smart-Exam-App-main/tests/'));
const production=names.filter(n=>(n.startsWith('Backend-API/')||n.startsWith('Frontend/Smart-Exam-App-main/'))&&!n.startsWith('Backend-API/wwwroot/')&&!tests.includes(n));
const inventory={capturedAt:new Date().toISOString(),branch:git(['branch','--show-current']),head:git(['rev-parse','HEAD']),production,tests,exclusion:'QA documentation/harness/evidence and runtime media fixtures excluded. Snapshot of actual changed/untracked source.'};
fs.writeFileSync(path.join(base,'changed-source-files.json'),JSON.stringify(inventory,null,2)+'\n');
const reportPath=path.join(base,'FINAL-QA-REPORT.md');
let report=fs.readFileSync(reportPath,'utf8').replace(/\r\n/g,'\n');
report=report.replace(/\*\*\d+ production-source files and (?:\d+|seven) test files\*\*/,`**${production.length} production-source files and ${tests.length} test files**`);
const marker='<!-- SOURCE_FILE_LIST: generated below from changed-source-files.json -->';
const start=report.indexOf(marker),end=report.indexOf('## 1. Overall functional readiness');
if(start<0||end<start)throw new Error('Source-list/conclusion markers missing');
report=report.slice(0,start)+marker+'\n\n### Production files\n\n```text\n'+production.join('\n')+'\n```\n\n### Test files\n\n```text\n'+tests.join('\n')+'\n```\n\n'+report.slice(end);
fs.writeFileSync(reportPath,report);
const documents=['FINAL-QA-REPORT.md','coverage-audit.md','phase11-performance-results.md','extra-attempt-workflow.md'];
let linksChecked=0;const missingLinks=[];
for(const name of documents){
 for(const m of fs.readFileSync(path.join(base,name),'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
  const target=m[1].split('#')[0];if(!target||/^[a-z]+:/i.test(target))continue;
  linksChecked++;if(!fs.existsSync(path.resolve(base,target)))missingLinks.push({name,target});
 }
}
const ids=[...report.matchAll(/^\| (D\d{2}) \|/gm)].map(m=>m[1]);
const last=Math.max(...ids.map(id=>Number(id.slice(1))));
const expected=Array.from({length:last},(_,i)=>'D'+String(i+1).padStart(2,'0'));
const result={checkedAt:new Date().toISOString(),documents,linksChecked,missingLinks,findingRows:ids.length,missingFindingIds:expected.filter(x=>!ids.includes(x)),duplicateFindingIds:ids.filter((x,i)=>ids.indexOf(x)!==i),sevenConclusionsAtEnd:[...report.matchAll(/^## [1-7]\. /gm)].length===7&&report.lastIndexOf('\n## ')===report.indexOf('\n## 7.'),productionFiles:production.length,testFiles:tests.length,missingSourceFiles:[...production,...tests].filter(n=>!fs.existsSync(n))};
fs.writeFileSync(path.join(base,'report-artifact-audit.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
if(result.missingLinks.length||result.missingFindingIds.length||result.duplicateFindingIds.length||!result.sevenConclusionsAtEnd||result.missingSourceFiles.length)process.exitCode=1;
