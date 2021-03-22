import uuid
from functools import reduce
from typing import Tuple

from exceptions import NameAlreadyExists

VOTE_VARIANTS = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, -1]


class Session:
    def __init__(self, master_key):
        self._master_key = master_key
        self._votes = {}
        self._hidden = True
        self._mean = 0
        self._dispersion = {}

    def add_voter(self, socket) -> str:
        user_uid = str(uuid.uuid1())
        self._votes[user_uid] = {'socket': socket}
        return user_uid

    def remove_voter(self, user_uid) -> None:
        del self._votes[user_uid]

    def set_vote(self, uid, vote) -> None:
        if self._hidden is True:
            self._votes[uid]['vote'] = int(vote)

    def show_results(self, master_key) -> None:
        if self._master_key == master_key:
            self._hidden = False

    def reset_results(self, master_key) -> None:
        if self._master_key == master_key:
            self._hidden = True
            for i in self._votes:
                self._votes[i]['vote'] = None

    def set_name(self, uid, new_name) -> None:
        if new_name in self.names:
            raise NameAlreadyExists
        else:
            self._votes[uid]['name'] = new_name

    def get_state(self) -> dict:
        res = {'error': None, 'data': ''}
        if self._hidden:
            result = []
            for key, value in self._votes.items():
                result.append({
                    'name': value.get('name'),
                    'uid': key,
                    'voted': value.get('vote') is not None
                })
            res['data'] = result
            res['result'] = None
        else:
            self.calculate_statistics()
            result = []
            for key, value in self._votes.items():
                result.append({
                    'name': value.get('name'),
                    'uid': key,
                    'voted': value.get('vote', False)
                })
            res['data'] = result
            res['result'] = {
                'dispersion': self._dispersion,
                'mean': self._mean
            }
        return res

    async def notify_all(self, data) -> None:
        for socket in self.sockets:
            await socket.send_json(data)

    def calculate_statistics(self):
        count = len(self.votes)
        self._dispersion = {}
        self._mean = reduce(lambda x, y: x + y, self.votes) / count

        counters = {x: 0 for x in VOTE_VARIANTS}
        for value in self.votes:
            counters[value] += 1

        for key, value in counters.items():
            if value != 0:
                self._dispersion[key] = round(value / count * 100, 1)

    @property
    def names(self):
        return [x.get('name') for x in self._votes.values() if x.get('name')]

    @property
    def sockets(self):
        return [x.get('socket') for x in self._votes.values()]

    @property
    def votes(self):
        return [x.get('vote') for x in self._votes.values() if x.get('vote') is not None]


class SessionManager:
    def __init__(self):
        self.__sessions = {}

    def get_session(self, session_id) -> Session:
        return self.__sessions.get(session_id)

    def create_session(self) -> Tuple[str, str]:
        _id = str(uuid.uuid1())
        _key = str(uuid.uuid1())
        self.__sessions[_id] = Session(_key)
        return _id, _key
