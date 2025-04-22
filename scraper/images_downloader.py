import csv
import urllib.request
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

# Create output folder
os.makedirs('images', exist_ok=True)

# Read CSV into a list of (name, link)
with open('la2_images.csv', 'r') as file:
    reader = csv.reader(file)
    data = list(reader)


def download_image(entry):
    name, link = entry
    filepath = os.path.join('images', name)
    try:
        print(f"Downloading {name} from {link}...")
        urllib.request.urlretrieve(link, filepath)
        return f"✓ {name}"
    except Exception as e:
        return f"✗ {name} failed: {e}"


# Use a thread pool for concurrent downloads
# You can increase/decrease workers
with ThreadPoolExecutor(max_workers=4) as executor:
    futures = [executor.submit(download_image, entry) for entry in data]
    for future in as_completed(futures):
        print(future.result())
