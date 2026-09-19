import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
import {here,privateConfig} from './client.mjs';
const workbook=Workbook.create(),sheet=workbook.worksheets.add('Candidates');
sheet.getRange('A1:F4').values=[
 ['FullName','FullNameAr','Email','Password','RollNo','Mobile'],
 ['QA26 Import A','استيراد ألف','qa26.import.a@example.test',privateConfig().password,'QA26-IMP-A','+971501111111'],
 ['QA26 Import B','استيراد باء','qa26.import.b@example.test','','QA26-IMP-B','+971502222222'],
 ['QA26 Invalid Import','استيراد غير صالح','not-an-email','','QA26-IMP-INVALID','abc']
];
sheet.getRange('A1:F1').format={fill:'#203D59',font:{bold:true,color:'#FFFFFF'}};
sheet.getRange('A1:F4').format.columnWidth=28;
sheet.getRange('C1:D4').format.columnWidth=45;
sheet.getRange('A1:F4').format.rowHeight=24;
sheet.showGridLines=false;
workbook.recalculate();
const review=await workbook.inspect({kind:'table',range:'Candidates!A1:C4',include:'values',tableMaxRows:4,tableMaxCols:3});
console.log(review.ndjson);
const preview=await workbook.render({sheetName:'Candidates',range:'A1:C4',scale:1,format:'png'});
await fs.writeFile(`${here}/import-preview.png`,new Uint8Array(await preview.arrayBuffer()));
const output=await SpreadsheetFile.exportXlsx(workbook);await output.save(`${here}/.env.qa-import.xlsx`);
console.log('Wrote ignored private import fixture');
