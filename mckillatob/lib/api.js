(function(chrome) {
    chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
        switch(request.method) {
            case 'setData':
                localStorage['mckillatob'] = JSON.stringify(request.mckillatob);
            case 'getData':
                var mckillatob = JSON.parse(localStorage['mckillatob'] || 'false');
                sendResponse({mckillatob: mckillatob, host: location.host, protocol: location.protocol});
                break;
            case 'removeData':
                delete localStorage['mckillatob'];
                break;
            case 'goTo':
                window.location = request.link;
                break;
            default:
                sendResponse({src: '', config: {}});
        }
        if( request.reload ) {
            window.location.reload();
        }
    });

})(chrome);
