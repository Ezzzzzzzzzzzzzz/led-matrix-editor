$(function () {
    var $previews = $('#previews');
    var $hexInput = $('#input');
    var $appendButton = $('#append');
    var $deleteButton = $('#delete');
    var $outputTextarea = $('#output');
    var $updateButton = $('#update');
    var $invertButton = $('#invert');
    var $clearButton = $('#clear');

    function makeCols() {
        var out = ['<table class="cols"><tr>'];
        for (var i = 1; i < 9; i++) {
            out.push('<td data-col="' + i + '">' + i + '</td>');
        }
        out.push('</tr></table>');
        return out.join('');
    }

    function makeRows() {
        var out = ['<table class="rows">'];
        for (var i = 1; i < 9; i++) {
            out.push('<tr><td data-row="' + i + '">' + i + '</td></tr>');
        }
        out.push('</table>');
        return out.join('');
    }

    function makeLeds() {
        var out = ['<table class="leds">'];
        for (var i = 1; i < 9; i++) {
            out.push('<tr>');
            for (var j = 1; j < 9; j++) {
                out.push('<td data-row="' + i + '" data-col="' + j + '"></td>');
            }
            out.push('</tr>');
        }
        out.push('</table>');
        return out.join('');
    }

    function makePreview(pattern) {
        pattern = ('0000000000000000' + pattern).substr(-16);

        var out = ['<table class="preview" data-hex="' + pattern + '">'];
        for (var i = 1; i < 9; i++) {
            var byte = pattern.substr(-2 * i, 2);
            byte = parseInt(byte, 16);

            out.push('<tr>');
            for (var j = 0; j < 8; j++) {
                if ((byte & 1 << j)) {
                    out.push('<td class="active"></td>');
                } else {
                    out.push('<td></td>');
                }
            }
            out.push('</tr>');
        }
        out.push('</table>');
        return out.join('');
    }

    function makePreviewElement(pattern, selected) {
        var preview = $(makePreview(pattern));
        preview.click(onPreviewClick);
        if (selected) {
            preview.addClass('selected');
        }
        return preview;
    }

    function ledsToHex() {
        var out = [];
        for (var i = 1; i < 9; i++) {
            var byte = [];
            for (var j = 1; j < 9; j++) {
                var active = $('.leds td[data-row=' + i + '][data-col=' + j + '] ').hasClass('active');
                byte.push(active ? '1' : '0');
            }
            byte.reverse();
            byte = parseInt(byte.join(''), 2).toString(16);
            byte = ('0' + byte).substr(-2);
            out.push(byte);
        }
        out.reverse();
        $hexInput.val(out.join(''));
    }

    function hexToLeds() {
        var val = $hexInput.val();
        val = ('0000000000000000' + val).substr(-16);

        for (var i = 1; i < 9; i++) {
            var byte = val.substr(-2 * i, 2);

            byte = parseInt(byte, 16);
            for (var j = 1; j < 9; j++) {
                var active = !!(byte & 1 << (j - 1));
                $('.leds td[data-row=' + i + '][data-col=' + j + '] ').toggleClass('active', active);
            }
        }
    }

    var savedHashState;

    function saveState() {
        var out = [];
        $previews.find('.preview').each(function () {
            out.push($(this).attr('data-hex'));
        });

        window.location.hash = savedHashState = out.join('|');

        $outputTextarea.val('[0x' + out.join(', 0x') + ']')
    }

    function loadState() {
        $previews.empty();
        var preview;
        var patterns = window.location.hash.slice(1).split('|');
        for (var i = 0; i < patterns.length; i++) {
            preview = makePreviewElement(patterns[i], false);
            $previews.append(preview);
        }
        $outputTextarea.val('const uint64_t PATTERNS[] = {0x' + patterns.join(', 0x') + '};');

        preview.addClass('selected');
        $hexInput.val(preview.attr('data-hex'));
        hexToLeds();
    }

    $('#cols').append($(makeCols()));
    $('#rows').append($(makeRows()));
    $('#leds').append($(makeLeds()));

    $('table.leds td').mousedown(function () {
        $(this).toggleClass('active');
        ledsToHex();
    });

    $invertButton.click(function () {
        $('table.leds td').toggleClass('active');
        ledsToHex();
    });

    $clearButton.mousedown(function () {
        $('table.leds td').removeClass('active');
        ledsToHex();
    });

    $('table.cols td').mousedown(function () {
        var col = $(this).attr('data-col');
        $('table.leds td[data-col=' + col + ']').toggleClass('active',
            $('table.leds td[data-col=' + col + '].active').length != 8);
        ledsToHex();
    });

    $('table.rows td[data-row]').mousedown(function () {
        var row = $(this).attr('data-row');
        $('table.leds td[data-row=' + row + ']').toggleClass('active',
            $('table.leds td[data-row=' + row + '].active').length != 8);
        ledsToHex();
    });

    $hexInput.keyup(function () {
        hexToLeds();
    });

    function onPreviewClick() {
        $previews.find('.preview.selected').removeClass('selected');
        $(this).addClass('selected');
        $deleteButton.removeAttr('disabled');
        $updateButton.removeAttr('disabled');
        $hexInput.val($(this).attr('data-hex'));
        hexToLeds();
    }

    $deleteButton.click(function () {
        $previews.find('.preview.selected').remove();
        $deleteButton.attr('disabled', 'disabled');
        $updateButton.attr('disabled', 'disabled');
        saveState();
    });

    $appendButton.click(function () {
        $previews.find('.preview.selected').removeClass('selected');
        $previews.append(makePreviewElement($hexInput.val(), true));
        saveState();
    });

    $updateButton.click(function () {
        $previews.find('.preview.selected').replaceWith(makePreviewElement($hexInput.val(), true));
        saveState();
    });


    $(window).on('hashchange', function () {
        if (window.location.hash.slice(1) != savedHashState) {
            loadState();
        }
    });

    $previews.sortable({
        stop: function (event, ui) {
            saveState();
        }
    });

    loadState();
});