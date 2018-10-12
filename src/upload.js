import $ from "jquery";
import "sioweb-confirm";
import loadImage from "blueimp-load-image";

(function (factory) {
	
	if(typeof module === "object" && typeof module.exports === "object") {
		module.exports = factory($, window, document);
	} else {
	  factory($, window, document);
	}
  }(function($, window, document, undefined) {

	var pluginName = 'upload',
		PluginClass;

	/* Enter PluginOptions */
	$[pluginName+'Default'] = {
		container: window,
		isHtml: false,
		ajax: null,
		confirm: null,
		max_upload_files: 5,
        dragOverTimeout: false,
        
        height: null,

		filename: 'file',

		preventDropDefault: true,
		preventDragoverDefault: true,

		maxSize: (1000*1024*30),

		data: function() {},
		drop: function() {},
		over: function() {},
		change: function() {},

		ready: function() {},

		success: function() {},
		ajaxSend: function() {},
		loadImageDone: function(el, image, uploadObj) {},

		error: function() {},

		defaultDrop: null,

		preventSubmitOnChange: false,
	};
	

	PluginClass = function() {

		var selfObj = this;
		this.item = false;
		this.initOptions = new Object($[pluginName+'Default']);

		this.uploadElement = null;
		this.uploadArea = null;
		
		this.uploadedFiles = {};
        
        this.form_data = new FormData();
		
		this.init = function(elem) {
			selfObj = this;

			if(!this.container) {
                this.container = window;
            }

			this.elem = elem;
			this.item = $(this.elem);
			this.container = $(this.container);
			this.isHTML = selfObj.elem.tagName.toLowerCase() === 'html';

			$(document).on('dragover',function(){
				clearTimeout(selfObj.dragOverTimeout);
				selfObj.item.removeClass('sw-drag-over');
			});
			
			if(!this.isHTML) {
				this.loaded();
			}
		};

		this.reset = function() {
			if(selfObj.uploadArea !== null) {
				selfObj.uploadArea.html('Keine Datei ausgewählt');
			}
		};

		this.update = function() {
			selfObj.uploadElement = null;
			selfObj.uploadElement = selfObj.item.find('input[type="file"]');
			
			selfObj.uploadElement.each(function() {
				$(this).unbind('change').change(selfObj.internOnChange);
			});
		};

		this.removeFile = function(fileName) {
			selfObj.uploadedFiles[fileName] = null;
			delete selfObj.uploadedFiles[fileName];
		};

		this.loaded = function() {
            selfObj.update();
			
			if(!selfObj.item.find('.upload_element').length) {
				selfObj.uploadArea = $('<div class="upload_element">Keine Datei ausgewählt</div>').insertBefore(selfObj.uploadElement);
			}

			selfObj.item.on('drop',function(e){
				if(selfObj.preventDropDefault) {
					e.stopPropagation();
					e.preventDefault();
				}
				selfObj.internDrop(e);
			}).on('dragover',function(e) {
				if(selfObj.preventDragoverDefault) {
					e.stopPropagation();
					e.preventDefault();
				}
				selfObj.internDragover(e);
			});

			selfObj.ready();
        };

		this.internOnChange = function(e) {
			var el = this,
				files = el.files[0];
                
            // selfObj.form_data = new FormData();
			if(selfObj.height) {
				var loadingImage = loadImage(
					files,
					function (imgCanvas) {
						el.setAttribute('data-value', files.name);
						selfObj.loadImageDone(el, imgCanvas, selfObj);
						files = selfObj.dataURLToBlob(imgCanvas.toDataURL('image/jpeg'));
						files.name = el.getAttribute('data-value');
						selfObj.uploadedFiles[el.name] = files;
						selfObj.handleFile.bind(el)(e, files);
					},
					{
						maxWidth: selfObj.height,
						orientation: true,
						canvas: true
					}
				);
			} else if(files !== null) {
				selfObj.form_data.append(el.name, files);
				selfObj.handleFile.bind(el)(e, files);
			}
		};

		this.handleFile = function(e, files) {
			var el = this,
				originFile = el.files[0];

			$('.upload-size').html('Es werden bis zu '+(originFile.size/1048576).toFixed(2)+') MiB von Ihrem Datenvolumen verbraucht!');

			if(selfObj.ajax !== null) {
				if(selfObj.confirm !== null) {
					$.confirm({
						title: 'Datei hochladen',
						content: 'Soll die ausgewählte Datei nun hochgeladen werden?',
						accept: function(confirmObj) {
							selfObj.send(selfObj.form_data);
							selfObj.change(selfObj.form_data,files,selfObj,e);
							el.value = '';
						},
						abort: function() {
							el.value = '';
						}
					});
				} else {
					if(!selfObj.preventSubmitOnChange) {
						selfObj.send(selfObj.form_data);
                    }
					selfObj.change(selfObj.form_data,originFile,selfObj,e);
					el.value = '';
				}
			} else {
				selfObj.change(selfObj.form_data,originFile,selfObj,e);
            }
		}

		this.addFile = function(e) {
			selfObj.internDrop(e);

			return this;
		};


		this.internDrop = function(e) {
			var files = null;

            selfObj.form_data = new FormData();

			if(typeof e.originalEvent.dataTransfer != 'undefined') {
				files = e.originalEvent.dataTransfer.files;
			}
			
			if(files !== null) {
				if(files[0].size > selfObj.maxSize) {
					selfObj.error({
						error: 'size',
						given: files[0].size,
						allowed: selfObj.maxSize
					});
					return;
				}
				selfObj.form_data.append(selfObj.filename,files[0]);
			}

			if(selfObj.uploadArea !== null) {
				selfObj.uploadArea.html('Datei "'+files[0].name+'" ('+(files[0].size/1048576).toFixed(2)+') MiB ausgewählt.');
			}

			if(selfObj.defaultDrop !== null && typeof selfObj.defaultDrop === 'function') {
				selfObj.defaultDrop(selfObj.form_data,files,selfObj);
			} else {
				if(selfObj.ajax !== null) {
					if(selfObj.confirm !== null) {
						$.confirm({
							title: 'Datei hochladen',
							content: 'Soll die ausgewählte Datei nun hochgeladen werden?',
							accept: function(confirmObj) {
								selfObj.send(selfObj.form_data);
							},
							abort: function() {
							}
						});
					} else {
						selfObj.send(selfObj.form_data);
					}
				}
			}

			selfObj.item.addClass('sw-dropped');

			if(selfObj.isHTML) {
				selfObj.item.removeClass('sw-drag-over');
				selfObj.drop(e,selfObj,selfObj.form_data);
			}
		},

		this.internDragover = function(e) {
			clearTimeout(selfObj.dragOverTimeout);
			selfObj.item.addClass('sw-drag-over');
			selfObj.dragOverTimeout = setTimeout(function () {
				selfObj.item.removeClass('sw-drag-over');
			}, 400);
			selfObj.over(e);
		};
		
		this.clone = function(src) {
			return Object.assign({}, src);
		}

		this.send = function() {			
			var data = arguments[0]||selfObj.form_data,
				f_data = selfObj.data(selfObj),
				chunkIndex = 0,
				chunkedFileArray = [];

			for(var fileName in selfObj.uploadedFiles) {
				if(chunkedFileArray[chunkIndex] === undefined) {
					chunkedFileArray[chunkIndex] = {};
				}

				chunkedFileArray[chunkIndex][fileName] = selfObj.uploadedFiles[fileName];

				if(Object.keys(chunkedFileArray[chunkIndex]).length === selfObj.max_upload_files) {
					chunkIndex++;
				}
			}

			for(var chunk in chunkedFileArray) {
				data = new FormData();
				if(f_data && typeof f_data === 'object') {
					for(var d in f_data) {
						data.append(d,f_data[d]);
					}
				}

				for(var fileName in chunkedFileArray[chunk]) {
					data.append(fileName, chunkedFileArray[chunk][fileName]);
				}

				$.ajax($.extend(true,{
					url: '/',
					method: 'POST',
					data: data,
					asych: false,
					cache: false,
					contentType: false,
					processData: false,
					success: function(data) {
						selfObj.success(selfObj,data);
						selfObj.form_data = new FormData();
						selfObj.uploadedFiles = {};
					},
					ajaxSend: function(data) {
						selfObj.ajaxSend(selfObj,data);
					}
				},selfObj.ajax));
			}
		};

        this.dataURLToBlob = function(dataURL) {
            var BASE64_MARKER = ';base64,';
            if (dataURL.indexOf(BASE64_MARKER) == -1) {
                var parts = dataURL.split(',');
                var contentType = parts[0].split(':')[1];
                var raw = parts[1];
        
                return new Blob([raw], {type: contentType});
            }
        
            var parts = dataURL.split(BASE64_MARKER);
            var contentType = parts[0].split(':')[1];
            var raw = window.atob(parts[1]);
            var rawLength = raw.length;
        
            var uInt8Array = new Uint8Array(rawLength);
        
            for (var i = 0; i < rawLength; ++i) {
                uInt8Array[i] = raw.charCodeAt(i);
            }
        
            return new Blob([uInt8Array], {type: contentType});
        };
        
        this.resizeImage = function(file) {
			var reader = new FileReader();

            reader.onload = function (readerEvent) {
                var image = new Image(),
					scale = 2,
					loaded = false;

                image.onload = function (imageEvent) {
					var dataUrl,
						canvas = document.createElement('canvas'),
						ctx = canvas.getContext('2d');

					
					if(image.height / scale > selfObj.height) {
						image.height = image.height / scale;
						image.width = image.width / scale;
				
						canvas.height = image.height;
						canvas.width = image.width;
						ctx.drawImage(image, 0, 0, image.height, image.width);
						image.src = canvas.toDataURL('image/jpeg');
					} else {
						var finalImage = new Image();

						finalImage.onload = function (imageEvent) {
							var canvas = document.createElement('canvas'),
								ctx = canvas.getContext('2d');

							if (finalImage.height > finalImage.width) {
								if (finalImage.height > selfObj.height) {
									finalImage.width *= selfObj.height / finalImage.height;
									finalImage.height = selfObj.height;
								}
							} else {
								if (finalImage.width > selfObj.height) {
									finalImage.height *= selfObj.height / finalImage.width;
									finalImage.width = selfObj.height;
								}
							}

							canvas.height = finalImage.height;
							canvas.width = finalImage.width;
							ctx.drawImage(image, 0, 0, finalImage.height, finalImage.width);
							// finalImage.src = canvas.toDataURL('image/jpeg');
							// dataUrl = finalImage.src;
							dataUrl = canvas.toDataURL('image/jpeg');

							var resizedImage = selfObj.dataURLToBlob(dataUrl);

							var EventData = {
								type: "imageResized",
								blob: resizedImage,
								url: dataUrl
							};
							EventData[selfObj.filename] = resizedImage;
							$.event.trigger(EventData);
						}

						finalImage.src = image.src;
					}
				}
                image.src = readerEvent.target.result;
            }
            reader.readAsDataURL(file);
        };
	};

	$[pluginName] = $.fn[pluginName] = function(settings) {
		var element = typeof this === 'function'?$('html'):this,
			newData = arguments[1]||{},
			returnElement = [];
				
		returnElement[0] = element.each(function(k,i) {
			var pluginClass = $.data(this, pluginName);

			if(!settings || typeof settings === 'object' || settings === 'init') {

				if(!pluginClass) {
					if(settings === 'init') {
						settings = arguments[1] || {};
					}
					pluginClass = new PluginClass();

					var newOptions = new Object(pluginClass.initOptions);

					if(settings) {
						newOptions = $.extend(true,{},newOptions,settings);
					}
					pluginClass = $.extend(newOptions,pluginClass);
					/** Initialisieren. */
					this[pluginName] = pluginClass;
					pluginClass.init(this);
					if(element.prop('tagName').toLowerCase() !== 'html') {
						$.data(this, pluginName, pluginClass);
					} else returnElement[1] = pluginClass;
				} else {
					pluginClass.init(this,1);
					if(element.prop('tagName').toLowerCase() !== 'html') {
						$.data(this, pluginName, pluginClass);
					} else returnElement[1] = pluginClass;
				}
			} else if(!pluginClass) {
				return;
			} else if(pluginClass[settings]) {
				var method = settings;
				returnElement[1] = pluginClass[method](newData);
			} else {
				return;
			}
		});

		if(returnElement[1] !== undefined) {
			return returnElement[1];
		}
		return returnElement[0];
	};
}));