function createSession() {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: '{}',
        redirect: 'follow'
    };

    fetch(window.location.protocol + '//' + window.location.host + '/session', requestOptions)
        .then(response => response.json())
        .then(resp => { window.location.href = '/session/' + resp['sessionId'] + '?isMaster=true'})
        .catch(error => alert(`Произошла ошибка: ${error}`));
}
