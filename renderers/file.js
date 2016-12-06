/**
 * Created by corss on 11/10/2016.
 */

const {ipcRenderer} = require('electron')
const {Tree} = require('../renderer.js')
const {Dialog} = require('electron').remote.require('./helpers/dialog.js')

class File {
    handleOpenClick(event) {
        var path = new Dialog().file()

        $('#id_path').val(path)
    }

    handleAcceptFileAddClick(event) {
        var result
        var data = new Form().collect()
        var notify = new Notification()

        if(data.path.length !== 0) {
            var check = data.path.split('.')
            var length = check.length
            if(check[length - 1] != 'pdf') {
                notify.show('Obsługiwane są tylko pliki PDF', 3000)
            } else {
                notify.show('Dodawanie...', 0, function () {
                    result = ipcRenderer.sendSync('addFile', {'data': data})

                    if (result.status === 'success') {
                        notify.hide()
                        new Tree().addFile(result.file)
                    } else if (result.status === 'exist') {
                        notify.hide(function () {
                            notify.show('Plik istnieje już w bazie danych pod nazwą \'' + result.name + '\'', 3000)
                        })
                    } else if (result.status === 'not_exist') {
                        notify.hide(function () {
                            notify.show('Wskazany plik nie istnieje', 3000)
                        })
                    }
                })
            }
        } else {
            notify.show('Wybierz plik', 3000)
        }
    }

    handleAcceptFileEditClick(event) {
        var result
        var data = new Form().collect()
        var notify = new Notification()

        if(data.name.length !== 0) {
            result = ipcRenderer.sendSync('editFile', {'data': data})

            if (result.status === 'success') {
                new Tree().editFile(data)
            }
        } else {
            notify.show('Wpisz nazwę', 3000)
        }
    }

    constructor() {
        var self = this

        $(document).on('click', '#id_path-icon', self.handleOpenClick)
        $(document).on('click', '#accept-file-add', self.handleAcceptFileAddClick)
        $(document).on('click', '#accept-file-edit', self.handleAcceptFileEditClick)
    }
}

new File()

