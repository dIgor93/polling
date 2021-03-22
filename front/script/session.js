
const VOTE_VARIANTS = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, -1]
let already_animated = false
let pooling_inited = false

function connect() {
    let socket;
    if (window.location.protocol === 'http:')
        socket = new WebSocket(`ws://${window.location.host}/ws/${getCookie('sessionId')}`)
    else
        socket = new WebSocket(`wss://${window.location.host}/ws/${getCookie('sessionId')}`)
    socket.addEventListener('message', event => handle_message(event));
    return socket;
}
const socket = connect()

function getCookie(name) {
    let matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

function sendVote(x) {
    socket.send(
        JSON.stringify(
            {
                'operation': 'voting',
                'vote': x,
                'session_id': getCookie('sessionId'),
            }
        ));
}

function showResults() {
    socket.send(
        JSON.stringify(
            {
                'operation': 'show_results',
                'master_key': getCookie('masterKey'),
                'session_id': getCookie('sessionId')
            }
        ));
}


function resetResults() {
    socket.send(
        JSON.stringify(
            {
                'operation': 'reset_results',
                'master_key': getCookie('masterKey'),
                'session_id': getCookie('sessionId')
            }
        ));
}

function sendName(newName) {
    socket.send(
        JSON.stringify(
            {
                'operation': 'set_name',
                'name': newName,
                'session_id': getCookie('sessionId')
            }
        ));
}


function handle_message(event) {
    let data = JSON.parse(event.data);

    renderMemberCount(data['data']);
    renderMembers(data['data']);

    if (!pooling_inited) {
        showPooling();
        pooling_inited = true;
    }

    if (data['error']) {
        console.log(data['error'])
        $("#nameError").show()
        return;
    }

    if (data['result']) {
        inactivateButtons()
        showStatistics(data['result']);
        data['data'].forEach((elem) => animateVotes(elem, already_animated))
        already_animated = true
        $('.voteVariant').removeClass('selectedVariant')
    } else {
        activateButtons()
        already_animated = false
    }
}

function inactivateButtons() {
    $('.voteVariant').addClass('unselectableVariant')
}

function activateButtons() {
    $('.voteVariant').removeClass('unselectableVariant')
}

function renderMemberCount(data) {
    $("#membersNumber").text(data.length);
}

function renderMembers(data) {
    let members = $("#members");
    members.text('')
    data.forEach((elem) => {
        let nameRect = document.createElement('div');
        nameRect.className = 'nameRect'
        nameRect.textContent = elem.name;
        nameRect.style.backgroundColor = elem['voted'] ? '#5dbf57' : '#d93535'
        nameRect.id = elem.uid;
        members.append(nameRect);
    })
}

function animateVotes(elem, animated) {
    if (typeof elem['voted'] === 'number') {
        let counter = 0;
        let nameRect = $("#" + elem['uid']);
        const width = $(".voteVariant")[0].offsetWidth;
        let target = (VOTE_VARIANTS.indexOf(elem['voted'])) * width + 0.5 * width + 70
        if (!animated) {
            let timer = setInterval(function () {
                counter += 3
                nameRect.css({'margin-left': counter + "px"});
                if (counter > target) {
                    clearInterval(timer)
                }
            }, 1, target)
        }
        nameRect.css({'margin-left': target + "px"});
    }
}

function showPooling() {
    $("#statistics").hide()
    $("#authority").remove()
    $("#polling").show()
    $("#nameError").hide()
}

function showStatistics(data) {
    $("#statistics").show()

    let labelDispersion = document.createElement('label')
    labelDispersion.setAttribute("id", "dispersion");
    let listHtml = document.createElement('ul')
    for (let key in data['dispersion']) {
        let li = document.createElement('li')
        if (key === '-1') {
            li.textContent = `∞: \t${data['dispersion'][key]}%`
        } else {
            li.textContent = `${key}: \t${data['dispersion'][key]}%`
        }
        listHtml.appendChild(li)
    }
    labelDispersion.appendChild(listHtml)

    $("#mean").text(data['mean'])
    $("#dispersion").replaceWith(labelDispersion)
}

$(document).on('click', '.voteVariant', function () {
    $('.voteVariant').removeClass('selectedVariant')
    $(this).addClass('selectedVariant');

    let selected = $(this).html();
    if (selected === '∞') {
        selected = -1
    }
    sendVote(selected)
});
