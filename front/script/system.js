window.onload = function () {
    document.getElementById('inviteLink').value = window.location.protocol + '//' + window.location.host + window.location.pathname;

    document.getElementById('inviteCopy').onclick = function() {
        document.getElementById("inviteLink").select();
        document.execCommand("copy");
    }
}

