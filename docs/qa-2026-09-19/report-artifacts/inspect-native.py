from pathlib import Path
import zipfile, xml.etree.ElementTree as ET, json, sys
from pypdf import PdfReader
p=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).parent
ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
book=next(p.glob('*.xlsx'))
with zipfile.ZipFile(book) as z:
    strings=[''.join(t.text or '' for t in si.findall('.//s:t',ns)) for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',ns)]
    sheets={}
    for name in ('sheet1','sheet2','sheet3'):
        cells={}
        for c in ET.fromstring(z.read(f'xl/worksheets/{name}.xml')).findall('.//s:c',ns):
            v=c.find('s:v',ns)
            if v is not None: cells[c.attrib['r']]=strings[int(v.text)] if c.attrib.get('t')=='s' else v.text
        sheets[name]=cells
    (p/'native-xlsx-values.json').write_text(json.dumps(sheets,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({'emptySharedString41':strings[41], 'summary':sheets['sheet1'], 'exampleEmptyJ2':sheets['sheet2'].get('J2'), 'sheet2CorrectAnswerF5':sheets['sheet2'].get('F5')}))
for pdf in p.glob('*.pdf'):
    reader=PdfReader(pdf)
    text='\n'.join(page.extract_text() or '' for page in reader.pages)
    pdf.with_suffix('.txt').write_text(text,encoding='utf8')
    print(json.dumps({'file':pdf.name,'pages':len(reader.pages),'textLength':len(text),'has42':'42' in text,'has56':'56' in text}))
