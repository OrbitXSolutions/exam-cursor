import fs from 'node:fs';
import path from 'node:path';
import {here} from './client.mjs';
const runName=process.argv[2]??'phase11-load-ordinary';
const rows=fs.readFileSync(path.join(here,`${runName}-resources.jsonl`),'utf8').trim().split(/\r?\n/).map(s=>JSON.parse(s));
const manifestPath=path.join(here,process.argv[3]??'load-manifest.json');
const manifest=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):null;
const pct=(a,p)=>{const sorted=[...a].sort((x,y)=>x-y);return sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))]??null;};
const describe=samples=>Object.fromEntries(['api','next'].map(name=>{
 const set=samples.filter(x=>x.name===name),values=key=>set.map(x=>x[key]).filter(x=>Number.isFinite(x));
 return [name,{samples:set.length,pids:[...new Set(set.map(x=>x.pid))],workingSetMb:{first:set[0]?.workingSetMb,last:set.at(-1)?.workingSetMb,max:Math.max(...values('workingSetMb'))},privateMemoryMb:{first:set[0]?.privateMemoryMb,last:set.at(-1)?.privateMemoryMb,max:Math.max(...values('privateMemoryMb'))},hostCpuPercent:{p50:pct(values('hostCpuPercent'),.5),p95:pct(values('hostCpuPercent'),.95),max:Math.max(...values('hostCpuPercent'))},threadsMax:Math.max(...values('threadCount')),handlesMax:Math.max(...values('handleCount'))}];
}));
const samples=rows.filter(x=>x.kind==='process'),start=manifest?.startedAt,barrier=manifest?.barrierAt,end=manifest?.completedAt;
const result={classification:manifest?'Actual host process measurements during simulated HTTP/SignalR workload; frontend development server is not50 rendered browsers':'Actual host process baseline while awaiting the prepared workload;50-candidate workload did not start',host:rows.find(x=>x.kind==='host'),sampleStart:samples[0]?.utc,sampleEnd:samples.at(-1)?.utc,workload:{start,barrier,end,requestedCount:manifest?.count,attemptsCreated:manifest?.attempts?.length,reachedFullActiveBarrier:!!barrier,errors:manifest?.errors},all:describe(samples),beforeRun:start?describe(samples.filter(x=>x.utc<start)):null,duringRun:start?describe(samples.filter(x=>x.utc>=start&&(!end||x.utc<=end))):null,fromFullActiveBarrier:barrier?describe(samples.filter(x=>x.utc>=barrier&&(!end||x.utc<=end))):null,afterRun:end?describe(samples.filter(x=>x.utc>end)):null,measurementErrors:rows.filter(x=>x.kind==='measurement-error')};
fs.writeFileSync(path.join(here,`${runName}-resource-summary.json`),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
