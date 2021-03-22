import abc


class CustomException(Exception):
    @abc.abstractmethod
    def json(self):
        pass


class NameAlreadyExists(CustomException):
    def __init__(self):
        self.code = '001'
        self.message = 'Имя уже используется'

    def json(self):
        return {'code': self.code, 'message': self.message}


class NameIsEmpty(CustomException):
    def __init__(self):
        self.code = '002'
        self.message = 'Пустое имя, укажите хотя бы один символ'

    def json(self):
        return {'code': self.code, 'message': self.message}