/**
 * Created by corss on 11/10/2016.
 */

const {ipcRenderer} = require('electron')
const {Tree} = require('../renderer.js')
const {Dialog} = require('electron').remote.require('./helpers/dialog.js')
const {PDFJS} = require('../libs/pdf.js')

class File {
    showMetaData(path) {
        var notify = new Notification()

        PDFJS.workerSrc = 'libs/pdf.worker.js'
        PDFJS.getDocument(path).then(function (pdf) {
            pdf.getMetadata().then(function (metadata) {
                if (typeof metadata !== 'undefined') {
                    if (typeof metadata.info !== 'undefined') {
                        $('#id_tag').val('')
                        if (typeof metadata.info.Author !== 'undefined') {
                            if(metadata.info.Author !== '')
                            {
                                $('#id_tag').val($('#id_tag').val() + 'author:' + metadata.info.Author.split(' ').join('_'))
                            }
                        }

                        if (typeof metadata.info.Title !== 'undefined') {
                            if(metadata.info.Title !== '') {
                                if ($('#id_tag').val().length !== 0) {
                                    $('#id_tag').val($('#id_tag').val() + ' ')
                                }

                                $('#id_tag').val($('#id_tag').val() + 'title:' + metadata.info.Title.split(' ').join('_'))
                            }
                        }
                    }
                }
            })
        }).catch(function(err) {
            notify.show('Błędna ścieżka', 3000)
        });
    }

    handleOpenClick(event, self) {
        var path = new Dialog().file()

        $('#id_path').val(path)
        self.showMetaData(path[0])
    }

    handlePathKeyPress(event, self) {
        if(event.which === 13) {
            self.showMetaData($('#id_path').val())
        }
    }

    check(tags) {
        var notify = new Notification()
        var result = true

        if (tags != '') {
            tags = tags.split(' ')

            for (var i = 0; i < tags.length; i++) {
                var tag = tags[i].split(':')

                if (tag.length === 1 || tag.length > 2) {
                    notify.show('Błędny zapis jednego ze słów kluczowych', 3000)
                    result = false
                    break
                } else if (tag.length === 2) {
                    if (tag[1] === '') {
                        notify.show('Klucz musi posiadać wartość', 3000)
                        result = false
                        break
                    }
                }
            }
        }

        return result
    }

    handleAcceptFileAddClick(event, self) {
        var result
        var data = new Form().collect()
        var notify = new Notification()
        var isValid = self.check(data.tag)

        if (isValid) {
            if (data.path.length !== 0) {
                var check = data.path.split('.')
                var length = check.length
                if (check[length - 1].indexOf('pdf') !== 0) {
                    notify.show('Obsługiwane są tylko pliki PDF', 3000)
                } else {
                    notify.show('Dodawanie...', 0, function () {
                        result = ipcRenderer.sendSync('addFile', {'data': data})

                        if (result.status === 'success') {
                            notify.hide()
                            new Tree().addFile(result.file)
                        } else if (result.status === 'not_exist') {
                            notify.hide(function () {
                                notify.show('Wskazany plik nie istnieje', 3000)
                            })
                        } else if (result.status === 'wrong_url') {
                            notify.hide(function () {
                                notify.show('Błędny adres URL', 3000)
                            })
                        } else if (typeof result.file !== 'undefined') {
                            if (result.status === 'exist') {
                                notify.hide(function () {
                                    notify.show('Plik istnieje już w bazie danych pod nazwą \'' + result.file.Filename + '\'', 3000)
                                })
                            }
                        }
                    })
                }
            } else {
                notify.show('Wybierz plik', 3000)
            }
        }
    }

    handleAcceptFileEditClick(event, self) {
        var result
        var data = new Form().collect()
        var notify = new Notification()
        var isValid = self.check(data.tag)

        if (isValid) {
            if (data.name.length !== 0) {
                result = ipcRenderer.sendSync('editFile', {'data': data})

                if (result.status === 'success') {
                    new Tree().editFile(data)
                }
            } else {
                notify.show('Wpisz nazwę', 3000)
            }
        }
    }

    constructor() {
        var self = this

        $(document).on('click', '#id_path-icon', function (event) {
            self.handleOpenClick(event, self)
        })
        $(document).on('keypress', '#id_path', function (event) {
            self.handlePathKeyPress(event, self)
        })
        $(document).on('click', '#accept-file-add', function (event) {
            self.handleAcceptFileAddClick(event, self)
        })
        $(document).on('click', '#accept-file-edit', function (event) {
            self.handleAcceptFileEditClick(event, self)
        })
    }
}

new File()

