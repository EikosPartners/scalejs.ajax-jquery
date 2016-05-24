/*global define,console*/
define('scalejs.ajax-jquery/ajax', [
    'jquery',
    'scalejs.core',
    'scalejs.reactive'
], function (
    jQuery,
    core
) {
    'use strict';

    var observable = core.reactive.Observable,
        merge = core.object.merge,
        toArray = core.array.toArray,
        log = core.log;

    function ajax(url, opts) {

        return observable.create(function (observer) {
            /*jslint unparam: true*/
            function success(data, textStatus, jqXhr) {
                observer.onNext(data);
            }
            /*jslint unparam: false*/

            /*jslint unparam: true*/
            function error(jqXhr, textStatus, errorThrown) {
                log.error('Error: "' + errorThrown + ': ' + textStatus + ' in response to ' + url + '"');
                observer.onError({
                    error: errorThrown,
                    status: textStatus,
                    message: jqXhr.responseText
                });
            }

            function complete() {
                observer.onCompleted();
            }
            /*jslint unparam: false*/

            var settings = merge({
                type: 'GET',
                success: success,
                error: error,
                complete: complete
            }, opts);

            jQuery.ajax(url, settings);

            return function () { };
        });
    }

    function get(url, data, options) {
        options = core.object.merge(options, {
            type: 'GET',
            data: data
        });

        return ajax(url, options);
    }

    function postMultipart(url, data, options) {
        var fdata = new FormData(),
            fields = Object.keys(data);

        fields.forEach(function (field) {
            fdata.append(field, data[field]);
        });

        if (fdata.fake) {
            options = core.object.merge(options, {
                type: 'POST',
                data: fdata,
                contentType: 'multipart/form-data; boundary=' + fdata.boundary,
                processData: false
            });
        } else {
            options = core.object.merge(options, {
                type: 'POST',
                data: fdata,
                contentType: false,
                processData: false
            });
        }

        return ajax(url, options);
    }
    function sendJson(url, data, options) {
        var jsonString = JSON.stringify(data);
        options = core.object.merge(options, {
            data: jsonString,
            contentType: 'application/json',
            processData: false
        });

        return ajax(url, options);
    }

    function jsonpGet(url, data, options) {
        var params = jQuery.param(data);
        options = core.object.merge(options, {
            type: 'GET',
            dataType: 'jsonp'
        });

        console.error('url: ' + url + '?' + params);
        return ajax(url + '?' + params, undefined, options);
    }
    function getMany() {
        return core.reactive.Observable.forkJoin(toArray(arguments).map(function (arg) {
            if (typeof arg === 'string') {
                 return get(arg);
            }
            return get(arg.url, arg.data, arg.options);
        }));
    }
    return {
        sendJson: sendJson,
        postMultipart: postMultipart,
        jsonpGet: jsonpGet,
        get: get,
        getMany: getMany
    };
});

/*global define*/
/*jsling sloppy: true*/

define('scalejs.ajax-jquery/xhr',[
    'scalejs.core'
], function (
    core
) {

    'use strict';
    var merge = core.object.merge;
    /**
     * Open connection to backend and post
     * @param {Object} Object       Object with data to be posted
     * @param {Function} callback   callback function
     */
    function xhr ( options ) {
       var settings = merge({
            ondone: null,
            type: 'GET',
            data: '',
            uri: null
        }, options);

        if ('function' !== typeof settings.ondone) {
            throw new TypeError('ajax: ondone must be function');
        }
        if (['POST', 'GET', 'PUT'].indexOf(settings.type) !== -1 ) {
            throw new Error('type not valid');
        }
        if (!settings.uri) {
            throw new Error('ajax: must provide uri');
        }

        var r = new XMLHttpRequest();

        r.onreadystatechange = function () {
            if (r.readyState !== 4) {
                return;
            }
            if (r.status !== 200) {
                return settings.ondone('request failed with status ' + r.status);
            }
            settings.ondone(null, r.responseText);
        };

        var abort = r.abort.bind(r);
        r.abort = function () {
            settings.ondone(null, null);
            abort();
        };
        r.open(settings.type, settings.uri, true);
        r.setRequestHeader('Content-Type', 'application/json');
        r.send(settings.data);
        return r;
    }

    function requestJson ( options ) {
      
        var cb = options.ondone;

        options.ondone = function ( err, data ) {
            if (err) {
                cb(err);
            } else {
                cb(null, JSON.parse(data));
            }
        };

        options.data = JSON.stringify(options.data);
        xhr(options);
    }
return {
        requestJson: requestJson,
        xhr: xhr
    };
});

/*global define*/
/*jsling sloppy: true*/

define('scalejs.ajax-jquery/formdata',[],function () {
    'use strict';
    var w = window;
    if (w.FormData){
        return;
    }
    function FormData() {
        this.fake = true;
        this.boundary = '--------FormData' + Math.random();
        this._fields = [];
    }
    FormData.prototype.append = function (key, value) {
        this._fields.push([key, value]);
    }
    FormData.prototype.toString = function () {
        var boundary = this.boundary;
        var body = '';
        this._fields.forEach(function (field) {
            body += '--' + boundary + '\r\n';
            // file upload
            if (field[1].name) {
                var file = field[1];
                body += 'Content-Disposition: form-data; name=\"' + field[0] + '\'; filename=\"' + file.name + '\"\r\n';
                body += 'Content-Type: ' + file.type + '\r\n\r\n';
                body += file.getAsBinary() + '\r\n';
            } else {
                body += 'Content-Disposition: form-data; name=\"' + field[0] + '\";\r\n\r\n';
                body += field[1] + '\r\n';
            }
        });
        body += '--' + boundary + '--';
        return body;
    }
    w.FormData = FormData;

    return FormData;

});

define('scalejs.ajax-jquery',[
    'scalejs.core',
    './scalejs.ajax-jquery/ajax',
    './scalejs.ajax-jquery/xhr',
    './scalejs.ajax-jquery/formdata'
], function (
    core,
    ajax,
    xhr
) {
    'use strict';

    // There are few ways you can register an extension.
    // 1. Core and Sandbox are extended in the same way:
    //      core.registerExtension({ part1: part1 });
    //
    // 2. Core and Sandbox are extended differently:
    //      core.registerExtension({
    //          core: {corePart: corePart},
    //          sandbox: {sandboxPart: sandboxPart}
    //      });
    //
    // 3. Core and Sandbox are extended dynamically:
    //      core.registerExtension({
    //          buildCore: buildCore,
    //          buildSandbox: buildSandbox
    //      });
    core.registerExtension({ajax: ajax , xhr:xhr});
});


