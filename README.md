spreadsheets
============

```
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

```
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
	addSheet: (sheet) => BaseWriter;
	getCharset: () => string;
	getNSheets: () => number;
	getSheet: (i: number) => Sheet;
	getSheets: () => Sheet[];
	getType: () => string;
	setCharset: (charset: string) => BaseWriter;
	setType: (type: string) => BaseWriter;
	saveFile: (name: string = 'download', noAutoBom: boolean = false) => void;
}

class SVWriter {
	constructor: (delimiter: string = ',', type: string = 'text/csv', charset: string = 'utf-8') => SVWriter;
	getData: () => string;
	getDelimiter: () => string;
	getBlob: () => Blob;
	setDelimiter: (delimiter: string) => SVWriter;
}

class CSVWriter extends SVWriter {}

class TSVWriter extends SVWriter {}
```
