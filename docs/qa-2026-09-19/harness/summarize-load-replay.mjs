import fs from 'node:fs';
import path from 'node:path';
import {here,root} from './client.mjs';
const manifest=JSON.parse(fs.readFileSync(path.join(here,'phase11-load-replay-manifest-snapshot.json'),'utf8'));
const start=new Date(manifest.startedAt),end=new Date(manifest.completedAt);
const lines=fs.readFileSync(path.join(root,'Backend-API/Logs/app-log-20260919.txt'),'utf8').split(/\r?\n/);
const records=lines.filter(line=>{
 const m=line.match(/^(\d{4}-\d\d-\d\d) (\d\d:\d\d:\d\d\.\d+) ([+-]\d\d:\d\d)/);
 if(!m)return false;const at=new Date(`${m[1]}T${m[2]}${m[3]}`);
 return at>=start&&at<=end;
});
const errors=records.filter(line=>line.includes('[ERR]')||/StatusCode=5\d\d/.test(line));
const result={classification:'Read-only application log review during the completed simulated50-candidate workload',start:manifest.startedAt,end:manifest.completedAt,matchingLogRecords:records.length,errorLogRecords:errors.length,errorLines:errors,metrics:manifest.metrics,attempts:manifest.attempts.length,activeBarrier:manifest.barrierAt};
fs.writeFileSync(path.join(here,'phase11-load-replay-log-summary.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
