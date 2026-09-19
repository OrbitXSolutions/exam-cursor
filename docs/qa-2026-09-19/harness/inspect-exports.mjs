import fs from 'node:fs';
import {FileBlob,SpreadsheetFile}from'@oai/artifact-tool';
import {here,Evidence}from'./client.mjs';
const e=new Evidence('phase3-export-content-evidence');
for(const name of ['batch-export.xlsx','candidate-export.xlsx','candidate-template.xlsx']){
 const w=await SpreadsheetFile.importXlsx(await FileBlob.load(`${here}/${name}`));
 const sheet=w.worksheets.getItemAt(0),values=sheet.getRange('A1:H6').values;
 const headers=values[0],emailColumn=headers.indexOf('Email');
 const emails=values.slice(1).map(r=>r[emailColumn]).filter(Boolean);
 if(name!=='candidate-template.xlsx')e.check(`${name} contains exactly2 expected candidate rows`,emails.length===2&&emails.includes('qa26.import.a@example.test')&&emails.includes('qa26.import.b@example.test'),{headers,emails});
 else e.check('Import template contains documented required headers',headers.includes('FullName')&&headers.includes('Email')&&headers.includes('RollNo'),{headers});
}
