/**
 * Created by corsseir on 10/21/16.
 */

const {File} = require('../renderer')
const {PDFViewer} = require('./previewFile.js')

class Info {
    constructor() {
        var self = this

        $(document).on('click', '#preview', self.handlePreviewClick)
        $(document).on('click', '#edit', self.handleEditClick)
    }

    handlePreviewClick(event) {
        var section = new Import().getTemplate('#link-section-preview-file', '#section-preview-file')
        section.find('#start-page').data('file-id', $('#start-page').data('file-id'))
        $('#side-right').empty().append(section)
        new PDFViewer()
    }

    handleEditClick(event) {
        new File().edit($('#start-page').data('file-id'))
    }
}

new Info()