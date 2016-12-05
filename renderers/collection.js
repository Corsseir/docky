/**
 * Created by corss on 11/10/2016.
 */

const {ipcRenderer} = require('electron')
const {Tree} = require('../renderer.js')

class Collection {
    handleAcceptCollectionAddClick(event) {
        var result
        var data = new Form().collect()
        var notify = new Notification()

        if(data.name.length !== 0) {
            result = ipcRenderer.sendSync('addCollection', {'data': data})

            if(result.status === 'success') {
                new Tree().addCollection(result.collection)
            } else if(result.status === 'exist') {
                notify.show('Kolekcja o podanej nazwie już istnieje', 3000)
            }
        } else {
            notify.show('Wpisz nazwę kolekcji', 3000)
        }
    }

    handleAcceptCollectionEditClick(event) {
        var result
        var data = new Form().collect()
        var notify = new Notification()

        if(data.name.length !== 0) {
            result = ipcRenderer.sendSync('editCollection', {'data': data})

            if(result.status === 'success') {
                new Tree().editCollection(data)
            } else if(result.status === 'exist') {
                notify.show('Kolekcja o podanej nazwie już istnieje', 3000)
            } else if(result.status === 'equal') {
                new Tree().editCollection(null)
            }
        } else {
            notify.show('Wpisz nazwę kolekcji', 3000)
        }
    }
    
    constructor () {
        var self = this

        $(document).on('click', '#accept-collection-add', self.handleAcceptCollectionAddClick)
        $(document).on('click', '#accept-collection-edit', self.handleAcceptCollectionEditClick)
    }
}

new Collection()

