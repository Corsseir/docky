/**
 * Created by corsseir on 10/21/16.
 */

function ButtonBar() {
    var handleBackClick = function (event) {
        $('#side-right').empty();
        new Import().getTemplate('#link-section-default', '#section-default', '#side-right');
    }

    var init = function () {
        $(document).on('click', '#back', handleBackClick);
    }
    init();
}

new ButtonBar();