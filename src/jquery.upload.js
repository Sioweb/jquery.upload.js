(function($){

	"use strict";

	var pluginName = 'upload',
		PluginClass;

	/* Enter PluginOptions */
	$[pluginName+'Default'] = {
		container: window,
		isHtml: false,
		ajax: null,
		confirm: null,
		dragOverTimeout: false,

		filename: 'pdf[file]',

		preventDropDefault: true,
		preventDragoverDefault: true,

		maxSize: (1000*1024*30),

		data: function() {},
		drop: function() {},
		over: function() {},
		change: function() {},

		success: function() {},
		ajaxSend: function() {},

		error: function() {},

		defaultDrop: null,
	};
	

	PluginClass = function() {

		var selfObj = this;
		this.item = false;
		this.initOptions = new Object($[pluginName+'Default']);

		this.uploadElement = null;
		this.uploadArea = null;
		
		this.init = function(elem) {
			selfObj = this;

			if(!this.container)
				this.container = window;
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

		this.loaded = function() {
			selfObj.uploadElement = selfObj.item.find('input[type="file"]');
			selfObj.uploadElement.change(selfObj.internOnChange);

			selfObj.uploadArea = $('<div class="upload_element">Keine Datei ausgewählt</div>').insertBefore(selfObj.uploadElement);

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
		};

		this.internOnChange = function(e) {
			var el = this,
				files = this.files[0],
				form_data = new FormData();

			if(files !== null) {
				form_data.append(selfObj.filename,files);
			}

			selfObj.uploadArea.html('Datei "'+files.name+'" ('+(files.size/1048576).toFixed(2)+') MiB ausgewählt.');

			if(selfObj.ajax !== null) {
				if(selfObj.confirm !== null) {
					$.confirm({
						title: 'Datei hochladen',
						content: 'Soll die ausgewählte Datei nun hochgeladen werden?',
						accept: function(confirmObj) {
							selfObj.send(form_data);
							selfObj.change(selfObj,e);
							el.value = '';
						},
						abort: function() {
							el.value = '';
						}
					});
				} else {
					selfObj.send(form_data);
					selfObj.change(selfObj,e);
					el.value = '';
				}
			}
		};

		this.addFile = function(e) {
			selfObj.internDrop(e);

			return this;
		};


		this.internDrop = function(e) {
			var files = null,
				form_data = new FormData();

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
				form_data.append(selfObj.filename,files[0]);
			}



			if(selfObj.uploadArea !== null) {
				selfObj.uploadArea.html('Datei "'+files[0].name+'" ('+(files[0].size/1048576).toFixed(2)+') MiB ausgewählt.');
			}

			if(selfObj.defaultDrop !== null && typeof selfObj.defaultDrop === 'function') {
				selfObj.defaultDrop(form_data,files,selfObj);
			} else {
				if(selfObj.ajax !== null) {
					if(selfObj.confirm !== null) {
						$.confirm({
							title: 'Datei hochladen',
							content: 'Soll die ausgewählte Datei nun hochgeladen werden?',
							accept: function(confirmObj) {
								selfObj.send(form_data);
							},
							abort: function() {
							}
						});
					} else {
						selfObj.send(form_data);
					}
				}
			}

			selfObj.item.addClass('sw-dropped');

			if(selfObj.isHTML) {
				selfObj.item.removeClass('sw-drag-over');
				selfObj.drop(e,selfObj,form_data);
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

		this.send = function() {
			var data = arguments[0]||{},
				f_data = selfObj.data(selfObj);

			if(f_data && typeof f_data === 'object') {
				for(var d in f_data) {
					data.append(d,f_data[d]);
				}
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
				},
				ajaxSend: function(data) {
					selfObj.ajaxSend(selfObj,data);
				}
			},selfObj.ajax));
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
})(jQuery);