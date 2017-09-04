var disable_functions = ['atob', 'eval', 'open'];
mckillatob.orig_functions = {};
mckillatob.confirming_functions = {};
if (!mckillatob.currenthost) {
    mckillatob.currenthost = location.protocol + '//' + location.hostname;
}
if (!mckillatob.config) {
    mckillatob.config = {
        enable: true
    };
}
if (!mckillatob.config.enablefunction) {
    mckillatob.config.enablefunction = {};
}
for (var dfid in disable_functions) {
    var disable_function = disable_functions[dfid];
    if (!mckillatob.config.enablefunction[disable_function]) {
        console.log('MCKILLATOB disabling ' + disable_function + ' on ' + mckillatob.currenthost + '...');
        mckillatob.orig_functions[disable_function] = window[disable_function];
        window[disable_function] = function() {
            var kill_function = mckillatob.config.enablefunction[disable_function] !== true;
            if (typeof mckillatob.config.enablefunction[disable_function] === 'undefined' && typeof mckillatob.confirming_functions[disable_function] === 'undefined') {
                mckillatob.confirming_functions[disable_function] = true;
                if (confirm('MCKILLATOB prevented window.' + disable_function + '()\n\nDo you want to keep blocking ' + disable_function + ' on ' + location.protocol + '//' + location.hostname + '?\n\n(OK to continue blocking, cancel to allow in the future)')) {
                    mckillatob.config.enablefunction[disable_function] = false;
                    window.postMessage({ type: 'FROM_PAGE', action: 'disable', function_name: disable_function }, '*');
                } else {
                    window.postMessage({ type: 'FROM_PAGE', action: 'enable', function_name: disable_function }, '*');
                    mckillatob.config.enablefunction[disable_function] = true;
                    kill_function = false;
                }
            }
            if (kill_function) {
                console.log('MCKILLATOB Prevented: window.' + disable_function + '()');
                return false;
            } else {
                mckillatob.orig_functions[disable_function].apply(this, arguments);
            }
        };
    }
}