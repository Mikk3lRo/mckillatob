(function($) {

    var popup = {
        key: 'popup',
        el: {
            popup: $('#mckillatob'),
            popupForm: $('#popup-form'),
            hostSelect: $('#host'),
            hostGoToLink: $('#goto-host'),
            refreshPage: $("#refresh_page"),
            enableCheck: $('#enable'),
            enableCheckAtob: $('#enableAtob'),
            enableCheckOpen: $('#enableOpen'),
            enableCheckEval: $('#enableEval'),
            saveBtn: $('#save'),
            resetBtn: $('#reset'),
            error: $('#error'),
        },
        title: {
            host: {
                select: "List of websites modified by mckillatob",
                goTo:  "Jump to the selected host"
            },
            save: "Save and settings for this host",
            reset: "Clear all settings for this host"
        },
        applyTitles: function() {
            this.el.hostSelect.attr('title', this.title.host.select);
            this.el.hostGoToLink.attr('title', this.title.host.goTo);

            this.el.saveBtn.attr('title', this.title.save);
            this.el.resetBtn.attr('title', this.title.save);
        },
        host: undefined,
        emptyDataPattern: {
            config: {
                enable: true,
                enablefunction: {}
            }
        },
        data: null,
        storage: {
            data: {
                private: {},
                global: {}
            },
            MODE: {
                private: 1,
                global: 2,
            },
            setMode: function(mode) {
                if( mode === this.MODE.private ) {
                    this.key = popup.key + "-" + popup.protocol + "//" + popup.host;
                    this.mode = this.MODE.private;
                }

                if( mode === this.MODE.global ) {
                    this.key = popup.key;
                    this.mode = this.MODE.global;
                }
            },
            load: function() {
                this.setMode(this.MODE.private);
                this._setData(JSON.parse(localStorage.getItem(this.key) || "{}"));

                this.setMode(this.MODE.global);
                this._setData(JSON.parse(localStorage.getItem(this.key) || "{}"));
            },
            _getData: function(key) {
                var storage = popup.storage;
                if( storage.mode == storage.MODE.private ) {
                    if( key ) {
                        return storage.data.private[key];
                    }
                    else {
                        return storage.data.private;
                    }
                }
                if( storage.mode == storage.MODE.global ) {
                    if( key ) {
                        return storage.data.global[key];
                    }
                    else {
                        return storage.data.global;
                    }
                }
            },
            _setData: function(data, key) {
                var storage = popup.storage;
                if( storage.mode == storage.MODE.private ) {
                    if( key ) {
                        storage.data.private[key] = data;
                    }
                    else {
                        storage.data.private = data;
                    }
                }
                if( storage.mode == storage.MODE.global ) {
                    if( key ) {
                        storage.data.global[key] = data;
                    }
                    else {
                        storage.data.global = data;
                    }
                }
            },
            get: function(key) {
                return this._getData(key);
            },
            set: function(arg1, arg2) {
                // arg1 is a key
                if( typeof arg1 === 'string' ) {
                    this._setData(arg2, arg1);
                }
                // arg1 is data
                else {
                    this._setData(arg1);
                }

                var str = JSON.stringify(this._getData() || {});
                localStorage.setItem(this.key, str);
            },
            remove: function(key) {
                if( key ) {
                    var data = this._getData();
                    delete data[key];

                    if( $.isEmptyObject(data) ) {
                        this.remove();
                    }
                    else {
                        var str = JSON.stringify(this._getData());
                        localStorage.setItem(this.key, str);
                    }
                }
                else {
                    localStorage.removeItem(this.key);
                    this._setData({});
                }
            }
        },
        apiclb: {
            onSelectedTab: function(tab) {
                popup.tabId = tab.id;
                chrome.tabs.sendRequest(popup.tabId, {method: "getData", reload: false}, popup.apiclb.onGetData);
            },
            onGetData: function(response) {
                if( !response || typeof response.host !== 'string' ) {
                    popup.error();
                    return;
                }

                /**
                 * Create 'hosts select'
                 */

                popup.host = response.host;
                popup.protocol = response.protocol;

                // Load storage (global, local) IMPORTANT: Must be called first of all storage operations
                popup.storage.load();

                // Set storage to store data accessible from all hosts
                popup.storage.setMode(popup.storage.MODE.global);

                var hosts = popup.storage.get('hosts') || [],
                    url = popup.protocol + "//" + response.host;

                // Add current host to list
                if( hosts.indexOf(url) === -1 ) {
                    hosts.push(url);
                }

                // Fill 'hosts select'
                hosts.forEach(function(host) {
                    var option = $('<option>' + host + '</option>');
                    if( host === url ) {
                        option.attr('selected', 'selected');
                    }
                    popup.el.hostSelect.append(option);
                });

                // Store host (current included in array) if is mckillatob defined
                if( response.mckillatob ) {
                    popup.storage.set('hosts', hosts);
                }

                // Set-up data pattern if empty
                if( !popup.data ) {
                    popup.data = $.extend(true, {}, popup.emptyDataPattern);
                }

                // Merge host's data to defaults
                popup.data = $.extend(popup.data, response.mckillatob);

                // Set storage to store data accessible ONLY from current host
                popup.storage.setMode(popup.storage.MODE.private);

                // Save local copy of live data
                if( response.mckillatob ) {
                    popup.storage.set('data', popup.data);
                }

                // Apply data
                popup.applyData();
            }
        },
        generateScriptDataUrl: function(script) {
            var b64 = 'data:text/javascript';
            // base64 may be smaller, but does not handle unicode characters
            // attempt base64 first, fall back to escaped text
            try {
                b64 += (';base64,' + btoa(script));
            }
            catch(e) {
                b64 += (';charset=utf-8,' + encodeURIComponent(script));
            }

            return b64;
        },
        applyData: function(data) {
            data = data || this.data;

            // Set enable checkbox
            popup.el.enableCheck.prop('checked', data.config.enable);
            popup.el.enableCheckEval.prop('checked', data.config.enablefunction['eval']);
            popup.el.enableCheckOpen.prop('checked', data.config.enablefunction['open']);
            popup.el.enableCheckAtob.prop('checked', data.config.enablefunction['atob']);
        },
        getCurrentData: function() {
            return {
                config: {
                    enable: popup.el.enableCheck.prop('checked'),
                    enablefunction: {
                        atob: popup.el.enableCheckAtob.prop('checked'),
                        eval: popup.el.enableCheckEval.prop('checked'),
                        open: popup.el.enableCheckOpen.prop('checked'),
                    }
                }
            };
        },
        save: function(e) {
            e.preventDefault();

            // Is allowed to save?
            if( popup.el.saveBtn.hasClass('pure-button-disabled') ) {
                return false;
            }

            var data = popup.getCurrentData();

            // Send new data to apply
            chrome.tabs.sendRequest(popup.tabId, {method: "setData", mckillatob: data, reload: true});

            // Save local copy of data
            popup.storage.setMode(popup.storage.MODE.private);
            popup.storage.set('data', popup.data);

            // Close popup
            window.close();

            return false;
        },
        reset: function(e) {
            e.preventDefault();

            // Is allowed to reset?
            if( popup.el.resetBtn.hasClass('pure-button-disabled') ) {
                return false;
            }

            if( confirm('Reset all settings for host ' + host.value + '?') ) {
                // Remove stored data for current host
                popup.storage.setMode(popup.storage.MODE.private);
                popup.storage.remove();

                // Remove host from hosts inside global storage
                popup.storage.setMode(popup.storage.MODE.global);
                var oldHosts = popup.storage.get('hosts'),
                    newHosts = [];
                oldHosts.forEach(function(host) {
                    if( host !== popup.protocol + '//' + popup.host ) {
                        newHosts.push(host);
                    }
                });
                popup.storage.set('hosts', newHosts);

                // Remove mckillatob from frontend
                chrome.tabs.sendRequest(popup.tabId, {method: "removeData", reload: true});

                // Set-up empty data
                popup.data = $.extend(true, {}, popup.emptyDataPattern);
                popup.applyData();

                // Close popup
                window.close();

                return false;

            }

            return false;
        },
        error: function() {
            popup.el.popup.addClass('mckillatob--error');
            popup.el.error.removeClass('is-hidden');
        }
    };

    window.popup = popup;

    /**
     * Add titles to elements
     */

    popup.applyTitles();


    /**
     * Click to goTo host link
     */
    popup.el.hostGoToLink.on('click', function() {
        var link = popup.el.hostSelect.val();
        chrome.tabs.sendRequest(popup.tabId, {method: "goTo", link: link, reload: false});
        window.close();
    });

    popup.el.refreshPage.on('click', function(){
        chrome.tabs.executeScript(popup.tabId, {code: 'location.reload();'});
    });


    /**
     * Connect front end (load info about current site)
     */

    chrome.tabs.getSelected(null, popup.apiclb.onSelectedTab);


    /**
     * Change host by select
     */

    popup.el.hostSelect.on('change', function(e) {
        var host = $(this).val(),
            hostData = JSON.parse(localStorage.getItem(popup.key + '-' + host), true);;
        if( host !== popup.protocol + '//' + popup.host ) {

            // Show goto link
            popup.el.hostGoToLink.removeClass('is-hidden');

            // Hide controls
            popup.el.saveBtn.addClass('pure-button-disabled');
            popup.el.resetBtn.addClass('pure-button-disabled');

            // Apply other host data
            try {
                popup.applyData(hostData.data, true);
            }
            // Hotfix for host without mckillatob
            catch(err) {
                popup.applyData($.extend(true, {}, popup.emptyDataPattern), true);
            }
        }
        else {
            // Hide goto link
            popup.el.hostGoToLink.addClass('is-hidden');

            // Show controls
            popup.el.saveBtn.removeClass('pure-button-disabled');
            popup.el.resetBtn.removeClass('pure-button-disabled');

            // Apply current host data
            popup.applyData(hostData.data);
        }
    });


    /**
     * Save script
     */

    popup.el.saveBtn.on('click', popup.save);

    /**
     * Reset script
     */

    popup.el.resetBtn.on('click', popup.reset);

})(jQuery);
