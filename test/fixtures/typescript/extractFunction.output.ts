function processItems(items: string[]) {
  const filtered = items.filter(item => item.length > 3);
  const uppercased = filtered.map(item => item.toUpperCase());
  const result = uppercased.join(', ');
  return result;
}

function processData(items: string[]) {
  console.log('Starting to process data...');

  // Code block to extract (lines 4-7)
  const result = processItems(items);
  console.log(result);

  console.log('Processing complete');
  return items.length;
}

export { processData };
