class NameAlreadyExists(Exception):
    def __init__(self):
        self.code = '001'
        self.message = 'Имя уже используется'

    def json(self):
        return {'code': self.code, 'message': self.message}