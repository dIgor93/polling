let socket = null;
const VOTE_VARIANTS = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, -1]

function connect() {
    if (window.location.protocol === 'http:')
        socket = new WebSocket(`ws://${window.location.host}/ws`)
    else
        socket = new WebSocket(`wss://${window.location.host}/ws`)
    socket.addEventListener('message', event => handle_message(event));
    socket.addEventListener('open', event => sendName('', document.getElementById('fieldName').value));
}

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

function sendName(oldName, newName) {
    socket.send(
        JSON.stringify(
            {
                'operation': 'set_name',
                'new_name': newName,
                'old_name': oldName,
                'session_id': getCookie('sessionId')
            }
        ));
}


function handle_message(event) {
    let data = JSON.parse(event.data);

    if (data['error']) {
        console.log(data['error'])
        document.getElementById('nameError').style.visibility = 'visible'
        return;
    }

    if (data['result']) {
        showStatistics(data['result']);
        for (let elem in data['data']) {
            if (data['data'].hasOwnProperty(elem)) {
                animateVotes(elem, data['data'][elem])
            }
        }
        return;
    }

    renderMemberCount(data['data']);
    renderMembers(data['data']);
    showPooling();
}

function renderMemberCount(data) {
    document.getElementById('membersNumber').textContent = (Object.keys(data).length).toString();
}

function renderMembers(data) {
    let members = document.getElementById('members');
    members.innerText = ''
    for (let elem in data) {
        let nameRect = document.createElement('div');
        nameRect.className = 'nameRect'
        nameRect.textContent = elem;
        nameRect.style.backgroundColor = data[elem] ? '#5dbf57' : '#d93535'
        nameRect.id = elem.toString();
        members.appendChild(nameRect);
    }
}

function animateVotes(user_name, user_vote) {
    let counter = 0;
    let nameRect = document.getElementById(user_name);
    const width = document.getElementsByClassName('voteVariant')[0].offsetWidth;
    let target = (VOTE_VARIANTS.indexOf(user_vote) + 0.5) * width + 100

    let timer = setInterval(function () {
        counter += 3
        nameRect.style.marginLeft = counter + "px";
        if (counter > target) {
            clearInterval(timer)
        }
    }, 1, target)
}

function showPooling() {
    document.getElementById('statistics').style.display = 'none'
    document.getElementById('authority').style.display = 'none'
    document.getElementById('polling').style.display = 'inherit'
    document.getElementById('nameError').style.display = 'none'
}

function showStatistics(data) {
    document.getElementById('statistics').style.display = 'inherit'

    let listHtml = document.createElement('ul')
    for (let key in data['dispersion']) {
        let li = document.createElement('li')
        if (key == -1) {
            li.textContent = `∞: \t${data['dispersion'][key]}%`
        } else {
            li.textContent = `${key}: \t${data['dispersion'][key]}%`
        }
        listHtml.appendChild(li)
    }

    $('#mean').innerText.innerText = data['mean']
    document.getElementById('dispersion').replaceChild(
        listHtml,
        document.getElementById('dispersion').lastChild
    )
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
