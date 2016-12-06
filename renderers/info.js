/**
 * Created by corsseir on 10/21/16.
 */

const {File} = require('../renderer')
const {PDFViewer} = require('./previewFile.js')
const {Section} = require('../helpers/section.js')
const {PDFOpener} = require('electron').remote.require('./libs/pdfOpener.js')
const {ipcRenderer} = require('electron')

class Info {
    constructor() {
        var self = this

        $(document).on('click', '#preview', self.handlePreviewClick)
        $(document).on('click', '#edit', self.handleEditClick)
        $(document).on('click', '#open', self.handleOpenClick)
    }

    handlePreviewClick(event) {
        var section = new Import().getTemplate('#link-section-preview-file', '#section-preview-file')
        section.find('#start-page').data('file-id', $('#start-page').data('file-id'))
        new Section().render(section, false, function () {
            new PDFViewer()
        })
    }

    handleEditClick(event) {
        new File().edit($('#start-page').data('file-id'))
    }

    handleOpenClick(event) {
        var fileID = $('#start-page').data('file-id')
        var location = ipcRenderer.sendSync('getLocation', {'fileID': fileID})

        PDFOpener.open(location.local.path)
    }
}

new Info()