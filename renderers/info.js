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
        section.find('#file-id').append($('#file-id').text())
        new Section().render(section, false, function () {
            new PDFViewer()
        })
    }

    handleEditClick(event) {
        new File().edit($('#file-id').text())
    }

    handleOpenClick(event) {
        var fileID = $('#file-id').text()
        var data = ipcRenderer.sendSync('getFile', {'fileID': fileID})

        PDFOpener.open(data.file.Path)
    }
}

new Info()