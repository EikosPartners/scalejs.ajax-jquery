define([
    'scalejs!core',
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

