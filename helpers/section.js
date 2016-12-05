/**
 * Created by corsseir on 03.12.16.
 */

let previousSections = []

class Section {
    render(section, callback) {
        $('#side-right').fadeOut(150, function () {
            previousSections.push($('#side-right').contents())
            $('#side-right').empty().append(section)
            $('#side-right').fadeIn(150)
            callback && callback()
        })
    }

    back(callback) {
        $('#side-right').fadeOut(150, function () {
            $('#side-right').empty().append(previousSections.pop())
            $('#side-right').fadeIn(150)
            callback && callback()
        })
    }
}

exports.Section = Section