
/*global define,console*/
define('ajax',[
    'jquery',
    'scalejs!core',
    'formdata'
], function (
    jQuery,
    core,
    formdata
) {
    'use strict';

    function ajax(url, opts) {
        var observable = core.reactive.Observable,
            merge = core.object.merge,
            log = core.log;

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
                    status: textStatus
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

    function postJson(url, data, options) {
        var jsonString = JSON.stringify(data);
        options = core.object.merge(options, {
            type: 'POST',
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

    return {
        postJson: postJson,
        postMultipart: postMultipart,
        jsonpGet: jsonpGet,
        get: get
    };
});
/*global define*/
/*jsling sloppy: true*/

define('xhr',[
    'scalejs!core'
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
    function ajax ( options ) {
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
        ajax(options);
    }

    // register function to backend
    core.registerExtension({
        ajaxxhr: {
            requestJson : requestJson , 
            ajax: ajax
        }
    });

});

define('scalejs.ajax-jquery',[
    'scalejs!core',
    './ajax',
    './xhr'
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


