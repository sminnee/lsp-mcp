# Consumer file that uses symbols from main.py and utils.py
from .main import calculate_sum, UserData
from .utils import process_numbers, LOCAL_CONSTANT


class DataProcessor:
    def calculate(self) -> int:
        return calculate_sum(5, 15)  # Reference to calculate_sum from main.py
    
    def process_user(self) -> UserData:
        user = UserData(42, 'Consumer User')  # Reference to UserData from main.py
        result = process_numbers(3, 4)
        user.name = f'User {LOCAL_CONSTANT}'  # Reference to LOCAL_CONSTANT from utils.py
        return user


# Test case for no references found
def unused_function():
    return 'This function should have no references'