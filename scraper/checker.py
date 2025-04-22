import os
import csv

dir = "images"

images_name = [filename for filename in os.listdir(dir)]

with open('la2_images.csv', 'r') as file:
    reader = csv.reader(file)

    for row in reader:
        name, link = row
        if name not in images_name:
            print(f"Missing image: {name}")
