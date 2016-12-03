/**
 * Created by corsseir on 11/30/16.
 */

const {ipcRenderer} = require('electron')
const {PDFJS} = require('../libs/pdf.js')

let pdfView
let scrollbarWidth = 15

class PDFViewer {
    constructor() {
        var self = this
        var fileID = $('#start-page').data('file-id')
        var location = ipcRenderer.sendSync('getLocation', {'fileID': fileID})

        self.init(location.local.path, 1)
        $('#start-page').data('location', location.local.path)
        $(document).on('click', '#page-previous', function (event) {
            self.handleClickPager(event, self)
        })
        $(document).on('click', '#page-next', function (event) {
            self.handleClickPager(event, self)
        })
        $(window).resize(function() {
            self.updatePDFSize(event, self)
        })
    }

    init(path, pageNumber) {
        var self = this

        PDFJS.workerSrc = 'libs/pdf.worker.js'
        PDFJS.getDocument(path).then(function(pdf) {
            $('#page-current').empty().text(pageNumber)
            $('#page-all').empty().text(pdf.pdfInfo.numPages)
            self.render(pdf, pageNumber)
        })
    }

    render(pdf, pageNumber) {
        pdf.getPage(pageNumber).then(function(page) {
            var canvas = document.createElement('canvas')
            var context = canvas.getContext('2d')
            var scale = 1.0
            var viewport = page.getViewport(scale)
            var width = $('#start-page').width()
            var height = $('#start-page').height() - 10 //10px margin-bottom

            $('#start-page').empty().append(canvas)
            scale = width / viewport.width
            viewport = page.getViewport(scale)
            canvas.height = viewport.height

            if(viewport.height > height) {
                viewport.width = viewport.width - scrollbarWidth
                console.log('wysokość jest większa')
            }

            canvas.width = viewport.width

            var renderContext = {
                canvasContext: context,
                viewport: viewport
            }
            page.render(renderContext)
        })
        pdfView = pdf
    }

    updatePDFSize(event, self) {
        var currentPage = parseInt($('#page-current').text())

        self.render(pdfView, currentPage)
    }

    handleClickPager(event, self) {
        var currentPage = parseInt($('#page-current').text())
        var maxPage = parseInt($('#page-all').text())
        var limit = false

        if(event.target.id === 'page-previous') {
            if(currentPage > 1) {
                currentPage = currentPage - 1
            } else {
                limit = true
            }
        } else if(event.target.id === 'page-next') {
            if(currentPage < maxPage) {
                currentPage = currentPage + 1
            } else {
                limit = true
            }
        }

        if(! limit) {
            self.render(pdfView, currentPage)
            $('#page-current').text(currentPage)
        }
    }
}

exports.PDFViewer = PDFViewer