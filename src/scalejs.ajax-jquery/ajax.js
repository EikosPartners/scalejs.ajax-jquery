/*global define,console*/
define('scalejs.ajax-jquery/ajax', [
    'jquery',
    'scalejs!core',
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
