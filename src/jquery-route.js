jQuery.route = jQuery.route || {

    uri: function(goUri) {
        var href = window.location.href;
        var index = href.indexOf("#!");

        if (goUri) {
            window.location.replace(href.slice(0, index == -1 ? href.length : index) + "#!" + goUri);
            return goUri;
        } else if (index != -1) {
            var uri = href.slice(index + 2, href.length);
            return uri ? uri : "/";
        } else {
            return "/";
        }
    },

    path: function() {
        var uri = this.uri();
        var q = uri.indexOf("?");
        var h = uri.indexOf("#");
        var lastPathIndex = uri.length;

        if (q != -1 && h != -1) lastPathIndex = (q < h ? q : h);
        else if (q != -1 && h == -1) lastPathIndex = q;
        else if (q == -1 && h != -1) lastPathIndex = h;

        return uri.slice(0, lastPathIndex).replace(/\/{2,}/g, "/");
    },

    query: function() {
        var uri = this.uri();
        var q = uri.indexOf("?");
        var h = uri.indexOf("#");

        var match;
        var pl     = /\+/g;
        var search = /([^&=]+)=?([^&]*)/g;
        var decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };
        var query  = uri.slice(q, (h < uri.length && q < h ? h : uri.length)).substring(1);

        urlParams = {};

        while (match = search.exec(query)) {
            urlParams[decode(match[1])] = decode(match[2]);
        }

        return urlParams;
    },

    hash: function() {
        var uri = this.uri();
        var q = uri.indexOf("?");
        var h = uri.indexOf("#");
        return uri.slice(h + 1, (q < uri.length && h < q ? q : uri.length));
    },

    callback: [],

    enchantUrl: function() {
        var href = window.location.href;
        href = href.replace(/#+!+\/*|$/, "#!/");

        var splitIndex = href.indexOf("#!/") + 3;
        var firstHref = href.slice(0, splitIndex);
        var lastHref = href.slice(splitIndex);
        lastHref = lastHref.replace(/\/{2,}/g, "/");
        if (lastHref.length > 0 && lastHref.slice(-1) == "/") lastHref = lastHref.slice(0, -1);
        href = firstHref + lastHref;

        var equal = window.location.href == href;

        if (!equal) {
            window.location.replace(href);
        }

        return equal;
    },

    enchantUrlHandler: function() {
        if (jQuery.route.enchantUrl()) {
            setTimeout(function() {
                var keys = Object.keys(jQuery.route.callback);

                for (var i = 0; i < keys.length; i++) {
                    var existCallback = false;

                    jQuery.each(jQuery.route.callback[keys[i]], function(index, value) {
                        if (value()) {
                            existCallback = true;
                        }
                    })

                    if (existCallback) {
                        break;
                    }
                }
            }, 0);
        }
    },

    loadedRoute: {}
}

jQuery.fn.route = jQuery.fn.route || function(uri, callback, priority) {
    priority = priority || 0;

    if (jQuery.route.callback.length == 0) {
        $(document).ready(jQuery.route.enchantUrlHandler);
        $(window).on('hashchange', jQuery.route.enchantUrlHandler);
    }

    var checkFunc = function() {
        var regex = new RegExp("^" + uri.replace(/\{\*}$/, "(.+)").replace(/\{([^\/]+)}/g, "([^\\/]+)") + "$");
        var path = jQuery.route.path();

        if (regex.test(path)) {
            if (typeof callback == "function") {
                var params = {};
                var paramKeys = regex.exec(uri).slice(1);
                var paramValues = regex.exec(path).slice(1);

                for (var j = 0; j < paramKeys.length; j++) {
                    params[paramKeys[j].replace(/^\{(.+)}$/, "$1")] = paramValues[j];
                }

                callback({
                    params: params,
                    uri: jQuery.route.uri(),
                    path: jQuery.route.path(),
                    query: jQuery.route.query(),
                    hash: jQuery.route.hash()
                })

                return true;
            } else if ( ! jQuery.route.loadedRoute[uri]) {
                $(document).trigger("jqueryRouteLoadStart", [uri]);

                $.getScript(callback)
                    .done(function(script, textStatus) {
                        jQuery.route.loadedRoute[uri] = true;
                        $(window).trigger("hashchange");
                        $(document).trigger("jqueryRouteLoadSuccess", [uri]);
                    })
                    .fail(function(jqxhr, settings, exception) {
                        $(document).trigger("jqueryRouteLoadFail", [uri]);
                    });

                return true;
            }
        }

        return false;
    }

    jQuery.route.callback[priority] = jQuery.route.callback[priority] || [];
    jQuery.route.callback[priority].push(checkFunc);

    return this;
};
