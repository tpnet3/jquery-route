$(document).ready(function() {
    $(window).route('/{first}/{seconds}', function(req) {
        $("body").html(JSON.stringify(req));
    })
})
