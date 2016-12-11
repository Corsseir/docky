// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {remote} = require('electron')
const {ipcRenderer} = require('electron')
const {Menu, MenuItem} = remote
const {Section} = require('./helpers/section.js')
const {Dialog} = require('electron').remote.require('./helpers/dialog.js')
const menuRoot = new Menu()
const menuCollection = new Menu()
const menuCollectionFake = new Menu()
const menuFile = new Menu()
const menuFileLimited = new Menu()
const contextMenuItems = {
    'root': {
        'addFile': new MenuItem({
            label: 'Dodaj Plik', click() {
                new File().add()
            }
        }),
        'addFiles': {
            'flat': new MenuItem({
                label: 'Dodaj Pliki', click() {
                    new File().addMany('flat')
                }
            }),
            'recursive': new MenuItem({
                label: 'Dodaj Pliki (rekurencyjnie)', click() {
                    new File().addMany('recursive')
                }
            }),
        },
        'addCollection': new MenuItem({
            label: 'Dodaj Kolekcje', click() {
                new Collection().add()
            }
        }),
        'paste': new MenuItem({
            label: 'Wklej', enabled: false, click() {
                new Collection().paste()
            }
        }),
        'refresh': new MenuItem({
            label: 'Odśwież', click() {
                new Collection().refresh()
            }
        }),
    },
    'collection': {
        'addFile': new MenuItem({
            label: 'Dodaj Plik', click() {
                new File().add()
            }
        }),
        'addFiles': {
            'flat': new MenuItem({
                label: 'Dodaj Pliki', click() {
                    new File().addMany('flat')
                }
            }),
            'recursive': new MenuItem({
                label: 'Dodaj Pliki (rekurencyjnie)', click() {
                    new File().addMany('recursive')
                }
            }),
        },
        'addCollection': new MenuItem({
            label: 'Dodaj Kolekcje', click() {
                new Collection().add()
            }
        }),
        'edit': new MenuItem({
            label: 'Edytuj', click() {
                new Collection().edit()
            }
        }),
        'paste': new MenuItem({
            label: 'Wklej', enabled: false, click() {
                new Collection().paste()
            }
        }),
        'remove': {
            'collection': new MenuItem({
                label: 'Usuń z kolekcji', click() {
                    new Collection().confirm('collection')
                }
            }),
            'global': new MenuItem({
                label: 'Usuń z biblioteki', click() {
                    new Collection().confirm('global')
                }
            }),
        },
        'fake': new MenuItem({
            label: 'Usuń', click() {
                $('#collection-0').remove()
            }
        }),
        'refresh': new MenuItem({
            label: 'Odśwież', click() {
                new Collection().refresh()
            }
        }),
    },
    'file': {
        'edit': new MenuItem({
            label: 'Edytuj', click() {
                new File().edit()
            }
        }),
        'copy': new MenuItem({
            label: 'Kopiuj', click() {
                new File().copy()
            }
        }),
        'cut': new MenuItem({
            label: 'Wytnij', click() {
                new File().cut()
            }
        }),
        'remove': {
            'collection': new MenuItem({
                label: 'Usuń z kolekcji', click() {
                    new File().confirm('collection')
                }
            }),
            'global': new MenuItem({
                label: 'Usuń z biblioteki', click() {
                    new File().confirm('global')
                }
            }),
        },
        'limited': {
            'edit': new MenuItem({
                label: 'Edytuj', click() {
                    new File().edit()
                }
            }),
            'copy': new MenuItem({
                label: 'Kopiuj', click() {
                    new File().copy()
                }
            }),
            'global': new MenuItem({
                label: 'Usuń z biblioteki', click() {
                    new File().confirm('global')
                }
            }),
        }
    }
}
let clickedCollection
let clickedFile
let copiedFile
let cuttedFile
let searchPhrase

class Tree {
    renderCollection(collection) {
        var link = document.querySelector('#link-partial-collection');
        var template = link.import.querySelector('#partial-collection');
        var clone = document.importNode(template.content, true);
        var el = document.createElement('div')

        $(el).append(clone)
        $(el).find('.c').first().attr('id', 'collection-' + collection.ID_Collection)
        $(el).find('text').first().text(collection.Name)

        return $(el).find('.c')
    }

    renderFile(file) {
        var link = document.querySelector('#link-partial-file');
        var template = link.import.querySelector('#partial-file');
        var clone = document.importNode(template.content, true);
        var el = document.createElement('div')

        $(el).append(clone)
        $(el).find('.f').first().attr('id', 'file-' + file.ID_File)
        $(el).find('text').first().text(file.Filename)

        return $(el).find('.f')
    }

    renderList() {
        var link = document.querySelector('#link-partial-list');
        var template = link.import.querySelector('#partial-list');
        var clone = document.importNode(template.content, true);

        clone = $(clone)

        return clone
    }

    renderRoot(collection) {
        var self = this
        var clone = self.renderCollection(collection)
        clone.find('i').first().removeClass('fa-folder')
        clone.find('i').first().addClass('fa-folder-open')
        $('.collection-list-main').append(clone)
    }

    renderSubTree(node, callback) {
        var self = this

        var ul
        var li
        var data
        var quantity
        var i = 0

        if ($('#collection-1').length === 0) {
            self.renderRoot(node)
        }

        li = $('#collection-' + node.ID_Collection)
        li.append(self.renderList())

        ul = li.children('ul').first()
        data = ipcRenderer.sendSync('getChildren', {'collectionID': node.ID_Collection})
        quantity = data.length

        if (quantity === 0) {
            callback && callback(ul)
        } else {
            data.forEach(function (item) {
                if (typeof item.ID_Collection === 'undefined') {
                    ul.append(self.renderFile(item))
                } else {
                    ul.append(self.renderCollection(item))
                }

                i++

                if (i === quantity) {
                    callback && callback(ul)
                }
            })
        }
    }

    build(parent, callback) {
        var self = this
        var node = ipcRenderer.sendSync('getCollection', {'collectionID': parent})

        self.renderSubTree(node, function (ul) {
            ul.slideDown(100)
            callback && callback()
        })
    }

    showBranch(callback) {
        var self = this
        var collectionIcon = clickedCollection.find('i').first()
        var ul = clickedCollection.children('ul')

        if (collectionIcon.hasClass('fa-folder')) {
            if (ul.length === 0) {
                self.build(clickedCollection.attr('id').split('-')[1], function () {
                    callback && callback({'status': 'success'})
                })
            } else if (ul.length !== 0) {
                clickedCollection.children('ul').slideDown(100)
                callback && callback({'status': 'exist'})
            }

            collectionIcon.removeClass('fa-folder')
            collectionIcon.addClass('fa-folder-open')
        } else if (collectionIcon.hasClass('fa-folder-open')) {
            callback && callback({'status': 'open'})
        } else {
            callback && callback({'status': 'failed'})
        }
    }

    hideBranch() {
        var ul = clickedCollection.children('ul')
        var collectionIcon = clickedCollection.find('i').first()

        collectionIcon.removeClass('fa-folder-open')
        collectionIcon.addClass('fa-folder')

        if (ul.length !== 0) {
            ul.slideUp(100)
        }
    }

    addCollection(collection) {
        var self = this

        self.showBranch(function (result) {
            if (result.status === 'open' || result.status === 'exist') {
                if (clickedCollection.children('ul').first().children('.c').length === 0) {
                    clickedCollection.children('ul').first().prepend(self.renderCollection(collection))
                } else {
                    clickedCollection.children('ul').first().children('.c').last().after(self.renderCollection(collection))
                }
            }
            var section = new Import().getTemplate('#link-section-default', '#section-default')

            new Section().render(section, false)
        })
    }

    editCollection(data) {
        var section = new Import().getTemplate('#link-section-default', '#section-default')
        new Section().render(section, false)

        if (data !== null) {
            $('#collection-' + data.id).children('span').children('text').first().text(data.name)
        }
    }

    removeCollection(mode) {
        var files = clickedCollection.find('.f')

        if (mode === 'global') {
            var fileID

            files.each(function (i, file) {
                fileID = $(file).attr('id')
                $('*[id*=' + fileID + ']').remove()
            })
        }

        clickedCollection.remove()
    }

    insertFile(fileItem, callback) {
        var files = clickedCollection.children('ul').first().children('.f')
        var first = parseInt(fileItem.attr('id').split('-')[1])
        var second

        for (var i = 0; i < files.length; i++) {
            second = parseInt($(files[i]).attr('id').split('-')[1])

            if (first <= second) {
                if (first !== second) {
                    $(files[i]).before(fileItem)
                } else {
                    new Notification().show('Plik o podanej nazwie istnieje już w wybranej kolekcji', 3000)
                }

                callback && callback()
                break
            }
        }

        if (i === files.length) {
            clickedCollection.children('ul').first().append(fileItem)
            callback && callback()
        }
    }

    addFile(data) {
        var self = this

        self.showBranch(function (result) {
            if (result.status === 'open' || result.status === 'exist') {
                if (clickedCollection.children('ul').first().children('.f').length === 0) {
                    clickedCollection.children('ul').first().append(self.renderFile(data))
                } else {
                    clickedCollection.children('ul').first().children('.f').last().after(self.renderFile(data))
                }
            }
            var section = new Import().getTemplate('#link-section-default', '#section-default')

            new Section().render(section, false)
        })
    }

    editFile(data) {
        var section = new Import().getTemplate('#link-section-default', '#section-default')
        $('*[id*=file-' + data.id + ']').children('span').children('text').text(data.name)
        new Section().render(section, false, function () {
            if ($('#collection-0').length !== 0) {
                new Search().rebuild()
            }
        })
    }

    removeFile(mode, fileID) {
        if (mode === 'collection') {
            clickedFile.remove()
        } else {
            $('*[id*=file-' + fileID + ']').remove()
        }
    }
}

class Collection {
    add() {
        var section = new Import().getTemplate('#link-section-form-collection', '#section-form-collection')
        var collectionParentID = clickedCollection.attr('id').split('-')[1]

        section.find('#id_parent').val(collectionParentID)
        section.find('#accept').attr('id', 'accept-collection-add')
        new Section().render(section, false)
    }

    edit() {
        var section = new Import().getTemplate('#link-section-form-collection', '#section-form-collection')
        var collectionID = clickedCollection.attr('id').split('-')[1]
        var data = ipcRenderer.sendSync('getCollection', {'collectionID': collectionID})

        section.find('#id_parent').val(data.ID_ParentCollection)
        section.find('#id_name').val(data.Name)
        section.find('#id_id').val(data.ID_Collection)
        section.find('#accept').attr('id', 'accept-collection-edit')
        new Section().render(section, false)
    }

    confirm(mode) {
        var collectionID = clickedCollection.attr('id').split('-')[1]
        var section = new Import().getTemplate('#link-section-confirm', '#section-confirm');

        section.find('#id_parent').val(collectionID)
        section.find('#id_mode').val(mode)

        if (mode === 'global') {
            section.find('#confirm-message').text('Usunięte zostaną wszystkie reprezentacje plików oraz\ ' +
                'ich fizyczna postać z wybranej kolekcji i należących do niej podkolekcji. Czy chcesz kontynuować?')
        } else {
            section.find('#confirm-message').text('Usunięte zostaną wszystkie reprezentacje plików\ ' +
                'z wybranej kolekcji i należących do niej podkolekcji. Czy chcesz kontynuować?')
        }

        new Section().render(section, false)
    }

    remove(data) {
        var section = new Import().getTemplate('#link-section-default', '#section-default')
        var result

        new Tree().removeCollection(data.mode)
        new Section().render(section, true, function () {
            new Notification().block(function () {
                new Notification().show('Usuwanie...', 0, function () {
                    result = ipcRenderer.sendSync('removeCollection', {
                        'data': {
                            'collectionID': data.parent,
                            'mode': data.mode
                        }
                    })

                    if (result.status === 'success') {
                        new Notification().hide(function () {
                            new Notification().unblock(function () {
                                new Notification().show('Usuwanie zakończone pomyślnie', 3000)
                            })
                        })
                    }
                })
            })
        })
    }

    paste() {
        var collectionID = clickedCollection.attr('id').split('-')[1]

        new Tree().showBranch(function () {
            if (copiedFile !== null) {
                var fileID = copiedFile.attr('id').split('-')[1]

                new Tree().insertFile(copiedFile.clone(), function () {
                    ipcRenderer.send('copyFile', {'data': {'fileID': fileID, 'collectionID': collectionID}})
                })
            } else if (cuttedFile !== null) {
                var fileID = cuttedFile.attr('id').split('-')[1]
                var previousCollectionID = cuttedFile.parents('li').first().attr('id').split('-')[1]

                new Tree().insertFile(cuttedFile, function () {
                    ipcRenderer.send('cutFile', {
                        'data': {
                            'fileID': fileID,
                            'collectionID': collectionID,
                            'previousCollectionID': previousCollectionID
                        }
                    })
                })
            }
            $('.f').css('opacity', '1.0')
            contextMenuItems.collection.paste.enabled = false
            contextMenuItems.root.paste.enabled = false
        })
    }

    refresh() {
        if (clickedCollection.children('span').children('i').hasClass('fa-folder-open')) {
            clickedCollection.children('span').children('i').removeClass('fa-folder-open')
            clickedCollection.children('span').children('i').addClass('fa-folder')
        }

        clickedCollection.children('ul').remove()
        new Tree().showBranch()
    }

    handleCollectionClick(event) {
        clickedCollection = $(event.target).closest('li')

        if (event.which === 1) {
            new Tree().showBranch(function (result) {
                if (result.status === 'open') {
                    new Tree().hideBranch()
                }
            })
        } else if (event.which === 3) {
            if ($(event.target).closest('li').attr('id') === 'collection-1') {
                menuRoot.popup(remote.getCurrentWindow())
            } else if (clickedCollection.children('span').hasClass('collection-fake')) {
                menuCollectionFake.popup(remote.getCurrentWindow())
            } else {
                menuCollection.popup(remote.getCurrentWindow())
            }
        }
    }

    init() {
        var self = this

        $(document).on('mousedown', '.collection', self.handleCollectionClick)
    }
}

class File {
    add() {
        var section = new Import().getTemplate('#link-section-form-file', '#section-form-file')
        var collectionParentID = clickedCollection.attr('id').split('-')[1]

        section.find('#id_parent').val(collectionParentID)
        section.find('#accept').attr('id', 'accept-file-add')

        new Section().render(section, false)
    }

    addMany(mode) {
        var collectionID = clickedCollection.attr('id').split('-')[1]

        new Scan().init(mode, collectionID)
    }

    edit(fileID) {
        var section = new Import().getTemplate('#link-section-form-file', '#section-form-file')
        var id = fileID
        var data

        if (typeof id === 'undefined') {
            id = clickedFile.attr('id').split('-')[1]
        }

        data = ipcRenderer.sendSync('getFile', {'fileID': id})
        section.find('#id_path').attr('id', 'id_name')
        section.find('#id_name').closest('td').find('i').remove()
        section.find('#id_name').val(data.file.Filename)
        section.find('#id_name').attr('placeholder', 'Nazwa')
        section.find('#id_name').attr('name', 'name')
        data = ipcRenderer.sendSync('getTags', {'fileID': id})
        section.find('#id_tag').val(data.tag.sort().join(' '))
        section.find('#id_id').val(id)
        section.find('#accept').attr('id', 'accept-file-edit')
        new Section().render(section, false)
    }

    confirm(mode) {
        var fileID = clickedFile.attr('id').split('-')[1]
        var collectionID = clickedFile.parents('li').attr('id').split('-')[1]
        var section = new Import().getTemplate('#link-section-confirm', '#section-confirm');

        section.find('#id_id').val(fileID)
        section.find('#id_parent').val(collectionID)
        section.find('#id_mode').val(mode)

        if (mode === 'global') {
            section.find('#confirm-message').text('Usunięte zostaną wszystkie reprezentacje wybranego pliku oraz\ ' +
                'jego fizyczna postać z biblioteki aplikacji. Czy chcesz kontynuować?')
        } else {
            section.find('#confirm-message').text('Usunięta zostanie reprezentacja wybranego pliku.\ ' +
                'Czy chcesz kontynuować?')
        }

        new Section().render(section, false)
    }

    remove(data) {
        var section = new Import().getTemplate('#link-section-default', '#section-default');

        new Tree().removeFile(data.mode, data.id)
        new Section().render(section, true, function () {
            ipcRenderer.send('removeFile', {
                'data': {
                    'fileID': data.id,
                    'collectionID': data.parent,
                    'mode': data.mode
                }
            })
        })
    }

    copy(event) {
        cuttedFile = null
        copiedFile = clickedFile;
        contextMenuItems.collection.paste.enabled = true
        contextMenuItems.root.paste.enabled = true
        copiedFile.css('opacity', '1.0')
    }

    cut(event) {
        copiedFile = null
        cuttedFile = clickedFile;
        contextMenuItems.collection.paste.enabled = true
        contextMenuItems.root.paste.enabled = true
        cuttedFile.css('opacity', '0.5')
    }

    handleFileClick(event) {
        clickedFile = $(event.target).closest('li')

        if (event.which === 1) {
            var section = new Import().getTemplate('#link-section-info', '#section-info');
            var fileID = clickedFile.attr('id').split('-')[1]
            var data = ipcRenderer.sendSync('getFile', {'fileID': fileID})

            console.log(data)
            console.log(location)

            section.find('#info-name').append(data.file.Filename)
            section.find('#info-path').append(data.file.Path)
            section.find('#info-url').append(data.file.Url)
            var date = new Date(data.file.Date)
            section.find('#info-date').append(date.toLocaleString())
            section.find('#info-checksum').append(data.file.Checksum)
            data = ipcRenderer.sendSync('getTags', {'fileID': fileID})
            section.find('#info-tag').append(data.tag.sort().join(' '))
            section.find('#file-id').append(fileID)

            new Section().render(section, false)
        } else if (event.which === 3) {
            if (clickedFile.parents('li').first().attr('id') === 'collection-0') {
                menuFileLimited.popup(remote.getCurrentWindow())
            } else {
                menuFile.popup(remote.getCurrentWindow())
            }
        }
    }

    init() {
        var self = this
        $(document).on('mousedown', '.file', self.handleFileClick)
    }
}

class ButtonBar {
    handleBackClick(event) {
        new Section().back()
    }

    handleMainClick(event) {
        var section = new Import().getTemplate('#link-section-default', '#section-default');

        new Section().render(section, true)
    }

    constructor() {
        var self = this

        $(document).on('click', '#back', self.handleBackClick)
        $(document).on('click', '#main', self.handleMainClick)
    }
}

class Search {
    search(data) {
        var fileIDs
        var files = []
        var result

        if (typeof data.key === 'undefined') {
            fileIDs = ipcRenderer.sendSync('search', data)
        } else {
            fileIDs = ipcRenderer.sendSync('searchAdvance', data)
        }

        if (fileIDs.length !== 0) {
            var quantity = fileIDs.length
            var i = 0

            fileIDs.forEach(function (fileID) {
                result = ipcRenderer.sendSync('getFile', {'fileID': fileID})
                files.push(result.file)
                i++

                if (i === quantity) {
                    files.forEach(function (file) {
                        $('#collection-0').children('ul').append(new Tree().renderFile(file))
                    })
                    new Notification().hide()
                    $('#collection-0').children('span').children('i').removeClass('fa-folder')
                    $('#collection-0').children('span').children('i').addClass('fa-folder-open')
                    $('#collection-0').children('ul').slideDown('100')
                }
            })
        } else {
            new Notification().hide(function () {
                $('#collection-0').children('span').children('i').removeClass('fa-folder-open')
                $('#collection-0').children('span').children('i').addClass('fa-folder')
                new Notification().show('Brak wyników wyszukiwania', 3000)
            })
        }
    }

    validateDate(date) {
        var result = true

        if (date.length === 3) {
            for (var i = 0; i < date.length; i++) {
                if (isNaN(date[i])) {
                    result = false
                } else if (i === 2) {
                    if (date[i].length !== 4) {
                        result = false
                    }
                } else {
                    if (date[i].length !== 2) {
                        result = false
                    }
                }
            }
        } else {
            result = false
        }

        if (!result) {
            new Notification().show('Błędny format daty', 3000)
        }

        return result
    }

    validate(self, date, callback) {
        if (date !== '') {
            var result

            date = date.split('/')
            result = self.validateDate(date)

            if (result) {
                date = date[2] + '-' + date[1] + '-' + date[0] + 'T00:00:00.000Z'
                callback && callback({'status': 'success', 'date': date})
            } else {
                callback && callback({'status': 'error'})
            }
        } else {
            callback && callback({'status': 'empty'})
        }
    }

    handleSearch(event, self, advance) {
        if (event.which === 13) {
            if ($('#search').val() === '' && !advance) {
                $('#collection-0').remove()
                searchPhrase = $('#search').val()
            } else {
                if ($('#collection-0').length !== 0) {
                    $('#collection-0').remove()
                }

                var fakeCollection = {
                    'ID_Collection': 0,
                    'Name': 'Wyniki wyszukiwania'
                }
                var renderedFakeCollection = new Tree().renderCollection(fakeCollection)

                renderedFakeCollection.children('span').addClass('collection-fake')

                if (!advance) {
                    searchPhrase = $('#search').val()
                }

                if (advance) {
                    var data = new Form().collect()

                    if (data.name === '') {
                        data['skip_file'] = true
                    } else {
                        data['skip_file'] = false
                    }

                    self.validate(self, data.date_from, function (result) {
                        if (result.status !== 'error') {
                            if (result.status === 'success') {
                                data.date_from = result.date
                            }

                            self.validate(self, data.date_to, function (result) {
                                if (result.status !== 'error') {
                                    if (result.status === 'success') {
                                        data.date_to = result.date
                                    }

                                    $('#collection-1').children('ul').prepend(renderedFakeCollection)
                                    $('#collection-0').append(new Tree().renderList())

                                    if (data.date_from !== '' && data.date_to !== '') {
                                        if (data.date_from < data.date_to) {
                                            new Notification().show('Wyszukiwanie...', 0, function () {
                                                self.search(data)
                                            })
                                        } else {
                                            new Notification().show('Pierwsza data musi być wcześniejsza', 3000)
                                        }
                                    } else {
                                        new Notification().show('Wyszukiwanie...', 0, function () {
                                            self.search(data)
                                        })
                                    }
                                }
                            })
                        }
                    })
                } else {
                    var data = {'phrase': searchPhrase}

                    $('#collection-1').children('ul').prepend(renderedFakeCollection)
                    $('#collection-0').append(new Tree().renderList())
                    new Notification().show('Wyszukiwanie...', 0, function () {
                        self.search(data)
                    })
                }
            }
        }
    }

    rebuild() {
        var self = this

        self.handleSearch({'which': 13}, self)
    }

    init() {
        var self = this

        $(document).on('keypress', '#search', function (event) {
            self.handleSearch(event, self, false)
        })
        $(document).on('click', '#search-button', function (event) {
            self.handleSearch({'which': 13}, self, true)
        })
    }
}

class Scan {
    init(mode, collectionID) {
        new Notification().hide(function () {
            var path = new Dialog().collection()

            if (!path) {
                return
            }

            new Notification().block(function () {
                new Notification().show('Skanowanie...', 0, function () {
                    var result = ipcRenderer.sendSync('scanCollection', {'path': path, 'mode': mode, 'collectionID': collectionID})

                    if (result.status === 'found') {
                        var quantity = result.fileIDs.length
                        var i = 0
                        var files = []

                        if(!collectionID) {
                            var collection = {
                                'Name': 'Zeskanowane',
                                'ID_Collection': result.collectionID
                            }

                            $('#collection-' + result.collectionID).remove()
                            $('#collection-1').children('ul').prepend(new Tree().renderCollection(collection))
                            clickedCollection = $('#collection-' + result.collectionID)
                        }

                        result.fileIDs.forEach(function (fileID) {
                            var data = ipcRenderer.sendSync('getFile', {'fileID': fileID})
                            files.push(data.file)
                            i++

                            if (i === quantity) {
                                files.forEach(function (file) {
                                    $('#collection-' + result.collectionID).children('ul').append(new Tree().renderFile(file))
                                })
                            }
                        })

                        new Tree().showBranch(function () {
                            clickedCollection = null
                            new Notification().hide(function () {
                                new Notification().unblock(function () {
                                    new Notification().show('Wszystkie znalezione pliki znajdują się w kolekcji \'' + $('#collection-' + result.collectionID).children('span').children('text').text() + '\'', 3000)
                                })
                            })
                        })

                    } else if (result.status === 'notFound') {
                        new Notification().hide(function () {
                            new Notification().unblock(function () {
                                new Notification().show('Wybrany folder nie zawiera plików PDF', 3000)
                            })
                        })
                    }
                })
            })
        })
    }
}

class Start {
    handleScanClick(event) {
        new Scan().init('recursive', false)
    }

    handleSearchAdvanceClick(event) {
        var section = new Import().getTemplate('#link-section-search', '#section-form-search');

        new Section().render(section, false)
    }

    constructor() {
        var self = this
        var section = new Import().getTemplate('#link-section-default', '#section-default');
        $('#side-right').empty().append(section);
        cuttedFile = null
        copiedFile = null

        menuCollection.append(contextMenuItems.collection.addFile)
        menuCollection.append(contextMenuItems.collection.addFiles.flat)
        menuCollection.append(contextMenuItems.collection.addFiles.recursive)
        menuCollection.append(contextMenuItems.collection.addCollection)
        menuCollection.append(contextMenuItems.collection.edit)
        menuCollection.append(contextMenuItems.collection.paste)
        menuCollection.append(contextMenuItems.collection.refresh)
        menuCollection.append(contextMenuItems.collection.remove.collection)
        menuCollection.append(contextMenuItems.collection.remove.global)
        menuCollectionFake.append(contextMenuItems.collection.fake)
        menuFile.append(contextMenuItems.file.edit)
        menuFile.append(contextMenuItems.file.copy)
        menuFile.append(contextMenuItems.file.cut)
        menuFile.append(contextMenuItems.file.remove.collection)
        menuFile.append(contextMenuItems.file.remove.global)
        menuFileLimited.append(contextMenuItems.file.limited.edit)
        menuFileLimited.append(contextMenuItems.file.limited.copy)
        menuFileLimited.append(contextMenuItems.file.limited.global)
        menuRoot.append(contextMenuItems.root.addFile)
        menuRoot.append(contextMenuItems.root.addFiles.flat)
        menuRoot.append(contextMenuItems.root.addFiles.recursive)
        menuRoot.append(contextMenuItems.root.addCollection)
        menuRoot.append(contextMenuItems.root.paste)
        menuRoot.append(contextMenuItems.root.refresh)

        new Collection().init()
        new File().init()
        new ButtonBar()
        new Search().init()
        new Tree().build(1)

        $(document).on('click', '#scan', self.handleScanClick)
        $(document).on('click', '.fa-gear', self.handleSearchAdvanceClick)
    }
}

new Start()

exports.Tree = Tree
exports.File = File
exports.Collection = Collection

