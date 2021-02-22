let socket = null;

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
    const values = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, -1]
    let summ = 0;
    let count = 0;
    let dispers = {}
    let data_json = JSON.parse(event.data);
    console.log(data_json)

    if ((data_json['error'] !== null) && (data_json['error'])) {
        console.log(data_json['error'])
        document.getElementById('nameError').style.visibility = 'visible'
    } else {
        let data = data_json['data'];
        let votesDiv = document.getElementById('votes');
        let tab = document.createElement('table')

        let tr = document.createElement('tr');

        let th = document.createElement('th')
        th.className = 'firstColumn'
        tr.appendChild(th)

        values.forEach((i) => {
            let th = document.createElement('th');
            th.textContent = (i === -1) ? '∞' : i;
            th.className = 'rows'
            tr.appendChild(th)
        })
        tab.appendChild(tr)

        for (let elem in data) {
            let tr = document.createElement('tr');
            let td = document.createElement('td');
            const value = data[elem]
            td.className = 'firstColumn'
            td.textContent = elem
            td.style.backgroundColor = ((value === null) || (value === false)) ? '#fd6363' : '#5dbf57'
            tr.appendChild(td)

            values.forEach((i) => {
                let td_empty = document.createElement('td');
                if (typeof value === 'number') {
                    if (i === value) {
                        td_empty.style.backgroundColor = '#5dbf57'
                        td_empty.textContent = (value === -1) ? '∞' : value;

                        summ += (value === -1) ? 0 : value;
                        count++;
                        if (dispers.hasOwnProperty(i)) {
                            dispers[i]++;
                        } else {
                            dispers[i] = 1;
                        }
                    }

                }
                tr.appendChild(td_empty)
            })

            if ((value === null) || (value === false)) {
                item = `<p style="color: #fd6363">${elem}</p>`
            }
            tab.appendChild(tr)
        }
        votesDiv.innerHTML = '';
        votesDiv.appendChild(tab)
        document.getElementById('authority').style.display = 'none'
        document.getElementById('polling').style.display = 'inherit'
        document.getElementById('nameError').style.display = 'none'

        if (count > 0) {
            document.getElementById('statistics').style.display = 'inherit'
        }
        document.getElementById('mid').innerText = summ / count;

        let listHtml = '<ul>'
        for (let key in dispers) {
            listHtml += `<li>${key}: \t${dispers[key] / count}%</li>`
        }
        listHtml += '</ul>'
        document.getElementById('dispersion').innerHTML = listHtml;

    }
}