(function() {
    var mckillatob = localStorage['mckillatob'];
    if (!mckillatob) {
        mckillatob = {
            config: {
                enable: true,
                enablefunction: {}
            }
        };
    } else {
        mckillatob = JSON.parse(mckillatob);
    }
    
    if( mckillatob && mckillatob.config.enable ) {
        mckillatob.currenthost = location.protocol + '//' + location.hostname;
        console.log('MCKILLATOB active on ' + mckillatob.currenthost + '...', mckillatob);

        var script_settings = document.createElement("script");
        script_settings.innerHTML = 'var mckillatob = ' + JSON.stringify(mckillatob) + ';';
        (document.head||document.documentElement).appendChild(script_settings);

        var script_inject = document.createElement("script");
        script_inject.src = chrome.extension.getURL('lib/inject.js');
        (document.head||document.documentElement).appendChild(script_inject);

        window.addEventListener("message", function(event) {
            if (event.source != window)
                return;

            if (event.data.action && event.data.function_name) {
                if (!mckillatob.config.enablefunction) {
                    mckillatob.config.enablefunction = {};
                }
                if (event.data.action === 'disable') {
                    mckillatob.config.enablefunction[event.data.function_name] = false;
                } else if (event.data.action === 'enable') {
                    mckillatob.config.enablefunction[event.data.function_name] = true;
                }
                localStorage['mckillatob'] = JSON.stringify(mckillatob);
            }
        });
    }
})();
