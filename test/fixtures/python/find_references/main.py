# Main file with function and variable definitions
# Test target: calculate_sum function defined at line 4, column 4
# Expected references: line 4 (declaration), line 10 (usage), utils.py line 5, consumer.py line 6

def calculate_sum(a: int, b: int) -> int:
    return a + b


def example():
    result = calculate_sum(10, 20)  # Reference to calculate_sum
    print(result)


# Test target: UserData class defined at line 16, column 6
# Expected references: line 16 (declaration), line 23 (usage), utils.py line 9, consumer.py line 10

class UserData:
    def __init__(self, user_id: int, name: str):
        self.id = user_id
        self.name = name


user_data = UserData(1, 'Test User')  # Reference to UserData


# Test target: API_ENDPOINT constant defined at line 28, column 0
# Expected references: line 28 (declaration), line 32 (usage), utils.py line 13

API_ENDPOINT = 'https://api.example.com'


def make_request():
    print(f'Making request to {API_ENDPOINT}')  # Reference to API_ENDPOINT