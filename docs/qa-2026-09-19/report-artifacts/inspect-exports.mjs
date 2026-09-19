import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';
const dir = process.argv[2] ? path.resolve(process.argv[2]) : path.dirname(fileURLToPath(import.meta.url));
const files = await fs.readdir(dir);
const xlsx = files.find(f => f.endsWith('.xlsx'));
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(path.join(dir, xlsx)));
const overview = await wb.inspect({ kind:'workbook,sheet,table', maxChars:14000, tableMaxRows:8, tableMaxCols:10 });
await fs.writeFile(path.join(dir,'xlsx-inspection.txt'), overview.ndjson);
console.log(overview.ndjson);
for (let i=0;i<4;i++) {
  let sheet;
  try { sheet=wb.worksheets.getItemAt(i); } catch { break; }
  const values=sheet.getUsedRange().values;
  await fs.writeFile(path.join(dir,`sheet-${i+1}-values.json`),JSON.stringify(values,null,2));
  console.log(JSON.stringify({index:i,name:sheet.name,rows:values.length,preview:values.slice(0,16)}));
  try {
    const png=await wb.render({sheetName:sheet.name,range:'A1:H24',scale:1,format:'png'});
    await fs.writeFile(path.join(dir,`sheet-${i+1}.png`), new Uint8Array(await png.arrayBuffer()));
  } catch(e) { console.log(`RENDER LIMIT ${sheet.name}: ${e.message}`); }
}
