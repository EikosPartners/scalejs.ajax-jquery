/*global define*/
/*jsling sloppy: true*/

define([
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
