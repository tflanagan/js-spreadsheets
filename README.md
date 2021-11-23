spreadsheets
============

## Exports
```javascript
window.Spreadsheets = {
	Cell: Cell,
	Row: Row,
	Sheet: Sheet,
	parsers: {
		BaseParser: BaseParser,
		CSV: CSVParser,
		TSV: TSVParser
	},
	writers: {
		BaseWriter: BaseWriter,
		CSV: CSVWriter,
		TSV: TSVWriter
	}
}
```


## Types
```typescript
type FileObj = {
	filename: string;
	data: string | ArrayBuffer;
};

type ProgressFn = (this: FileReader, event: ProgressEvent<FileReader>) => any;

class Cell {
	get: () => string;
	set: (contents: string) => Cell;
}
class Row extends Array<Cell>;
class Sheet extends Array<Row>;

class BaseParser {
	getFile: () => FileObj;
	loadFile: (file: File, progress: ProgressFn) => Promise<FileObj>;
	setContents: (contents: BlobPart, filename?: string, fileProps?: FilePropertyBag, progress?: ProgressFn) => Promise<FileObj>;
}

class SVParser extends BaseParser {
	constructor: (delimiter: string = ',') => SVParser;
	getDelimiter: () => string;
	parseFile: () => Promise<Sheet>;
	setDelimiter: (delimiter: string): SVParser;
}

class CSVParser extends SVParser {}

class TSVParser extends SVParser {}

class BaseWriter {
	constructor: (type: string = 'text/plain', charset: string = 'utf-8') => BaseWriter;
	addSheet: (sheet?: Sheet) => Sheet;
	getCharset: () => string;
	getNSheets: () => number;
	getSheet: (i: number) => Sheet;
	getSheets: () => Sheet[];
	getType: () => string;
	setCharset: (charset: string) => BaseWriter;
	setType: (type: string) => BaseWriter;
	saveFile: (name: string = 'download', noAutoBom: boolean = false) => void;
}

class SVWriter extends BaseWriter {
	constructor: (delimiter: string = ',', type: string = 'text/csv', charset: string = 'utf-8') => SVWriter;
	getData: () => string;
	getDelimiter: () => string;
	getBlob: () => Blob;
	setDelimiter: (delimiter: string) => SVWriter;
}

class CSVWriter extends SVWriter {}

class TSVWriter extends SVWriter {}
```

## Examples

```js
// CSV contents from html input source
const inputElementFileOnChangeFunction = async function(event){
	const file = this.files && this.files[0];

	if(file){
		const csvParser = new Spreadsheets.parsers.CSV();

		await csvParser.loadFile(file);

		const csvSheet = await csvParser.parseFile();

		csvSheet.forEach((row, r) => {
			row.forEach((cell, c) => {
				console.log(`Cell (${r}, ${c}) Value: ${cell.get()}`);
			});
		});
	}
};


// CSV contents from non-html input source
const csvRaw = [
	[
		'Row 1 Col 1',
		'Row 1 Col 2',
		'Row 1 Col 3'
	].join(','),
	[
		'Row 2 Col 1',
		'Row 2 Col 2',
		'Row 2 Col 3'
	].join(','),
	[
		'Row 3 Col 1',
		'Row 3 Col 2',
		'Row 3 Col 3'
	].join(',')
].join('\n');

const csvParser = new Spreadsheets.parsers.CSV();

const csvBlob = new Blob([ csvRaw ], {
	type: 'text/csv'
});

await csvParser.setContents(csvBlob);

const csvSheet = await csvParser.parseFile();

csvSheet.forEach((row, r) => {
	row.forEach((cell, c) => {
		console.log(`Cell Value A: ${cell.get()}`);

		cell.set(`Col ${c} Row ${r}`);

		console.log(`Cell Value B: ${cell.get()}`);
	});
});

const csvWriter = new Spreadsheets.writers.CSV();

csvWriter.addSheet(csvSheet);

await csvWriter.saveFile('new.csv');
```