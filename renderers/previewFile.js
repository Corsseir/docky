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
        var data = ipcRenderer.sendSync('getFile', {'fileID': fileID})

        self.init(data.file.Path, 1)
        $('#start-page').data('location', data.file.Path)
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
            self.render(pdf, pageNumber, true, function () {
                $('canvas').fadeIn(100)
            })
        })
    }

    render(pdf, pageNumber, hide, callback) {
        pdf.getPage(pageNumber).then(function(page) {
            var canvas = document.createElement('canvas')
            var context = canvas.getContext('2d')
            var scale = 1.0
            var viewport = page.getViewport(scale)
            var width = $('#start-page').width()
            var height = $('#start-page').height() - 10 //10px margin-bottom

            if(hide) {
                $(canvas).css('display', 'none')
            }

            $('#start-page').empty().append(canvas)
            scale = width / viewport.width
            viewport = page.getViewport(scale)
            canvas.height = viewport.height

            if(viewport.height > height) {
                viewport.width = viewport.width - scrollbarWidth
            }

            canvas.width = viewport.width

            var renderContext = {
                canvasContext: context,
                viewport: viewport
            }

            page.render(renderContext)
            pdfView = pdf

            callback && callback()
        })
    }

    updatePDFSize(event, self) {
        var currentPage = parseInt($('#page-current').text())

        self.render(pdfView, currentPage, false)
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
            $('canvas').fadeOut(100, function () {
                self.render(pdfView, currentPage, true, function () {
                    $('#page-current').text(currentPage)
                    $('canvas').fadeIn(100)
                })
            })
        }
    }
}

exports.PDFViewer = PDFViewer