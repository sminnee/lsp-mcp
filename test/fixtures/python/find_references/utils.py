# Utils file that imports and uses symbols from main.py
from .main import calculate_sum, UserData, API_ENDPOINT


def process_numbers(x: int, y: int) -> int:
    return calculate_sum(x * 2, y * 2)  # Reference to calculate_sum from main.py


def create_user(user_id: int, name: str) -> UserData:
    user = UserData(user_id, name)  # Reference to UserData from main.py
    print(f'Making request to {API_ENDPOINT}')  # Reference to API_ENDPOINT from main.py
    return user


# Test target: LOCAL_CONSTANT defined at line 16, column 0
# Expected references: line 16 (declaration), line 20 (usage)

LOCAL_CONSTANT = 'local value'


def use_local_constant() -> str:
    return LOCAL_CONSTANT.upper()  # Reference to LOCAL_CONSTANT