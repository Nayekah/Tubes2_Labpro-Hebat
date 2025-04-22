import requests
from bs4 import BeautifulSoup
import csv
from urllib.parse import urljoin

BASE_URL = "https://little-alchemy.fandom.com/wiki/Elements_(Little_Alchemy_2)"


def scrape_little_alchemy_recipes():
    headers = {'User-Agent': 'Mozilla/5.0'}
    session = requests.Session()
    response = session.get(BASE_URL, headers=headers)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, 'lxml')
    links = {}

    tables = soup.find_all('table')

    # print(len(tables))

    # if not tables:
    #     raise ValueError(
    #         "Recipe table not found - website structure may have changed")

    for i, table in enumerate(tables):
        # print(i)
        for row in table.find_all('tr')[1:]:  # Skip header row
            # print(row)
            cols = row.find_all('td')

            img = cols[0].find('img')

            if img.get("data-image-key") and img.get("data-src"):
                link = img["data-src"]

                link = link[:link.find("scale-to-width")]

                # print(img["data-image-key"] + " = " + link)

                links[img["data-image-key"]] = link

    return links


def save_recipes_to_csv(links, filename="la2_images.csv"):
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["Element", "link"])

        for element, link in links.items():
            writer.writerow([element, link])


# Run the scraper
if __name__ == "__main__":
    all_recipes = scrape_little_alchemy_recipes()
    save_recipes_to_csv(all_recipes)
    print(f"Successfully scraped {len(all_recipes)} elements!")
