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
        self._sockets = []
        self._mean = 0
        self._dispersion = {}

    def add_voter(self, socket) -> None:
        self._sockets.append(socket)

    def remove_voter(self, socket, name) -> None:
        if socket in self._sockets:
            self._sockets.remove(socket)
        if name in self._votes:
            del self._votes[name]

    def set_vote(self, vote, name) -> None:
        if self._hidden is True:
            self._votes[name] = int(vote)

    def show_results(self, master_key) -> None:
        if self._master_key == master_key:
            self._hidden = False

    def reset_results(self, master_key) -> None:
        if self._master_key == master_key:
            self._hidden = True
            for i in self._votes:
                self._votes[i] = None

    def set_name(self, old_name, new_name) -> None:
        if new_name in self._votes:
            raise NameAlreadyExists
        else:
            if old_name:
                self._votes[new_name] = self._votes[old_name]
                self._votes.pop(old_name)
            else:
                self._votes[new_name] = None

    def get_state(self) -> dict:
        res = {'error': None, 'data': ''}
        if self._hidden:
            res['data'] = {key: (value is not None) for key, value in self._votes.items()}
            res['result'] = None
        else:
            self.calculate_statistics()
            res['data'] = self._votes
            res['result'] = {
                'dispersion': self._dispersion,
                'mean': self._mean
            }
        return res

    async def notify_all(self, data) -> None:
        for socket in self._sockets:
            await socket.send_json(data)

    def calculate_statistics(self):
        count = len(self._votes.keys())
        self._dispersion = {}
        self._mean = reduce(lambda x, y: x + y, self._votes.values()) / count

        counters = {x: 0 for x in VOTE_VARIANTS}
        for value in self._votes.values():
            counters[value] += 1

        for key, value in counters.items():
            if value != 0:
                self._dispersion[key] = round(value / count * 100, 1)


class SessionManager:
    def __init__(self):
        self.__sessions = {}

    def get_session(self, session_id) -> Session:
        return self.__sessions[session_id]

    def create_session(self) -> Tuple[str, str]:
        _id = str(uuid.uuid1())
        _key = str(uuid.uuid1())
        self.__sessions[_id] = Session(_key)
        return _id, _key
