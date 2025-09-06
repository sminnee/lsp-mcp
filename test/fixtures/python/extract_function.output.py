def process_items(items):
    filtered = [item for item in items if len(item) > 3]
    uppercased = [item.upper() for item in filtered]
    result = ', '.join(uppercased)
    return result

def process_data(items):
    print('Starting to process data...')
    
    # Code block to extract (lines 4-7)
    result = process_items(items)
    print(result)
    
    print('Processing complete')
    return len(items)