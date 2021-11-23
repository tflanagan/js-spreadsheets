/* Copyright 2017 Tristian Flanagan
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

(function(factory){
	'use strict';

	if(typeof(define) === 'function' && define.amd){
		define('SpreadSheets', [ 'FileSaver' ], factory);
	}else
	if(typeof module !== 'undefined' && module.exports){
		module.exports = factory(require('FileSaver'));
	}

	var test = function(){
		return [
			typeof(FileSaver) === 'function'
		].indexOf(false) === -1
	};

	if(test()){
		window.SpreadSheets = factory(FileSaver);
	}else{
		var nS = setInterval(function(){
			if(!test()){
				return false;
			}

			clearInterval(nS);

			window.SpreadSheets = factory(FileSaver);
		});
	}
})(function(FileSaver){
	'use strict';

	/* Helpers */
		var isSafari = /constructor/i.test(window.HTMLElement) || window.safari,
			isChromeIos = /CriOS\/[\d]+/.test(navigator.userAgent);

		var inherits = function(ctx, superCtx){
			ctx._super = superCtx;

			Object.setPrototypeOf(ctx.prototype, superCtx.prototype);
		};

		var val2sv = function(val){
			if(!val){
				return val;
			}

			if(typeof(val) !== 'number' && (isNaN(val) || !isFinite(val) || ('' + val).match(/e/))){
				if(('' + val).match(/e/)){
					val = val.toString();
				}

				val = val.replace(/\"/g, '""').replace(/\&/g, '&amp;');

				val = '"' + val + '"';
			}

			return val;
		};

	/* Cell */
		var Cell = function(value){
			this.value = value;

			return this;
		};

		Cell.prototype.set = function(value){
			this.value = value;

			return this;
		};

		Cell.prototype.get = function(){
			return this.value;
		};

	/* Row */
		var Row = function(){
			Array.apply(this, arguments);

			return this;
		};

		inherits(Row, Array);

	/* Sheet */
		var Sheet = function(){
			Array.apply(this, arguments);

			return this;
		};

		inherits(Sheet, Array);

	/* Base Parser */
		var BaseParser = function(){
			this._file = undefined;

			return this;
		};

		BaseParser.prototype.getFile = function(){
			if(!this._file){
				throw new Error('File not loaded yet');
			}

			return this._file;
		};

		BaseParser.prototype.loadFile = function(file, progress){
			var that = this;

			return new Promise(function(resolve, reject){
				var reader = new FileReader(),
					callbackCalled = false;

				reader.addEventListener('load', function(){
					if(!callbackCalled){
						callbackCalled = true;

						that._file = {
							filename: file.name,
							data: reader.result
						};

						resolve(that._file);
					}
				});

				reader.addEventListener('progress', progress || function(){});

				reader.addEventListener('error', function(err){
					if(!callbackCalled){
						callbackCalled = true;

						reject(err);
					}
				});

				reader.readAsText(file);
			});
		};

		BaseParser.prototype.setContents = function(contents, filename, fileProps, progress){
			var file = new File([ contents ], filename || 'file.txt', fileProps || {});

			return this.loadFile(file, progress);
		};

	/* SV Parser */
		var SVParser = function(delimiter){
			BaseParser.apply(this, arguments);

			this.setDelimiter(delimiter || ',');

			return this;
		};

		inherits(SVParser, BaseParser);

		SVParser.prototype.getDelimiter = function(){
			return this._delimiter;
		};

		SVParser.prototype.parseFile = function(){
			var that = this;

			return new Promise(function(resolve, reject){
				try {
					var file = that.getFile(),
						text = file.data.replace(/\r\n?|\n/g, '\n'),
						sheet = new Sheet(),
						delimiter = that.getDelimiter(),
						regex = new RegExp('(' + delimiter + ')(?=(?:[^"]|"[^"]*")*$)', 'g');

					text.split('\n').forEach(function(svRow){
						var row = new Row();

						svRow.split(regex).forEach(function(svCell){
							if(svCell === delimiter){
								return;
							}

							svCell = svCell.replace(/(^")(.*)("$)/g, "$2");
							svCell = svCell.replace(/""/g, "\"");

							row.push(new Cell(svCell));
						});

						sheet.push(row);
					});

					resolve(sheet);
				}catch(err){
					reject(err);
				}
			});
		};

		SVParser.prototype.setDelimiter = function(delimiter){
			this._delimiter = delimiter;

			return this;
		};

	/* CSV Parser */
		var CSVParser = function(){
			SVParser.call(this, ',');

			return this;
		};

		inherits(CSVParser, SVParser);

	/* TSV Parser */
		var TSVParser = function(){
			SVParser.call(this, '\t');

			return this;
		};

		inherits(TSVParser, SVParser);

	/* Base Writer */
		var BaseWriter = function(type, charset){
			this._type = type || 'text/plain';
			this._charset = charset;

			this._sheets = [];

			return this;
		};

		BaseWriter.prototype.addSheet = function(sheet){
			if(!sheet){
				sheet = new Sheet();
			}

			if(!(sheet instanceof Sheet)){
				throw new Error('sheet must be of type Sheet');
			}

			this._sheets.push(sheet);

			return sheet;
		};

		BaseWriter.prototype.getCharset = function(){
			return this._charset;
		};

		BaseWriter.prototype.getNSheets = function(){
			return this._sheets.length;
		};

		BaseWriter.prototype.getSheet = function(i){
			return this._sheets[i];
		};

		BaseWriter.prototype.getSheets = function(){
			return this._sheets;
		};

		BaseWriter.prototype.getType = function(){
			return this._type;
		};

		BaseWriter.prototype.setCharset = function(charset){
			this._charset = charset;

			return this;
		};

		BaseWriter.prototype.setType = function(type){
			this._type = type;

			return this;
		};

		BaseWriter.prototype.saveFile = function(name, noAutoBom){
			var blob = this.getBlob(),
				fileSaver = new FileSaver(blob, noAutoBom);

			return fileSaver.save(name || blob.name || 'download');
		};

	/* SV Writer */
		var SVWriter = function(delimiter, type, charset){
			BaseWriter.call(this);

			this.setDelimiter(delimiter || ',')
			this.setCharset(charset || 'utf-8');
			this.setType(type || 'text/csv');

			return this;
		};

		inherits(SVWriter, BaseWriter);

		SVWriter.prototype.getData = function(){
			var data = [],
				delimiter = this.getDelimiter();

			if(this.getNSheets() === 0){
				throw new Error('No Sheets have been added');
			}

			this.getSheet(0).forEach(function(row){
				var dataRow = [];

				row.forEach(function(cell){
					dataRow.push(cell.get());
				});

				data.push(dataRow);
			});

			return data.map(function(row){
				return row.map(function(val){
					return val2sv(val);
				}).join(delimiter);
			}).join('\n');
		};

		SVWriter.prototype.getDelimiter = function(){
			return this._delimiter;
		};

		SVWriter.prototype.getBlob = function(){
			return new Blob([
				this.getData()
			], {
				type: this.getType() + ';charset=' + this.getCharset()
			});
		};

		SVWriter.prototype.setDelimiter = function(delimiter){
			this._delimiter = delimiter;

			return this;
		};

	/* CSV Writer */
		var CSVWriter = function(){
			SVWriter.call(this, ',', 'text/csv', 'utf-8');

			return this;
		};

		inherits(CSVWriter, SVWriter);

	/* TSV Writer */
		var TSVWriter = function(){
			SVWriter.call(this, '\t', 'text/tsv', 'utf-8');

			return this;
		};

		inherits(TSVWriter, SVWriter);

	/* Export */
		return {
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
		};
});
