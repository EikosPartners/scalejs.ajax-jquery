define([
    'scalejs.core', 'scalejs!application'
], function(
    core
) {
    var ajax = core.ajax;

    // For deeper testing, log to console
    console.log('core.ajax: ', ajax);

    describe('core.ajax', function() {

        it('is defined', function() {
            expect(ajax).toBeDefined();
        });

    });
});

