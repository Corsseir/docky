/**
 * Created by corsseir on 03.12.16.
 */

let previousSections = []

class Section {
    render(section, clear, callback) {
        $('#side-right').fadeOut(150, function () {
            if($('#side-right').find('#section-name').text() !== section.find('#section-name').text()) {
                previousSections.push($('#side-right').contents())
            } else {
                if($('#side-right').find('#id_id').length !== 0 && section.find('#id_id').length !== 0) {
                    if($('#side-right').find('#id_id').val() !== section.find('#id_id').val()) {
                        previousSections.push($('#side-right').contents())
                    }
                } else if($('#side-right').find('#file-id').length !== 0 && section.find('#file-id').length !== 0) {
                    if($('#side-right').find('#file-id').text() !== section.find('#file-id').text()) {
                        previousSections.push($('#side-right').contents())
                    }
                }
            }

            $('#side-right').empty().append(section)
            $('#side-right').fadeIn(150)

            if(clear) {
                previousSections = []
            }

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