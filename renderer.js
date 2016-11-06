// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const scan = require('electron').remote.require('./components/scanPDF.js').Scan

function Start () {
    var init = function (event) {
        new Import().getTemplate('#link-section-default', '#section-default', '#side-right');
    }
    init();
}

function Folder () {
    var handleFolderClick = function (event) {
        var folder = $(event.target);
        var folderIcon = folder.find('i');
        var folderList = folder.closest('li').find('ul').first();

        if(folderIcon.hasClass('fa-folder')) {
            folderIcon.removeClass('fa-folder');
            folderIcon.addClass('fa-folder-open');

            if(typeof(folderList) !== 'undefined') {
                folderList.show();
            }
        } else if(folderIcon.hasClass('fa-folder-open')) {
            folderIcon.removeClass('fa-folder-open');
            folderIcon.addClass('fa-folder');

            if(typeof(folderList) !== 'undefined') {
                folderList.hide();
            }
        }
    }

    var init = function () {
        $(document).on('click', '.folder', handleFolderClick);
    }
    init();
}

function File () {
    var handleFileClick = function (event) {
        $(document).find('#side-right').first().empty();
        new Import().getTemplate('#link-section-info', '#section-info', '#side-right');
    }

    var init = function () {
        $(document).on('click', '.file', handleFileClick);
    }
    init();
}

function Scan () {
    var handleClick = function (event) {
        var response = scan.proceed()

        console.log(response.status)
    }

    var init = function () {
        $(document).on('click', '#scan', handleClick)
    }
    init()
}

new Start();
new Folder();
new File();
new Scan();

